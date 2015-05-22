(function() {
	"use strict";

	var Router = function(windowElement, onRequest) {
		this.onRequest = onRequest;
		this.routes = {};
		this.windowElement = windowElement;
		this.windowElement.addEventListener("click", this.onWindowClick.bind(this));
		this.windowElement.addEventListener("popstate", this.onHistoryPopState);
	};

	Router.prototype.addRoute = function(relativeUrl, handleFunc) {
		this.routes[relativeUrl] = handleFunc;
	};

	Router.prototype.onHistoryPopState = function(event) {
		// console.debug("onPopState", event);
	};

	Router.prototype.onWindowClick = function(event) {
		if (event.target.tagName === "A") {
			var element = event.target;
			if (element.hasAttribute("target") && element.getAttribute("target") !== "") {
				return;
			}

			var url = element.getAttribute("href");
			if (!url) {
				return;
			}

			window.history.pushState(null, "", url);

			// If route exists, call request event callback and execute route
			// handler.
			if (this.routes[url]) {
				if (this.onRequest) {
					this.onRequest();
				}

				this.routes[url]();
			}

			event.preventDefault();
			event.stopPropagation();
		}
	};

	Router.prototype.triggerRequest = function(relativeUrl) {
		if (this.routes[relativeUrl]) {
			if (this.onRequest) {
				this.onRequest();
			}

			this.routes[relativeUrl]();
		}
	};

	sprinkles.Router = Router;
})();
