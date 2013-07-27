# Panoptikos

Panoptikos is an image viewer for Reddit. You can see it in action at [panoptikos.com](http://www.panoptikos.com/).

The server-side code is written in Go, the client-side heavily relies on JavaScript. The JavaScript library used is [Closure Library](https://developers.google.com/closure/library/). Panoptikos is hosted on [Google App Engine](https://developers.google.com/appengine/).

## Features

* You can select any subreddits you want.
* You can save the URL to save your selection of subreddits.
* By default, you see content from Reddit's ”Hot” section instead of from the ”New” section. This protects us largely from trolls that post NSFL content.

## Known Issues

* High memory usage on clients because images outside the visible screen area are not removed from the page. Possible browser crashes if browser runs out of memory.
* Jerky scrolling because sometimes only high-resolution images can be used in previews.
* You can't switch between Reddit's "Hot", "New", "Controversial", "Top" sections. (Current default is "Hot".)

## Installing Panoptikos

[Install the Google App Engine SDK for Go](https://developers.google.com/appengine/downloads#Google_App_Engine_SDK_for_Go) if you haven't done so already. Then:

	$ go get github.com/ChristianSiegert/panoptikos

This operation may take a while.

## Running Panoptikos locally

Start the App Engine development server and tell it to serve Panoptikos:

	$ /path/to/google_appengine/dev_appserver.py $GOPATH/src/github.com/ChristianSiegert/panoptikos/app

Then, open your browser and go to `http://localhost:8080/`.

## Deploying Panoptikos to Google App Engine

1. Create a new application on [appengine.google.com](https://appengine.google.com/).
2. Change the application id in `$GOPATH/src/github.com/ChristianSiegert/panoptikos/app/app.yaml` to the one you just used when you created the new application.
3. Upload the app:

	```
	$ /path/to/google_appengine/appcfg.py update $GOPATH/src/github.com/ChristianSiegert/panoptikos/app
	```

4. You can now access Panoptikos at `http://your_app_id.appspot.com`.

## Updating Panoptikos on Google App Engine

Simply run:

	$ /path/to/google_appengine/appcfg.py update $GOPATH/src/github.com/ChristianSiegert/panoptikos/app

This replaces your already deployed version. If you want to keep your deployed version, change the version string in `app.yaml` before you run the command.

## Development

This project uses [Closure Library](https://developers.google.com/closure/library/) as JavaScript library. Stylesheets are compiled into a single file with [Closure Stylesheets](http://code.google.com/p/closure-stylesheets/). JavaScript is compiled into a single file with [Closure Compiler](https://developers.google.com/closure/compiler/).

### Generating the Closure Library dependency tree

If you add or remove custom JavaScript classes, i.e. any non-goog class, you have to generate the Closure Library dependency tree again. You can do this by changing to the Panoptikos project directory and executing Closure Library's Dependency Writer:

	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/app
	$ ./libraries/closure-library-20120710-r2029/closure/bin/build/depswriter.py \
		--output_file=./webroot/dev-js/dependencies.js \
		--root_with_prefix="./webroot/dev-js/ ../../"

This overwrites the existing `$GOPATH/src/github.com/ChristianSiegert/panoptikos/app/webroot/dev-js/dependencies.js` file.

### Compiling JavaScript and stylesheet files

This repository contains two programs, _app_ and _assetcompiler_. _app_ is the actual Panoptikos app, and _assetcompiler_ is responsible for compiling JavaScript and stylesheet files into a single file each.

In general, to compile assets, we have to call Java programs, namely Closure Stylesheets and Closure Compiler. Since Java programs can't be called in a Google App Engine Go sandbox, the asset compiler can't be a part of the actual Google App Engine Panoptikos app and had to be moved to a normal, standalone Go program.

The rules are for compiling assets are:

* If you modify a CSS or JavaScript file, you don't have to run the asset compiler as long as you test the code in your development environment.

* If you deploy the app to Google App Engine, you must run the asset compiler before deployment to create a single, new CSS or JavaScript file that contains the updated code:

	```
	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos
	$ /usr/local/go/bin/go run assetcompiler/main.go -compile-css=true
	```

	```
	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos
	$ /usr/local/go/bin/go run assetcompiler/main.go -compile-js=true
	```

You may have to adjust the path to the standard Go binary if you don't develop on a Mac.
