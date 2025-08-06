package websocket

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/phuongaz/chatchat/internal/domain/chat"
	"github.com/phuongaz/chatchat/internal/infra/repo"
	chatUsecase "github.com/phuongaz/chatchat/internal/usecase/chat"
	userUsecase "github.com/phuongaz/chatchat/internal/usecase/user"
)

type WebSocketHandler struct {
	chatUC chatUsecase.ChatUsecase
	userUC userUsecase.UserUsecase
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func NewWebSocketHandler(chatUC chatUsecase.ChatUsecase, userUC userUsecase.UserUsecase) *WebSocketHandler {
	return &WebSocketHandler{chatUC: chatUC, userUC: userUC}
}

func (h *WebSocketHandler) HandleMessage(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}

	userID := c.Param("userID")
	user, err := h.userUC.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		log.Printf("Error getting user: %v", err)
		return
	}

	repo.Manager.AddConnection(user.ID, conn)

	defer func() {
		repo.Manager.RemoveConnection(userID)
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		var encryptedMsg chat.EncryptedMessage
		if err := json.Unmarshal(msg, &encryptedMsg); err != nil {
			log.Printf("Error unmarshalling message: %v", err)
		}

		if err := h.chatUC.SendMessage(c.Request.Context(), encryptedMsg); err != nil {
			log.Printf("Error sending message: %v", err)
			break
		}
	}
}
