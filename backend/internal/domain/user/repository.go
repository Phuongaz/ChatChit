package user

type UserRepository interface {
	FindByID(id string) (*User, error)
	FindByUsername(username string) (*User, error)
	SearchUser(query string) ([]*User, error)
	Create(user User) error
	GetPublicKey(userID string) (string, error)
}
