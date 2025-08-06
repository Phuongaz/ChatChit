package user

import (
	"context"
	"fmt"

	"github.com/phuongaz/chatchat/internal/domain/user"
)

type userUsecase struct {
	userRepo user.UserRepository
}

func (u *userUsecase) GetUserByID(ctx context.Context, userID string) (*user.User, error) {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (u *userUsecase) GetUserByUsername(ctx context.Context, username string) (*user.User, error) {
	user, err := u.userRepo.FindByUsername(username)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (u *userUsecase) SearchUser(ctx context.Context, query string) ([]*user.User, error) {
	fmt.Println("query", query)
	users, err := u.userRepo.SearchUser(query)
	if err != nil {
		return nil, err
	}
	fmt.Println("users", users)
	return users, nil
}

func (u *userUsecase) GetPublicKey(ctx context.Context, userID string) (string, error) {
	publicKey, err := u.userRepo.GetPublicKey(userID)
	if err != nil {
		return "", err
	}
	return publicKey, nil
}
