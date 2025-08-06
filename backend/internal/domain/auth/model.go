package auth

type RegisterRequest struct {
	Username            string `json:"username"`
	Password            string `json:"password"`
	PublicKey           string `json:"public_key"`
	PrivateEncryptedKey string `json:"private_encrypted_key"`
	IV                  string `json:"iv"`
	Salt                string `json:"salt"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
