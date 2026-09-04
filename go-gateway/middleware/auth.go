package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserContextKey contextKey = "userClaims"

// UserClaims represents standard JWT claims extracted from iMentor auth tokens
type UserClaims struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	IsFaculty bool   `json:"isFaculty"`
	IsAdmin   bool   `json:"isAdmin"`
	jwt.RegisteredClaims
}

// AuthMiddleware optionally or strictly validates JWT bearer tokens
func AuthMiddleware(secret string, strict bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				if strict {
					http.Error(w, `{"error":"Authorization required"}`, http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r)
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			claims := &UserClaims{}

			token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})

			if err != nil || !token.Valid {
				if strict {
					http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r)
				return
			}

			// Store claims in context
			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserClaims retrieves extracted JWT claims from context
func GetUserClaims(r *http.Request) *UserClaims {
	if val := r.Context().Value(UserContextKey); val != nil {
		if claims, ok := val.(*UserClaims); ok {
			return claims
		}
	}
	return nil
}

// GetUserID retrieves the authenticated UserID from request context
func GetUserID(r *http.Request) string {
	if claims := GetUserClaims(r); claims != nil {
		return claims.UserID
	}
	return ""
}

