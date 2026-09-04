package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"imentor/gateway/config"
	"imentor/gateway/models"
	"imentor/gateway/services"
)

// ChatHandler manages incoming chat requests and SSE streaming
type ChatHandler struct {
	cfg           *config.Config
	sglangClient  *services.SGLangClient
	resourceQueue *services.ResourceQueueService
}

// NewChatHandler creates a new ChatHandler
func NewChatHandler(cfg *config.Config, sglangClient *services.SGLangClient, resourceQueue *services.ResourceQueueService) *ChatHandler {
	return &ChatHandler{
		cfg:           cfg,
		sglangClient:  sglangClient,
		resourceQueue: resourceQueue,
	}
}

// HandleChatMessage handles POST /api/chat/message with streaming SSE
func (h *ChatHandler) HandleChatMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Query) == "" {
		http.Error(w, `{"error":"Query is required"}`, http.StatusBadRequest)
		return
	}

	// Track interactive start / end for resource queue governance
	h.resourceQueue.TrackInteractiveStart()
	defer h.resourceQueue.TrackInteractiveEnd()

	// Set SSE Headers
	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, `{"error":"Streaming unsupported"}`, http.StatusInternalServerError)
		return
	}
	flusher.Flush()

	// Prepare messages array
	var messages []models.ChatMessage

	// 1. System Prompt (apply Socratic guided learning if tutorMode is on)
	sysPrompt := req.SystemPrompt
	if req.TutorMode || req.TutorModeType != "" {
		sysPrompt = services.BuildSocraticSystemPrompt(req.DocumentContextName)
	}
	if sysPrompt != "" {
		messages = append(messages, models.ChatMessage{
			Role:    "system",
			Content: sysPrompt,
		})
	}

	// 2. Chat History
	for _, hist := range req.History {
		messages = append(messages, models.ChatMessage{
			Role:    hist.Role,
			Content: hist.Content,
		})
	}

	// 3. Current User Query
	messages = append(messages, models.ChatMessage{
		Role:    "user",
		Content: req.Query,
	})

	sglangReq := &models.SGLangRequest{
		Model:       h.cfg.SGLangModel,
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   4096,
		Stream:      true,
	}

	tokenChan := make(chan string, 100)
	errChan := make(chan error, 1)

	// Launch SGLang streaming in a background goroutine
	go h.sglangClient.StreamChat(r.Context(), sglangReq, tokenChan, errChan)

	var fullResponseBuilder strings.Builder

	for {
		select {
		case <-r.Context().Done():
			return // Client disconnected
		case err, ok := <-errChan:
			if ok && err != nil {
				errMsg, _ := json.Marshal(map[string]string{"type": "error", "error": err.Error()})
				fmt.Fprintf(w, "data: %s\n\n", errMsg)
				flusher.Flush()
				return
			}
		case token, ok := <-tokenChan:
			if !ok {
				// Stream completed naturally
				donePayload, _ := json.Marshal(map[string]interface{}{
					"type": "done",
					"done": true,
				})
				fmt.Fprintf(w, "data: %s\n\n", donePayload)
				flusher.Flush()

				// Optionally enqueue background memory update for session
				if req.SessionID != "" && fullResponseBuilder.Len() > 0 {
					go func(sessID string) {
						h.resourceQueue.Enqueue(
							"SESSION_INSIGHTS",
							map[string]interface{}{
								"sessionId": sessID,
								"query":     req.Query,
								"response":  fullResponseBuilder.String(),
							},
							models.PriorityNormal,
							"insights_"+sessID,
						)
					}(req.SessionID)
				}
				return
			}

			fullResponseBuilder.WriteString(token)

			// Deliver token event in iMentor standard SSE format
			tokenEvent, _ := json.Marshal(map[string]interface{}{
				"type":    "token",
				"content": token,
			})
			fmt.Fprintf(w, "data: %s\n\n", tokenEvent)
			flusher.Flush()
		}
	}
}
