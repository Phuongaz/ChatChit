package user

import (
	"context"

	"github.com/phuongaz/chatchat/internal/domain/user"
)

type UserUsecase interface {
	GetPublicKey(ctx context.Context, userID string) (string, error)
	SearchUser(ctx context.Context, query string) ([]*user.User, error)
	GetUserByID(ctx context.Context, userID string) (*user.User, error)
	GetUserByUsername(ctx context.Context, username string) (*user.User, error)
}

func NewUserUsecase(userRepo user.UserRepository) UserUsecase {
	return &userUsecase{userRepo: userRepo}
}
