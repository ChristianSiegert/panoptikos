// Package asset provides compression of CSS and JavaScript files.
package asset

import (
	"github.com/ChristianSiegert/panoptikos/base"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"strings"
	"time"
)

// Compilation levels supported by Closure Compiler
const (
	JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS = "ADVANCED_OPTIMIZATIONS"
	JS_COMPILATION_LEVEL_SIMPLE_OPTIMIZATIONS   = "SIMPLE_OPTIMIZATIONS"
	JS_COMPILATION_LEVEL_WHITESPACE_ONLY        = "WHITESPACE_ONLY"
)

// CompileCss executes Closure Stylesheets to merge and compile all CSS code
// into a single file. The file is written to the webroot directory, its
// filename is a Unix timestamp in base 62.
func CompileCss() (relativeFilename string) {
	log.Println("Compiling CSS ...")

	workingDirectory, error := os.Getwd()

	if error != nil {
		log.Fatal("Could not determine working directory: ", error)
	}

	timestampInBase62, error := base.Convert(uint64(time.Now().Unix()), base.DefaultCharacters)

	if error != nil {
		log.Fatal("Failed to convert timestamp to base 62: ", error)
	}

	relativeFilename = timestampInBase62 + ".css"
	absoluteFilename := workingDirectory + "/webroot/" + relativeFilename

	command := exec.Command(
		"java",
		"-jar", workingDirectory+"/libraries/closure-stylesheets-20111230/closure-stylesheets-20111230.jar",
		"--output-file", absoluteFilename,

		// Ignore non-standard CSS functions and unrecognized CSS properties
		// that we use or else Closure Stylesheets won't compile our CSS
		"--allowed-non-standard-function", "color-stop",
		"--allowed-non-standard-function", "progid:DXImageTransform.Microsoft.gradient",
		"--allowed-unrecognized-property", "tap-highlight-color",
		"--allowed-unrecognized-property", "text-size-adjust",

		// Stylesheet order is important: Succeeding stylesheet rules overwrite
		// preceding ones
		"./webroot/css/reset.gss",
		"./webroot/css/general.gss",
		"./webroot/css/form.gss",
		"./webroot/css/subreddit-picker.gss",
		"./webroot/css/board.gss",
		"./webroot/css/board-item.gss",

		// Also include the CSS of the Closure Library widgets we use
		// "./libraries/closure-library-20120710-r2029/closure/goog/css/common.css",
		// "./libraries/closure-library-20120710-r2029/closure/goog/css/custombutton.css",
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

// CompileJavaScript executes Closure Compiler to merge and compile all
// JavaScript code into a single file. The file is written to the webroot
// directory, its filename is a Unix timestamp in base 62.
func CompileJavaScript(jsCompilationLevel string, verbose bool) (relativeFilename string) {
	jsCompilationLevel = strings.ToUpper(jsCompilationLevel)

	switch jsCompilationLevel {
	case JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS:
		log.Println("Compiling JavaScript with advanced optimizations ...")
	case JS_COMPILATION_LEVEL_SIMPLE_OPTIMIZATIONS:
		log.Println("Compiling JavaScript with simple optimizations ...")
	case JS_COMPILATION_LEVEL_WHITESPACE_ONLY:
		log.Println("Compiling JavaScript with whitespace-only optimizations ...")
	default:
		log.Printf("JavaScript compilation level '%s' not recognized. Using '%s'.\n", jsCompilationLevel, JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS)
		log.Println("Compiling JavaScript with advanced optimizations ...")
		jsCompilationLevel = JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS
	}

	workingDirectory, error := os.Getwd()

	if error != nil {
		log.Fatal("Could not determine working directory: ", error)
	}

	timestampInBase62, error := base.Convert(uint64(time.Now().Unix()), base.DefaultCharacters)

	if error != nil {
		log.Fatal("Failed to convert timestamp to base 62: ", error)
	}

	relativeFilename = timestampInBase62 + ".js"
	absoluteFilename := workingDirectory + "/webroot/" + relativeFilename

	command := exec.Command(
		workingDirectory+"/libraries/closure-library-20120710-r2029/closure/bin/build/closurebuilder.py",
		"--compiler_flags=--compilation_level="+jsCompilationLevel,
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

	if verbose {
		// All Closure Builder output runs over stderr, even if no error occurred
		log.Println(string(stderrOutput))
	}

	log.Println("Compiled JavaScript.")
	return
}
