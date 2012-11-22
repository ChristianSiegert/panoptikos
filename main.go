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
	"strconv"
	"strings"
	"time"
)

type Page struct {
	CssFilename      string
	IsProductionMode bool
	JsFilename       string
}

var page Page

// Compilation levels supported by Closure Compiler
const (
	JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS = "ADVANCED_OPTIMIZATIONS"
	JS_COMPILATION_LEVEL_SIMPLE_OPTIMIZATIONS   = "SIMPLE_OPTIMIZATIONS"
	JS_COMPILATION_LEVEL_WHITESPACE_ONLY        = "WHITESPACE_ONLY"
)

// Command-line flags
var (
	httpPort           = flag.String("port", "8080", "HTTP port the web server listens to.")
	isProductionMode   = flag.Bool("production", false, "Whether the server should run in production mode.")
	jsCompilationLevel = flag.String("js-compilation-level", JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS, "Either WHITESPACE_ONLY, SIMPLE_OPTIMIZATIONS or ADVANCED_OPTIMIZATIONS. See https://developers.google.com/closure/compiler/docs/compilation_levels. Advanced optimizations can break your code. Only used in production mode.")
	verbose            = flag.Bool("verbose", false, "Whether additional information should be displayed.")
)

// RegEx patterns
var (
	assetUrlPattern   = regexp.MustCompile("^/(?:css|images|js)/")
	whitespacePattern = regexp.MustCompile(">[ \f\n\r\t]+<")
)

func main() {
	// Set maximum number of CPUs that can be executing simultaneously
	runtime.GOMAXPROCS(runtime.NumCPU())

	// Parse command-line flags
	flag.Parse()

	log.Println("Production mode:", *isProductionMode)
	page.IsProductionMode = *isProductionMode

	page.CssFilename /*, error*/ = compileCss()

	// if error != nil {
	// 	log.Fatal("Error:", error);
	// }

	if *isProductionMode {
		page.JsFilename = compileJavaScript()
	}

	http.HandleFunc("/", handleRequest)
	log.Println("Web server is running at 127.0.0.1:" + *httpPort + ".")

	if error := http.ListenAndServe(":"+*httpPort, nil); error != nil {
		log.Fatal("Could not start web server: ", error)
	}
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

		cleanedFileContent := whitespacePattern.ReplaceAllString(string(fileContent), "><")
		parsedTemplate, error := template.New("default").Parse(cleanedFileContent)

		error = parsedTemplate.Execute(responseWriter, page)

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

func compileCss() (relativeFilename string) {
	log.Println("Compiling CSS ...")

	workingDirectory, error := os.Getwd()

	if error != nil {
		log.Fatal("Could not determine working directory: ", error)
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	relativeFilename = "css/compiled-" + timestamp + ".css"
	absoluteFilename := workingDirectory + "/webroot/" + relativeFilename

	command := exec.Command(
		"java",
		"-jar", workingDirectory+"/libraries/closure-stylesheets-20111230/closure-stylesheets-20111230.jar",
		"--allowed-non-standard-function", "color-stop",
		"--allowed-non-standard-function", "progid:DXImageTransform.Microsoft.gradient",
		"--allowed-unrecognized-property", "tap-highlight-color",
		"--allowed-unrecognized-property", "text-size-adjust",
		"--output-file", absoluteFilename,

		// Stylesheet order is important: Succeeding rules overwrite preceding ones
		"./webroot/css/reset.gss",
		"./webroot/css/general.gss",
		"./webroot/css/form.gss",
		"./webroot/css/subreddit-picker.gss",
		"./webroot/css/board.gss",
		"./webroot/css/board-item.gss",
	)

	stderrPipe, error := command.StderrPipe()

	if error != nil {
		log.Fatal("Could not create stderr pipe for Closure Stylesheets: ", error)
	}

	if error := command.Start(); error != nil {
		log.Fatal("Could not start Closure Stylesheets: ", error)
	}

	stderrOutput, error := ioutil.ReadAll(stderrPipe)

	if error != nil {
		log.Fatal("Could not read from Closure Stylesheets' stderr pipe: ", error)
	}

	if error := command.Wait(); error != nil {
		log.Println("Could not compile CSS:", string(stderrOutput))
		log.Fatal("Closure Stylesheets finished with: ", error)
	}

	log.Println("Compiled CSS.")
	return
}

func compileJavaScript() (relativeFilename string) {
	*jsCompilationLevel = strings.ToUpper(*jsCompilationLevel)

	switch *jsCompilationLevel {
	case JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS:
		log.Println("Compiling JavaScript with advanced optimizations ...")
	case JS_COMPILATION_LEVEL_SIMPLE_OPTIMIZATIONS:
		log.Println("Compiling JavaScript with simple optimizations ...")
	case JS_COMPILATION_LEVEL_WHITESPACE_ONLY:
		log.Println("Compiling JavaScript with whitespace-only optimizations ...")
	default:
		log.Printf("JavaScript compilation level '%s' not recognized. Using '%s'.\n", *jsCompilationLevel, JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS)
		log.Println("Compiling JavaScript with advanced optimizations ...")
		*jsCompilationLevel = JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS
	}

	workingDirectory, error := os.Getwd()

	if error != nil {
		log.Fatal("Could not determine working directory: ", error)
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	relativeFilename = "js/compiled-" + timestamp + ".js"
	absoluteFilename := workingDirectory + "/webroot/" + relativeFilename

	command := exec.Command(
		workingDirectory+"/libraries/closure-library-20120710-r2029/closure/bin/build/closurebuilder.py",
		"--compiler_flags=--compilation_level="+*jsCompilationLevel,
		"--compiler_flags=--warning_level=VERBOSE",
		"--compiler_jar="+workingDirectory+"/libraries/closure-compiler-20120917-r2180/compiler.jar",
		"--namespace=panoptikos.Panoptikos",
		"--output_file="+absoluteFilename,
		"--output_mode=compiled",
		"--root="+workingDirectory,
	)

	stderrPipe, error := command.StderrPipe()

	if error != nil {
		log.Fatal("Could not create stderr pipe for Closure Builder: ", error)
	}

	if error := command.Start(); error != nil {
		log.Fatal("Could not start Closure Builder: ", error)
	}

	stderrOutput, error := ioutil.ReadAll(stderrPipe)

	if error != nil {
		log.Fatal("Could not read from Closure Builder's stderr pipe: ", error)
	}

	if error := command.Wait(); error != nil {
		log.Println("Could not compile JavaScript:", string(stderrOutput))
		log.Fatal("Closure Builder finished with: ", error)
	}

	if *verbose {
		// All Closure Builder output runs over stderr, even if no error occurred
		log.Println(string(stderrOutput))
	}

	log.Println("Compiled JavaScript.")
	return
}
