package jobs

import (
	"context"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/services"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

// ConstatMonthlyJob gère le job mensuel de génération et transmission des constats
// SPEC 2 - Vault → Constat Mensuel
type ConstatMonthlyJob struct {
	service *services.ConstatService
	db      *pgxpool.Pool
	log     *zerolog.Logger
}

// NewConstatMonthlyJob crée un nouveau job mensuel
func NewConstatMonthlyJob(service *services.ConstatService, db *pgxpool.Pool, log *zerolog.Logger) *ConstatMonthlyJob {
	return &ConstatMonthlyJob{
		service: service,
		db:      db,
		log:     log,
	}
}

// Run exécute le job mensuel pour générer et transmettre les constats
// Doit être appelé le 1er de chaque mois (ou après un délai de sécurité)
func (j *ConstatMonthlyJob) Run(ctx context.Context) error {
	now := time.Now().UTC()
	
	// Calculer la période close (mois précédent)
	// Exemple : Si on est le 1er février 2026, on génère le constat pour janvier 2026
	previousMonth := now.AddDate(0, -1, 0)
	period := fmt.Sprintf("%04d-%02d", previousMonth.Year(), previousMonth.Month())

	j.log.Info().
		Str("period", period).
		Str("current_date", now.Format("2006-01-02")).
		Msg("Starting monthly constat generation job")

	// Récupérer la liste des tenants actifs (qui ont des documents vaultés)
	tenants, err := j.getActiveTenants(ctx)
	if err != nil {
		return fmt.Errorf("failed to get active tenants: %w", err)
	}

	if len(tenants) == 0 {
		j.log.Info().Msg("No active tenants found, skipping constat generation")
		return nil
	}

	j.log.Info().
		Int("tenant_count", len(tenants)).
		Msg("Found active tenants for constat generation")

	// Générer et transmettre les constats pour chaque tenant
	successCount := 0
	failureCount := 0

	for _, tenant := range tenants {
		if err := j.processTenant(ctx, tenant, period); err != nil {
			j.log.Error().
				Str("tenant", tenant).
				Str("period", period).
				Err(err).
				Msg("Failed to process tenant constat")
			failureCount++
			// Continuer avec les autres tenants même en cas d'erreur
			continue
		}
		successCount++
	}

	j.log.Info().
		Str("period", period).
		Int("success_count", successCount).
		Int("failure_count", failureCount).
		Int("total_tenants", len(tenants)).
		Msg("Monthly constat generation job completed")

	if failureCount > 0 {
		return fmt.Errorf("job completed with %d failures out of %d tenants", failureCount, len(tenants))
	}

	return nil
}

// processTenant génère et transmet le constat pour un tenant donné
func (j *ConstatMonthlyJob) processTenant(ctx context.Context, tenant, period string) error {
	j.log.Info().
		Str("tenant", tenant).
		Str("period", period).
		Msg("Processing tenant constat")

	// Générer le constat (idempotent : si existe déjà, le récupère)
	constat, err := j.service.GenerateConstat(ctx, tenant, period)
	if err != nil {
		return fmt.Errorf("failed to generate constat: %w", err)
	}

	j.log.Info().
		Str("tenant", tenant).
		Str("period", period).
		Str("constat_id", constat.ConstatID).
		Int("documents_count", constat.Proofs.DocumentsCount).
		Msg("Constat generated successfully")

	// Transmettre le constat vers Odoo CORE
	if err := j.service.TransmitConstat(ctx, constat); err != nil {
		return fmt.Errorf("failed to transmit constat: %w", err)
	}

	j.log.Info().
		Str("tenant", tenant).
		Str("period", period).
		Str("constat_id", constat.ConstatID).
		Str("transmission_status", constat.TransmissionStatus).
		Msg("Constat transmitted successfully")

	return nil
}

// getActiveTenants récupère la liste des tenants actifs (qui ont des documents vaultés)
func (j *ConstatMonthlyJob) getActiveTenants(ctx context.Context) ([]string, error) {
	rows, err := j.db.Query(ctx, `
		SELECT DISTINCT tenant
		FROM documents
		WHERE tenant IS NOT NULL
		  AND tenant != ''
		  AND odoo_model = 'account.move'
		  AND odoo_state = 'posted'
		ORDER BY tenant
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query active tenants: %w", err)
	}
	defer rows.Close()

	var tenants []string
	for rows.Next() {
		var tenant string
		if err := rows.Scan(&tenant); err != nil {
			return nil, fmt.Errorf("failed to scan tenant: %w", err)
		}
		tenants = append(tenants, tenant)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tenants: %w", err)
	}

	return tenants, nil
}

// StartScheduler démarre le scheduler qui exécute le job mensuel
// Le job s'exécute le 1er de chaque mois à 00:00 UTC (ou après un délai de sécurité)
func StartScheduler(ctx context.Context, job *ConstatMonthlyJob, log *zerolog.Logger) {
	log.Info().Msg("Starting constat monthly scheduler")

	// Fonction pour calculer le prochain exécution
	nextRun := func() time.Time {
		now := time.Now().UTC()
		// Si on est le 1er du mois et qu'il est encore tôt (avant 01:00), exécuter maintenant
		// Sinon, programmer pour le 1er du mois suivant à 00:00 UTC
		if now.Day() == 1 && now.Hour() < 1 {
			// On est le 1er du mois, mais avant 01:00, exécuter dans 1 minute (délai de sécurité)
			return now.Add(1 * time.Minute)
		}
		// Programmer pour le 1er du mois suivant à 00:00 UTC
		nextMonth := now.AddDate(0, 1, 0)
		return time.Date(nextMonth.Year(), nextMonth.Month(), 1, 0, 0, 0, 0, time.UTC)
	}

	// Fonction pour exécuter le job
	runJob := func() {
		jobCtx, cancel := context.WithTimeout(ctx, 30*time.Minute) // Timeout de 30 minutes pour le job
		defer cancel()

		if err := job.Run(jobCtx); err != nil {
			log.Error().Err(err).Msg("Monthly constat job failed")
		}
	}

	// Exécuter immédiatement si c'est le bon moment
	firstRun := nextRun()
	if time.Until(firstRun) < 1*time.Hour {
		log.Info().
			Time("next_run", firstRun).
			Msg("Scheduling first run")
		go func() {
			time.Sleep(time.Until(firstRun))
			runJob()
		}()
	}

	// Boucle principale : exécuter tous les mois
	go func() {
		ticker := time.NewTicker(24 * time.Hour) // Vérifier chaque jour
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("Constat monthly scheduler stopped")
				return
			case <-ticker.C:
				now := time.Now().UTC()
				// Vérifier si c'est le 1er du mois entre 00:00 et 01:00 UTC
				if now.Day() == 1 && now.Hour() == 0 {
					log.Info().Msg("Triggering monthly constat job")
					runJob()
				}
			}
		}
	}()
}

