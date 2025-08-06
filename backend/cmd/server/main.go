package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/phuongaz/chatchat/internal/bootstrap"
	"github.com/phuongaz/chatchat/internal/delivery/http"
	"github.com/phuongaz/chatchat/internal/infra/repo"
	"github.com/phuongaz/chatchat/internal/usecase/auth"
	"github.com/phuongaz/chatchat/internal/usecase/chat"
	"github.com/phuongaz/chatchat/internal/usecase/user"
	"github.com/phuongaz/chatchat/pkg/jwt"
)

func main() {
	// Check required environment variables
	jwtSecret := os.Getenv("JWT_SECRET_KEY")

	router := gin.Default()

	db := bootstrap.ConnectMySQL()

	userRepo := repo.NewMysqlUserRepo(db)
	chatRepo := repo.NewMysqlChatRepo(db)

	jwtMaker := jwt.NewJWT(jwtSecret)
	authUC := auth.NewAuthUsecase(userRepo, jwtMaker)
	userUC := user.NewUserUsecase(userRepo)
	chatUC := chat.NewChatUsecase(chatRepo)

	router = http.NewRouter(authUC, chatUC, userUC)

	log.Printf("Server starting on port 8089...")
	router.Run(":8089")
}
