package services

import (
	"fmt"
	"log"
	"math"
	"math/rand"
	"sort"
	"sync"
	"sync/atomic"
	"time"

	"imentor/gateway/models"
)

// TaskHandler represents a worker callback for a specific background task type
type TaskHandler func(payload map[string]interface{}) (interface{}, error)

// ResourceQueueService manages resource-aware background task execution
type ResourceQueueService struct {
	mu                      sync.Mutex
	activeInteractiveCount  int64
	totalRequestsHandled    int64
	lastInteractiveActivity time.Time
	idleThreshold           time.Duration
	maxConcurrentBG         int
	inMemoryQueue           []*models.BackgroundTask
	processingTasks         map[string]*models.BackgroundTask
	handlers                map[string]TaskHandler
	stopChan                chan struct{}
	wg                      sync.WaitGroup
	pollInterval            time.Duration
	startTime               time.Time
}

// NewResourceQueueService initializes the queue manager
func NewResourceQueueService(maxConcurrentBG int, idleThreshold time.Duration) *ResourceQueueService {
	return NewResourceQueueServiceWithInterval(maxConcurrentBG, idleThreshold, 1500*time.Millisecond)
}

// NewResourceQueueServiceWithInterval initializes queue manager with custom poll interval
func NewResourceQueueServiceWithInterval(maxConcurrentBG int, idleThreshold time.Duration, pollInterval time.Duration) *ResourceQueueService {
	rq := &ResourceQueueService{
		idleThreshold:           idleThreshold,
		maxConcurrentBG:         maxConcurrentBG,
		inMemoryQueue:           make([]*models.BackgroundTask, 0),
		processingTasks:         make(map[string]*models.BackgroundTask),
		handlers:                make(map[string]TaskHandler),
		stopChan:                make(chan struct{}),
		pollInterval:            pollInterval,
		lastInteractiveActivity: time.Now(),
		startTime:               time.Now(),
	}

	rq.registerDefaultHandlers()
	rq.wg.Add(1)
	go rq.startSchedulerLoop()
	return rq
}

// TrackInteractiveStart increments active interactive streams count
func (rq *ResourceQueueService) TrackInteractiveStart() {
	atomic.AddInt64(&rq.activeInteractiveCount, 1)
	atomic.AddInt64(&rq.totalRequestsHandled, 1)
	rq.mu.Lock()
	rq.lastInteractiveActivity = time.Now()
	rq.mu.Unlock()
}

// TrackInteractiveEnd decrements active interactive streams count
func (rq *ResourceQueueService) TrackInteractiveEnd() {
	if atomic.LoadInt64(&rq.activeInteractiveCount) > 0 {
		atomic.AddInt64(&rq.activeInteractiveCount, -1)
	}
	rq.mu.Lock()
	rq.lastInteractiveActivity = time.Now()
	rq.mu.Unlock()
}

// HasAvailableResources checks if GPU/CPU is free for background tasks
func (rq *ResourceQueueService) HasAvailableResources() bool {
	if atomic.LoadInt64(&rq.activeInteractiveCount) > 0 {
		return false // Yield immediately if students are chatting!
	}

	rq.mu.Lock()
	defer rq.mu.Unlock()

	return rq.hasAvailableResourcesLocked()
}

func (rq *ResourceQueueService) hasAvailableResourcesLocked() bool {
	if atomic.LoadInt64(&rq.activeInteractiveCount) > 0 {
		return false
	}
	if time.Since(rq.lastInteractiveActivity) < rq.idleThreshold {
		return false
	}
	if len(rq.processingTasks) >= rq.maxConcurrentBG {
		return false
	}
	return true
}

// Enqueue adds a task to the priority-ordered background queue
func (rq *ResourceQueueService) Enqueue(taskType string, payload map[string]interface{}, priority models.TaskPriority, dedupKey string) (string, error) {
	rq.mu.Lock()
	defer rq.mu.Unlock()

	// Deduplication check
	if dedupKey != "" {
		for _, t := range rq.inMemoryQueue {
			if t.DedupKey == dedupKey {
				return t.ID, nil
			}
		}
	}

	taskID := fmt.Sprintf("task_%s_%d_%x", taskType, time.Now().UnixNano(), rand.Int31())
	task := &models.BackgroundTask{
		ID:          taskID,
		Type:        taskType,
		Priority:    priority,
		Payload:     payload,
		CreatedAt:   time.Now(),
		Attempts:    0,
		MaxAttempts: 3,
		Status:      "queued",
		DedupKey:    dedupKey,
	}

	rq.inMemoryQueue = append(rq.inMemoryQueue, task)
	sort.SliceStable(rq.inMemoryQueue, func(i, j int) bool {
		if rq.inMemoryQueue[i].Priority != rq.inMemoryQueue[j].Priority {
			return rq.inMemoryQueue[i].Priority < rq.inMemoryQueue[j].Priority
		}
		return rq.inMemoryQueue[i].CreatedAt.Before(rq.inMemoryQueue[j].CreatedAt)
	})

	log.Printf("[QUEUE] Enqueued background task [%s] (Priority %d, Depth: %d)", taskType, priority, len(rq.inMemoryQueue))
	return taskID, nil
}

// RegisterHandler binds a handler function to a task type
func (rq *ResourceQueueService) RegisterHandler(taskType string, handler TaskHandler) {
	rq.mu.Lock()
	defer rq.mu.Unlock()
	rq.handlers[taskType] = handler
}

func (rq *ResourceQueueService) startSchedulerLoop() {
	defer rq.wg.Done()
	ticker := time.NewTicker(rq.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-rq.stopChan:
			return
		case <-ticker.C:
			if !rq.HasAvailableResources() {
				continue
			}

			rq.mu.Lock()
			if len(rq.inMemoryQueue) == 0 {
				rq.mu.Unlock()
				continue
			}

			task := rq.inMemoryQueue[0]
			rq.inMemoryQueue = rq.inMemoryQueue[1:]
			task.Status = "processing"
			task.Attempts++
			rq.processingTasks[task.ID] = task
			rq.mu.Unlock()

			go rq.executeTask(task)
		}
	}
}

func (rq *ResourceQueueService) executeTask(task *models.BackgroundTask) {
	defer func() {
		rq.mu.Lock()
		delete(rq.processingTasks, task.ID)
		rq.mu.Unlock()
	}()

	rq.mu.Lock()
	handler, exists := rq.handlers[task.Type]
	rq.mu.Unlock()

	if !exists {
		log.Printf("[QUEUE] No handler found for task type: %s", task.Type)
		return
	}

	_, err := handler(task.Payload)
	if err != nil {
		log.Printf("[QUEUE] Task [%s] failed on attempt %d: %v", task.Type, task.Attempts, err)
		if task.Attempts < task.MaxAttempts {
			backoff := time.Duration(math.Pow(2, float64(task.Attempts))) * time.Second
			time.AfterFunc(backoff, func() {
				rq.mu.Lock()
				rq.inMemoryQueue = append(rq.inMemoryQueue, task)
				rq.mu.Unlock()
			})
		}
		return
	}

	log.Printf("[QUEUE] Task [%s] completed successfully", task.Type)
}

func (rq *ResourceQueueService) registerDefaultHandlers() {
	rq.RegisterHandler("SESSION_INSIGHTS", func(payload map[string]interface{}) (interface{}, error) {
		log.Printf("[QUEUE-WORKER] Generating session insight memory maps for session: %v", payload["sessionId"])
		return map[string]string{"status": "analyzed"}, nil
	})

	rq.RegisterHandler("MEMORY_MAP_GENERATION", func(payload map[string]interface{}) (interface{}, error) {
		log.Printf("[QUEUE-WORKER] Updating student concept memory map for student: %v", payload["userId"])
		return map[string]string{"status": "map_updated"}, nil
	})

	rq.RegisterHandler("TOT_BRANCH_OFFLINE", func(payload map[string]interface{}) (interface{}, error) {
		log.Printf("[QUEUE-WORKER] Precomputing offline ToT branch exploration")
		return map[string]string{"status": "precomputed"}, nil
	})
}

// GetStats returns live metrics
func (rq *ResourceQueueService) GetStats() *models.GatewayStats {
	rq.mu.Lock()
	defer rq.mu.Unlock()

	queuedCopy := make([]models.BackgroundTask, len(rq.inMemoryQueue))
	for i, t := range rq.inMemoryQueue {
		queuedCopy[i] = *t
	}

	return &models.GatewayStats{
		ActiveInteractiveStreams: atomic.LoadInt64(&rq.activeInteractiveCount),
		TotalRequestsHandled:     atomic.LoadInt64(&rq.totalRequestsHandled),
		QueueDepth:               len(rq.inMemoryQueue),
		ActiveBackgroundTasks:    len(rq.processingTasks),
		HasAvailableResources:    rq.hasAvailableResourcesLocked(),
		UptimeSeconds:            int64(time.Since(rq.startTime).Seconds()),
		QueuedTasks:              queuedCopy,
	}
}

// Stop shuts down the scheduler loop and waits for exit
func (rq *ResourceQueueService) Stop() {
	close(rq.stopChan)
	rq.wg.Wait()
}
