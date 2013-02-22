// Package base provides a function for converting base 10 numbers into other
// bases.
package base

import "fmt"

// DefaultCharacters contains 62 characters that can be safely used in filenames
// in all common filesystems.
var DefaultCharacters = []string{
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e",
	"f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
	"u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I",
	"J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
	"Y", "Z",
}

// Convert converts a base 10 number into another base. The target base is
// determined by the length of the characters slice.
func Convert(number uint64, characters []string) (string, error) {
	base := uint64(len(characters))

	if base < 2 {
		error := fmt.Errorf("At least two characters must be provided, got %d.", base)
		return "", error
	}

	result := ""

	for {
		remainder := number % base
		result = characters[remainder] + result
		number = (number - remainder) / base

		if number == 0 {
			break
		}
	}

	return result, nil
}
