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
