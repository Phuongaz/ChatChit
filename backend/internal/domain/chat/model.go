package chat

type EncryptedMessage struct {
	SenderID   string `json:"sender_id"`
	ReceiverID string `json:"receiver_id"`
	CipherText string `json:"cipher_text"`
	Timestamp  int64  `json:"timestamp"`
	IV         string `json:"iv"`
}

type Conversation struct {
	ID                   string `json:"id"`
	UserID1              string `json:"user_id1"`
	UserID2              string `json:"user_id2"`
	LastMessage          string `json:"last_message"`
	LastMessageTimestamp int64  `json:"last_message_timestamp"`
}

type Messages struct {
	ID             string `json:"id"`
	ConversationID string `json:"conversation_id"`
	SenderID       string `json:"sender_id"`
	ReceiverID     string `json:"receiver_id"`
	IV             string `json:"iv"`
	CipherText     string `json:"cipher_text"`
	Timestamp      int64  `json:"timestamp"`
}

type ConversationHistory struct {
	ID                   string     `json:"id"`
	ConversationID       string     `json:"conversation_id"`
	Username             string     `json:"username"`
	Messages             []Messages `json:"messages"`
	LastMessage          string     `json:"last_message"`
	LastMessageTimestamp int64      `json:"last_message_timestamp"`
}

// ChatListItem represents a chat item in the sidebar
type ChatListItem struct {
	UserID               string `json:"user_id"`
	Username             string `json:"username"`
	ConversationID       string `json:"conversation_id"`
	LastMessage          string `json:"last_message"`
	LastMessageTimestamp int64  `json:"last_message_timestamp"`
	UpdatedAt            string `json:"updated_at"`
}
