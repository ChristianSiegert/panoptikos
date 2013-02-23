package main

import (
	"flag"
	"github.com/ChristianSiegert/panoptikos/asset"
	"github.com/ChristianSiegert/panoptikos/html"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"runtime"
	"strings"
)

type Page struct {
	CssFilename      string
	IsProductionMode bool
	JsFilename       string
}

var page Page

// Command-line flags
var (
	httpPort           = flag.String("port", "8080", "HTTP port the web server listens to.")
	isProductionMode   = flag.Bool("production", false, "Whether the server should run in production mode.")
	jsCompilationLevel = flag.String("js-compilation-level", asset.JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS, "Either WHITESPACE_ONLY, SIMPLE_OPTIMIZATIONS or ADVANCED_OPTIMIZATIONS. See https://developers.google.com/closure/compiler/docs/compilation_levels. Advanced optimizations can break your code. Only used in production mode.")
	verbose            = flag.Bool("verbose", false, "Whether additional information should be displayed.")
)

var assetUrlPattern = regexp.MustCompile("\\.(?:css|ico|js|png)$")

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	flag.Parse()

	if *isProductionMode {
		log.Println("Starting in production mode.")
	} else {
		log.Println("Starting in development mode.")
	}

	page.IsProductionMode = *isProductionMode
	mustCompileCssAndJs()

	http.HandleFunc("/", handleRequest)
	log.Println("Web server is running at 127.0.0.1:" + *httpPort + ".")

	if error := http.ListenAndServe(":"+*httpPort, nil); error != nil {
		log.Fatal("Could not start web server: ", error)
	}
}

// mustCompileCssAndJs compiles CSS and, only in production mode, JavaScript. If
// there is an error, the program exits. Progress and error messages are logged.
func mustCompileCssAndJs() {
	cssResultChan := make(chan string)
	cssProgressChan := make(chan string)
	cssErrorChan := make(chan error)

	jsResultChan := make(chan string)
	jsProgressChan := make(chan string)
	jsErrorChan := make(chan error)

	go asset.CompileCss(cssResultChan, cssProgressChan, cssErrorChan)

	if *isProductionMode {
		go asset.CompileJavaScript(*jsCompilationLevel, *verbose, jsResultChan, jsProgressChan, jsErrorChan)
	}

	for isCompilingCss, isCompilingJs := true, *isProductionMode; isCompilingCss || isCompilingJs; {
		select {
		case page.CssFilename = <-cssResultChan:
			isCompilingCss = false
		case cssProgress := <-cssProgressChan:
			log.Println(cssProgress)
		case cssError := <-cssErrorChan:
			log.Fatal("Compiling CSS failed: ", cssError)
			isCompilingCss = false
		case page.JsFilename = <-jsResultChan:
			isCompilingJs = false
		case jsProgress := <-jsProgressChan:
			log.Println(jsProgress)
		case jsError := <-jsErrorChan:
			log.Fatal("Compiling JavaScript failed: ", jsError)
		}
	}

	close(cssResultChan)
	close(cssProgressChan)
	close(cssErrorChan)

	close(jsResultChan)
	close(jsProgressChan)
	close(jsErrorChan)
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
		fileContent, error := ioutil.ReadFile("views/layouts/default.html")

		if error != nil {
			http.NotFound(responseWriter, request)
			log.Println("Error:", error)
			return
		}

		cleanedFileContent := html.RemoveWhitespace(string(fileContent))
		parsedTemplate, error := template.New("default").Parse(cleanedFileContent)

		if error != nil {
			http.Error(responseWriter, error.Error(), http.StatusInternalServerError)
			log.Println("Error:", error)
			return
		}

		if error := parsedTemplate.Execute(responseWriter, page); error != nil {
			http.Error(responseWriter, error.Error(), http.StatusInternalServerError)
			log.Println("Error:", error)
			return
		}

		return
	}

	if assetUrlPattern.MatchString(request.URL.Path) {
		file, error := os.Open("webroot" + request.URL.Path)

		if error != nil {
			http.NotFound(responseWriter, request)
			log.Println("Error:", error)
			return
		}

		fileInfo, error := file.Stat()

		if error != nil {
			http.NotFound(responseWriter, request)
			log.Println("Error:", error)
			return
		}

		http.ServeContent(responseWriter, request, "webroot"+request.URL.Path, fileInfo.ModTime(), file)
		return
	}

	http.NotFound(responseWriter, request)
}
