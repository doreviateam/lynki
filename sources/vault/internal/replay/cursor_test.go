package replay

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildCursor_NoSecret(t *testing.T) {
	c, err := BuildCursor(42, "tenant1", "")
	require.NoError(t, err)
	assert.NotEmpty(t, c)
	assert.NotContains(t, c, ".")
}

func TestBuildCursor_WithSecret(t *testing.T) {
	c, err := BuildCursor(42, "tenant1", "my-secret")
	require.NoError(t, err)
	assert.Contains(t, c, ".")
}

func TestParseCursor_LegacySequence(t *testing.T) {
	seq, err := ParseCursor("42", "t", "")
	require.NoError(t, err)
	assert.Equal(t, int64(42), seq)
}

func TestParseCursor_Signed(t *testing.T) {
	secret := "test-secret"
	c, err := BuildCursor(100, "core", secret)
	require.NoError(t, err)

	seq, err := ParseCursor(c, "core", secret)
	require.NoError(t, err)
	assert.Equal(t, int64(100), seq)
}

func TestParseCursor_Tampered(t *testing.T) {
	c, _ := BuildCursor(100, "core", "secret")
	// Modifier le cursor
	tampered := c[:len(c)-2] + "xx"

	_, err := ParseCursor(tampered, "core", "secret")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "signature")
}
