package chat

type ChatRepository interface {
	SaveMessage(msg Messages) error
	GetOrCreateConversationID(userID1 string, userID2 string) (string, error)
	GetMessagesByConversationID(conversationID string) ([]Messages, error)
	GetConversationHistoryByUserID(userID string) ([]ConversationHistory, error)
	GetConversationByID(conversationID string) (*Conversation, error)
	GetMessageByID(messageID string) (*Messages, error)
	DeleteMessage(messageID string) error
	DeleteMessagesByConversationID(conversationID string) error
	DeleteConversation(conversationID string) error
}
