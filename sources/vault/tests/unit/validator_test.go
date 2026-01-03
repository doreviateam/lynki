package unit

import (
	"strings"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/stretchr/testify/assert"
)

func TestValidateFormat(t *testing.T) {
	validator := validators.NewValidator()

	tests := []struct {
		name      string
		format    string
		shouldErr bool
	}{
		{"Valid JSON", "json", false},
		{"Valid CSV", "csv", false},
		{"Valid JSON uppercase", "JSON", false},
		{"Invalid format", "xml", true},
		{"Invalid format", "pdf", true},
		{"Empty format", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateFormat(tt.format)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateLimit(t *testing.T) {
	validator := validators.NewValidator()

	tests := []struct {
		name      string
		limitStr  string
		maxLimit  int
		expected  int
		shouldErr bool
	}{
		{"Valid limit", "10", 100, 10, false},
		{"Valid max limit", "100", 100, 100, false},
		{"Invalid: too high", "101", 100, 0, true},
		{"Invalid: zero", "0", 100, 0, true},
		{"Invalid: negative", "-1", 100, 0, true},
		{"Invalid: not a number", "abc", 100, 0, true},
		{"Invalid: empty", "", 100, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := validator.ValidateLimit(tt.limitStr, tt.maxLimit)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

func TestValidateTenant(t *testing.T) {
	validator := validators.NewValidator()

	tests := []struct {
		name      string
		tenant    string
		shouldErr bool
	}{
		{"Valid tenant", "laplatine", false},
		{"Valid tenant with underscore", "tenant_1", false},
		{"Valid tenant with dash", "tenant-1", false},
		{"Valid tenant with numbers", "tenant123", false},
		{"Empty tenant", "", true},
		{"Too long tenant", strings.Repeat("a", 101), true},
		{"Tenant with spaces", "tenant 1", true},
		{"Tenant with special chars", "tenant@1", true},
		{"Tenant with path traversal", "../../tenant", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateTenant(tt.tenant)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateUUID(t *testing.T) {
	validator := validators.NewValidator()

	tests := []struct {
		name      string
		uuidStr   string
		shouldErr bool
	}{
		{"Valid UUID", "550e8400-e29b-41d4-a716-446655440000", false},
		{"Valid UUID uppercase", "550E8400-E29B-41D4-A716-446655440000", false},
		{"Invalid UUID", "not-a-uuid", true},
		{"Invalid UUID format", "550e8400e29b41d4a716446655440000", true},
		{"Empty UUID", "", true},
		{"UUID with invalid chars", "550e8400-e29b-41d4-a716-44665544000g", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateUUID(tt.uuidStr)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateDate(t *testing.T) {
	validator := validators.NewValidator()

	tests := []struct {
		name      string
		dateStr   string
		shouldErr bool
	}{
		{"Valid RFC3339", "2025-01-15T10:30:00Z", false},
		{"Valid RFC3339 with timezone", "2025-01-15T10:30:00+01:00", false},
		{"Invalid format", "2025-01-15", true},
		{"Invalid format", "15/01/2025", true},
		{"Empty date", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateDate(tt.dateStr)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidatePage(t *testing.T) {
	validator := validators.NewValidator()

	tests := []struct {
		name      string
		pageStr   string
		expected  int
		shouldErr bool
	}{
		{"Valid page", "1", 1, false},
		{"Valid page", "10", 10, false},
		{"Invalid: zero", "0", 0, true},
		{"Invalid: negative", "-1", 0, true},
		{"Invalid: not a number", "abc", 0, true},
		{"Invalid: empty", "", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := validator.ValidatePage(tt.pageStr)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}
