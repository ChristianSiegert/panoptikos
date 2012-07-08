package main

import (
	"flag"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"runtime"
)

type Page struct {
}

// Command-line flags
var httpPort = flag.String("port", "8080", "HTTP port the web server listens to.")

// RegEx patterns
var assetUrlPattern = regexp.MustCompile("^/(?:css|js)/")
var whitespacePattern = regexp.MustCompile(">[ \f\n\r\t]+<")

func main() {
	// Set maximum number of processes to number of CPUs
	runtime.GOMAXPROCS(runtime.NumCPU())

	// Parse command-line into defined flags
	flag.Parse()

	http.HandleFunc("/", handleRequest)

	fmt.Println("Started web server at 127.0.0.1:" + *httpPort + ".")
	error := http.ListenAndServe(":"+*httpPort, nil)

	if error != nil {
		log.Fatal("ListenAndServe: ", error)
	}
}

func handleRequest(responseWriter http.ResponseWriter, request *http.Request) {
	if request.URL.Path == "/" {
		fileContent, error := ioutil.ReadFile("views/layouts/default.html")

		if error != nil {
			fmt.Println("Error:", error)
			http.NotFound(responseWriter, request)
			return
		}

		cleanedFileContent := whitespacePattern.ReplaceAllString(string(fileContent), "><")
		parsedTemplate, error := template.New("default").Parse(cleanedFileContent)

		error = parsedTemplate.Execute(responseWriter, &Page{})

		if error != nil {
			http.Error(responseWriter, error.Error(), http.StatusInternalServerError)
			fmt.Println(error)
			return
		}

		return
	}

	if assetUrlPattern.MatchString(request.URL.Path) {
		file, error := os.Open("webroot" + request.URL.Path)

		if error != nil {
			http.NotFound(responseWriter, request)
			return
		}

		fileInfo, error := file.Stat()

		if error != nil {
			fmt.Println("Error:", error)
			return
		}

		http.ServeContent(responseWriter, request, "webroot"+request.URL.Path, fileInfo.ModTime(), file)
		return
	}

	http.NotFound(responseWriter, request)
}
