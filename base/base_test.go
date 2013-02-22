package base

import "testing"

type inputOutput struct {
	number          uint64   // Number to convert
	characters      []string // Characters that are allowed in result string
	expectedString  string
	errorIsExpected bool
}

var characters = []string{
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e",
	"f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
	"u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I",
	"J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
	"Y", "Z",
}

var (
	base2Characters  = characters[:2]
	base10Characters = characters[:10]
	base16Characters = characters[:16]
	base62Characters = characters[:62]
)

func TestConvert(t *testing.T) {
	inputOutputs := []*inputOutput{
		{0, base2Characters, "0", false},
		{10, base2Characters, "1010", false},
		{16, base2Characters, "10000", false},
		{42, base2Characters, "101010", false},
		{22022013, base2Characters, "1010100000000011101111101", false},

		{0, base10Characters, "0", false},
		{10, base10Characters, "10", false},
		{16, base10Characters, "16", false},
		{42, base10Characters, "42", false},
		{22022013, base10Characters, "22022013", false},

		{0, base16Characters, "0", false},
		{10, base16Characters, "a", false},
		{16, base16Characters, "10", false},
		{42, base16Characters, "2a", false},
		{22022013, base16Characters, "150077d", false},

		{0, base62Characters, "0", false},
		{10, base62Characters, "a", false},
		{16, base62Characters, "g", false},
		{42, base62Characters, "G", false},
		{22022013, base62Characters, "1uoVL", false},

		{22022013, []string{""}, "", true},
		{22022013, []string{"a"}, "", true},
	}

	for _, inputOutput := range inputOutputs {
		result, error := Convert(inputOutput.number, inputOutput.characters)

		if error == nil && inputOutput.errorIsExpected {
			t.Errorf("Convert(%d, %s) returned no error, expected an error", inputOutput.number, inputOutput.characters)
		} else if error != nil && !inputOutput.errorIsExpected {
			t.Errorf("Convert(%d, %s) returned an error, expected no error", inputOutput.number, inputOutput.characters)
		} else if result != inputOutput.expectedString {
			t.Errorf("Convert(%d, %s) returned %s, expected %s", inputOutput.number, inputOutput.characters, result, inputOutput.expectedString)
		}
	}
}

// BenchmarkConvert times how long it takes to convert a Unix timestamp (in
// seconds) to base 62.
func BenchmarkConvert(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Convert(1361553692, base62Characters)
	}
}
