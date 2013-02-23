// Package asset provides compression of CSS and JavaScript files.
package asset

import (
	"fmt"
	"github.com/ChristianSiegert/panoptikos/base"
	"io/ioutil"
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
func CompileCss(resultChan, progressChan chan<- string, errorChan chan<- error) {
	progressChan <- "Compiling CSS ..."

	workingDirectory, error := os.Getwd()

	if error != nil {
		errorChan <- fmt.Errorf("Could not determine working directory: %s", error)
		return
	}

	timestampInBase62, error := base.Convert(uint64(time.Now().Unix()), base.DefaultCharacters)

	if error != nil {
		errorChan <- fmt.Errorf("Failed to convert timestamp to base 62: %s", error)
		return
	}

	relativeFilename := timestampInBase62 + ".css"
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
		errorChan <- fmt.Errorf("Could not create stderr pipe for Closure Stylesheets: %s", error)
		return
	}

	if error := command.Start(); error != nil {
		errorChan <- fmt.Errorf("Could not start Closure Stylesheets: %s", error)
		return
	}

	stderrOutput, error := ioutil.ReadAll(stderrPipe)

	if error != nil {
		errorChan <- fmt.Errorf("Could not read from Closure Stylesheets' stderr pipe: %s", error)
		return
	}

	if error := command.Wait(); error != nil {
		errorChan <- fmt.Errorf("Could not compile CSS: %s", string(stderrOutput))
		return
	}

	progressChan <- "Compiled CSS."
	resultChan <- relativeFilename
}

// CompileJavaScript executes Closure Compiler to merge and compile all
// JavaScript code into a single file. The file is written to the webroot
// directory, its filename is a Unix timestamp in base 62.
func CompileJavaScript(jsCompilationLevel string, verbose bool, resultChan, progressChan chan<- string, errorChan chan<- error) {
	jsCompilationLevel = strings.ToUpper(jsCompilationLevel)

	switch jsCompilationLevel {
	case JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS:
		progressChan <- "Compiling JavaScript with advanced optimizations ..."
	case JS_COMPILATION_LEVEL_SIMPLE_OPTIMIZATIONS:
		progressChan <- "Compiling JavaScript with simple optimizations ..."
	case JS_COMPILATION_LEVEL_WHITESPACE_ONLY:
		progressChan <- "Compiling JavaScript with whitespace-only optimizations ..."
	default:
		progressChan <- fmt.Sprintf("JavaScript compilation level '%s' not recognized. Using '%s'.\n", jsCompilationLevel, JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS)
		progressChan <- "Compiling JavaScript with advanced optimizations ..."
		jsCompilationLevel = JS_COMPILATION_LEVEL_ADVANCED_OPTIMIZATIONS
	}

	workingDirectory, error := os.Getwd()

	if error != nil {
		errorChan <- fmt.Errorf("Could not determine working directory: %s", error)
		return
	}

	timestampInBase62, error := base.Convert(uint64(time.Now().Unix()), base.DefaultCharacters)

	if error != nil {
		errorChan <- fmt.Errorf("Failed to convert timestamp to base 62: %s", error)
		return
	}

	relativeFilename := timestampInBase62 + ".js"
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
		errorChan <- fmt.Errorf("Could not create stderr pipe for Closure Builder: %s", error)
		return
	}

	if error := command.Start(); error != nil {
		errorChan <- fmt.Errorf("Could not start Closure Builder: %s", error)
		return
	}

	stderrOutput, error := ioutil.ReadAll(stderrPipe)

	if error != nil {
		errorChan <- fmt.Errorf("Could not read from Closure Builder's stderr pipe: %s", error)
		return
	}

	if error := command.Wait(); error != nil {
		errorChan <- fmt.Errorf("Could not compile JavaScript: %s", string(stderrOutput))
		return
	}

	if verbose {
		// All Closure Builder output runs over stderr, even if no error occurred
		progressChan <- string(stderrOutput)
	}

	progressChan <- "Compiled JavaScript."
	resultChan <- relativeFilename
}
