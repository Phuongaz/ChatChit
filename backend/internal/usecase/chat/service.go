package chat

import (
	"context"

	"github.com/phuongaz/chatchat/internal/domain/chat"
)

type ChatUsecase interface {
	SendMessage(ctx context.Context, msg chat.EncryptedMessage) error
	GetChatList(ctx context.Context, userID string) ([]chat.ChatListItem, error)
	GetOrCreateConversationID(ctx context.Context, userID1 string, userID2 string) (string, error)
	GetMessagesByConversationID(ctx context.Context, conversationID string) ([]chat.Messages, error)
	DeleteConversation(ctx context.Context, conversationID string, userID string) error
}

func NewChatUsecase(r chat.ChatRepository) ChatUsecase {
	return &chatUsecase{chatRepo: r}
}
