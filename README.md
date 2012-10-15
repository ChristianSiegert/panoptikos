# Panoptikos

## Introduction

Panoptikos is an image viewer for Reddit. This repository contains a new, experimental, version I'm working on. You can play around with it at [experimental.panoptikos.com](http://experimental.panoptikos.com/).

The server-side code is written in Go, the client-side heavily relies on JavaScript. The JavaScript library of my choice is Google's Closure Library.

Once the biggest problems are fixed and the most requested features are added, this version will replace the current version of Panoptikos running at [panoptikos.com](http://panoptikos.com/).

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

The executable can be found in the working directory under the name "panoptikos".

## Running Panoptikos

Simply execute the compiled file:

	$ ./panoptikos

## Command-line arguments

Panoptikos supports these command-line arguments:

* **--js-compilation-level** Either `WHITESPACE_ONLY`, `SIMPLE_OPTIMIZATIONS` or `ADVANCED_OPTIMIZATIONS`. See [Closure Compiler Compilation Levels](https://developers.google.com/closure/compiler/docs/compilation_levels). Advanced optimizations can break your code. Only used in production mode. Default is `SIMPLE_OPTIMIZATIONS`.
* **--port** HTTP port the web server listens to. Default is `8080`.
* **--production** Whether the server should run in production mode. Default is `false`.
* **--verbose** Whether additional information should be displayed. Default is `false`.

## Examples

To start the web server in development mode with default settings:

	$ ./panoptikos

To start the web server in production mode and make it listen to port 80:

	$ ./panoptikos --production --port=80

To display Closure Compiler warnings even if your JavaScript code compiled successfully:

	$ ./panoptikos --production --verbose

To compile your JavaScript code with advanced optimizations:

	$ ./panoptikos --production --js-compilation-level=ADVANCED_OPTIMIZATIONS

## Development

This project uses [Closure Library](https://developers.google.com/closure/library/) as JavaScript library. Additionally, if the server is started in production mode, [Closure Compiler](https://developers.google.com/closure/compiler/) is used to compile all JavaScript code into a single JavaScript file.

### Generating the Closure Library dependency tree

In development mode, if you add or remove custom JavaScript classes, i.e. any non-goog class, you have to generate the dependency tree again. You can do this by changing to the Panoptikos project directory and executing Closure Library's Dependency Writer:

	$ cd ./panoptikos
	$ ./libraries/closure-library-20120710-r2029/closure/bin/build/depswriter.py \
		--output_file=./webroot/js/dependencies.js \
		--root_with_prefix="./webroot/js/ ../../"

This overwrites the existing dependencies.js file.
