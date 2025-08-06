package auth

import (
	"github.com/phuongaz/chatchat/internal/domain/auth"
	"github.com/phuongaz/chatchat/internal/domain/user"
	"github.com/phuongaz/chatchat/internal/dto"
)

type AuthUsecase interface {
	Register(req auth.RegisterRequest) error
	Login(req dto.LoginRequest) (string, *user.User, error)
}
