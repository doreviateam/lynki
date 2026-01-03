package validators

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// Validator fournit des fonctions de validation centralisées
type Validator struct{}

// NewValidator crée un nouveau validateur
func NewValidator() *Validator {
	return &Validator{}
}

// ValidateFormat valide un format (json, csv, etc.)
func (v *Validator) ValidateFormat(format string) error {
	allowedFormats := map[string]bool{
		"json": true,
		"csv":  true,
	}

	formatLower := strings.ToLower(format)
	if !allowedFormats[formatLower] {
		return fmt.Errorf("invalid format: %s (allowed: json, csv)", format)
	}

	return nil
}

// ValidateLimit valide une limite de pagination
func (v *Validator) ValidateLimit(limitStr string, maxLimit int) (int, error) {
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return 0, fmt.Errorf("invalid limit: %s (must be a number)", limitStr)
	}

	if limit < 1 {
		return 0, fmt.Errorf("limit must be >= 1")
	}

	if limit > maxLimit {
		return 0, fmt.Errorf("limit must be <= %d", maxLimit)
	}

	return limit, nil
}

// ValidateOffset valide un offset de pagination
func (v *Validator) ValidateOffset(offsetStr string) error {
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		return fmt.Errorf("invalid offset: %s (must be a number)", offsetStr)
	}

	if offset < 0 {
		return fmt.Errorf("offset must be >= 0")
	}

	return nil
}

// ValidateOffsetWithValue retourne l'offset validé
func (v *Validator) ValidateOffsetWithValue(offsetStr string) (int, error) {
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		return 0, fmt.Errorf("invalid offset: %s (must be a number)", offsetStr)
	}

	if offset < 0 {
		return 0, fmt.Errorf("offset must be >= 0")
	}

	return offset, nil
}

// ValidateTenant valide un identifiant de tenant
func (v *Validator) ValidateTenant(tenant string) error {
	if len(tenant) == 0 {
		return fmt.Errorf("tenant cannot be empty")
	}

	if len(tenant) > 100 {
		return fmt.Errorf("tenant length must be <= 100 characters")
	}

	// Autoriser uniquement alphanumérique, tirets et underscores
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9_-]+$`, tenant)
	if !matched {
		return fmt.Errorf("tenant contains invalid characters (allowed: a-z, A-Z, 0-9, _, -)")
	}

	return nil
}

// ValidateUUID valide un UUID
func (v *Validator) ValidateUUID(uuidStr string) error {
	uuidPattern := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	if !uuidPattern.MatchString(strings.ToLower(uuidStr)) {
		return fmt.Errorf("invalid UUID format")
	}
	return nil
}

// ValidateDate valide une date au format RFC3339
func (v *Validator) ValidateDate(dateStr string) error {
	if dateStr == "" {
		return fmt.Errorf("date cannot be empty")
	}

	// Vérifier le format RFC3339
	_, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		return fmt.Errorf("invalid date format (must be RFC3339): %w", err)
	}

	return nil
}

// ValidatePage valide un numéro de page
func (v *Validator) ValidatePage(pageStr string) (int, error) {
	page, err := strconv.Atoi(pageStr)
	if err != nil {
		return 0, fmt.Errorf("invalid page: %s (must be a number)", pageStr)
	}

	if page < 1 {
		return 0, fmt.Errorf("page must be >= 1")
	}

	return page, nil
}
