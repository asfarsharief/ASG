package database

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"

	"github.com/dgraph-io/badger/v4"
)

var DB *badger.DB

// InitBadgerDB initializes BadgerDB connection
func InitBadgerDB(dbPath string) (*badger.DB, error) {
	opts := badger.DefaultOptions(dbPath)
	opts.Logger = nil // Disable logging for cleaner output

	db, err := badger.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to open BadgerDB: %w", err)
	}

	DB = db
	log.Println("BadgerDB connected successfully")
	return db, nil
}

// CloseBadgerDB closes BadgerDB connection
func CloseBadgerDB(db *badger.DB) {
	if db != nil {
		if err := db.Close(); err != nil {
			log.Printf("Error closing BadgerDB: %v", err)
		} else {
			log.Println("BadgerDB disconnected")
		}
	}
}

// Set stores a key-value pair
func Set(key string, value interface{}) error {
	return DB.Update(func(txn *badger.Txn) error {
		data, err := json.Marshal(value)
		if err != nil {
			return err
		}
		return txn.Set([]byte(key), data)
	})
}

// Get retrieves a value by key
func Get(key string, dest interface{}) error {
	return DB.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(key))
		if err != nil {
			return err
		}

		valCopy, err := item.ValueCopy(nil)
		if err != nil {
			return fmt.Errorf("copying value: %w", err)
		}

		err = json.Unmarshal(valCopy, dest)
		if err != nil {
			return fmt.Errorf("copying value: %w", err)
		}
		return nil
	})
}

// Delete removes a key-value pair
func Delete(key string) error {
	return DB.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte(key))
	})
}

// ListKeys returns all keys with a given prefix
func ListKeys(prefix string) ([]string, error) {
	var keys []string
	err := DB.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = false
		it := txn.NewIterator(opts)
		defer it.Close()

		for it.Seek([]byte(prefix)); it.ValidForPrefix([]byte(prefix)); it.Next() {
			item := it.Item()
			key := string(item.Key())
			keys = append(keys, key)
		}
		return nil
	})
	return keys, err
}

// ListValues returns all values with a given prefix
func ListValues(prefix string, dest interface{}) error {
	var values []interface{}
	err := DB.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		it := txn.NewIterator(opts)
		defer it.Close()

		for it.Seek([]byte(prefix)); it.ValidForPrefix([]byte(prefix)); it.Next() {
			item := it.Item()
			err := item.Value(func(val []byte) error {
				var value interface{}
				if err := json.Unmarshal(val, &value); err != nil {
					return err
				}
				values = append(values, value)
				return nil
			})
			if err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return err
	}

	// Convert to JSON and back to dest type
	data, err := json.Marshal(values)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, dest)
}

// Exists checks if a key exists
func Exists(key string) (bool, error) {
	var exists bool
	err := DB.View(func(txn *badger.Txn) error {
		_, err := txn.Get([]byte(key))
		if err == badger.ErrKeyNotFound {
			exists = false
			return nil
		}
		if err != nil {
			return err
		}
		exists = true
		return nil
	})
	return exists, err
}

// GetNextID generates the next ID for a given prefix
func GetNextID(prefix string) (string, error) {
	var nextID int
	var maxID int

	// Use a more efficient approach to get the next ID
	err := DB.View(func(txn *badger.Txn) error {
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

	nextID = maxID + 1
	return fmt.Sprintf("%s:%d", prefix, nextID), nil
}
