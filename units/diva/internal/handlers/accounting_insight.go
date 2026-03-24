package handlers

import (
	"encoding/json"
	"log/slog"
	"os"
	"time"

	"github.com/doreviateam/diva/internal/archive"
	"github.com/doreviateam/diva/internal/facts"
	"github.com/doreviateam/diva/internal/mistral"
	"github.com/doreviateam/diva/internal/models"
	"github.com/gofiber/fiber/v2"
)

// AccountingInsightHandler — POST /diva/accounting/insight (Sprint 12 T69).
// Template-first : l'insight est toujours généré de manière déterministe.
// Si use_mistral=true et Mistral est disponible, le texte brut est reformulé.
func AccountingInsightHandler(mc *mistral.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req models.AccountingInsightRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "Request invalide."},
			})
		}

		if req.Context.Tenant == "" || req.Context.DateStart == "" || req.Context.DateEnd == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "context.tenant, date_start et date_end requis"},
			})
		}

		input := toFactsInput(&req)
		pack := facts.BuildAccountingFactsPack(input)
		if pack == nil {
			return c.Status(422).JSON(fiber.Map{
				"error": fiber.Map{"code": "NO_DATA", "message": "Données comptables insuffisantes pour générer un insight."},
			})
		}

		insight := facts.GenerateAccountingInsight(pack)

		slog.Info("event=accounting_insight_generated",
			"tenant", req.Context.Tenant,
			"facts_hash", pack.FactsHash,
			"signals", len(pack.Signals),
			"deltas", len(pack.Deltas),
		)

		resp := models.AccountingInsightResponse{
			Headline:    insight.Headline,
			WhatISee:    insight.WhatISee,
			ToCheck:     insight.ToCheck,
			ScopeNote:   insight.ScopeNote,
			FactsHash:   insight.FactsHash,
			GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		}

		if req.Options.UseMistral && mc != nil {
			reformulated := reformulateWithMistral(mc, insight)
			if reformulated != nil {
				resp.Headline = reformulated.Headline
				resp.WhatISee = reformulated.WhatISee
				resp.ToCheck = reformulated.ToCheck
				slog.Info("event=accounting_insight_reformulated",
					"tenant", req.Context.Tenant,
					"facts_hash", pack.FactsHash,
				)
			}
		}

		packJSON, _ := json.Marshal(pack)
		slog.Debug("event=accounting_facts_pack",
			"tenant", req.Context.Tenant,
			"facts_hash", pack.FactsHash,
			"pack", string(packJSON),
		)

		if len(packJSON) > 0 {
			archive.ArchiveFactsPackAsync(os.Getenv("VAULT_URL"), req.Context.Tenant, pack.FactsHash, "insight", facts.ReportTemplateVersion, packJSON)
		}

		return c.JSON(resp)
	}
}

func toFactsInput(req *models.AccountingInsightRequest) *facts.AccountingFactsInput {
	input := &facts.AccountingFactsInput{
		Context: facts.AccountingContextMeta{
			Tenant:             req.Context.Tenant,
			CompanyIDs:         req.Context.CompanyIDs,
			DateStart:          req.Context.DateStart,
			DateEnd:            req.Context.DateEnd,
			CompareStart:       req.Context.CompareStart,
			CompareEnd:         req.Context.CompareEnd,
			ReferentielVersion: req.Context.ReferentielVersion,
			Currency:           req.Context.Currency,
		},
	}

	if req.BalanceSheet != nil {
		lines := make([]facts.AccountingRubricLine, len(req.BalanceSheet.Lines))
		for i, l := range req.BalanceSheet.Lines {
			lines[i] = facts.AccountingRubricLine{
				Code: l.Code, Label: l.Label, Amount: l.Amount, Previous: l.Previous,
			}
		}
		input.BalanceSheet = &facts.AccountingRubricsInput{
			Lines: lines, Total: req.BalanceSheet.Total, TotalN1: req.BalanceSheet.TotalN1, Complete: req.BalanceSheet.Complete,
		}
	}

	if req.IncomeStatement != nil {
		lines := make([]facts.AccountingRubricLine, len(req.IncomeStatement.Lines))
		for i, l := range req.IncomeStatement.Lines {
			lines[i] = facts.AccountingRubricLine{
				Code: l.Code, Label: l.Label, Amount: l.Amount, Previous: l.Previous,
			}
		}
		input.IncomeStatement = &facts.AccountingRubricsInput{
			Lines: lines, Total: req.IncomeStatement.Total, TotalN1: req.IncomeStatement.TotalN1, Complete: req.IncomeStatement.Complete,
		}
	}

	if req.AgedReceivables != nil {
		lines := make([]facts.AgedBalanceLineInput, len(req.AgedReceivables.Lines))
		for i, l := range req.AgedReceivables.Lines {
			lines[i] = facts.AgedBalanceLineInput{
				PartnerID: l.PartnerID, PartnerName: l.PartnerName,
				NotDue: l.NotDue, Range0_30: l.Range0_30, Range31_60: l.Range31_60,
				Range61_90: l.Range61_90, Range91_180: l.Range91_180, RangeOver180: l.RangeOver180,
				Total: l.Total,
			}
		}
		input.AgedReceivables = &facts.AgedBalanceInput{Lines: lines, AgingBasis: req.AgedReceivables.AgingBasis, Complete: req.AgedReceivables.Complete}
	}

	if req.AgedPayables != nil {
		lines := make([]facts.AgedBalanceLineInput, len(req.AgedPayables.Lines))
		for i, l := range req.AgedPayables.Lines {
			lines[i] = facts.AgedBalanceLineInput{
				PartnerID: l.PartnerID, PartnerName: l.PartnerName,
				NotDue: l.NotDue, Range0_30: l.Range0_30, Range31_60: l.Range31_60,
				Range61_90: l.Range61_90, Range91_180: l.Range91_180, RangeOver180: l.RangeOver180,
				Total: l.Total,
			}
		}
		input.AgedPayables = &facts.AgedBalanceInput{Lines: lines, AgingBasis: req.AgedPayables.AgingBasis, Complete: req.AgedPayables.Complete}
	}

	return input
}

type reformulatedInsight struct {
	Headline string
	WhatISee string
	ToCheck  string
}

// reformulateWithMistral envoie le texte template au Mistral local pour reformulation.
// Si Mistral échoue ou est indisponible, retourne nil (fallback = template brut).
func reformulateWithMistral(mc *mistral.Client, insight *facts.AccountingInsight) *reformulatedInsight {
	if mc == nil || insight == nil {
		return nil
	}

	prompt := `Tu es un rédacteur comptable. Reformule ces textes en français professionnel, sobre et factuel.
Ne change PAS les montants, pourcentages ou noms de partenaires. Ne génère PAS de conseil ou de recommandation.

Headline: ` + insight.Headline + `
Ce que je vois: ` + insight.WhatISee + `
Points de vigilance: ` + insight.ToCheck + `

Réponds en JSON strict:
{"headline":"...","what_i_see":"...","to_check":"..."}`

	resp, err := mc.RawChat(prompt)
	if err != nil {
		slog.Warn("event=accounting_mistral_reformulation_failed", "error", err.Error())
		return nil
	}

	var result reformulatedInsight
	if err := json.Unmarshal([]byte(resp), &result); err != nil {
		slog.Warn("event=accounting_mistral_parse_failed", "raw", resp, "error", err.Error())
		return nil
	}

	if result.Headline == "" {
		return nil
	}
	return &result
}
