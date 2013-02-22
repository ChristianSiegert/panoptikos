// Package html provides a function for the removal of whitespace in HTML code.
package html

import "regexp"

var (
	whitespaceAtStart             = regexp.MustCompile("^[ \f\n\r\t]+")
	whitespaceAtEnd               = regexp.MustCompile("[ \f\n\r\t]+$")
	whitespaceBetweenTags         = regexp.MustCompile(">[ \f\n\r\t]+<")
	whitespaceBetweenTagAndAction = regexp.MustCompile(">[ \f\n\r\t]+{{")
	whitespaceBetweenActionAndTag = regexp.MustCompile("}}[ \f\n\r\t]+<")
)

// RemoveWhitespace removes whitespace between tags, between tags and actions,
// and at the beginning and end of the HTML code.
func RemoveWhitespace(text string) string {
	text = whitespaceBetweenTags.ReplaceAllString(text, "><")
	text = whitespaceBetweenTagAndAction.ReplaceAllString(text, ">{{")
	text = whitespaceBetweenActionAndTag.ReplaceAllString(text, "}}<")
	text = whitespaceAtStart.ReplaceAllString(text, "")
	text = whitespaceAtEnd.ReplaceAllString(text, "")
	return text
}
