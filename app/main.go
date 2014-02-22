// Package main only handles some legacy URLs.
package main

import (
	"appengine"
	"fmt"
	"github.com/ChristianSiegert/panoptikos/assetcompiler/sanitizer"
	"io/ioutil"
	"log"
	"net/http"
	"regexp"
	"strings"
)

var isDevAppServer = appengine.IsDevAppServer()
var legacyPicturesUrlRegExp = regexp.MustCompile("^/pictures/browse/n?sfw/source:reddit-([a-zA-Z0-9_-]+)")

func init() {
	http.HandleFunc("/", handleRequest)
	http.HandleFunc("/feeds/", handleFeedsRequest)
	http.HandleFunc("/pictures/browse/", handlePicturesRequest)

	if isDevAppServer {
		http.HandleFunc("/dev-partials/", handleDevPartialsRequest)
	}
}

// handleRequest treats all incoming requests as requests to legacy URLs and
// redirects to the website root page.
func handleRequest(responseWriter http.ResponseWriter, request *http.Request) {
	http.Redirect(responseWriter, request, "/", http.StatusMovedPermanently)
}

// handleFeedsRequest handles the legacy URL "/feeds" by responding with a “404
// Not Found” error status.
func handleFeedsRequest(responseWriter http.ResponseWriter, request *http.Request) {
	http.NotFound(responseWriter, request)
}

// handlePicturesRequest redirects from the legacy URL for viewing subreddits to
// the new URL for viewing subreddits.
func handlePicturesRequest(responseWriter http.ResponseWriter, request *http.Request) {
	if strings.HasPrefix(request.URL.Path, "/pictures/browse/nsfw") {
		url := "/r/Amateur+BustyPetite+gonewild+nsfw+RealGirls"
		http.Redirect(responseWriter, request, url, http.StatusMovedPermanently)
		return
	}

	matches := legacyPicturesUrlRegExp.FindStringSubmatch(request.URL.Path)

	if len(matches) == 0 {
		http.Redirect(responseWriter, request, "/", http.StatusMovedPermanently)
		return
	}

	newUrl := "/r/" + matches[1]
	http.Redirect(responseWriter, request, newUrl, http.StatusMovedPermanently)
}

func handleDevPartialsRequest(responseWriter http.ResponseWriter, request *http.Request) {
	if !isDevAppServer {
		http.NotFound(responseWriter, request)
		return
	}

	fileName := "./webroot" + request.URL.Path
	fileContent, err := ioutil.ReadFile(fileName)

	if err != nil {
		http.Error(responseWriter, fmt.Sprintf("Couldn’t read file: %s", err), http.StatusInternalServerError)
		log.Printf("main: Couldn’t read file: %s", err)
		return
	}

	fileContent = sanitizer.RemoveHtmlComments(fileContent)
	fileContent = sanitizer.RemoveHtmlWhitespace(fileContent)

	if _, err := responseWriter.Write(fileContent); err != nil {
		log.Printf("main: Couldn’t serve file: %s", err)
	}
}
