package store

import (
    "encoding/json"
    "fmt"

    "go.etcd.io/bbolt"
)

var db *bbolt.DB

func InitDB(path string) error {
    var err error
    db, err = bbolt.Open(path, 0666, nil)
    if err != nil {
        return err
    }

    return db.Update(func(tx *bbolt.Tx) error {
        _, err := tx.CreateBucketIfNotExists([]byte("players"))
        if err != nil {
            return fmt.Errorf("create bucket: %s", err)
        }
        _, err = tx.CreateBucketIfNotExists([]byte("auctions"))
        if err != nil {
            return fmt.Errorf("create bucket: %s", err)
        }
        _, err = tx.CreateBucketIfNotExists([]byte("games"))
        if err != nil {
            return fmt.Errorf("create bucket: %s", err)
        }
        return nil
    })
}

func Save(bucket string, key string, value interface{}) error {
    return db.Update(func(tx *bbolt.Tx) error {
        b := tx.Bucket([]byte(bucket))
        data, err := json.Marshal(value)
        if err != nil {
            return err
        }
        return b.Put([]byte(key), data)
    })
}

func GetAll(bucket string, dest interface{}) error {
    return db.View(func(tx *bbolt.Tx) error {
        b := tx.Bucket([]byte(bucket))
        var all []json.RawMessage
        b.ForEach(func(k, v []byte) error {
            all = append(all, v)
            return nil
        })
        data, _ := json.Marshal(all)
        return json.Unmarshal(data, dest)
    })
}
