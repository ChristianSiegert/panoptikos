// This program must be executed with the standard Go tools (not with the App
// Engine SDK Go tools) because it depends on Java programs.
package main

import (
	"flag"
	"fmt"
	"github.com/ChristianSiegert/panoptikos/assetcompiler/asset"
	"io/ioutil"
	"log"
	"regexp"
)

// Command-line flags
var (
	compileCss         = flag.Bool("compile-css", false, "Whether to compile CSS files.")
	compileJs          = flag.Bool("compile-js", false, "Whether to compile JavaScript files.")
	jsCompilationLevel = flag.String("js-compilation-level", asset.JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS, "Either WHITESPACE_ONLY, SIMPLE_OPTIMIZATIONS or ADVANCED_OPTIMIZATIONS. See https://developers.google.com/closure/compiler/docs/compilation_levels. Advanced optimizations can break your code. Only used in production mode.")
	verbose            = flag.Bool("verbose", false, "Whether additional information should be displayed.")
)

// Regular expressions for finding the CSS and JS filename in a .go file.
var (
	cssFilenamePattern = regexp.MustCompile("cssFilename = \"[^\"]*\"")
	jsFilenamePattern  = regexp.MustCompile("jsFilename  = \"[^\"]*\"")
)

var cssCompilerArguments = []string{
	// Ignore non-standard CSS functions and unrecognized CSS properties
	// that we use or else Closure Stylesheets won't compile our CSS
	"--allowed-non-standard-function", "color-stop",
	"--allowed-non-standard-function", "progid:DXImageTransform.Microsoft.gradient",
	"--allowed-unrecognized-property", "tap-highlight-color",
	"--allowed-unrecognized-property", "text-size-adjust",

	// Stylesheet order is important: Succeeding stylesheet rules overwrite
	// preceding ones
	"./webroot/dev-css/reset.gss",
	"./webroot/dev-css/general.gss",
	"./webroot/dev-css/form.gss",
	"./webroot/dev-css/subreddit-picker.gss",
	"./webroot/dev-css/board.gss",
	"./webroot/dev-css/board-item.gss",

	// Also include the CSS of the Closure Library widgets we use
	// "./libraries/closure-library-20120710-r2029/closure/goog/css/common.css",
	// "./libraries/closure-library-20120710-r2029/closure/goog/css/custombutton.css",
}

func main() {
	flag.Parse()

	if !*compileCss && !*compileJs {
		fmt.Println("You must specify if you want to compile CSS and/or JS files.")
		fmt.Println("Command-line flags you can use:")
		flag.PrintDefaults()
		return
	}

	compileCssJs()
}

// compileCssJs compiles CSS and/or JavaScript. Progress and error messages are
// logged.
func compileCssJs() {
	cssResultChan := make(chan string)
	cssProgressChan := make(chan string)
	cssErrorChan := make(chan error)

	jsResultChan := make(chan string)
	jsProgressChan := make(chan string)
	jsErrorChan := make(chan error)

	defer close(cssResultChan)
	defer close(cssProgressChan)
	defer close(cssErrorChan)

	defer close(jsResultChan)
	defer close(jsProgressChan)
	defer close(jsErrorChan)

	if *compileCss {
		go asset.CompileCss(cssCompilerArguments, cssResultChan, cssProgressChan, cssErrorChan)
	}

	if *compileJs {
		go asset.CompileJavaScript(*jsCompilationLevel, *verbose, jsResultChan, jsProgressChan, jsErrorChan)
	}

	cssFilename := ""
	jsFilename := ""

	for isCompilingCss, isCompilingJs := *compileCss, *compileJs; isCompilingCss || isCompilingJs; {
		select {
		case cssFilename = <-cssResultChan:
			isCompilingCss = false
		case jsFilename = <-jsResultChan:
			isCompilingJs = false

		case cssProgress := <-cssProgressChan:
			log.Println(cssProgress)
		case jsProgress := <-jsProgressChan:
			log.Println(jsProgress)

		case cssError := <-cssErrorChan:
			log.Println("Compiling CSS failed: ", cssError)
		case jsError := <-jsErrorChan:
			log.Println("Compiling JavaScript failed: ", jsError)
		}
	}

	updateFilenames(cssFilename, jsFilename)
}

func updateFilenames(cssFilename, jsFilename string) {
	filename := "./asset-filenames.go"

	content, error := ioutil.ReadFile(filename)
	if error != nil {
		log.Printf("assetcompiler: Couldn't read file %s: %s", filename, error)
		return
	}

	if len(cssFilename) > 0 {
		replacement := fmt.Sprintf("cssFilename = \"%s\"", cssFilename)
		content = cssFilenamePattern.ReplaceAll(content, []byte(replacement))
	}

	if len(jsFilename) > 0 {
		replacement := fmt.Sprintf("jsFilename  = \"%s\"", jsFilename)
		content = jsFilenamePattern.ReplaceAll(content, []byte(replacement))
	}

	if error := ioutil.WriteFile(filename, content, 0666); error != nil {
		log.Printf("assetcompiler: Couldn't write to file %s: %s", filename, error)
		return
	}
}
