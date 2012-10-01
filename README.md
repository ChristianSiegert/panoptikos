# Panoptikos

## Introduction

Panoptikos is an image viewer for Reddit. This repo contains a new, experimental, version I'm working on. The server-side code is written in Go, the client-side heavily relies on JavaScript.

Once the biggest problems are fixed and the most requested features are added, this version will replace the current version of Panoptikos running at http://panoptikos.com/.

## What’s different?

* You can select any subreddits you want.
* You can save the URL to save your selection of subreddits.
* By default, you see content from Reddit's ”Hot” section instead of from the ”New” section. This protects us largely from trolls that post NSFL content.

## Known Issues

* High memory usage because images outside the visible screen area are not removed from the page. Possible browser crashes on 32-bit systems.
* Jerky scrolling because sometimes I can only use the original high-resolution images in previews.
* There is no endless scrolling, you must click "Load more" all the time.
* You can't switch between Reddit's "Hot", "New", "Controversial", "Top" sections. (Current default is "Hot".)

## Compiling Panoptikos

[Install the Go tools](http://golang.org/doc/install) if you haven't done so already. Then, clone the repository, change to the directory and build the executable:

	$ git clone https://github.com/ChristianSiegert/panoptikos.git
	$ cd ./panoptikos
	$ go build -o panoptikos

The executable can be found in the current directory under the name "panoptikos".

## Running Panoptikos

Simply execute the compiled file:

	$ ./panoptikos

## Command-line arguments

Panoptikos supports these command-line arguments:

* **--port** HTTP port the web server listens to. Default is "8080".

## Example

To start the web server and make it listen to port 80:

	$ ./panoptikos --port=80

## Development

This project builds on top of [Closure Library](https://developers.google.com/closure/library/).

### Generating the Closure Library dependency tree

If you add or remove custom classes, i.e. any non-goog class, you have to generate the dependency tree again. You can do this by changing to the Panoptikos project directory and executing Closure Library's Dependency Writer:
	$ cd ./panoptikos
	$ ./libraries/closure-library-20120710-r2029/closure/bin/build/depswriter.py \
		--output_file=./webroot/js/dependencies.js \
		--root_with_prefix="./webroot/js/ ../../"

This overwrites the existing dependencies.js file.

### Compiling JavaScript code for production

	$ cd ./panoptikos
	$ ./libraries/closure-library-20120710-r2029/closure/bin/build/closurebuilder.py \
		--compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" \
		--compiler_flags="--warning_level=VERBOSE" \
		--compiler_jar=/Users/christian/Downloads/compiler-latest/compiler.jar \
		--namespace="panoptikos.Panoptikos" \
		--output_mode=compiled \
		--root=. \
		> webroot/js/compiled.js

