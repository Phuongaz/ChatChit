package repo

import (
	"sync"

	"github.com/gorilla/websocket"
)

type ConnectionRepo struct {
	connections map[string]*websocket.Conn
	mu          sync.RWMutex
}

var Manager = &ConnectionRepo{
	connections: make(map[string]*websocket.Conn),
}

func NewConnectionRepo() *ConnectionRepo {
	return &ConnectionRepo{
		connections: make(map[string]*websocket.Conn),
	}
}

func (r *ConnectionRepo) AddConnection(userID string, conn *websocket.Conn) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.connections[userID] = conn
}

func (r *ConnectionRepo) RemoveConnection(userID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.connections, userID)
}

func (r *ConnectionRepo) GetConnection(userID string) (*websocket.Conn, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	conn, ok := r.connections[userID]
	return conn, ok
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
