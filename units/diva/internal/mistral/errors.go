package mistral

import "errors"

var (
	ErrMistralTimeout     = errors.New("mistral timeout")
	ErrMistralUnavailable = errors.New("mistral unavailable")
)
