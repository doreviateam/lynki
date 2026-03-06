package backfill

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"
)

const reasonBackfill = "backfill_2026_02_28"

// PaymentMethodsResult résumé du backfill payment-methods
type PaymentMethodsResult struct {
	Tenant           string
	DocsRead         int
	SkippedCorrect   int
	SkippedOverride  int
	OverridesCreated int
	FallbacksCount   int
	WithoutSourceID  int
	Errors           int
	Duration         time.Duration
}

// RunPaymentMethodsBackfill exécute le backfill payment-methods pour un tenant.
// Lit les documents payment du Vault, appelle Odoo pour cash/check, insère les overrides.
func RunPaymentMethodsBackfill(
	ctx context.Context,
	db *storage.DB,
	tenant, odooURL string,
	dryRun bool,
	batchSize, limit int,
	log *zerolog.Logger,
) (*PaymentMethodsResult, error) {
	if db == nil {
		return nil, fmt.Errorf("database is required")
	}
	if tenant == "" {
		return nil, fmt.Errorf("tenant is required")
	}
	if odooURL == "" {
		return nil, fmt.Errorf("odoo-url is required")
	}
	if batchSize <= 0 {
		batchSize = 50
	}

	start := time.Now()
	result := &PaymentMethodsResult{Tenant: tenant}

	// Snapshot borne max : ne traiter que les documents existants au démarrage
	// (PostgreSQL n'a pas MAX(uuid), on utilise ORDER BY ... LIMIT 1)
	var maxCreated time.Time
	var maxID uuid.UUID
	err := db.Pool.QueryRow(ctx, `
		SELECT created_at, id
		FROM documents
		WHERE source = 'payment' AND tenant = $1
		ORDER BY created_at DESC, id DESC
		LIMIT 1
	`, tenant).Scan(&maxCreated, &maxID)
	if err != nil {
		if err == pgx.ErrNoRows {
			if log != nil {
				log.Info().Str("tenant", tenant).Msg("No payment documents found")
			}
			result.Duration = time.Since(start)
			return result, nil
		}
		return nil, fmt.Errorf("snapshot borne max: %w", err)
	}
	if maxID == uuid.Nil {
		if log != nil {
			log.Info().Str("tenant", tenant).Msg("No payment documents found")
		}
		result.Duration = time.Since(start)
		return result, nil
	}

	csvPath := "documents_without_odoo_payment_id.csv"
	var csvFile *os.File
	if !dryRun {
		csvFile, err = os.Create(csvPath)
		if err != nil {
			return nil, fmt.Errorf("create csv: %w", err)
		}
		defer csvFile.Close()
		cw := csv.NewWriter(csvFile)
		_ = cw.Write([]string{"document_id", "tenant", "created_at"})
		cw.Flush()
	}

	// Pagination : documents sans override, (created_at, id) <= snapshot
	cursorCreated := time.Time{}
	cursorID := uuid.Nil

	for {
		var rows pgx.Rows
		if cursorID == uuid.Nil {
			rows, err = db.Pool.Query(ctx, `
				SELECT d.id, d.created_at, d.payload_json
				FROM documents d
				LEFT JOIN payment_method_overrides o ON o.document_id = d.id
				WHERE d.source = 'payment' AND d.tenant = $1
				  AND o.document_id IS NULL
				  AND (d.created_at, d.id) <= ($2, $3)
				ORDER BY d.created_at ASC, d.id ASC
				LIMIT $4
			`, tenant, maxCreated, maxID, batchSize)
		} else {
			rows, err = db.Pool.Query(ctx, `
				SELECT d.id, d.created_at, d.payload_json
				FROM documents d
				LEFT JOIN payment_method_overrides o ON o.document_id = d.id
				WHERE d.source = 'payment' AND d.tenant = $1
				  AND o.document_id IS NULL
				  AND (d.created_at, d.id) <= ($2, $3)
				  AND ((d.created_at > $4) OR (d.created_at = $4 AND d.id > $5))
				ORDER BY d.created_at ASC, d.id ASC
				LIMIT $6
			`, tenant, maxCreated, maxID, cursorCreated, cursorID, batchSize)
		}
		if err != nil {
			return nil, fmt.Errorf("query documents: %w", err)
		}
		var batch []struct {
			id         uuid.UUID
			createdAt  time.Time
			payloadRaw []byte
		}
		for rows.Next() {
			var item struct {
				id         uuid.UUID
				createdAt  time.Time
				payloadRaw []byte
			}
			if err := rows.Scan(&item.id, &item.createdAt, &item.payloadRaw); err != nil {
				rows.Close()
				return nil, fmt.Errorf("scan: %w", err)
			}
			batch = append(batch, item)
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return nil, fmt.Errorf("rows: %w", err)
		}

		if len(batch) == 0 {
			break
		}

		// Collecter les IDs Odoo à interroger (skip si method déjà cash/check)
		type docItem struct {
			docID     uuid.UUID
			createdAt time.Time
			odooID    string
		}
		var toFetch []docItem
		for _, b := range batch {
			result.DocsRead++

			var payload map[string]interface{}
			if len(b.payloadRaw) > 0 {
				_ = json.Unmarshal(b.payloadRaw, &payload)
			}
			odooID := ""
			if v, ok := payload["source_id"].(string); ok && v != "" {
				odooID = strings.TrimSpace(v)
			}
			if odooID == "" {
				if payment, ok := payload["payment"].(map[string]interface{}); ok {
					if v, ok := payment["id"]; ok {
						odooID = fmt.Sprint(v)
					}
				}
			}
			if odooID == "" {
				result.WithoutSourceID++
				if csvFile != nil {
					cw := csv.NewWriter(csvFile)
					_ = cw.Write([]string{b.id.String(), tenant, b.createdAt.Format(time.RFC3339)})
					cw.Flush()
				}
				continue
			}

			methodVal := ""
			if v, ok := payload["method"].(string); ok && v != "" {
				methodVal = strings.ToLower(strings.TrimSpace(v))
			}
			if methodVal == "cash" || methodVal == "check" {
				result.SkippedCorrect++
				cursorCreated = b.createdAt
				cursorID = b.id
				continue
			}
			if methodVal == "" {
				result.FallbacksCount++
			}
			toFetch = append(toFetch, docItem{docID: b.id, createdAt: b.createdAt, odooID: odooID})
			cursorCreated = b.createdAt
			cursorID = b.id
		}

		// Appeler Odoo par lots
		if len(toFetch) > 0 {
			odooIDs := make([]string, 0, len(toFetch))
			docByOdooID := make(map[string]docItem)
			for _, item := range toFetch {
				odooIDs = append(odooIDs, item.odooID)
				docByOdooID[item.odooID] = item
			}

			methods, err := fetchOdooPaymentJournalTypes(ctx, odooURL, odooIDs)
			if err != nil {
				result.Errors++
				if log != nil {
					log.Warn().Err(err).Strs("ids", odooIDs).Msg("Odoo fetch failed")
				}
			} else {
				for oid, method := range methods {
					if method != "cash" && method != "check" {
						continue
					}
					item, ok := docByOdooID[oid]
					if !ok {
						continue
					}
					if !dryRun {
						_, err := db.Pool.Exec(ctx, `
							INSERT INTO payment_method_overrides (document_id, method, reason)
							VALUES ($1, $2, $3)
							ON CONFLICT (document_id) DO UPDATE SET
								method = EXCLUDED.method,
								reason = EXCLUDED.reason
							WHERE payment_method_overrides.method IS DISTINCT FROM EXCLUDED.method
						`, item.docID, method, reasonBackfill)
						if err != nil {
							result.Errors++
							if log != nil {
								log.Warn().Err(err).Str("doc_id", item.docID.String()).Msg("upsert override failed")
							}
						} else {
							result.OverridesCreated++
						}
					} else {
						result.OverridesCreated++
					}
				}
			}
		}

		if limit > 0 && result.DocsRead >= limit {
			break
		}
		if len(batch) < batchSize {
			break
		}
	}

	result.Duration = time.Since(start)
	if log != nil {
		log.Info().
			Str("tenant", tenant).
			Int("docs_read", result.DocsRead).
			Int("skipped_correct", result.SkippedCorrect).
			Int("skipped_override", result.SkippedOverride).
			Int("overrides", result.OverridesCreated).
			Int("fallbacks", result.FallbacksCount).
			Int("without_source_id", result.WithoutSourceID).
			Int("errors", result.Errors).
			Bool("dry_run", dryRun).
			Dur("duration", result.Duration).
			Msg("Backfill payment-methods completed")
	}
	return result, nil
}

func fetchOdooPaymentJournalTypes(ctx context.Context, baseURL string, paymentIDs []string) (map[string]string, error) {
	if len(paymentIDs) == 0 {
		return map[string]string{}, nil
	}
	u, err := url.Parse(strings.TrimSuffix(baseURL, "/") + "/dorevia/vault/payment_journal_types")
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("payment_ids", strings.Join(paymentIDs, ","))
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("odoo returned %d: %s", resp.StatusCode, string(body))
	}

	var out map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}
