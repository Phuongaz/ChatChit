package user

import "time"

type User struct {
	ID                  string    `json:"id"`
	Username            string    `json:"username"`
	Email               string    `json:"email"`
	PublicKey           string    `json:"public_key"`
	PrivateEncryptedKey string    `json:"private_encrypted_key"`
	Password            string    `json:"password"`
	IV                  string    `json:"iv"`
	Salt                string    `json:"salt"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
