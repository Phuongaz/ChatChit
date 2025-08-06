package models

type Chat struct {
	ID         string `gorm:"primaryKey"`
	SenderID   string `gorm:"not null"`
	ReceiverID string `gorm:"not null"`
	CipherText string `gorm:"not null"`
	Timestamp  int64  `gorm:"not null"`
}

func (Chat) TableName() string {
	return "chats"
}

type Messages struct {
	ID             string `gorm:"primaryKey"`
	ConversationID string `gorm:"not null"`
	SenderID       string `gorm:"not null"`
	ReceiverID     string `gorm:"not null"`
	Content        string `gorm:"default:''"`
	IV             string `gorm:"not null"`
	CipherText     string `gorm:"not null"`
	Timestamp      int64  `gorm:"not null"`
}

func (Messages) TableName() string {
	return "messages"
}

type Conversation struct {
	ID      string `gorm:"primaryKey"`
	UserID1 string `gorm:"not null"`
	UserID2 string `gorm:"not null"`
}

func (Conversation) TableName() string {
	return "conversations"
}

type ConversationHistory struct {
	ID             string     `gorm:"primaryKey"`
	ConversationID string     `gorm:"not null"`
	Messages       []Messages `gorm:"foreignKey:ConversationID"`
}

func (ConversationHistory) TableName() string {
	return "conversation_histories"
}
