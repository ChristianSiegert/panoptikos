// Package asset provides compression of CSS and JavaScript files.
package asset

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"
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
func CompileCss(sourceFilenames []string, destinationFilename string, compilerArguments []string, resultChan, progressChan chan<- string, errorChan chan<- error) {
	progressChan <- "Compiling CSS ..."

	workingDirectory, err := os.Getwd()

	if err != nil {
		errorChan <- fmt.Errorf("Could not determine working directory: %s", err)
		return
	}

	absoluteDestinationFilename := workingDirectory + destinationFilename

	// Merge arguments
	arguments := []string{
		"-jar", workingDirectory + "/assetcompiler/third-party/closure-stylesheets-20111230/closure-stylesheets-20111230.jar",
		"--output-file", absoluteDestinationFilename,
	}

	for k, v := range sourceFilenames {
		sourceFilenames[k] = workingDirectory + "/app/webroot" + v
	}

	arguments = append(arguments, sourceFilenames...)
	arguments = append(arguments, compilerArguments...)

	command := exec.Command("java", arguments...)

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
	resultChan <- destinationFilename
}

// CompileJs executes Closure Compiler to merge and compile all JavaScript code
// into a single file. The file is written to the webroot directory, its
// filename is a Unix timestamp in base 62.
func CompileJs(sourceFilenames []string, destinationFilename string, jsCompilationLevel string, verbose bool, resultChan, progressChan chan<- string, errorChan chan<- error) {
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

	absoluteDestinationFilename := workingDirectory + destinationFilename

	arguments := []string{
		"-jar", workingDirectory + "/assetcompiler/third-party/closure-compiler-20130823/compiler.jar",
		"--compilation_level", jsCompilationLevel,
	}

	for k, v := range sourceFilenames {
		sourceFilenames[k] = workingDirectory + "/app/webroot" + v
	}

	arguments = append(arguments, sourceFilenames...)
	arguments = append(arguments, []string{
		"--js_output_file", absoluteDestinationFilename,
		"--language_in", "ECMASCRIPT5",
		// "--warning_level", "VERBOSE",
	}...)

	command := exec.Command("java", arguments...)

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
	resultChan <- destinationFilename
}
