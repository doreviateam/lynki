package hashinput

import (
	"testing"
)

func TestToMinor(t *testing.T) {
	minusOne := -1.005
	tests := []struct {
		name      string
		value     *float64
		minorUnit  int
		want      *int64
	}{
		{"nil", nil, 2, nil},
		{"1686.84", ptrFloat(1686.84), 2, ptrInt64(168684)},
		{"1.005", ptrFloat(1.005), 2, ptrInt64(101)},
		{"1.004", ptrFloat(1.004), 2, ptrInt64(100)},
		{"-1.005", &minusOne, 2, ptrInt64(-101)},
		{"-1.004", ptrFloat(-1.004), 2, ptrInt64(-100)},
		{"0", ptrFloat(0), 2, ptrInt64(0)},
		{"34000", ptrFloat(34000), 2, ptrInt64(3400000)},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := toMinor(tt.value, tt.minorUnit)
			if tt.want == nil {
				if got != nil {
					t.Errorf("toMinor() = %v, want nil", *got)
				}
			} else {
				if got == nil {
					t.Errorf("toMinor() = nil, want %d", *tt.want)
				} else if *got != *tt.want {
					t.Errorf("toMinor() = %d, want %d", *got, *tt.want)
				}
			}
		})
	}
}

func TestToBasisPoints(t *testing.T) {
	tests := []struct {
		name  string
		value *float64
		want  *int64
	}{
		{"nil", nil, nil},
		{"0", ptrFloat(0), ptrInt64(0)},
		{"12.34", ptrFloat(12.34), ptrInt64(1234)},
		{"100", ptrFloat(100), ptrInt64(10000)},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := toBasisPoints(tt.value)
			if tt.want == nil {
				if got != nil {
					t.Errorf("toBasisPoints() = %v, want nil", *got)
				}
			} else {
				if got == nil {
					t.Errorf("toBasisPoints() = nil, want %d", *tt.want)
				} else if *got != *tt.want {
					t.Errorf("toBasisPoints() = %d, want %d", *got, *tt.want)
				}
			}
		})
	}
}

func ptrFloat(f float64) *float64 {
	return &f
}
func ptrInt64(i int64) *int64 {
	return &i
}
