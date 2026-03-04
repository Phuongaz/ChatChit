package repo

import (
	"log"

	"github.com/google/uuid"
	"github.com/phuongaz/chatchat/internal/domain/chat"
	"github.com/phuongaz/chatchat/internal/infra/models"
	"gorm.io/gorm"
)

type mysqlChatRepo struct {
	db *gorm.DB
}

func NewMysqlChatRepo(db *gorm.DB) chat.ChatRepository {
	return &mysqlChatRepo{db: db}
}

func (r *mysqlChatRepo) SaveMessage(msg chat.Messages) error {
	return r.db.Create(&models.Messages{
		ID:             uuid.New().String(),
		ConversationID: msg.ConversationID,
		SenderID:       msg.SenderID,
		ReceiverID:     msg.ReceiverID,
		IV:             msg.IV,
		CipherText:     msg.CipherText,
		Timestamp:      msg.Timestamp,
	}).Error
}

func (r *mysqlChatRepo) GetOrCreateConversationID(userID1 string, userID2 string) (string, error) {
	var conversation models.Conversation

	// Try to find existing conversation in both directions
	err := r.db.Model(&models.Conversation{}).Where(
		"(user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)",
		userID1, userID2, userID2, userID1,
	).First(&conversation).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new conversation with consistent ordering (smaller ID first)
			var firstUserID, secondUserID string
			if userID1 < userID2 {
				firstUserID, secondUserID = userID1, userID2
			} else {
				firstUserID, secondUserID = userID2, userID1
			}

			conversationID := uuid.New().String()
			log.Printf("Creating new conversation %s between %s and %s", conversationID, firstUserID, secondUserID)

			err = r.db.Create(&models.Conversation{
				ID:      conversationID,
				UserID1: firstUserID,
				UserID2: secondUserID,
			}).Error
			if err != nil {
				return "", err
			}
			return conversationID, nil
		}
		return "", err
	}

	log.Printf("Found existing conversation %s between %s and %s", conversation.ID, conversation.UserID1, conversation.UserID2)
	return conversation.ID, nil
}

func (r *mysqlChatRepo) GetMessagesByConversationID(conversationID string) ([]chat.Messages, error) {
	var messages []models.Messages
	err := r.db.Model(&models.Messages{}).Where("conversation_id = ?", conversationID).Order("timestamp ASC").Find(&messages).Error
	if err != nil {
		log.Printf("Error getting messages for conversation %s: %v", conversationID, err)
		return nil, err
	}

	log.Printf("Found %d messages in database for conversation %s", len(messages), conversationID)

	// Convert models to domain
	result := make([]chat.Messages, len(messages))
	for i, msg := range messages {
		log.Printf("Message %d: ID=%s, Timestamp=%d, CipherText=%s", i, msg.ID, msg.Timestamp, msg.CipherText[:20]+"...")
		result[i] = chat.Messages{
			ID:             msg.ID,
			ConversationID: msg.ConversationID,
			SenderID:       msg.SenderID,
			ReceiverID:     msg.ReceiverID,
			IV:             msg.IV,
			CipherText:     msg.CipherText,
			Timestamp:      msg.Timestamp,
		}
	}

	log.Printf("Returning %d messages for conversation %s", len(result), conversationID)
	return result, nil
}

func (r *mysqlChatRepo) GetConversationHistoryByUserID(userID string) ([]chat.ConversationHistory, error) {
	// Query to get conversations with user info
	query := `
		SELECT DISTINCT
			c.id as conversation_id,
			CASE 
				WHEN c.user_id1 = ? THEN c.user_id2 
				ELSE c.user_id1 
			END as other_user_id,
			CASE 
				WHEN c.user_id1 = ? THEN u2.username 
				ELSE u1.username 
			END as other_username,
			COALESCE(m.cipher_text, '') as last_message,
			COALESCE(m.iv, '') as last_message_iv,
			COALESCE(m.timestamp, 0) as last_message_timestamp
		FROM conversations c
		LEFT JOIN users u1 ON c.user_id1 = u1.id  
		LEFT JOIN users u2 ON c.user_id2 = u2.id
		LEFT JOIN messages m ON c.id = m.conversation_id 
			AND m.timestamp = (
				SELECT MAX(timestamp) 
				FROM messages m2 
				WHERE m2.conversation_id = c.id
			)
		WHERE c.user_id1 = ? OR c.user_id2 = ?
		ORDER BY COALESCE(m.timestamp, 0) DESC
	`

	rows, err := r.db.Raw(query, userID, userID, userID, userID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]chat.ConversationHistory, 0)
	for rows.Next() {
		var conversationID, otherUserID, otherUsername, lastMessage, lastMessageIV string
		var lastMessageTimestamp int64

		err := rows.Scan(&conversationID, &otherUserID, &otherUsername, &lastMessage, &lastMessageIV, &lastMessageTimestamp)
		if err != nil {
			continue
		}

		history := chat.ConversationHistory{
			ID:                   otherUserID,
			ConversationID:       conversationID,
			Username:             otherUsername,
			Messages:             []chat.Messages{},
			LastMessage:          lastMessage,
			LastMessageIV:        lastMessageIV,
			LastMessageTimestamp: lastMessageTimestamp,
		}

		result = append(result, history)
	}

	return result, nil
}

func (r *mysqlChatRepo) GetConversationByID(conversationID string) (*chat.Conversation, error) {
	var conversation models.Conversation
	err := r.db.Model(&models.Conversation{}).Where("id = ?", conversationID).First(&conversation).Error
	if err != nil {
		return nil, err
	}

	return &chat.Conversation{
		ID:      conversation.ID,
		UserID1: conversation.UserID1,
		UserID2: conversation.UserID2,
	}, nil
}

func (r *mysqlChatRepo) DeleteMessagesByConversationID(conversationID string) error {
	return r.db.Where("conversation_id = ?", conversationID).Delete(&models.Messages{}).Error
}

func (r *mysqlChatRepo) DeleteConversation(conversationID string) error {
	return r.db.Where("id = ?", conversationID).Delete(&models.Conversation{}).Error
}
