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
	defer conn.Close()

	userID := c.Param("userID")
	user, err := h.userUC.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		log.Printf("WS: user not found for id=%s: %v", userID, err)
		conn.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "user not found"))
		return
	}

	repo.Manager.AddConnection(user.ID, conn)
	defer repo.Manager.RemoveConnection(user.ID)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("WS read error for user %s: %v", user.ID, err)
			}
			break
		}

		var encryptedMsg chat.EncryptedMessage
		if err := json.Unmarshal(msg, &encryptedMsg); err != nil {
			log.Printf("WS: failed to unmarshal message from %s: %v", user.ID, err)
			continue
		}

		if err := h.chatUC.SendMessage(c.Request.Context(), encryptedMsg); err != nil {
			log.Printf("WS: SendMessage error for user %s: %v", user.ID, err)
			break
		}
	}
}
