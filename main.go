package main

import (
	"flag"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"runtime"
)

type Page struct {
	IsProductionMode bool
}

// Command-line flags
var httpPort = flag.String("port", "8080", "HTTP port the web server listens to.")
var isProductionMode = flag.Bool("production", false, "Whether the server should run in production mode.")

// RegEx patterns
var assetUrlPattern = regexp.MustCompile("^/(?:css|images|js)/")
var whitespacePattern = regexp.MustCompile(">[ \f\n\r\t]+<")

func main() {
	// Set maximum number of CPUs that can be executing simultaneously
	runtime.GOMAXPROCS(runtime.NumCPU())

	// Parse command-line flags
	flag.Parse()

	log.Println("Production mode:", *isProductionMode)

	if *isProductionMode {
		// compileCss()
		compileJavaScript()
	}

	http.HandleFunc("/", handleRequest)
	log.Println("Going to start web server at 127.0.0.1:" + *httpPort + ".")

	if error := http.ListenAndServe(":"+*httpPort, nil); error != nil {
		log.Fatal("Could not start web server: ", error)
	}
}

func handleRequest(responseWriter http.ResponseWriter, request *http.Request) {
	if request.URL.Path == "/" {
		fileContent, error := ioutil.ReadFile("views/layouts/default.html")

		if error != nil {
			http.NotFound(responseWriter, request)
			log.Println("Error:", error)
			return
		}

		cleanedFileContent := whitespacePattern.ReplaceAllString(string(fileContent), "><")
		parsedTemplate, error := template.New("default").Parse(cleanedFileContent)

		error = parsedTemplate.Execute(responseWriter, &Page{IsProductionMode: *isProductionMode})

		if error != nil {
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

func compileJavaScript() {
	log.Println("Compiling JavaScript ...")

	workingDirectory, error := os.Getwd()

	if error != nil {
		log.Fatal("Could not determine working directory: ", error)
	}

	command := exec.Command(
		workingDirectory+"/libraries/closure-library-20120710-r2029/closure/bin/build/closurebuilder.py",
		"--compiler_flags=--compilation_level=ADVANCED_OPTIMIZATIONS",
		// "--compiler_flags=--warning_level=VERBOSE",
		"--compiler_jar="+workingDirectory+"/libraries/closure-compiler-20120917-r2180/compiler.jar",
		"--namespace=panoptikos.Panoptikos",
		"--output_file="+workingDirectory+"/webroot/js/compiled.js",
		"--output_mode=compiled",
		"--root="+workingDirectory)

	stderrPipe, error := command.StderrPipe()

	if error != nil {
		log.Fatal("Could not create stderr pipe for Closure Builder: ", error)
	}

	if error := command.Start(); error != nil {
		log.Fatal("Could not start Closure Builder: ", error)
	}

	stdErrOutput, error := ioutil.ReadAll(stderrPipe)

	if error != nil {
		log.Fatal("Could not read from Closure Builder's stderr pipe: ", error)
	}

	if error := command.Wait(); error != nil {
		log.Println("Could not compile JavaScript:", string(stdErrOutput))
		log.Fatal("Closure Builder finished with: ", error)
	}

	log.Println("Compiled JavaScript.")
}
