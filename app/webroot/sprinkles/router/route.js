(function() {
	"use strict";

	// path is a string that can contain named parameters, e.g.
	// "/articles/detail/:id".
	function Route(path, handleFunc, specifity) {
		// handleFunc is executed when Route matches the request URL.
		this.handleFunc = handleFunc || function() {};

		// pattern is a RegExp pattern used to match the request URL.
		this.pattern = pathToPattern(path);

		this.specifity = specifity || 0;
	}

	function pathToPattern(path) {
		var regExpPieces = [];
		var pathPieces = path.split("/");

		for (var i = 0, count = pathPieces.length; i < count; i++) {
			var pathPiece = pathPieces[i];
			if (pathPiece[0] === ":") {
				regExpPieces.push("([^/]*)");
			} else {
				regExpPieces.push(pathPiece);
			}
		}

		var finalPath = "^" + regExpPieces.join("/") + "$";
		return new RegExp(finalPath);
	}


	sprinkles.provide("sprinkles.router.Route", Route);
})();
