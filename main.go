package panoptikos

import (
	"appengine"
	"github.com/ChristianSiegert/panoptikos/sanitizer"
	"html/template"
	"io/ioutil"
	"net/http"
	"strings"
)

type Page struct {
	CssFilename    string
	IsDevAppServer bool
	JsFilename     string
}

var page Page
var cachedTemplate *template.Template

var isDevAppServer = appengine.IsDevAppServer()

func init() {
	page.IsDevAppServer = isDevAppServer
	page.CssFilename = cssFilename
	page.JsFilename = jsFilename

	var err error
	if cachedTemplate, err = loadTemplate(); err != nil {
		http.HandleFunc("/", handleInitError(err))
		return
	}

	http.HandleFunc("/", handleRequest)
	http.HandleFunc("/_ah/warmup", handleWarmUpRequest)
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

func handleWarmUpRequest(responseWriter http.ResponseWriter, request *http.Request) {
	context := appengine.NewContext(request)
	context.Debugf("panoptikos: Received warm-up request.")
}

func handleInitError(err error) func(http.ResponseWriter, *http.Request) {
	return func(responseWriter http.ResponseWriter, request *http.Request) {
		context := appengine.NewContext(request)
		context.Errorf("panoptikos: Initializing the app failed: %s", err)
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
	}
}
