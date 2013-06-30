package panoptikos

import (
	"appengine"
	"github.com/ChristianSiegert/panoptikos/app/sanitizer"
	"html/template"
	"io/ioutil"
	"net/http"
	"strings"
)

type Page struct {
	CompiledCssFile string   // Filename of the compiled CSS file
	CompiledJsFile  string   // Filename of the compiled JS file
	DevCssFiles     []string // Filenames of the development CSS files
	IsDevAppServer  bool
}

var cachedTemplate *template.Template
var page Page

func init() {
	page.DevCssFiles = []string{
		"reset.css",
		"general.css",
		"form.css",
		"subreddit-picker.css",
		"board.css",
		"board-item.css",
	}

	page.CompiledCssFile = "1uePdv.css"
	page.CompiledJsFile = "1ugdFO.js"
	page.IsDevAppServer = appengine.IsDevAppServer()

	var err error
	if cachedTemplate, err = loadTemplate(); err != nil {
		http.HandleFunc("/", handleInitError(err))
		return
	}

	http.HandleFunc("/", handleRequest)

	// The most requested URL that doesn't exist anymore. Handling it outside of
	// handleRequest avoids expensive RegEx testing that is going on in
	// handleRequest.
	http.HandleFunc("/feeds/atom/", handleFeedRequest)
}

func loadTemplate() (*template.Template, error) {
	fileContent, err := ioutil.ReadFile("views/layouts/default.html")

	if err != nil {
		return nil, err
	}

	whitespaceStrippedFileContent := sanitizer.RemoveWhitespace(string(fileContent))
	template_, err := template.New("default").Parse(whitespaceStrippedFileContent)

	if err != nil {
		return nil, err
	}

	return template_, nil
}

func handleRequest(responseWriter http.ResponseWriter, request *http.Request) {
	if request.URL.Path == "/" {
		if err := cachedTemplate.Execute(responseWriter, page); err != nil {
			context := appengine.NewContext(request)
			context.Errorf("panoptikos: Couldn't execute cached template: %s", err)
			http.Error(responseWriter, err.Error(), http.StatusInternalServerError)
			return
		}

		return
	}

	// Redirect legacy URLs to home page to prevent 404 Not Found errors
	if request.URL.Path == "/feedback" ||
		request.URL.Path == "/feeds" ||
		request.URL.Path == "/preferences" ||
		strings.Index(request.URL.Path, "/pictures") == 0 ||
		strings.Index(request.URL.Path, "/referrals/by-source") == 0 ||
		strings.Index(request.URL.Path, "/sources/select") == 0 {
		http.Redirect(responseWriter, request, "/", http.StatusMovedPermanently)
		return
	}

	http.NotFound(responseWriter, request)
}

func handleFeedRequest(responseWriter http.ResponseWriter, request *http.Request) {
	http.NotFound(responseWriter, request)
}

func handleInitError(err error) func(http.ResponseWriter, *http.Request) {
	return func(responseWriter http.ResponseWriter, request *http.Request) {
		context := appengine.NewContext(request)
		context.Errorf("panoptikos: Initializing the app failed: %s", err)
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
	}
}
