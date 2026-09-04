package models

import (
	"math"
	"time"
)

// Badge represents a gamification achievement badge
type Badge struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"` // "socratic", "streak", "mastery", "bounty"
	Icon        string    `json:"icon"`
	Rarity      string    `json:"rarity"` // "common", "rare", "epic", "legendary"
	UnlockedAt  time.Time `json:"unlockedAt"`
}

// GamificationProfile tracks student XP, levels, streaks, and achievements
type GamificationProfile struct {
	UserID             string    `json:"userId"`
	TotalXP            int64     `json:"totalXp"`
	CurrentLevel       int       `json:"currentLevel"`
	CurrentRank        string    `json:"currentRank"` // "Novice", "Scholar", "Grandmaster", etc.
	CreditsBalance     int64     `json:"creditsBalance"`
	LearningCredits    int64     `json:"learningCredits"`
	CurrentStreakDays  int       `json:"currentStreakDays"`
	LongestStreakDays  int       `json:"longestStreakDays"`
	LastActiveDate     time.Time `json:"lastActiveDate"`
	Badges             []Badge   `json:"badges"`
	CompletedBounties  int       `json:"completedBounties"`
	BossBattlesWon     int       `json:"bossBattlesWon"`
	TotalQuestionsDone int       `json:"totalQuestionsDone"`
}

// CalculateLevel computes the level based on total XP (XP = 100 * level^1.5)
func CalculateLevel(totalXP int64) (int, string) {
	if totalXP <= 0 {
		return 1, "Novice"
	}

	level := int(math.Floor(math.Pow(float64(totalXP)/100.0, 1.0/1.5))) + 1
	if level < 1 {
		level = 1
	}

	var rank string
	switch {
	case level < 5:
		rank = "Novice Apprentice"
	case level < 15:
		rank = "Adept Scholar"
	case level < 30:
		rank = "Master Theorist"
	case level < 50:
		rank = "Distinguished Researcher"
	default:
		rank = "Grandmaster Polymath"
	}

	return level, rank
}

// NextLevelXP computes the XP required to reach the next level
func NextLevelXP(currentLevel int) int64 {
	return int64(math.Ceil(100.0 * math.Pow(float64(currentLevel), 1.5)))
}
