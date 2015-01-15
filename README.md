# Panoptikos

Panoptikos is an image viewer for Reddit. You can see it in action at [panoptikos.com](http://www.panoptikos.com/).

The server-side code is written in Go, the client-side code in JavaScript with [AngularJS](http://angularjs.org/). Panoptikos is hosted on [Google App Engine](https://developers.google.com/appengine/).

## Table of Contents

* [Features](#features)
* [Known issues](#known-issues)
* [Installing Panoptikos](#installing-panoptikos)
* [Running Panoptikos locally](#running-panoptikos-locally)
* [Deploying Panoptikos to Google App Engine](#deploying-panoptikos-to-google-app-engine)
* [Updating Panoptikos on Google App Engine](#updating-panoptikos-on-google-app-engine)
* [Development](#development)
	* [Compiling JavaScript and stylesheet files](#compiling-javascript-and-stylesheet-files)

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

## Installing Panoptikos

[Install the Google App Engine SDK for Go](https://developers.google.com/appengine/downloads#Google_App_Engine_SDK_for_Go) if you haven’t done so already. Then:

	$ go get github.com/ChristianSiegert/panoptikos

This operation may take a while.

## Running Panoptikos locally

Start the App Engine development server and tell it to serve Panoptikos:

	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/app/
	$ goapp serve

Then, open your browser and go to `http://localhost:8080/`.

## Deploying Panoptikos to Google App Engine

1. Create a new application on [appengine.google.com](https://appengine.google.com/). As application id choose anything you like.
2. Change the application id in `$GOPATH/src/github.com/ChristianSiegert/panoptikos/app/app.yaml` to the one you just used when you created the application on Google App Engine.
3. Upload the app:

	```
	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/app/
	$ goapp deploy
	```

4. You can now access Panoptikos at `http://your_app_id.appspot.com`.

## Updating Panoptikos on Google App Engine

Simply run:

	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/app/
	$ goapp deploy

This replaces your already deployed version. If you want to keep your deployed version, change the version string in `app.yaml` to something else before you run the command.

## Development

This project uses [AngularJS](http://angularjs.org/) as JavaScript library. Once the port of Panoptikos from [Closure Library](https://developers.google.com/closure/library/) to AngularJS is complete, asset compression can be used again.

For now, before you update an already deployed version of Panoptikos, change the URLs of the CSS, Javascript and template files being loaded to avoid problems due to browser caching. Simply attach `?v=TIMESTAMP` to the URLs, where `TIMESTAMP` should be replaced by an unused timestamp string. You need to change URLs in:

* `$GOPATH/src/github.com/ChristianSiegert/panoptikos/app/webroot/dev-partials/index.html` and
* `$GOPATH/src/github.com/ChristianSiegert/panoptikos/app/webroot/dev-js/config.js`.

### Compiling JavaScript and stylesheet files

**(Doesn’t work yet. Still in development. Ignore instructions below.)**

This repository contains two programs, _app_ and _assetcompiler_. _app_ is the actual Panoptikos app, and _assetcompiler_ is responsible for compiling JavaScript and stylesheet files into a single file each.

To compile assets, we have to call two Java programs, namely [Closure Compiler](https://developers.google.com/closure/compiler/) for JavaScript files and [Closure Stylesheets](http://code.google.com/p/closure-stylesheets/) for CSS files. Since Java programs can’t be called in a Google App Engine Go sandbox, the asset compiler can’t be a part of the actual Google App Engine Panoptikos app and instead is a normal, standalone Go program.

The rules for compiling assets are:

* If Panoptikos runs in your development environment and you modify a CSS or JavaScript file, you don’t have to run the asset compiler. Simply refresh the page in your browser.

* If Panoptikos is being deployed to Google App Engine, you must run the asset compiler before deployment to create a single, new CSS and JavaScript file that contain the updated code:

	```
	$ cd $GOPATH/src/github.com/ChristianSiegert/panoptikos/
	$ /usr/local/go/bin/go run ./assetcompiler/main.go
	```

	You may have to adjust the path to the standard Go binary if you don’t develop on a Mac.

### History

I started developing Panoptikos in 2010. Back then it was written in PHP and served by an Apache webserver. I used [MooTools](http://mootools.net/) as JavaScript library and [CouchDB](https://couchdb.apache.org/) as database. When I introduced Panoptikos to Reddit, it was very well received. I kept working on it, added features, made it pretty. It grew steadily, both in terms of unique users per month and data stored on the server.

After about two years of steady growth I had to shut it off. I simply couldn’t pay for it anymore. What started on a single, entry-level Linode, grew to three medium Linodes and eventually moved to one massive server. Sadly, it could have been prevented.

The architecture of Panoptikos proved to be not scalable. In contrast to today, users could only browse through a very limited number of subreddits on the early Panoptikos. Instead of fetching content from Reddit with JavaScript everytime a user visited Panoptikos, users saw a copy and slightly older version of Reddit. A cron job ran every half hour, fetched the list of threads for the around 100 subreddits, downloaded the linked images, resized and saved them as preview images (thumbnails) and then displayed them.

### Goal

I started rewriting Panoptikos from scratch so I could:

* Use Google’s free hosting on Google App Engine
* Learn Go
* Learn AngularJS
