(function() {
	"use strict";

	// Logger provides logging to the browser’s console, and submission of log
	// messages to a server for debugging purposes.
	function Logger(allowSubmissions, submissionUrl) {
		// allowSubmissions indicates whether log messages can be sent to a
		// server for debugging. If set to false, no submissions can be sent,
		// even if the debug, error, info and log methods are called with
		// submit=true.
		this.allowSubmissions = !!allowSubmissions;

		// submissionUrl is the URL to which log messages are sent as a POST
		// request.
		this.submissionUrl = submissionUrl || "";
	}

	Logger.prototype.debug = function(args, submit) {
		this.log(args, submit, Logger.LogTypeDebug);
	};

	Logger.prototype.error = function(args, submit) {
		this.log(args, submit, Logger.LogTypeError);
	};

	Logger.prototype.info = function(args, submit) {
		this.log(args, submit, Logger.LogTypeInfo);
	};

	Logger.prototype.warn = function(args, submit) {
		this.log(args, submit, Logger.LogTypeWarning);
	};

	Logger.prototype.log = function(args, submit, logType) {
		var console = window.console;
		if (console) {
			switch (logType) {
				case Logger.LogTypeDebug:
					console.debug.apply(console, args);
					break;
				case Logger.LogTypeError:
					console.error.apply(console, args);
					break;
				case Logger.LogTypeInfo:
					console.info.apply(console, args);
					break;
				case Logger.LogTypeWarning:
					console.warn.apply(console, args);
					break;
				default:
					console.log.apply(console, args);
			}
		}

		if (this.allowSubmissions && submit) {
			this.submit(logType, sprinkles.String.format(args));
		}
	};

	// submit sends a log message to a server.
	Logger.prototype.submit = function(logType, message) {
		var message = String(logType).toUpperCase() + ": " + message;

		var request = new XMLHttpRequest();
		request.onerror = function(event) {
			this.error("Logger: Sending %s message failed.", logType);
		}.bind(this);
		request.onload = function(event) {
			if (event.target.status !== 200) {
				request.onerror(event);
				return;
			}
		};
		request.open("POST", this.submissionUrl)
		request.send(message);
	};

	// Log types.
	Logger.LogTypeDebug   = "debug";
	Logger.LogTypeError   = "error";
	Logger.LogTypeInfo    = "info";
	Logger.LogTypeWarning = "warning";

	sprinkles.Logger = Logger;
})();
