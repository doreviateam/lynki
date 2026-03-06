package guard

import (
	"sync"
	"time"
)

// RefreshGuard limite à 1 refresh concurrent par context_hash.
// Stratégie v1 : Reject — pas d'attente, rejet immédiat si refresh déjà en cours.
type RefreshGuard struct {
	mu       sync.Mutex
	inflight map[string]time.Time
	maxAge   time.Duration
}

// New crée un RefreshGuard avec purge périodique des locks orphelins.
// maxAge = 2 * MISTRAL_TIMEOUT (ex. 60s si timeout 30s).
func New(maxAge time.Duration) *RefreshGuard {
	g := &RefreshGuard{
		inflight: make(map[string]time.Time),
		maxAge:   maxAge,
	}
	go g.purgeLoop()
	return g
}

// TryAcquire tente d'acquérir le lock pour le context_hash.
// Retourne true si acquis, false si un refresh est déjà en cours.
func (g *RefreshGuard) TryAcquire(contextHash string) bool {
	g.mu.Lock()
	defer g.mu.Unlock()
	if _, ok := g.inflight[contextHash]; ok {
		return false
	}
	g.inflight[contextHash] = time.Now()
	return true
}

// Release libère le lock pour le context_hash.
func (g *RefreshGuard) Release(contextHash string) {
	g.mu.Lock()
	defer g.mu.Unlock()
	delete(g.inflight, contextHash)
}

// PurgeStale supprime les locks plus vieux que maxAge (crash, timeout).
func (g *RefreshGuard) PurgeStale() {
	g.mu.Lock()
	defer g.mu.Unlock()
	cutoff := time.Now().Add(-g.maxAge)
	for k, t := range g.inflight {
		if t.Before(cutoff) {
			delete(g.inflight, k)
		}
	}
}

func (g *RefreshGuard) purgeLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		g.PurgeStale()
	}
}
