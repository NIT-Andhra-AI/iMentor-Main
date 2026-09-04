package models

import "time"

// ChatMessage represents a single message in the conversation history
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
	Name    string `json:"name,omitempty"`
}

// ChatRequest represents the client's incoming request to /api/chat/message
type ChatRequest struct {
	Query                   string        `json:"query"`
	SessionID               string        `json:"sessionId"`
	History                 []ChatMessage `json:"history,omitempty"`
	SystemPrompt            string        `json:"systemPrompt,omitempty"`
	UseWebSearch            bool          `json:"useWebSearch,omitempty"`
	UseAcademicSearch       bool          `json:"useAcademicSearch,omitempty"`
	CriticalThinkingEnabled bool          `json:"criticalThinkingEnabled,omitempty"`
	DocumentContextName     string        `json:"documentContextName,omitempty"`
	TutorMode               bool          `json:"tutorMode,omitempty"`
	TutorModeType           string        `json:"tutorModeType,omitempty"`
	CurrentModulePathID     string        `json:"currentModulePathId,omitempty"`
	IsAutoGreeting          bool          `json:"isAutoGreeting,omitempty"`
}

// SGLangRequest represents the OpenAI-compatible streaming payload sent to SGLang
type SGLangRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
	MaxTokens   int           `json:"max_tokens"`
	Stream      bool          `json:"stream"`
	TopP        float64       `json:"top_p,omitempty"`
}

// SGLangStreamDelta represents a partial streaming delta from SGLang SSE
type SGLangStreamDelta struct {
	Role    string `json:"role,omitempty"`
	Content string `json:"content,omitempty"`
}

// SGLangStreamChoice represents a streaming choice entry
type SGLangStreamChoice struct {
	Index        int               `json:"index"`
	Delta        SGLangStreamDelta `json:"delta"`
	FinishReason *string           `json:"finish_reason"`
}

// SGLangStreamChunk represents the SSE JSON data chunk from SGLang
type SGLangStreamChunk struct {
	ID      string               `json:"id"`
	Object  string               `json:"object"`
	Created int64                `json:"created"`
	Model   string               `json:"model"`
	Choices []SGLangStreamChoice `json:"choices"`
}

// ClientSSEEvent represents the SSE format delivered to iMentor frontend
type ClientSSEEvent struct {
	Type    string      `json:"type"`
	Content string      `json:"content,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Done    bool        `json:"done,omitempty"`
}

// TaskPriority defines priority levels for background tasks
type TaskPriority int

const (
	PriorityHigh       TaskPriority = 1
	PriorityNormal     TaskPriority = 2
	PriorityBackground TaskPriority = 3
	PriorityBatch      TaskPriority = 4
)

// BackgroundTask represents an item in the Resource Task Queue
type BackgroundTask struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Priority    TaskPriority           `json:"priority"`
	Payload     map[string]interface{} `json:"payload"`
	CreatedAt   time.Time              `json:"createdAt"`
	Attempts    int                    `json:"attempts"`
	MaxAttempts int                    `json:"maxAttempts"`
	Status      string                 `json:"status"`
	DedupKey    string                 `json:"dedupKey,omitempty"`
}

// GatewayStats represents live metrics of the Go Gateway
type GatewayStats struct {
	ActiveInteractiveStreams int64            `json:"activeInteractiveStreams"`
	TotalRequestsHandled     int64            `json:"totalRequestsHandled"`
	QueueDepth               int              `json:"queueDepth"`
	ActiveBackgroundTasks    int              `json:"activeBackgroundTasks"`
	HasAvailableResources    bool             `json:"hasAvailableResources"`
	UptimeSeconds            int64            `json:"uptimeSeconds"`
	QueuedTasks              []BackgroundTask `json:"queuedTasks,omitempty"`
}
