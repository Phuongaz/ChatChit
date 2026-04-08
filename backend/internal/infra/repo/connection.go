package repo

import (
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
)

type ConnectionRepo struct {
	connections map[string]*websocket.Conn
	writeMu     map[string]*sync.Mutex
	mu          sync.RWMutex
}

var Manager = &ConnectionRepo{
	connections: make(map[string]*websocket.Conn),
	writeMu:     make(map[string]*sync.Mutex),
}

func NewConnectionRepo() *ConnectionRepo {
	return &ConnectionRepo{
		connections: make(map[string]*websocket.Conn),
		writeMu:     make(map[string]*sync.Mutex),
	}
}

func (r *ConnectionRepo) AddConnection(userID string, conn *websocket.Conn) {
	r.mu.Lock()
	defer r.mu.Unlock()
	// Close stale connection if one already exists for this user
	if old, ok := r.connections[userID]; ok {
		old.Close()
	}
	r.connections[userID] = conn
	r.writeMu[userID] = &sync.Mutex{}
}

func (r *ConnectionRepo) RemoveConnection(userID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.connections, userID)
	delete(r.writeMu, userID)
}

func (r *ConnectionRepo) GetConnection(userID string) (*websocket.Conn, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	conn, ok := r.connections[userID]
	return conn, ok
}

// WriteJSON sends a JSON message to a connected user in a thread-safe manner.
// Gorilla WebSocket does not support concurrent writes; this serializes them per user.
func (r *ConnectionRepo) WriteJSON(userID string, v interface{}) error {
	r.mu.RLock()
	conn, connOk := r.connections[userID]
	mu, muOk := r.writeMu[userID]
	r.mu.RUnlock()

	if !connOk || !muOk {
		return fmt.Errorf("no active connection for user %s", userID)
	}

	mu.Lock()
	defer mu.Unlock()
	return conn.WriteJSON(v)
}

func (r *ConnectionRepo) ListConnections() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	keys := make([]string, 0, len(r.connections))
	for userID := range r.connections {
		keys = append(keys, userID)
	}
	return keys
}
