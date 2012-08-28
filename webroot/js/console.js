goog.provide("app.console");

/**
 * log wraps the browser's console.log. The only difference is that log will not
 * log anything if the app is in production mode.
 */
app.console.log = function() {
	if (app.config.core.isProductionMode) {
		return;
	}

	console.log.apply(console, arguments);
}
