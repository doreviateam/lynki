package unit

import (
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/stretchr/testify/assert"
)

func TestSanitizeLogMessage(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Normal message",
			input:    "User logged in successfully",
			expected: "User logged in successfully",
		},
		{
			name:     "Password in message",
			input:    "password: secret123",
			expected: "password: ***REDACTED***",
		},
		{
			name:     "API key in message",
			input:    "api_key: sk_live_1234567890",
			expected: "api_key: ***REDACTED***",
		},
		{
			name:     "JWT token",
			input:    "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature",
			expected: "Bearer ***REDACTED***",
		},
		{
			name:     "Email address",
			input:    "user@example.com logged in",
			expected: "***@example.com logged in",
		},
		{
			name:     "System path",
			input:    "File saved to /opt/dorevia-vault/storage/file.pdf",
			expected: "File saved to ***PATH_REDACTED***",
		},
		{
			name:     "URL with credentials",
			input:    "Connecting to http://user:pass@example.com",
			expected: "Connecting to http://***REDACTED***@example.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.SanitizeLogMessage(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSanitizeLogField(t *testing.T) {
	tests := []struct {
		name          string
		key           string
		value         interface{}
		expectedKey   string
		expectedValue interface{}
	}{
		{
			name:          "Normal field",
			key:           "user_id",
			value:         "123",
			expectedKey:   "user_id",
			expectedValue: "123",
		},
		{
			name:          "Password field",
			key:           "password",
			value:         "secret123",
			expectedKey:   "password",
			expectedValue: "***REDACTED***",
		},
		{
			name:          "Token field",
			key:           "api_token",
			value:         "sk_live_123",
			expectedKey:   "api_token",
			expectedValue: "***REDACTED***",
		},
		{
			name:          "String value with sensitive data",
			key:           "message",
			value:         "password: secret123",
			expectedKey:   "message",
			expectedValue: "password: ***REDACTED***",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			key, value := utils.SanitizeLogField(tt.key, tt.value)
			assert.Equal(t, tt.expectedKey, key)
			assert.Equal(t, tt.expectedValue, value)
		})
	}
}

func TestSanitizeMap(t *testing.T) {
	input := map[string]interface{}{
		"user_id":  "123",
		"password": "secret123",
		"api_key":  "sk_live_123",
		"message":  "password: secret123",
	}

	result := utils.SanitizeMap(input)

	assert.Equal(t, "123", result["user_id"])
	assert.Equal(t, "***REDACTED***", result["password"])
	assert.Equal(t, "***REDACTED***", result["api_key"])
	assert.Equal(t, "password: ***REDACTED***", result["message"])
}
