package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/phuongaz/chatchat/internal/dto"
	"github.com/phuongaz/chatchat/internal/usecase/user"
)

type UserHandler struct {
	userUC user.UserUsecase
}

func NewUserHandler(userUC user.UserUsecase) *UserHandler {
	return &UserHandler{userUC: userUC}
}

func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("userID")
	user, err := h.userUC.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "User",
		Data:    user,
	})
}

func (h *UserHandler) SearchUser(c *gin.Context) {
	query := c.Query("q")
	fmt.Println("query", query)
	users, err := h.userUC.SearchUser(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "Search user",
		Data:    users,
	})
}

func (h *UserHandler) GetPublicKey(c *gin.Context) {
	userID := c.Param("userID")
	user, err := h.userUC.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "Public key",
		Data: gin.H{
			"public_key": user.PublicKey,
		},
	})
}
