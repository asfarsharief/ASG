package database

import (
	"encoding/json"
	"fmt"
	"strconv"
	"sync"

	"player-service/internal/models"

	"github.com/dgraph-io/badger/v4"
)

// SafeBadgerDB provides stack-safe database operations
type SafeBadgerDB struct {
	db *badger.DB
	mu sync.RWMutex
}

// NewSafeBadgerDB creates a new safe database wrapper
func NewSafeBadgerDB(db *badger.DB) *SafeBadgerDB {
	return &SafeBadgerDB{db: db}
}

// SafeGet retrieves a value by key with stack protection
func (s *SafeBadgerDB) SafeGet(key string, dest interface{}) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []byte
	err := s.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(key))
		if err != nil {
			return err
		}

		return item.Value(func(val []byte) error {
			// Copy the value to avoid holding the transaction
			result = make([]byte, len(val))
			copy(result, val)
			return nil
		})
	})

	if err != nil {
		return err
	}

	// Unmarshal outside the transaction
	return json.Unmarshal(result, dest)
}

// SafeSet stores a key-value pair with stack protection
func (s *SafeBadgerDB) SafeSet(key string, value interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return s.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(key), data)
	})
}

// SafeListKeys returns keys with a given prefix with stack protection
func (s *SafeBadgerDB) SafeListKeys(prefix string) ([]string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var keys []string
	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = false
		it := txn.NewIterator(opts)
		defer it.Close()

		prefixBytes := []byte(prefix)
		for it.Seek(prefixBytes); it.ValidForPrefix(prefixBytes); it.Next() {
			item := it.Item()
			key := string(item.Key())
			keys = append(keys, key)

			// Safety limit to prevent stack overflow
			if len(keys) > 10000 {
				break
			}
		}
		return nil
	})

	return keys, err
}

// SafeGetNextID generates the next ID with stack protection
func (s *SafeBadgerDB) SafeGetNextID(prefix string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var maxID int
	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = false
		it := txn.NewIterator(opts)
		defer it.Close()

		prefixBytes := []byte(prefix + ":")
		for it.Seek(prefixBytes); it.ValidForPrefix(prefixBytes); it.Next() {
			item := it.Item()
			key := string(item.Key())

			// Extract ID from key (format: prefix:number)
			if len(key) > len(prefix)+1 {
				idStr := key[len(prefix)+1:]
				if id, err := strconv.Atoi(idStr); err == nil && id > maxID {
					maxID = id
				}
			}
		}
		return nil
	})

	if err != nil {
		return "", err
	}

	nextID := maxID + 1
	return fmt.Sprintf("%s:%d", prefix, nextID), nil
}

// SafeIteratePlayers iterates through players with stack protection
func (s *SafeBadgerDB) SafeIteratePlayers(status, band string, limit, offset int, callback func(*models.Player) bool) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var processedCount int
	var returnedCount int

	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = true
		it := txn.NewIterator(opts)
		defer it.Close()

		prefixBytes := []byte("player:")
		for it.Seek(prefixBytes); it.ValidForPrefix(prefixBytes); it.Next() {
			// Safety limit to prevent stack overflow
			if processedCount > 10000 {
				break
			}
			processedCount++

			item := it.Item()
			var player models.Player

			err := item.Value(func(val []byte) error {
				// Copy the value to avoid holding the transaction
				result := make([]byte, len(val))
				copy(result, val)
				return json.Unmarshal(result, &player)
			})

			if err != nil {
				continue // Skip invalid entries
			}

			// Apply filters
			if status != "" && player.Status != status {
				continue
			}
			if band != "" {
				if bandInt, err := strconv.Atoi(band); err == nil && player.Band != bandInt {
					continue
				}
			}

			// Apply pagination
			if returnedCount < offset {
				returnedCount++
				continue
			}
			if limit > 0 && (returnedCount-offset) >= limit {
				break
			}

			// Call the callback function
			if !callback(&player) {
				break
			}
			returnedCount++
		}
		return nil
	})

	return err
}
