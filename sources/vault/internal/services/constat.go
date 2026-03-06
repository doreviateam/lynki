package services

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/ledger"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

// ConstatService gère la génération et la transmission des constats mensuels
// SPEC 2 - Vault → Constat Mensuel
type ConstatService struct {
	db          *pgxpool.Pool
	signer      crypto.Signer
	ledger      ledger.Service
	vaultID     string
	coreURL     string
	coreToken   string
	httpClient  *http.Client
	log         *zerolog.Logger
}

// ConstatServiceConfig configuration pour ConstatService
type ConstatServiceConfig struct {
	DB          *pgxpool.Pool
	Signer      crypto.Signer
	Ledger      ledger.Service
	VaultID     string
	CoreURL     string
	CoreToken   string
	HTTPClient  *http.Client
	Logger      *zerolog.Logger
}

// NewConstatService crée un nouveau service de constats
func NewConstatService(cfg ConstatServiceConfig) *ConstatService {
	httpClient := cfg.HTTPClient
	if httpClient == nil {
		httpClient = &http.Client{
			Timeout: 30 * time.Second,
		}
	}

	return &ConstatService{
		db:         cfg.DB,
		signer:     cfg.Signer,
		ledger:     cfg.Ledger,
		vaultID:    cfg.VaultID,
		coreURL:    cfg.CoreURL,
		coreToken:  cfg.CoreToken,
		httpClient: httpClient,
		log:        cfg.Logger,
	}
}

// generateConstatID génère un ID unique de 10 caractères alphanumériques
// Format : 10 caractères (0-9, a-z, A-Z)
// Exemple : "aB3dE5fG7h"
func generateConstatID() (string, error) {
	const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	const length = 10

	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	for i := range bytes {
		bytes[i] = charset[bytes[i]%byte(len(charset))]
	}

	return string(bytes), nil
}

// AggregateDocuments agrège les documents vaultés pour un tenant et une période close
// Retourne les volumes par move_type et les statistiques de conformité Factur-X
func (s *ConstatService) AggregateDocuments(ctx context.Context, tenant, period string) (*models.Volumes, *models.Compliance, int, error) {
	// Parser la période YYYY-MM
	startOfPeriod, endOfPeriod, err := parsePeriod(period)
	if err != nil {
		return nil, nil, 0, fmt.Errorf("invalid period format: %w", err)
	}

	// Requête SQL pour agrégation par move_type
	volumesQuery := `
		SELECT 
			COALESCE(SUM(CASE WHEN move_type = 'out_invoice' THEN 1 ELSE 0 END), 0) as out_invoice,
			COALESCE(SUM(CASE WHEN move_type = 'in_invoice' THEN 1 ELSE 0 END), 0) as in_invoice,
			COALESCE(SUM(CASE WHEN move_type = 'out_refund' THEN 1 ELSE 0 END), 0) as out_refund,
			COALESCE(SUM(CASE WHEN move_type = 'in_refund' THEN 1 ELSE 0 END), 0) as in_refund,
			COUNT(*) as total
		FROM documents
		WHERE tenant = $1
		  AND odoo_model = 'account.move'
		  AND odoo_state = 'posted'
		  AND created_at >= $2
		  AND created_at <= $3
		  AND move_type IS NOT NULL
	`

	var volumes models.Volumes
	var total int

	err = s.db.QueryRow(ctx, volumesQuery, tenant, startOfPeriod, endOfPeriod).Scan(
		&volumes.OutInvoice,
		&volumes.InInvoice,
		&volumes.OutRefund,
		&volumes.InRefund,
		&total,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Aucun document pour cette période, retourner des volumes à zéro
			return &models.Volumes{}, &models.Compliance{}, 0, nil
		}
		return nil, nil, 0, fmt.Errorf("failed to aggregate volumes: %w", err)
	}

	// Requête SQL pour agrégation par compliance_status (optionnel)
	complianceQuery := `
		SELECT 
			COALESCE(SUM(CASE WHEN compliance_status = 'compliant' THEN 1 ELSE 0 END), 0) as compliant,
			COALESCE(SUM(CASE WHEN compliance_status = 'non_compliant_2026' THEN 1 ELSE 0 END), 0) as non_compliant_2026,
			COALESCE(SUM(CASE WHEN compliance_status = 'out_of_scope' THEN 1 ELSE 0 END), 0) as out_of_scope
		FROM documents
		WHERE tenant = $1
		  AND odoo_model = 'account.move'
		  AND odoo_state = 'posted'
		  AND created_at >= $2
		  AND created_at <= $3
		  AND compliance_status IS NOT NULL
	`

	var compliance models.Compliance
	err = s.db.QueryRow(ctx, complianceQuery, tenant, startOfPeriod, endOfPeriod).Scan(
		&compliance.Compliant,
		&compliance.NonCompliant2026,
		&compliance.OutOfScope,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Aucune statistique de conformité, retourner un objet vide
			return &volumes, &models.Compliance{}, total, nil
		}
		return nil, nil, 0, fmt.Errorf("failed to aggregate compliance: %w", err)
	}

	return &volumes, &compliance, total, nil
}

// parsePeriod parse une période au format YYYY-MM et retourne les bornes temporelles
// startOfPeriod : Premier jour du mois à 00:00:00 UTC
// endOfPeriod : Dernier jour du mois à 23:59:59 UTC
func parsePeriod(period string) (time.Time, time.Time, error) {
	// Parser YYYY-MM
	parsedTime, err := time.Parse("2006-01", period)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid period format, expected YYYY-MM: %w", err)
	}

	// Calculer startOfPeriod : Premier jour du mois à 00:00:00 UTC
	startOfPeriod := time.Date(parsedTime.Year(), parsedTime.Month(), 1, 0, 0, 0, 0, time.UTC)

	// Calculer endOfPeriod : Dernier jour du mois à 23:59:59 UTC
	// Ajouter un mois, puis soustraire une seconde
	nextMonth := startOfPeriod.AddDate(0, 1, 0)
	endOfPeriod := nextMonth.Add(-time.Second)

	return startOfPeriod, endOfPeriod, nil
}

// GenerateConstat génère un constat mensuel complet avec preuves cryptographiques
// Retourne le constat généré ou existant (idempotence)
func (s *ConstatService) GenerateConstat(ctx context.Context, tenant, period string) (*models.Constat, error) {
	// 1. Vérifier l'idempotence : un constat existe-t-il déjà pour (tenant, period) ?
	var existingID uuid.UUID
	err := s.db.QueryRow(ctx, `
		SELECT id FROM constats 
		WHERE tenant = $1 AND period = $2
		LIMIT 1
	`, tenant, period).Scan(&existingID)

	if err == nil {
		// Constat existe déjà, le récupérer
		return s.GetConstat(ctx, tenant, period)
	}
	if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed to check existing constat: %w", err)
	}

	// 2. Agrégation des documents
	volumes, compliance, totalDocs, err := s.AggregateDocuments(ctx, tenant, period)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate documents: %w", err)
	}

	// 3. Créer le constat
	// ID interne en base (UUID)
	internalID := uuid.New()
	// ID externe pour constat_id (10 caractères alphanumériques)
	constatID, err := generateConstatID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate constat ID: %w", err)
	}
	generatedAt := time.Now().UTC()
	vaultID := s.vaultID

	constat := &models.Constat{
		ID:              internalID,
		ConstatID:       constatID,
		Tenant:          tenant,
		Period:          period,
		GeneratedAt:     generatedAt,
		VaultID:         &vaultID,
		Volumes:         *volumes,
		Compliance:      compliance,
		TransmissionStatus: "pending",
		CreatedAt:       generatedAt,
	}

	// 4. Construire le payload complet du constat pour signature JWS
	constatPayload := map[string]interface{}{
		"constat_id":    constatID,
		"tenant":        tenant,
		"period":        period,
		"generated_at":  generatedAt.Format(time.RFC3339),
		"vault_id":      vaultID,
		"volumes": map[string]int{
			"out_invoice": volumes.OutInvoice,
			"in_invoice":  volumes.InInvoice,
			"out_refund":  volumes.OutRefund,
			"in_refund":   volumes.InRefund,
		},
		"proofs": map[string]interface{}{
			"documents_count": totalDocs,
		},
	}

	// Ajouter compliance si disponible
	if compliance != nil && compliance.Total() > 0 {
		constatPayload["compliance"] = map[string]int{
			"compliant":            compliance.Compliant,
			"non_compliant_2026":   compliance.NonCompliant2026,
			"out_of_scope":         compliance.OutOfScope,
		}
	}

	// 5. Canonicaliser et calculer SHA256 du payload
	payloadBytes, err := json.Marshal(constatPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal constat payload: %w", err)
	}

	canonicalBytes, err := utils.CanonicalizeJSON(payloadBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to canonicalize JSON: %w", err)
	}

	payloadSHA256 := sha256.Sum256(canonicalBytes)
	payloadSHA256Hex := hex.EncodeToString(payloadSHA256[:])

	// 6. Générer le JWS signant le constat complet
	evidencePayload := crypto.EvidencePayload{
		DocumentID: constatID,
		Sha256:     payloadSHA256Hex,
		Timestamp:  generatedAt.Format(time.RFC3339),
	}
	evidenceBytes, err := json.Marshal(evidencePayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal evidence payload: %w", err)
	}

	signature, err := s.signer.SignPayload(ctx, evidenceBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to sign constat: %w", err)
	}
	jws := signature.JWS

	// 7. Ajouter au ledger si activé
	var ledgerHash *string
	if s.ledger != nil {
		tx, err := s.db.Begin(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to begin transaction: %w", err)
		}
		defer tx.Rollback(ctx)

		hash, err := s.ledger.Append(ctx, tx, internalID, payloadSHA256Hex, jws)
		if err != nil {
			return nil, fmt.Errorf("failed to append to ledger: %w", err)
		}

		ledgerHash = &hash
		constat.Proofs.LedgerHash = ledgerHash

		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit ledger transaction: %w", err)
		}
	}

	// 8. Stocker le constat en base de données
	constat.Proofs.JWS = jws
	constat.Proofs.DocumentsCount = totalDocs

	err = s.insertConstat(ctx, constat)
	if err != nil {
		// Si c'est une violation de contrainte UNIQUE (race condition très rare),
		// récupérer le constat existant
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "unique") || strings.Contains(errStr, "duplicate") || strings.Contains(errStr, "23505") {
			// Constat existe déjà (race condition), le récupérer
			return s.GetConstat(ctx, tenant, period)
		}
		return nil, fmt.Errorf("failed to insert constat: %w", err)
	}

	return constat, nil
}

// insertConstat insère un constat en base de données
func (s *ConstatService) insertConstat(ctx context.Context, constat *models.Constat) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO constats (
			id, constat_id, tenant, period, generated_at, vault_id,
			volumes_out_invoice, volumes_in_invoice, volumes_out_refund, volumes_in_refund,
			compliance_compliant, compliance_non_compliant_2026, compliance_out_of_scope,
			proofs_jws, proofs_ledger_hash, proofs_documents_count,
			transmission_status, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10,
			$11, $12, $13,
			$14, $15, $16,
			$17, $18
		)
	`,
		constat.ID,
		constat.ConstatID,
		constat.Tenant,
		constat.Period,
		constat.GeneratedAt,
		constat.VaultID,
		constat.Volumes.OutInvoice,
		constat.Volumes.InInvoice,
		constat.Volumes.OutRefund,
		constat.Volumes.InRefund,
		getComplianceValue(constat.Compliance, "compliant"),
		getComplianceValue(constat.Compliance, "non_compliant_2026"),
		getComplianceValue(constat.Compliance, "out_of_scope"),
		constat.Proofs.JWS,
		constat.Proofs.LedgerHash,
		constat.Proofs.DocumentsCount,
		constat.TransmissionStatus,
		constat.CreatedAt,
	)

	if err != nil {
		// Si c'est une violation de contrainte UNIQUE (code 23505), le constat existe déjà
		// Normalement on ne devrait pas arriver ici car on vérifie l'idempotence avant
		// Mais si c'est le cas (race condition), l'erreur sera propagée
		return fmt.Errorf("failed to insert constat: %w", err)
	}

	return nil
}

// getComplianceValue retourne la valeur de compliance ou 0 si nil
func getComplianceValue(compliance *models.Compliance, field string) int {
	if compliance == nil {
		return 0
	}
	switch field {
	case "compliant":
		return compliance.Compliant
	case "non_compliant_2026":
		return compliance.NonCompliant2026
	case "out_of_scope":
		return compliance.OutOfScope
	default:
		return 0
	}
}

// GetConstat récupère un constat existant par tenant et période
func (s *ConstatService) GetConstat(ctx context.Context, tenant, period string) (*models.Constat, error) {
	var constat models.Constat
	var vaultID *string
	var transmittedAt *time.Time
	var transmissionError *string
	var ledgerHash *string
	var compliant, nonCompliant2026, outOfScope int

	err := s.db.QueryRow(ctx, `
		SELECT 
			id, constat_id, tenant, period, generated_at, vault_id,
			volumes_out_invoice, volumes_in_invoice, volumes_out_refund, volumes_in_refund,
			compliance_compliant, compliance_non_compliant_2026, compliance_out_of_scope,
			proofs_jws, proofs_ledger_hash, proofs_documents_count,
			transmitted_at, transmission_status, transmission_error,
			created_at
		FROM constats
		WHERE tenant = $1 AND period = $2
	`, tenant, period).Scan(
		&constat.ID,
		&constat.ConstatID,
		&constat.Tenant,
		&constat.Period,
		&constat.GeneratedAt,
		&vaultID,
		&constat.Volumes.OutInvoice,
		&constat.Volumes.InInvoice,
		&constat.Volumes.OutRefund,
		&constat.Volumes.InRefund,
		&compliant,
		&nonCompliant2026,
		&outOfScope,
		&constat.Proofs.JWS,
		&ledgerHash,
		&constat.Proofs.DocumentsCount,
		&transmittedAt,
		&constat.TransmissionStatus,
		&transmissionError,
		&constat.CreatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("constat not found for tenant %s and period %s", tenant, period)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get constat: %w", err)
	}

	constat.VaultID = vaultID
	constat.TransmittedAt = transmittedAt
	constat.TransmissionError = transmissionError
	constat.Proofs.LedgerHash = ledgerHash

	// Créer l'objet Compliance si au moins une valeur est non nulle
	if compliant > 0 || nonCompliant2026 > 0 || outOfScope > 0 {
		constat.Compliance = &models.Compliance{
			Compliant:        compliant,
			NonCompliant2026: nonCompliant2026,
			OutOfScope:       outOfScope,
		}
	}

	return &constat, nil
}

// ListConstats liste les constats avec pagination
func (s *ConstatService) ListConstats(ctx context.Context, tenant string, limit, offset int) ([]*models.Constat, int, error) {
	// Construire la requête SQL
	whereClause := "1=1"
	args := []interface{}{}
	argIndex := 1

	if tenant != "" {
		whereClause += fmt.Sprintf(" AND tenant = $%d", argIndex)
		args = append(args, tenant)
		argIndex++
	}

	// Compter le total
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM constats WHERE %s", whereClause)
	err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count constats: %w", err)
	}

	// Récupérer les constats avec pagination
	selectQuery := fmt.Sprintf(`
		SELECT 
			id, constat_id, tenant, period, generated_at, vault_id,
			volumes_out_invoice, volumes_in_invoice, volumes_out_refund, volumes_in_refund,
			compliance_compliant, compliance_non_compliant_2026, compliance_out_of_scope,
			proofs_jws, proofs_ledger_hash, proofs_documents_count,
			transmitted_at, transmission_status, transmission_error,
			created_at
		FROM constats
		WHERE %s
		ORDER BY generated_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query constats: %w", err)
	}
	defer rows.Close()

	var constats []*models.Constat
	for rows.Next() {
		var constat models.Constat
		var vaultID *string
		var transmittedAt *time.Time
		var transmissionError *string
		var ledgerHash *string
		var compliant, nonCompliant2026, outOfScope int

		err := rows.Scan(
			&constat.ID,
			&constat.ConstatID,
			&constat.Tenant,
			&constat.Period,
			&constat.GeneratedAt,
			&vaultID,
			&constat.Volumes.OutInvoice,
			&constat.Volumes.InInvoice,
			&constat.Volumes.OutRefund,
			&constat.Volumes.InRefund,
			&compliant,
			&nonCompliant2026,
			&outOfScope,
			&constat.Proofs.JWS,
			&ledgerHash,
			&constat.Proofs.DocumentsCount,
			&transmittedAt,
			&constat.TransmissionStatus,
			&transmissionError,
			&constat.CreatedAt,
		)

		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan constat: %w", err)
		}

		constat.VaultID = vaultID
		constat.TransmittedAt = transmittedAt
		constat.TransmissionError = transmissionError
		constat.Proofs.LedgerHash = ledgerHash

		// Créer l'objet Compliance si au moins une valeur est non nulle
		if compliant > 0 || nonCompliant2026 > 0 || outOfScope > 0 {
			constat.Compliance = &models.Compliance{
				Compliant:        compliant,
				NonCompliant2026: nonCompliant2026,
				OutOfScope:       outOfScope,
			}
		}

		constats = append(constats, &constat)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating constats: %w", err)
	}

	return constats, total, nil
}

// TransmitConstat transmet un constat vers Odoo CORE avec retry et gestion d'erreurs
func (s *ConstatService) TransmitConstat(ctx context.Context, constat *models.Constat) error {
	if s.coreURL == "" {
		return fmt.Errorf("Odoo CORE URL not configured")
	}

	// Vérifier si déjà transmis (idempotence)
	if constat.TransmissionStatus == "transmitted" {
		if s.log != nil {
			s.log.Info().
				Str("constat_id", constat.ConstatID).
				Str("tenant", constat.Tenant).
				Str("period", constat.Period).
				Msg("Constat already transmitted, skipping")
		}
		return nil
	}

	// Construire le payload JSON du constat
	payload := s.buildConstatPayload(constat)
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal constat payload: %w", err)
	}

	// URL de l'endpoint Odoo CORE
	url := fmt.Sprintf("%s/api/v1/constats", strings.TrimSuffix(s.coreURL, "/"))

	// Retry avec backoff exponentiel
	maxRetries := 5
	backoffBase := 1 // secondes

	for attempt := 0; attempt < maxRetries; attempt++ {
		// Créer la requête HTTP
		req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(payloadBytes))
		if err != nil {
			return fmt.Errorf("failed to create HTTP request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", fmt.Sprintf("api_key %s", s.coreToken))
		req.Header.Set("User-Agent", "Dorevia-Vault/1.0")

		// Envoyer la requête
		resp, err := s.httpClient.Do(req)
		if err != nil {
			// Erreur de connexion (temporaire)
			if attempt < maxRetries-1 {
				waitTime := time.Duration(backoffBase * (1 << uint(attempt))) * time.Second
				if s.log != nil {
					s.log.Warn().
						Str("constat_id", constat.ConstatID).
						Int("attempt", attempt+1).
						Dur("wait_time", waitTime).
						Err(err).
						Msg("Connection error, retrying")
				}
				time.Sleep(waitTime)
				continue
			}
			// Dernière tentative échouée
			return s.markTransmissionFailed(ctx, constat, fmt.Sprintf("Connection error after %d attempts: %v", maxRetries, err))
		}
		defer resp.Body.Close()

		// Lire la réponse (limite pour éviter consommation mémoire)
		var responseBody bytes.Buffer
		_, _ = responseBody.ReadFrom(resp.Body)

		// Analyser le statut HTTP
		statusCode := resp.StatusCode

		// Succès (200 OK ou 201 Created)
		if statusCode >= 200 && statusCode < 300 {
			transmittedAt := time.Now().UTC()
			err = s.updateTransmissionStatus(ctx, constat.ID, "transmitted", nil, &transmittedAt)
			if err != nil {
				return fmt.Errorf("failed to update transmission status: %w", err)
			}

			if s.log != nil {
				s.log.Info().
					Str("constat_id", constat.ConstatID).
					Str("tenant", constat.Tenant).
					Str("period", constat.Period).
					Int("status_code", statusCode).
					Msg("Constat transmitted successfully")
			}

			// Mettre à jour le constat en mémoire
			constat.TransmissionStatus = "transmitted"
			constat.TransmittedAt = &transmittedAt
			return nil
		}

		// Erreurs permanentes (400, 401, 403) - ne pas retry
		if statusCode == 400 || statusCode == 401 || statusCode == 403 {
			errorMsg := fmt.Sprintf("HTTP %d: %s", statusCode, responseBody.String())
			return s.markTransmissionFailed(ctx, constat, errorMsg)
		}

		// Erreurs temporaires (429, 5xx) - retry
		if statusCode == 429 || (statusCode >= 500 && statusCode < 600) {
			if attempt < maxRetries-1 {
				waitTime := time.Duration(backoffBase * (1 << uint(attempt))) * time.Second
				if s.log != nil {
					s.log.Warn().
						Str("constat_id", constat.ConstatID).
						Int("status_code", statusCode).
						Int("attempt", attempt+1).
						Dur("wait_time", waitTime).
						Msg("Temporary error, retrying")
				}
				time.Sleep(waitTime)
				continue
			}
			// Dernière tentative échouée
			errorMsg := fmt.Sprintf("HTTP %d after %d attempts: %s", statusCode, maxRetries, responseBody.String())
			return s.markTransmissionFailed(ctx, constat, errorMsg)
		}

		// Autres erreurs (4xx non gérées) - traiter comme permanentes
		errorMsg := fmt.Sprintf("HTTP %d: %s", statusCode, responseBody.String())
		return s.markTransmissionFailed(ctx, constat, errorMsg)
	}

	// Ne devrait jamais arriver ici, mais au cas où
	return fmt.Errorf("failed to transmit constat after %d attempts", maxRetries)
}

// buildConstatPayload construit le payload JSON pour transmission vers Odoo CORE
func (s *ConstatService) buildConstatPayload(constat *models.Constat) map[string]interface{} {
	payload := map[string]interface{}{
		"constat_id":   constat.ConstatID,
		"tenant":       constat.Tenant,
		"period":       constat.Period,
		"generated_at": constat.GeneratedAt.Format(time.RFC3339),
		"volumes": map[string]int{
			"out_invoice": constat.Volumes.OutInvoice,
			"in_invoice":  constat.Volumes.InInvoice,
			"out_refund":  constat.Volumes.OutRefund,
			"in_refund":   constat.Volumes.InRefund,
		},
		"proofs": map[string]interface{}{
			"jws":             constat.Proofs.JWS,
			"documents_count": constat.Proofs.DocumentsCount,
		},
	}

	if constat.VaultID != nil {
		payload["vault_id"] = *constat.VaultID
	}

	if constat.Proofs.LedgerHash != nil {
		proofsMap := payload["proofs"].(map[string]interface{})
		proofsMap["ledger_hash"] = *constat.Proofs.LedgerHash
	}

	if constat.Compliance != nil && constat.Compliance.Total() > 0 {
		payload["compliance"] = map[string]int{
			"compliant":            constat.Compliance.Compliant,
			"non_compliant_2026":   constat.Compliance.NonCompliant2026,
			"out_of_scope":         constat.Compliance.OutOfScope,
		}
	}

	return payload
}

// markTransmissionFailed marque un constat comme échec de transmission
func (s *ConstatService) markTransmissionFailed(ctx context.Context, constat *models.Constat, errorMsg string) error {
	err := s.updateTransmissionStatus(ctx, constat.ID, "failed", &errorMsg, nil)
	if err != nil {
		return fmt.Errorf("failed to mark transmission as failed: %w", err)
	}

	if s.log != nil {
		s.log.Error().
			Str("constat_id", constat.ConstatID).
			Str("tenant", constat.Tenant).
			Str("period", constat.Period).
			Str("error", errorMsg).
			Msg("Constat transmission failed")
	}

	// Mettre à jour le constat en mémoire
	constat.TransmissionStatus = "failed"
	errorStr := errorMsg
	constat.TransmissionError = &errorStr

	return fmt.Errorf("transmission failed: %s", errorMsg)
}

// updateTransmissionStatus met à jour le statut de transmission en base de données
func (s *ConstatService) updateTransmissionStatus(ctx context.Context, constatID uuid.UUID, status string, errorMsg *string, transmittedAt *time.Time) error {
	var err error
	if transmittedAt != nil {
		// Mise à jour avec transmitted_at
		_, err = s.db.Exec(ctx, `
			UPDATE constats
			SET transmission_status = $1,
			    transmitted_at = $2,
			    transmission_error = $3
			WHERE id = $4
		`, status, transmittedAt, errorMsg, constatID)
	} else {
		// Mise à jour sans transmitted_at
		_, err = s.db.Exec(ctx, `
			UPDATE constats
			SET transmission_status = $1,
			    transmission_error = $2
			WHERE id = $3
		`, status, errorMsg, constatID)
	}

	if err != nil {
		return fmt.Errorf("failed to update transmission status: %w", err)
	}

	return nil
}

