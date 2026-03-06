package services

import (
	"testing"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestParsePeriod teste la fonction parsePeriod
func TestParsePeriod(t *testing.T) {
	tests := []struct {
		name          string
		period        string
		expectedStart time.Time
		expectedEnd   time.Time
		expectedError bool
	}{
		{
			name:          "Valid period January 2026",
			period:        "2026-01",
			expectedStart: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
			expectedEnd:   time.Date(2026, 1, 31, 23, 59, 59, 0, time.UTC),
			expectedError: false,
		},
		{
			name:          "Valid period February 2026 (leap year)",
			period:        "2026-02",
			expectedStart: time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC),
			expectedEnd:   time.Date(2026, 2, 28, 23, 59, 59, 0, time.UTC),
			expectedError: false,
		},
		{
			name:          "Valid period December 2025",
			period:        "2025-12",
			expectedStart: time.Date(2025, 12, 1, 0, 0, 0, 0, time.UTC),
			expectedEnd:   time.Date(2025, 12, 31, 23, 59, 59, 0, time.UTC),
			expectedError: false,
		},
		{
			name:          "Invalid format - missing dash",
			period:        "202601",
			expectedError: true,
		},
		{
			name:          "Invalid format - wrong format",
			period:        "2026/01",
			expectedError: true,
		},
		{
			name:          "Invalid format - empty",
			period:        "",
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			start, end, err := parsePeriod(tt.period)
			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedStart, start)
				assert.Equal(t, tt.expectedEnd, end)
			}
		})
	}
}

// TestVolumesTotal teste la méthode Total() de Volumes
func TestVolumesTotal(t *testing.T) {
	volumes := models.Volumes{
		OutInvoice: 100,
		InInvoice:  50,
		OutRefund:  10,
		InRefund:   5,
	}
	assert.Equal(t, 165, volumes.Total())
}

// TestComplianceTotal teste la méthode Total() de Compliance
func TestComplianceTotal(t *testing.T) {
	compliance := models.Compliance{
		Compliant:        80,
		NonCompliant2026: 20,
		OutOfScope:       10,
	}
	assert.Equal(t, 110, compliance.Total())
}

// TestComplianceNil teste Compliance avec nil
func TestComplianceNil(t *testing.T) {
	var compliance *models.Compliance
	assert.Nil(t, compliance)
	
	// Test avec compliance nil dans getComplianceValue
	assert.Equal(t, 0, getComplianceValue(compliance, "compliant"))
}

// TestGetComplianceValue teste la fonction getComplianceValue
func TestGetComplianceValue(t *testing.T) {
	compliance := &models.Compliance{
		Compliant:        100,
		NonCompliant2026: 50,
		OutOfScope:       25,
	}

	assert.Equal(t, 100, getComplianceValue(compliance, "compliant"))
	assert.Equal(t, 50, getComplianceValue(compliance, "non_compliant_2026"))
	assert.Equal(t, 25, getComplianceValue(compliance, "out_of_scope"))
	assert.Equal(t, 0, getComplianceValue(compliance, "unknown"))
	assert.Equal(t, 0, getComplianceValue(nil, "compliant"))
}

