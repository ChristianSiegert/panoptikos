package panoptikos

import (
	"appengine"
	"github.com/ChristianSiegert/panoptikos/sanitizer"
	"html/template"
	"io/ioutil"
	"log"
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
	if isDevAppServer {
		log.Println("Starting in development mode.")
	} else {
		log.Println("Starting in production mode.")
	}

	page.IsDevAppServer = isDevAppServer
	page.CssFilename = cssFilename
	page.JsFilename = jsFilename

	http.HandleFunc("/", handleRequest)
}

func handleRequest(responseWriter http.ResponseWriter, request *http.Request) {
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

	if request.URL.Path == "/" {
		if cachedTemplate == nil {
			fileContent, error := ioutil.ReadFile("views/layouts/default.html")

			if error != nil {
				http.NotFound(responseWriter, request)
				log.Println("Error:", error)
				return
			}

			cleanedFileContent := sanitizer.RemoveWhitespace(string(fileContent))
			cachedTemplate, error = template.New("default").Parse(cleanedFileContent)

			if error != nil {
				http.Error(responseWriter, error.Error(), http.StatusInternalServerError)
				log.Println("Error:", error)
				return
			}
		}

		if error := cachedTemplate.Execute(responseWriter, page); error != nil {
			http.Error(responseWriter, error.Error(), http.StatusInternalServerError)
			log.Println("Error:", error)
			return
		}

		return
	}

	http.NotFound(responseWriter, request)
}
