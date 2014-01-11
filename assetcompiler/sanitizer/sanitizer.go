// Package sanitizer provides a function for the removal of whitespace in HTML
// templates.
package sanitizer

import "regexp"

var (
	htmlCommentRegExp             = regexp.MustCompile("<!--.*?-->")
	whitespaceAtStart             = regexp.MustCompile("^[ \f\n\r\t]+")
	whitespaceAtEnd               = regexp.MustCompile("[ \f\n\r\t]+$")
	whitespaceBetweenTags         = regexp.MustCompile(">[ \f\n\r\t]+<")
	whitespaceBetweenActions      = regexp.MustCompile("}}[ \f\n\r\t]+{{")
	whitespaceBetweenTagAndAction = regexp.MustCompile(">[ \f\n\r\t]+{{")
	whitespaceBetweenActionAndTag = regexp.MustCompile("}}[ \f\n\r\t]+<")
)

func RemoveHtmlComments(html []byte) []byte {
	return htmlCommentRegExp.ReplaceAll(html, []byte(""))
}

// RemoveWhitespace removes whitespace between tags, actions, and at the
// beginning and end of the HTML code.
func RemoveWhitespace(text []byte) []byte {
	text = whitespaceBetweenTags.ReplaceAll(text, []byte("><"))
	text = whitespaceBetweenActions.ReplaceAll(text, []byte("}}{{"))
	text = whitespaceBetweenTagAndAction.ReplaceAll(text, []byte(">{{"))
	text = whitespaceBetweenActionAndTag.ReplaceAll(text, []byte("}}<"))
	text = whitespaceAtStart.ReplaceAll(text, []byte(""))
	text = whitespaceAtEnd.ReplaceAll(text, []byte(""))
	return text
}
