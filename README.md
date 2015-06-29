# Panoptikos

Panoptikos is an image viewer for Reddit. You can see it in action at [panoptikos.com](http://www.panoptikos.com/).

The server-side code is written in Go, the client-side code in plain JavaScript. Panoptikos is hosted on [Google App Engine](https://developers.google.com/appengine/).

## Features

* **Preview images.** No need to open dozens of tabs to see what’s behind all those links.
* **Infinite scrolling.**
* **Sharp images.** Preview images look gorgeous on high-density screens.
* **No duplicate content.** On Reddit you’ll often see the same content on the next page again. Doesn’t happen here!
* **Supports all screensizes.** Works on mobile phones equally as well as on widescreens.
* **Supports all common platforms and browsers.** It’s a web-app. There’s nothing to install, not even a browser extension.

## Known issues

* High memory usage on clients because images outside the visible screen area are not removed from the page. Possible browser crashes if browser runs out of memory.
* Jerky scrolling because sometimes only high-resolution images can be used as preview images.

## Development

If you want to work on Panoptikos or use it as a basis for your project, follow the steps below.

### Installing Panoptikos

[Install the Google App Engine SDK for Go](https://developers.google.com/appengine/downloads#Google_App_Engine_SDK_for_Go) if you haven’t done so already. Then:

	$ go get github.com/ChristianSiegert/panoptikos

Switch to the git branch `vanilla-js`:

	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/
	$ git checkout vanilla-js

### Running Panoptikos locally

Start the App Engine development server and tell it to serve Panoptikos:

	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/app/
	$ goapp serve

Then, open your browser and go to `http://localhost:8080/`.

### Deploying Panoptikos to Google App Engine

1. Create a new application on [appengine.google.com](https://appengine.google.com/). As application id choose anything you like.
2. Change the application id in `$GOPATH/src/github.com/ChristianSiegert/panoptikos/app/app.yaml` to the one you just used when you created the application on Google App Engine.
3. Upload the app:

	```
	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/app/
	$ goapp deploy
	```

4. You can now access Panoptikos at `http://your_app_id.appspot.com`.

### Updating Panoptikos on Google App Engine

Simply run:

	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/app/
	$ goapp deploy

This replaces your already deployed version. If you want to keep your deployed version, change the version string in `app.yaml` to something else before you run the command.

### Switching between development and production mode

**_Ignore this chapter. Enabling production mode for Panoptikos does not work yet in this branch._**

By default, the app is in production mode. That means a single file that contains all templates, Javascript and CSS was generated and is served. Any changes to the source code will have no effect unless you generate a new single production file. Generated production files are stored in `app/webroot/compiled-index/`.

To make development easier, you can enable development mode. If development mode is enabled, the server serves template, Javascript and CSS files from their development directories. Any changes to the source code will be reflected immediately on page refresh. Open `app.yaml` and uncomment the marked blocks to enable development mode.

### Generating a new production file

**_Ignore the instructions below. Generating a production file does not work yet in this branch._**

To generate a new production file that contains all templates, Javascript and CSS:

	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/
	$ /usr/local/go/bin/go run ./assetcompiler/main.go

You may have to adjust the path to the standard Go binary if you don’t develop on a Mac.

This repository contains two programs, _app_ and _assetcompiler_. _app_ is the actual Panoptikos app, and _assetcompiler_ is responsible for compiling template, JavaScript and stylesheet files into a single file.

assetcompiler calls two Java programs, namely [Closure Compiler](https://developers.google.com/closure/compiler/) to compile JavaScript files and [Closure Stylesheets](http://code.google.com/p/closure-stylesheets/) to compile CSS files. Since Java programs can’t be called in a Google App Engine Go sandbox, the asset compiler can’t be a part of the actual Google App Engine Panoptikos app and instead is a normal, standalone Go program.
