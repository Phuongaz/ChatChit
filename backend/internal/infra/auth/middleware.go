package auth

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/phuongaz/chatchat/pkg/jwt"
)

func JWTMiddleware() gin.HandlerFunc {
	jwtMaker := jwt.NewJWT(os.Getenv("JWT_SECRET_KEY"))

	return func(c *gin.Context) {
		tokenString, err := c.Cookie("token")
		if err != nil {
			log.Printf("JWT Middleware: No token cookie found: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		payload, err := jwtMaker.VerifyToken(tokenString)
		if err != nil {
			log.Printf("JWT Middleware: Failed to verify token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		log.Printf("JWT Middleware: Successfully authenticated user ID: %s", payload.UserID)
		c.Set("userID", payload.UserID)
		c.Set("role", payload.Role)
		c.Next()
	}
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get origin from request header
		origin := c.Request.Header.Get("Origin")

		// Allow specific origins
		allowedOrigins := []string{
			"http://localhost:3000",  // Frontend
			"http://localhost:3001",  // Admin Panel
			"https://localhost:3000", // Frontend (HTTPS)
			"https://localhost:3001", // Admin Panel (HTTPS)
			"http://localhost",       // Nginx proxy
			"https://localhost",      // Nginx proxy (HTTPS)
		}

		isAllowed := false
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				isAllowed = true
				break
			}
		}

		if strings.HasPrefix(origin, "http://192.168.") || strings.HasPrefix(origin, "https://192.168.") {
			isAllowed = true
		}

		// Always allow requests from nginx proxy (no origin header)
		if origin == "" {
			isAllowed = true
		}

		if isAllowed {
			if origin != "" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			}
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
			c.Writer.Header().Set("Access-Control-Max-Age", "86400") // 24 hours
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
