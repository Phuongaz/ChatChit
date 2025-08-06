package chat

import (
	"context"
	"errors"
	"log"

	"github.com/phuongaz/chatchat/internal/domain/chat"
	"github.com/phuongaz/chatchat/internal/infra/repo"
)

type chatUsecase struct {
	chatRepo chat.ChatRepository
}

func (s *chatUsecase) HandleMessage(ctx context.Context, msg chat.EncryptedMessage) error {
	log.Printf("User %s gửi tới %s: %s\n", msg.SenderID, msg.ReceiverID, msg.CipherText)
	return nil
}

func (s *chatUsecase) SendMessage(ctx context.Context, msg chat.EncryptedMessage) error {
	conversationID, err := s.chatRepo.GetOrCreateConversationID(msg.SenderID, msg.ReceiverID)
	if err != nil {
		return err
	}

	if err := s.chatRepo.SaveMessage(chat.Messages{
		ConversationID: conversationID,
		SenderID:       msg.SenderID,
		ReceiverID:     msg.ReceiverID,
		IV:             msg.IV,
		CipherText:     msg.CipherText,
		Timestamp:      msg.Timestamp,
	}); err != nil {
		return err
	}

	// Try to send real-time message if receiver is online
	// Don't return error if receiver is offline - message is already saved
	log.Printf("Looking for WebSocket connection for receiver: %s", msg.ReceiverID)
	receiverConn, ok := repo.Manager.GetConnection(msg.ReceiverID)
	if ok {
		log.Printf("Found WebSocket connection for %s, sending real-time message", msg.ReceiverID)
		log.Printf("Sending WebSocket message: SenderID=%s, ReceiverID=%s, CipherText=%s, IV=%s, Timestamp=%d",
			msg.SenderID, msg.ReceiverID, msg.CipherText, msg.IV, msg.Timestamp)
		if err := receiverConn.WriteJSON(msg); err != nil {
			log.Printf("Failed to send real-time message to %s: %v", msg.ReceiverID, err)
		} else {
			log.Printf("Successfully sent real-time message to %s", msg.ReceiverID)
		}
	} else {
		log.Printf("Receiver %s is offline, message saved for later delivery", msg.ReceiverID)
		// List all active connections for debugging
		log.Printf("Active connections: %v", repo.Manager.ListConnections())
	}

	return nil
}

func (s *chatUsecase) GetChatList(ctx context.Context, userID string) ([]chat.ChatListItem, error) {
	// Get conversation histories (now includes real usernames from join)
	histories, err := s.chatRepo.GetConversationHistoryByUserID(userID)
	if err != nil {
		return nil, err
	}

	// Convert to ChatListItem format
	chatList := make([]chat.ChatListItem, 0, len(histories))
	for _, history := range histories {
		otherUserID := history.ID

		// Use real username from repository join query
		username := history.Username
		if username == "" {
			username = "User_" + otherUserID[:8] // Fallback if username is empty
		}

		// Format timestamp as ISO string for frontend
		updatedAt := "2025-01-04T12:00:00Z" // Mock timestamp
		if history.LastMessageTimestamp > 0 {
			// Convert unix timestamp to ISO string if needed
			updatedAt = "2025-01-04T12:00:00Z" // Simplified for now
		}

		chatItem := chat.ChatListItem{
			UserID:               otherUserID,
			Username:             username,
			ConversationID:       history.ConversationID,
			LastMessage:          history.LastMessage,
			LastMessageTimestamp: history.LastMessageTimestamp,
			UpdatedAt:            updatedAt,
		}

		chatList = append(chatList, chatItem)
	}

	return chatList, nil
}

func (s *chatUsecase) HistoryChats(ctx context.Context, userID string) ([]chat.ConversationHistory, error) {
	conversationHistories, err := s.chatRepo.GetConversationHistoryByUserID(userID)
	if err != nil {
		return nil, err
	}

	return conversationHistories, nil
}

func (s *chatUsecase) GetOrCreateConversationID(ctx context.Context, userID1 string, userID2 string) (string, error) {
	return s.chatRepo.GetOrCreateConversationID(userID1, userID2)
}

func (s *chatUsecase) GetMessagesByConversationID(ctx context.Context, conversationID string) ([]chat.Messages, error) {
	return s.chatRepo.GetMessagesByConversationID(conversationID)
}

func (s *chatUsecase) DeleteConversation(ctx context.Context, conversationID string, userID string) error {
	// Verify that the user is part of this conversation before allowing deletion
	conversation, err := s.chatRepo.GetConversationByID(conversationID)
	if err != nil {
		return err
	}

	// Check if user is participant in this conversation
	if conversation.UserID1 != userID && conversation.UserID2 != userID {
		return errors.New("user is not authorized to delete this conversation")
	}

	// Delete all messages in the conversation first
	err = s.chatRepo.DeleteMessagesByConversationID(conversationID)
	if err != nil {
		return err
	}

	// Then delete the conversation itself
	err = s.chatRepo.DeleteConversation(conversationID)
	if err != nil {
		return err
	}

	log.Printf("Successfully deleted conversation %s and all its messages", conversationID)
	return nil
}
