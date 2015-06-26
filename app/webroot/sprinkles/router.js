(function() {
	"use strict";

	var Router = function() {
		this.regExpRelativeUrl = /^\/[^\/]?/;

		// dispatchedFirstRequest indicates whether the Router dispatched its
		// first request. It is used to prevent Safari from triggering the
		// popstate event on page load.
		this.dispatchedFirstRequest = false;

		this.routes = {};

		// onRouteChange is called when the route changes.
		this.onRouteChange = function() {};

		window.addEventListener("click", this.onWindowClick.bind(this));
		window.addEventListener("popstate", this.onHistoryPopState.bind(this));
	};

	// dispatchRequest dispatches an internal request to load the page specified
	// by relativeUrl. If no route is registered to handle relativeUrl, nothing
	// will happen.
	Router.prototype.dispatchRequest = function(relativeUrl) {
		for (var route in this.routes) {
			if (!this.routes.hasOwnProperty(route)) {
				continue;
			}

			var finalRoute = "^" + route + "$";
			var routeRegExp = new RegExp(finalRoute);
			var match = routeRegExp.exec(relativeUrl);

			if (match === null) {
				continue;
			}

			if (typeof(this.onRouteChange) === "function") {
				this.onRouteChange();
			}

			var params = [];

			if (match.length > 1) {
				params = match.slice(1);
			}

			this.routes[route](params);
			return;
		}

		this.dispatchedFirstRequest = true;
	};

	Router.prototype.onHistoryPopState = function(event) {
		// Prevent Safari from triggering popstate event on page load
		if (!this.dispatchedFirstRequest) {
			return;
		}

		this.dispatchRequest(location.pathname);
	};

	// onWindowClick triggers a new page request if the user clicked on a link
	// with a relative URL, e.g. “/settings”. If the link’s “target” attribute
	// is set to a non-empty string, no “href” attribute exists or the URL is
	// absolute, Router lets the browser handle the click.
	Router.prototype.onWindowClick = function(event) {
		if (event.target.tagName === "A") {
			var element = event.target;

			// If link opens in new tab or window
			if (element.hasAttribute("target") && element.getAttribute("target") !== "") {
				return;
			}

			// If link doesn’t have a URL
			var url = element.getAttribute("href");
			if (!url) {
				return;
			}

			// If URL is not relative
			if (!this.regExpRelativeUrl.test(url)) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			this.dispatchRequest(url);
			window.history.pushState(null, "", url);
		}
	};

	// registerRoute registers a route and its handleFunc.
	Router.prototype.registerRoute = function(route, handleFunc) {
		this.routes[route] = handleFunc;
	};

	sprinkles.Router = Router;
})();
