package services

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"imentor/gateway/middleware"
	"imentor/gateway/models"
)

// AuthService manages user authentication and JWT lifecycle
type AuthService struct {
	mu        sync.RWMutex
	users     map[string]*models.User // keyed by UserID
	byEmail   map[string]*models.User // keyed by Email
	jwtSecret []byte
}

// NewAuthService creates a new AuthService
func NewAuthService(jwtSecret string) *AuthService {
	return &AuthService{
		users:     make(map[string]*models.User),
		byEmail:   make(map[string]*models.User),
		jwtSecret: []byte(jwtSecret),
	}
}

// Register creates a new student or faculty account
func (s *AuthService) Register(username, email, plainPassword, department string, isFaculty bool) (*models.User, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.byEmail[email]; exists {
		return nil, "", errors.New("email is already registered")
	}

	userID := fmt.Sprintf("usr_%d_%s", time.Now().UnixNano(), username)
	user := &models.User{
		ID:                   userID,
		Username:             username,
		Email:                email,
		IsFaculty:            isFaculty,
		IsAdmin:              false,
		Department:           department,
		PreferredLLMProvider: "sglang",
		Profile: models.UserProfile{
			Branch:         department,
			ConceptMastery: make(map[string]float64),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := user.SetPassword(plainPassword); err != nil {
		return nil, "", fmt.Errorf("failed to hash password: %w", err)
	}

	s.users[userID] = user
	s.byEmail[email] = user

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// Login verifies credentials and returns a signed JWT
func (s *AuthService) Login(email, plainPassword string) (*models.User, string, error) {
	s.mu.RLock()
	user, exists := s.byEmail[email]
	s.mu.RUnlock()

	if !exists || !user.CheckPassword(plainPassword) {
		return nil, "", errors.New("invalid email or password")
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// GetUserByID retrieves a user by their unique ID
func (s *AuthService) GetUserByID(userID string) (*models.User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	user, exists := s.users[userID]
	return user, exists
}

// GenerateToken creates a signed JWT for a user
func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	role := "student"
	if user.IsAdmin {
		role = "admin"
	} else if user.IsFaculty {
		role = "faculty"
	}

	claims := &middleware.UserClaims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      role,
		IsFaculty: user.IsFaculty,
		IsAdmin:   user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * 7 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
