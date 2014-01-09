// Package main only handles some legacy URLs.
package main

import (
	"net/http"
	"regexp"
)

func init() {
	http.HandleFunc("/", handleRequest)
	http.HandleFunc("/pictures/browse/sfw/", handlePicturesRequest)
}

// handleRequest treats all incoming requests as requests to legacy URLs and
// redirects to the website root page.
func handleRequest(responseWriter http.ResponseWriter, request *http.Request) {
	http.Redirect(responseWriter, request, "/", http.StatusMovedPermanently)
}

// handlePicturesRequest redirects from the legacy URL for viewing subreddits to
// the new URL for viewing subreddits.
func handlePicturesRequest(responseWriter http.ResponseWriter, request *http.Request) {
	legacyUrlExpression := regexp.MustCompile("^/pictures/browse/n?sfw/source:reddit-([a-zA-Z0-9_-]+)")
	matches := legacyUrlExpression.FindStringSubmatch(request.URL.Path)

	if len(matches) == 0 {
		http.Redirect(responseWriter, request, "/", http.StatusMovedPermanently)
		return
	}

	newUrl := "/r/" + matches[1]
	http.Redirect(responseWriter, request, newUrl, http.StatusMovedPermanently)
}
