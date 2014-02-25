// This program must be executed with the standard Go tools (not with the App
// Engine SDK Go tools) because it depends on Java programs.
package main

import (
	"flag"
	"fmt"
	"github.com/ChristianSiegert/panoptikos/assetcompiler/asset"
	"github.com/ChristianSiegert/panoptikos/assetcompiler/base"
	"github.com/ChristianSiegert/panoptikos/assetcompiler/sanitizer"
	"io/ioutil"
	"log"
	"regexp"
	"strings"
	"time"
)

// Command-line flags
var (
	jsCompilationLevel = flag.String("js-compilation-level", asset.JS_COMPILATION_LEVEL_SIMPLE_OPTIMIZATIONS, "Either WHITESPACE_ONLY, SIMPLE_OPTIMIZATIONS or ADVANCED_OPTIMIZATIONS. See https://developers.google.com/closure/compiler/docs/compilation_levels. Advanced optimizations can break your code.")
	verbose            = flag.Bool("verbose", false, "Whether additional information should be displayed after compiling.")
)

var (
	appYamlRegExp1 = regexp.MustCompile("(static_files: webroot/compiled-partials/index)(?:-[a-zA-Z0-9]+)?(.html)")
	appYamlRegExp2 = regexp.MustCompile("(upload: webroot/compiled-partials/index)(?:-[a-zA-Z0-9]+)?(\\\\.html)")
)

var cssCompilerArguments = []string{
	// Ignore non-standard CSS functions and unrecognized CSS properties that
	// we use or else Closure Stylesheets won’t compile our CSS.
	"--allowed-non-standard-function", "color-stop",
	"--allowed-non-standard-function", "progid:DXImageTransform.Microsoft.gradient",
	"--allowed-unrecognized-property", "-webkit-flex",
	"--allowed-unrecognized-property", "flex",
}

func main() {
	// token is a Unix timestamp in base 62
	token, err := base.Convert(uint64(time.Now().Unix()), base.DefaultCharacters)

	if err != nil {
		log.Printf("Failed to create token: %s", err)
		return
	}

	// Read index.html
	sourceFilename := "./app/webroot/dev-partials/index.html"
	indexHtml, err := ioutil.ReadFile(sourceFilename)

	if err != nil {
		log.Printf("Failed to read file '%s'.", sourceFilename)
		return
	}

	// CSS
	stylesheetRegExp := regexp.MustCompile("<link href=\"([^\"]+)\" rel=\"stylesheet\">")
	matches := stylesheetRegExp.FindAllStringSubmatch(string(indexHtml), -1)

	cssFilenames := make([]string, 0, len(matches))

	for _, match := range matches {
		url := match[1]

		// If URL begins with “http://”, “https://” or “//”, skip it.
		if found, err := regexp.MatchString("^(https?:)?//", url); found {
			continue
		} else if err != nil {
			log.Printf("Failed while searching CSS links: %s", err)
		}

		cssFilenames = append(cssFilenames, url)
		indexHtml = []byte(strings.Replace(string(indexHtml), match[0], "", 1))
	}

	// JavaScript
	jsRegExp := regexp.MustCompile("<script src=\"([^\"]+)\"></script>")
	matches = jsRegExp.FindAllStringSubmatch(string(indexHtml), -1)

	jsFilenames := make([]string, 0, len(matches))

	for _, match := range matches {
		url := match[1]

		// If URL begins with “http://”, “https://” or “//”, skip it.
		if found, err := regexp.MatchString("^(https?:)?//", url); found {
			continue
		} else if err != nil {
			log.Printf("Failed while searching JS links: %s", err)
		}

		if url == "/dev-js/config.js" {
			templateUrlRegExp := regexp.MustCompile(`templateUrl: "([^"]+)"`)
			configFilename := "./app/webroot" + url
			configFileContent, err := ioutil.ReadFile(configFilename)

			if err != nil {
				log.Printf("assetcompiler: Couldn’t read file '%s': %s", configFilename, err)
				return
			}

			matches := templateUrlRegExp.FindAllStringSubmatch(string(configFileContent), -1)

			if len(matches) == 0 {
				continue
			}

			for _, match := range matches {
				templateUrl := match[1]
				templateFilename := "./app/webroot" + templateUrl
				templateFileContent, err := ioutil.ReadFile(templateFilename)

				if err != nil {
					log.Printf("assetcompiler: Couldn’t read file '%s': %s", templateFilename, err)
					return
				}

				templateFileContent = sanitizer.RemoveHtmlComments(templateFileContent)
				templateFileContent = sanitizer.RemoveHtmlWhitespace(templateFileContent)
				templateFileContent = []byte(strings.Replace(string(templateFileContent), `'`, `\'`, -1))
				configFileContent = []byte(strings.Replace(string(configFileContent), match[0], fmt.Sprintf(`template: '%s'`, string(templateFileContent)), 1))

			}

			configDestinationFilename := "./app/webroot/compiled-js/temp-config-" + token + ".js"

			if err := ioutil.WriteFile(configDestinationFilename, configFileContent, 0666); err != nil {
				log.Printf("assetcompiler: Couldn’t write file '%s': %s", configDestinationFilename, err)
				return
			}

			url = "/compiled-js/temp-config-" + token + ".js"
		}

		jsFilenames = append(jsFilenames, url)
		indexHtml = []byte(strings.Replace(string(indexHtml), match[0], "", 1))
	}

	// Compile
	cssDestinationBaseName, jsDestinationBaseName, err := compileCssJs(token, cssFilenames, jsFilenames)

	if err != nil {
		log.Printf("assetcompiler: Compiling CSS/JS failed: %s", err)
		return
	}

	// cssLink := fmt.Sprintf("<link href=\"%s\" rel=\"stylesheet\" type=\"text/css\">", cssDestinationBaseName)
	// jsLink := fmt.Sprintf("<script src=\"%s\"></script>", jsDestinationBaseName)

	cssFileName := "./app/webroot/compiled-css/" + cssDestinationBaseName
	cssContent, err := ioutil.ReadFile(cssFileName)

	if err != nil {
		log.Printf("assetcompiler: Reading compiled CSS file failed: %s", err)
		return
	}

	jsFileName := "./app/webroot/compiled-js/" + jsDestinationBaseName
	jsContent, err := ioutil.ReadFile(jsFileName)

	if err != nil {
		log.Printf("assetcompiler: Reading compiled JS file failed: %s", err)
		return
	}

	cssLink := fmt.Sprintf(`<style>%s</style>`, cssContent)
	jsLink := fmt.Sprintf(`<script>%s</script>`, jsContent)

	indexHtml = []byte(strings.Replace(string(indexHtml), "<!-- COMPILED_CSS_HERE -->", cssLink, 1))
	indexHtml = []byte(strings.Replace(string(indexHtml), "<!-- COMPILED_JS_HERE -->", jsLink, 1))
	indexHtml = sanitizer.RemoveHtmlComments(indexHtml)
	indexHtml = sanitizer.RemoveHtmlWhitespace(indexHtml)

	destinationFilename := "./app/webroot/compiled-partials/index-" + token + ".html"
	ioutil.WriteFile(destinationFilename, indexHtml, 0666)

	if err := updateAppYaml("./app/app.yaml", token); err != nil {
		log.Printf("main: Updating app.yaml failed: %s", err)
	}
}

func updateAppYaml(fileName, token string) error {
	fileContent, err := ioutil.ReadFile(fileName)

	if err != nil {
		return err
	}

	fileContent = appYamlRegExp1.ReplaceAll(fileContent, []byte("$1-"+token+"$2"))
	fileContent = appYamlRegExp2.ReplaceAll(fileContent, []byte("$1-"+token+"$2"))

	if err := ioutil.WriteFile(fileName, fileContent, 0640); err != nil {
		return err
	}

	return nil
}

// compileCssJs compiles CSS and/or JavaScript. Progress and error messages are
// logged.
func compileCssJs(uniqueKey string, cssSourceFilenames, jsSourceFilenames []string) (cssDestinationBaseName, jsDestinationBaseName string, err error) {
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

	cssDestinationBaseName = uniqueKey + ".css"
	jsDestinationBaseName = uniqueKey + ".js"

	cssDestinationFilename := "/app/webroot/compiled-css/" + cssDestinationBaseName
	jsDestinationFilename := "/app/webroot/compiled-js/" + jsDestinationBaseName

	go asset.CompileCss(cssSourceFilenames, cssDestinationFilename, cssCompilerArguments, cssResultChan, cssProgressChan, cssErrorChan)
	go asset.CompileJs(jsSourceFilenames, jsDestinationFilename, *jsCompilationLevel, *verbose, jsResultChan, jsProgressChan, jsErrorChan)

	for isCompilingCss, isCompilingJs := true, true; isCompilingCss || isCompilingJs; {
		select {
		case _ = <-cssResultChan:
			isCompilingCss = false
		case _ = <-jsResultChan:
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

	return cssDestinationBaseName, jsDestinationBaseName, nil
}
