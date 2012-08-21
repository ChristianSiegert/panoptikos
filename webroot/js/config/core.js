(function() {
	var exports = app.namespace("app.config.core");

	/**
	 * Dimensions in pixels.
	 * @var object
	 */
	exports.board = {
		columnMarginLeft: 10,
		columnMaxWidth: 328
	};

	exports.isProductionMode = true;

	/**
	 * @var object
	 */
	exports.network = {
		timeout: 30000 // in milliseconds
	}

	/**
	 * You can overwrite the default subreddits by uncommenting the lines below
	 * and adding subreddit names.
	 */
	// app.models.subreddit.setDefaultSubreddits([
	// 	"adviceanimals",
	// 	"aww"
	// ]);
})();
