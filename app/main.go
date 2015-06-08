// Package main handles requests to templates and to legacy URLs.
package main

import (
	"appengine"
	"appengine/mail"
	"appengine/taskqueue"
	"encoding/json"
	"fmt"
	"github.com/ChristianSiegert/panoptikos/assetcompiler/sanitizer"
	"io/ioutil"
	"log"
	"net/http"
	"regexp"
	"strings"
)

var adminEmailAddress = "christian@panoptikos.com"
var isDevAppServer = appengine.IsDevAppServer()
var legacyPicturesUrlRegExp = regexp.MustCompile("^/pictures/browse/n?sfw/source:reddit-([a-zA-Z0-9_-]+)")

type Feedback struct {
	Message string
	Sender  string
}

func init() {
	http.HandleFunc("/", handleRequest)
	http.HandleFunc("/api/1/feedback", api1Feedback)
	http.HandleFunc("/feeds/", handleFeedsRequest)
	http.HandleFunc("/pictures/browse/", handlePicturesRequest)
	http.HandleFunc("/worker/send-feedback", workerSendFeedback)

	if isDevAppServer {
		http.HandleFunc("/donations/donations.html", handleTemplateRequest)
		http.HandleFunc("/feedback/feedback.html", handleTemplateRequest)
		http.HandleFunc("/settings/settings.html", handleTemplateRequest)
		http.HandleFunc("/subreddit-list/subreddit-list.html", handleTemplateRequest)
		http.HandleFunc("/supporters/supporters.html", handleTemplateRequest)
		http.HandleFunc("/thread-detail/thread-detail.html", handleTemplateRequest)
		http.HandleFunc("/thread-list/thread-list.html", handleTemplateRequest)
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
	matches := legacyPicturesUrlRegExp.FindStringSubmatch(request.URL.Path)

	if len(matches) >= 1 {
		newUrl := "/r/" + strings.Replace(matches[1], "-", "_", -1)
		http.Redirect(responseWriter, request, newUrl, http.StatusMovedPermanently)
		return
	}

	if strings.HasPrefix(request.URL.Path, "/pictures/browse/nsfw") {
		url := "/r/Amateur+BustyPetite+gonewild+nsfw+RealGirls"
		http.Redirect(responseWriter, request, url, http.StatusMovedPermanently)
		return
	}

	http.Redirect(responseWriter, request, "/", http.StatusMovedPermanently)
}

func handleTemplateRequest(responseWriter http.ResponseWriter, request *http.Request) {
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

func api1Feedback(responseWriter http.ResponseWriter, request *http.Request) {
	if request.Method != "POST" {
		responseWriter.Header()["Allow"] = []string{"POST"}
		http.Error(responseWriter, "", http.StatusMethodNotAllowed)
		return
	}

	context := appengine.NewContext(request)
	content, err := ioutil.ReadAll(request.Body)

	if err != nil {
		context.Errorf("main: api1Feedback: Reading request body failed: %s", err)
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	feedback := &Feedback{}

	if err := json.Unmarshal(content, feedback); err != nil {
		context.Errorf("main: api1Feedback: Unmarshalling JSON failed: %s", err)
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if feedback.Message == "" {
		http.Error(responseWriter, "Message must not be empty.", http.StatusForbidden)
		return
	}

	task := taskqueue.NewPOSTTask("/worker/send-feedback", map[string][]string{
		"ip":        {request.RemoteAddr},
		"message":   {feedback.Message},
		"sender":    {feedback.Sender},
		"userAgent": {request.UserAgent()},
	})

	if _, err := taskqueue.Add(context, task, ""); err != nil {
		context.Errorf("main: handleRequestApi1Feedback: Adding task to taskqueue failed: %s (Task: %s)", err, task)
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
	}
}

func workerSendFeedback(responseWriter http.ResponseWriter, request *http.Request) {
	if request.Method != "POST" {
		responseWriter.Header()["Allow"] = []string{"POST"}
		http.Error(responseWriter, "", http.StatusMethodNotAllowed)
		return
	}

	context := appengine.NewContext(request)

	if err := request.ParseForm(); err != nil {
		context.Errorf("main: workerSendFeedback: Parsing form failed: %s", err)
		http.Error(responseWriter, err.Error(), http.StatusInternalServerError)
		return
	}

	message := strings.TrimSpace(request.FormValue("message"))
	sender := strings.TrimSpace(request.FormValue("sender"))

	if message == "" {
		return
	}

	message += "\n\n\nThis message was sent by:"
	message += "\n\nUser agent:\n" + request.FormValue("userAgent")
	message += "\n\nIP:\n" + request.FormValue("ip")

	m := &mail.Message{
		Body:    message,
		ReplyTo: sender,
		Sender:  adminEmailAddress,
		Subject: "Feedback",
	}

	if err := mail.SendToAdmins(context, m); err != nil {
		http.Error(responseWriter, err.Error(), http.StatusInternalServerError)
	}
}
