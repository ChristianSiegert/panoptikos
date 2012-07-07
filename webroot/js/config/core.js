(function() {
	var exports = app.namespace("app.config.core");

	exports.board = {
		columnLeftMargin: 10,
		columnWidth: 328
	};

	/**
	 * @returns array Array with subreddit names that are chosen by default
	 */
	exports.getNamesOfDefaultSubreddits = function() {
		return [
			"1000words",
			"aviation",
			"aww",
			"birdpics",
			"cityporn",
			"earthporn",
			"itookapicture",
			"picturechallenge",
			"wallpaper",
			"wallpapers",
			"windowshots"
		];
	};

	exports.network = {
		timeout: 30000 // in milliseconds
	}
})();
