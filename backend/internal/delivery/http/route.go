package http

import (
	"github.com/gin-gonic/gin"
	"github.com/phuongaz/chatchat/internal/delivery/http/handler"
	"github.com/phuongaz/chatchat/internal/delivery/websocket"
	middleware "github.com/phuongaz/chatchat/internal/infra/auth"
	"github.com/phuongaz/chatchat/internal/usecase/auth"
	"github.com/phuongaz/chatchat/internal/usecase/chat"
	"github.com/phuongaz/chatchat/internal/usecase/user"
)

func NewRouter(authUC auth.AuthUsecase, chatUC chat.ChatUsecase, userUC user.UserUsecase) *gin.Engine {
	r := gin.Default()
	r.Use(middleware.CORS())
	api := r.Group("/api")
	auth := api.Group("/auth")
	{
		authHandler := handler.NewAuthHandler(authUC, userUC)
		auth.POST("/check-register", authHandler.CheckRegister)
		auth.POST("/pre-login", authHandler.PreLogin)
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	chat := api.Group("/chat")
	chat.Use(middleware.JWTMiddleware())
	{
		chatHandler := handler.NewChatHandler(chatUC)
		chat.POST("/send-message", chatHandler.SendMessage)
		chat.GET("/history", chatHandler.HistoryChats)
		chat.GET("/history/:userID", chatHandler.HistoryChatsByUserID)
		chat.GET("/messages/:conversationID", chatHandler.GetMessagesByConversationID)
		chat.DELETE("/conversation/:conversationID", chatHandler.DeleteConversation)
	}

	user := api.Group("/user")
	{
		userHandler := handler.NewUserHandler(userUC)
		user.GET("/public-key/:userID", userHandler.GetPublicKey)
		user.GET("/search", userHandler.SearchUser)
		user.GET("/:userID", userHandler.GetUser)
	}

	ws := websocket.NewWebSocketHandler(chatUC, userUC)
	api.GET("/ws", ws.HandleMessage)
	api.GET("/ws/:userID", ws.HandleMessage)
	return r
}
