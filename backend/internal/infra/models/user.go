package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                  uuid.UUID `gorm:"primaryKey"`
	Username            string    `gorm:"unique;not null"`
	Password            string    `gorm:"not null"`
	PublicKey           string    `gorm:"not null"`
	PrivateEncryptedKey string    `gorm:"not null"`
	IV                  string    `gorm:"not null"`
	Salt                string    `gorm:"not null"`
	CreatedAt           time.Time `gorm:"autoCreateTime"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime"`
}
