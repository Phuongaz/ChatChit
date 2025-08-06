package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	chatDomain "github.com/phuongaz/chatchat/internal/domain/chat"
	"github.com/phuongaz/chatchat/internal/dto"
	chatUsecase "github.com/phuongaz/chatchat/internal/usecase/chat"
)

type ChatHandler struct {
	chatUC chatUsecase.ChatUsecase
}

func NewChatHandler(chatUC chatUsecase.ChatUsecase) *ChatHandler {
	return &ChatHandler{chatUC: chatUC}
}

func (h *ChatHandler) HistoryChats(c *gin.Context) {
	senderIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Code:    http.StatusUnauthorized,
			Message: "User not authenticated",
		})
		return
	}

	userID, ok := senderIDValue.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: "Invalid user ID format",
		})
		return
	}

	chats, err := h.chatUC.GetChatList(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "History chats",
		Data: gin.H{
			"chats": chats,
		},
	})
}

func (h *ChatHandler) HistoryChatsByUserID(c *gin.Context) {
	userID := c.Param("userID")
	//log.Printf("HistoryChatsByUserID called for target user: %s", userID)
	currentUserIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Code:    http.StatusUnauthorized,
			Message: "User not authenticated",
		})
		return
	}

	currentUserID, ok := currentUserIDValue.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: "Invalid user ID format",
		})
		return
	}

	//log.Printf("Looking for conversation between current user %s and target user %s", currentUserID, userID)

	conversationID, err := h.chatUC.GetOrCreateConversationID(c.Request.Context(), currentUserID, userID)
	if err != nil {
		log.Printf("Failed to get conversation ID: %v", err)
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	//log.Printf("Found/created conversation ID: %s", conversationID)

	messages, err := h.chatUC.GetMessagesByConversationID(c.Request.Context(), conversationID)
	if err != nil {
		log.Printf("Failed to get messages for conversation %s: %v", conversationID, err)
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	//log.Printf("Found %d messages for conversation %s", len(messages), conversationID)

	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "Messages",
		Data: gin.H{
			"messages": messages,
		},
	})
}

func (h *ChatHandler) GetMessagesByConversationID(c *gin.Context) {
	conversationID := c.Param("conversationID")
	messages, err := h.chatUC.GetMessagesByConversationID(c.Request.Context(), conversationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "Messages",
		Data:    messages,
	})
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	var req struct {
		ReceiverID string `json:"receiver_id" binding:"required"`
		CipherText string `json:"cipher_text" binding:"required"`
		IV         string `json:"iv" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("SendMessage: Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, dto.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	senderIDValue, exists := c.Get("userID")
	if !exists {
		log.Printf("SendMessage: No userID in context")
		c.JSON(http.StatusUnauthorized, dto.Response{
			Code:    http.StatusUnauthorized,
			Message: "User not authenticated",
		})
		return
	}

	senderID, ok := senderIDValue.(string)
	if !ok {
		log.Printf("SendMessage: Invalid userID format in context: %v", senderIDValue)
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: "Invalid user ID format",
		})
		return
	}

	//log.Printf("SendMessage: Sending message from %s to %s", senderID, req.ReceiverID)

	// Create encrypted message
	encryptedMsg := chatDomain.EncryptedMessage{
		SenderID:   senderID,
		ReceiverID: req.ReceiverID,
		CipherText: req.CipherText,
		IV:         req.IV,
		Timestamp:  time.Now().Unix(),
	}

	err := h.chatUC.SendMessage(c.Request.Context(), encryptedMsg)
	if err != nil {
		log.Printf("SendMessage: Failed to send message: %v", err)
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	log.Printf("SendMessage: Successfully sent message")
	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "Message sent successfully",
		Data: gin.H{
			"message_id": time.Now().Unix(), // Simple message ID for now
			"timestamp":  encryptedMsg.Timestamp,
		},
	})
}

func (h *ChatHandler) DeleteConversation(c *gin.Context) {
	conversationID := c.Param("conversationID")

	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.Response{
			Code:    http.StatusUnauthorized,
			Message: "User not authenticated",
		})
		return
	}

	userID, ok := userIDValue.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: "Invalid user ID format",
		})
		return
	}

	//log.Printf("DeleteConversation: User %s requesting to delete conversation %s", userID, conversationID)

	err := h.chatUC.DeleteConversation(c.Request.Context(), conversationID, userID)
	if err != nil {
		//log.Printf("DeleteConversation: Failed to delete conversation: %v", err)
		c.JSON(http.StatusInternalServerError, dto.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.Response{
		Code:    http.StatusOK,
		Message: "Conversation deleted successfully",
	})
}
