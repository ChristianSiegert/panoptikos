// Package sanitizer provides a function for the removal of whitespace in HTML
// templates.
package sanitizer

import (
	"bytes"
	"regexp"
)

var (
	htmlCommentRegExp             = regexp.MustCompile("<!--(.|[\r\n])*?-->")
	lineBreakRegExp               = regexp.MustCompile("[\r\n]+")
	tagRegExp                     = regexp.MustCompile("<(.|[\r\n])*?>")
	whitespaceAtStart             = regexp.MustCompile("^[ \f\n\r\t\v]+")
	whitespaceAtEnd               = regexp.MustCompile("[ \f\n\r\t\v]+$")
	whitespaceBetweenTags         = regexp.MustCompile(">[ \f\n\r\t\v]+<")
	whitespaceBetweenActions      = regexp.MustCompile("}}[ \f\n\r\t\v]+{{")
	whitespaceBetweenTagAndAction = regexp.MustCompile(">[ \f\n\r\t\v]+{{")
	whitespaceBetweenActionAndTag = regexp.MustCompile("}}[ \f\n\r\t\v]+<")
	whitespaceInsideTagStart      = regexp.MustCompile("<(/)?[ \f\n\r\t\v]+")
	whitespaceInsideTagEnd        = regexp.MustCompile("[ \f\n\r\t\v]+(/?)>")
	whitespaceInsideTagEqualSign  = regexp.MustCompile("[ \f\n\r\t\v]*=[ \f\n\r\t\v]*")
	whitespaceInsideTag           = regexp.MustCompile("[ \f\n\r\t\v]{2,}")
)

func RemoveHtmlComments(html []byte) []byte {
	return htmlCommentRegExp.ReplaceAll(html, []byte(""))
}

// RemoveHtmlWhitespace removes whitespace between tags, actions, and at the
// beginning and end of the HTML code.
func RemoveHtmlWhitespace(html []byte) []byte {
	html = whitespaceBetweenTags.ReplaceAll(html, []byte("><"))
	html = whitespaceBetweenActions.ReplaceAll(html, []byte("}}{{"))
	html = whitespaceBetweenTagAndAction.ReplaceAll(html, []byte(">{{"))
	html = whitespaceBetweenActionAndTag.ReplaceAll(html, []byte("}}<"))
	html = whitespaceAtStart.ReplaceAll(html, []byte(""))
	html = whitespaceAtEnd.ReplaceAll(html, []byte(""))

	tags := tagRegExp.FindAll(html, -1)

	for _, tag := range tags {
		cleanTag := lineBreakRegExp.ReplaceAll(tag, []byte(" "))
		cleanTag = whitespaceInsideTagStart.ReplaceAll(cleanTag, []byte("<$1"))
		cleanTag = whitespaceInsideTagEnd.ReplaceAll(cleanTag, []byte("$1>"))
		cleanTag = whitespaceInsideTagEqualSign.ReplaceAllLiteral(cleanTag, []byte("="))
		cleanTag = whitespaceInsideTag.ReplaceAllLiteral(cleanTag, []byte(" "))
		html = bytes.Replace(html, tag, cleanTag, 1)
	}

	return html
}
