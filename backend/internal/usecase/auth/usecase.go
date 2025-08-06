package auth

import (
	"errors"
	"time"

	"github.com/phuongaz/chatchat/internal/domain/auth"
	"github.com/phuongaz/chatchat/internal/domain/user"
	"github.com/phuongaz/chatchat/internal/dto"
	"github.com/phuongaz/chatchat/pkg/jwt"
)

type authUsecase struct {
	userRepo user.UserRepository
	jwtMaker jwt.JWTMaker
}

func NewAuthUsecase(userRepo user.UserRepository, jwtMaker jwt.JWTMaker) AuthUsecase {
	return &authUsecase{userRepo: userRepo, jwtMaker: jwtMaker}
}

func (a *authUsecase) Register(req auth.RegisterRequest) error {

	_, err := a.userRepo.FindByUsername(req.Username)
	if err == nil {
		return errors.New("user already exists")
	}

	err = a.userRepo.Create(user.User{
		Username:            req.Username,
		Password:            req.Password,
		PublicKey:           req.PublicKey,
		PrivateEncryptedKey: req.PrivateEncryptedKey,
		IV:                  req.IV,
		Salt:                req.Salt,
	})
	if err != nil {
		return err
	}

	return nil
}

func (a *authUsecase) Login(req dto.LoginRequest) (string, *user.User, error) {
	userFound, err := a.userRepo.FindByUsername(req.Username)
	if err != nil {
		return "", nil, err
	}

	if userFound.Password != req.HashedPassword {
		return "", nil, errors.New("invalid password")
	}

	token, err := a.jwtMaker.GenerateToken(userFound.ID, "user", 24*time.Hour)
	if err != nil {
		return "", nil, err
	}

	return token, userFound, nil
}
