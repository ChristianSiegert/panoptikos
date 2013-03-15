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

	var error error
	if cachedTemplate, error = loadTemplate(); error != nil {
		http.HandleFunc("/", handleInitError(error))
		return
	}

	http.HandleFunc("/", handleRequest)
}

func loadTemplate() (*template.Template, error) {
	fileContent, error := ioutil.ReadFile("views/layouts/default.html")

	if error != nil {
		return nil, error
	}

	whitespaceStrippedFileContent := sanitizer.RemoveWhitespace(string(fileContent))
	template_, error := template.New("default").Parse(whitespaceStrippedFileContent)

	if error != nil {
		return nil, error
	}

	return template_, nil
}

func handleRequest(responseWriter http.ResponseWriter, request *http.Request) {
	if request.URL.Path == "/" {
		if error := cachedTemplate.Execute(responseWriter, page); error != nil {
			context := appengine.NewContext(request)
			context.Errorf("panoptikos: Couldn't execute cached template: %s", error)
			http.Error(responseWriter, error.Error(), http.StatusInternalServerError)
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

func handleInitError(error error) func(http.ResponseWriter, *http.Request) {
	return func(responseWriter http.ResponseWriter, request *http.Request) {
		context := appengine.NewContext(request)
		context.Errorf("panoptikos: Initializing the app failed: %s", error)
		http.Error(responseWriter, "Internal Server Error", http.StatusInternalServerError)
	}
}

