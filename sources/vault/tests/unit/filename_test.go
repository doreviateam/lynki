package unit

import (
	"strings"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/stretchr/testify/assert"
)

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Normal filename",
			input:    "document.pdf",
			expected: "document.pdf",
		},
		{
			name:     "Path traversal",
			input:    "../../etc/passwd",
			expected: "etc_passwd",
		},
		{
			name:     "Backslashes",
			input:    "..\\..\\windows\\system32",
			expected: "windows_system32",
		},
		{
			name:     "Null bytes",
			input:    "file\x00name.pdf",
			expected: "filename.pdf",
		},
		{
			name:     "Empty after sanitization",
			input:    "../../../",
			expected: "document",
		},
		{
			name:     "Only dots and slashes",
			input:    "../../",
			expected: "document",
		},
		{
			name:     "Very long filename",
			input:    strings.Repeat("a", 300) + ".pdf",
			expected: strings.Repeat("a", 255-4) + ".pdf",
		},
		{
			name:     "Control characters",
			input:    "file\nname\t.pdf",
			expected: "filename.pdf",
		},
		{
			name:     "Spaces",
			input:    "  file name.pdf  ",
			expected: "file name.pdf",
		},
		{
			name:     "Mixed dangerous characters",
			input:    "../../file\nname\x00.pdf",
			expected: "filename.pdf",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.SanitizeFilename(tt.input)
			assert.Equal(t, tt.expected, result)
			// Vérifier qu'il n'y a plus de caractères dangereux
			assert.NotContains(t, result, "..")
			assert.NotContains(t, result, "/")
			assert.NotContains(t, result, "\\")
			assert.NotContains(t, result, "\x00")
		})
	}
}

func TestValidateFilename(t *testing.T) {
	tests := []struct {
		name      string
		filename  string
		shouldErr bool
	}{
		{"Valid filename", "document.pdf", false},
		{"Empty filename", "", true},
		{"Path traversal", "../../etc/passwd", true},
		{"Too long", strings.Repeat("a", 300), true},
		{"Valid long filename", strings.Repeat("a", 200), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := utils.ValidateFilename(tt.filename)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestEscapeFilename(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string // Vérifier qu'il n'y a pas de caractères dangereux
	}{
		{"Normal filename", "document.pdf", "document.pdf"},
		{"Filename with quotes", `file"name.pdf`, `file\"name.pdf`},
		{"Filename with newline", "file\nname.pdf", "filename.pdf"},
		{"Filename with carriage return", "file\rname.pdf", "filename.pdf"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.EscapeFilename(tt.input)
			// Vérifier qu'il n'y a pas de caractères dangereux
			assert.NotContains(t, result, "\n")
			assert.NotContains(t, result, "\r")
		})
	}
}

func TestFormatContentDisposition(t *testing.T) {
	tests := []struct {
		name     string
		filename string
		check    func(t *testing.T, result string)
	}{
		{
			name:     "Normal filename",
			filename: "document.pdf",
			check: func(t *testing.T, result string) {
				assert.Contains(t, result, "attachment")
				assert.Contains(t, result, "document.pdf")
			},
		},
		{
			name:     "Filename with quotes",
			filename: `file"name.pdf`,
			check: func(t *testing.T, result string) {
				assert.Contains(t, result, "attachment")
				assert.NotContains(t, result, "\n")
				assert.NotContains(t, result, "\r")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.FormatContentDisposition(tt.filename)
			tt.check(t, result)
		})
	}
}
