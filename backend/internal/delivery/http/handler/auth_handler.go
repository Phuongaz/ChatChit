package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	domainAuth "github.com/phuongaz/chatchat/internal/domain/auth"
	"github.com/phuongaz/chatchat/internal/dto"
	"github.com/phuongaz/chatchat/internal/usecase/auth"
	"github.com/phuongaz/chatchat/internal/usecase/user"
)

type AuthHandler struct {
	authUC auth.AuthUsecase
	userUC user.UserUsecase
}

func NewAuthHandler(authUC auth.AuthUsecase, userUC user.UserUsecase) *AuthHandler {
	return &AuthHandler{authUC: authUC, userUC: userUC}
}

func (h *AuthHandler) CheckRegister(c *gin.Context) {
	//same login request but check if user already exists
	var req domainAuth.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	_, err := h.userUC.GetUserByUsername(c.Request.Context(), req.Username)
	if err == nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Code:    http.StatusBadRequest,
			Message: "User already exists",
			Data:    gin.H{"available": false},
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "User already exists",
		Data:    gin.H{"available": true},
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req domainAuth.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	err := h.authUC.Register(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "User registered successfully",
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	token, user, err := h.authUC.Login(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		Domain:   "",
		MaxAge:   3600,
		Secure:   false,
		HttpOnly: true,
	})

	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "Login successful",
		Data: gin.H{
			"user_id":             user.ID,
			"username":            user.Username,
			"privateEncryptedKey": user.PrivateEncryptedKey,
			"salt":                user.Salt,
			"iv":                  user.IV,
		},
	})
}
