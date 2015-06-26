(function() {
	"use strict";

	// Logger provides logging to the browser’s console, and sending log
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

	Logger.prototype.log = function(args, submit, logType) {
		if (window.console) {
			switch (logType) {
				case Logger.LogTypeDebug:
					console.debug(args);
					break;
				case Logger.LogTypeError:
					console.error(args);
					break;
				case Logger.LogTypeInfo:
					console.info(args);
					break;
				default:
					console.log(args);
			}
		}

		if (this.allowSubmissions && submit) {
			this.submit(logType, sprinkles.String.format(args));
		}
	};

	// submit sends a log messages to a server.
	Logger.prototype.submit = function(logType, report) {
		var report = String(logType).toUpperCase() + ": " + String(report);

		var request = new XMLHttpRequest();
		request.onerror = this.error("Logger: Sending %s report failed.", logType);
		request.onload = function(event) {
			if (event.target.status !== 200) {
				request.onerror(event);
				return;
			}
		};
		request.open("POST", this.submissionUrl)
		request.send(report);
	};

	// Log types.
	Logger.LogTypeDebug = "debug";
	Logger.LogTypeError = "error";
	Logger.LogTypeInfo  = "info";

	sprinkles.Logger = Logger;
})();
