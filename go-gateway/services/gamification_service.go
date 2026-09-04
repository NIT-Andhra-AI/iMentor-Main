package services

import (
	"sort"
	"sync"
	"time"

	"imentor/gateway/models"
)

// GamificationService handles student XP, ranks, streaks, and bounties
type GamificationService struct {
	mu       sync.RWMutex
	profiles map[string]*models.GamificationProfile // keyed by UserID
}

// NewGamificationService initializes the gamification engine
func NewGamificationService() *GamificationService {
	return &GamificationService{
		profiles: make(map[string]*models.GamificationProfile),
	}
}

// GetOrCreateProfile retrieves or initializes a gamification profile
func (s *GamificationService) GetOrCreateProfile(userID string) *models.GamificationProfile {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile, exists := s.profiles[userID]
	if !exists {
		level, rank := models.CalculateLevel(0)
		profile = &models.GamificationProfile{
			UserID:            userID,
			TotalXP:           0,
			CurrentLevel:      level,
			CurrentRank:       rank,
			CreditsBalance:    50, // Initial bonus credits
			LearningCredits:   10,
			CurrentStreakDays: 1,
			LongestStreakDays: 1,
			LastActiveDate:    time.Now(),
			Badges:            make([]models.Badge, 0),
		}
		s.profiles[userID] = profile
	}
	return profile
}

// AwardXP adds XP, recalculates level milestones, and returns whether level-up occurred
func (s *GamificationService) AwardXP(userID string, xpAmount int64) (newLevel int, leveledUp bool, newRank string) {
	profile := s.GetOrCreateProfile(userID)

	s.mu.Lock()
	defer s.mu.Unlock()

	oldLevel := profile.CurrentLevel
	profile.TotalXP += xpAmount

	level, rank := models.CalculateLevel(profile.TotalXP)
	profile.CurrentLevel = level
	profile.CurrentRank = rank
	profile.LastActiveDate = time.Now()

	leveledUp = level > oldLevel
	return level, leveledUp, rank
}

// UpdateStreak increments streak if active on consecutive days
func (s *GamificationService) UpdateStreak(userID string) int {
	profile := s.GetOrCreateProfile(userID)

	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	daysSinceLast := int(now.Sub(profile.LastActiveDate).Hours() / 24)

	if daysSinceLast == 1 {
		profile.CurrentStreakDays++
		if profile.CurrentStreakDays > profile.LongestStreakDays {
			profile.LongestStreakDays = profile.CurrentStreakDays
		}
	} else if daysSinceLast > 1 {
		profile.CurrentStreakDays = 1 // Reset streak if broken
	}

	profile.LastActiveDate = now
	return profile.CurrentStreakDays
}

// ClaimBounty awards credits upon successful completion of a knowledge bounty
func (s *GamificationService) ClaimBounty(userID string, bountyCredits int64, learningCredits int64) (int64, int64) {
	profile := s.GetOrCreateProfile(userID)

	s.mu.Lock()
	defer s.mu.Unlock()

	profile.CreditsBalance += bountyCredits
	profile.LearningCredits += learningCredits
	profile.CompletedBounties++

	return profile.CreditsBalance, profile.LearningCredits
}

// GetLeaderboard returns the top-N students sorted by Total XP
func (s *GamificationService) GetLeaderboard(topN int) []models.GamificationProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]models.GamificationProfile, 0, len(s.profiles))
	for _, p := range s.profiles {
		list = append(list, *p)
	}

	sort.SliceStable(list, func(i, j int) bool {
		return list[i].TotalXP > list[j].TotalXP
	})

	if len(list) > topN {
		list = list[:topN]
	}

	return list
}
