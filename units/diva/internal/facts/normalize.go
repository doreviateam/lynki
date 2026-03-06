package facts

import (
	"regexp"
	"strings"
)

var spaceCollapse = regexp.MustCompile(`\s+`)

// NormalizeMessage — trim + collapse spaces pour stabilité du tri.
// Évite les surprises : espaces doubles, accents, € vs EUR, ponctuation variable.
// Ne modifie pas le contenu métier, juste la stabilité.
func NormalizeMessage(msg string) string {
	s := strings.TrimSpace(msg)
	s = spaceCollapse.ReplaceAllString(s, " ")
	return s
}
