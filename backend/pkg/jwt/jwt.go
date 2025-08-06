package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Payload struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type JWTMaker interface {
	GenerateToken(userID string, role string, duration time.Duration) (string, error)
	VerifyToken(token string) (*Payload, error)
}

type JWT struct {
	secretKey string
}

func NewJWT(secretKey string) *JWT {
	return &JWT{secretKey: secretKey}
}

func (j *JWT) GenerateToken(userID string, role string, duration time.Duration) (string, error) {
	payload := &Payload{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, payload)
	return token.SignedString([]byte(j.secretKey))
}

func (j *JWT) VerifyToken(tokenStr string) (*Payload, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Payload{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(j.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	payload, ok := token.Claims.(*Payload)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return payload, nil
}
