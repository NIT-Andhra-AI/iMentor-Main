package services

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"imentor/gateway/models"
)

// SGLangClient handles high-speed HTTP/2 streaming connections to SGLang
type SGLangClient struct {
	httpClient *http.Client
	baseURL    string
	modelName  string
}

// NewSGLangClient initializes an optimized HTTP client with connection pooling
func NewSGLangClient(baseURL, modelName string) *SGLangClient {
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:        1000,
		MaxIdleConnsPerHost: 500,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 5 * time.Second,
		DisableCompression:  true, // Low latency for SSE
	}

	return &SGLangClient{
		httpClient: &http.Client{
			Transport: transport,
			Timeout:   120 * time.Second,
		},
		baseURL:   strings.TrimRight(baseURL, "/"),
		modelName: modelName,
	}
}

// StreamChat streams token chunks from SGLang to an output channel
func (c *SGLangClient) StreamChat(ctx context.Context, req *models.SGLangRequest, tokenChan chan<- string, errChan chan<- error) {
	defer close(tokenChan)
	defer close(errChan)

	if req.Model == "" {
		req.Model = c.modelName
	}
	req.Stream = true

	reqBodyBytes, err := json.Marshal(req)
	if err != nil {
		errChan <- fmt.Errorf("failed to marshal SGLang request: %w", err)
		return
	}

	targetURL := fmt.Sprintf("%s/v1/chat/completions", c.baseURL)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", targetURL, bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		errChan <- fmt.Errorf("failed to create request: %w", err)
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")
	httpReq.Header.Set("Cache-Control", "no-cache")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		errChan <- fmt.Errorf("SGLang connection failed: %w", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		errChan <- fmt.Errorf("SGLang returned status %d: %s", resp.StatusCode, string(body))
		return
	}

	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			errChan <- fmt.Errorf("error reading stream: %w", err)
			return
		}

		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, ":") {
			continue // Skip heartbeat / comment
		}

		if !strings.HasPrefix(line, "data:") {
			continue
		}

		dataPayload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if dataPayload == "[DONE]" {
			break
		}

		var chunk models.SGLangStreamChunk
		if err := json.Unmarshal([]byte(dataPayload), &chunk); err != nil {
			continue // Skip unparseable chunk
		}

		if len(chunk.Choices) > 0 {
			content := chunk.Choices[0].Delta.Content
			if content != "" {
				select {
				case <-ctx.Done():
					return
				case tokenChan <- content:
				}
			}
		}
	}
}
