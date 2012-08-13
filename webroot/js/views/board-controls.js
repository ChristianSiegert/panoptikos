(function() {
	var exports = app.namespace("app.views.boardControls");

	/**
	 * createInstance returns a new instance of class BoardControls.
	 * @returns object BoardControls
	 */
	exports.createInstance = function() {
		return new BoardControls();
	};

	/**
	 * Class BoardControls manages an anchor element that users click on to load
	 * more images.
	 */
	function BoardControls() {
		var self = this;

		/**
		 * @var HTMLElement
		 */
		var boardControls;

		/**
		 * @var string
		 */
		var loadMoreAnchorTextDefault1 = "Load images";
		var loadMoreAnchorTextDefault2 = "Load more";
		var loadMoreAnchorTextActive = "Loading images&hellip;"

		/**
		 * Flag that indicates if at least one image has been loaded.
		 * @var boolean
		 */
		var hasLoadedAnImage = false;

		self.create = function() {
			boardControls = new Element("a", {
				html: loadMoreAnchorTextDefault1,
				id: "board-controls"
			});

			window.addEvent("app.views.board.didCompleteRequest", handleBoardDidCompleteRequestEvent);

			boardControls.addEvent("click", handleClickEvent);
			return boardControls;
		};

		function handleClickEvent() {
			window.fireEvent("app.views.boardControls.userDidAskForImages");
		};

		function handleBoardDidCompleteRequestEvent(event) {
			if (!event
					|| typeof(event.runningRequestsCount) !== "number"
					|| isNaN(event.runningRequestsCount)) {
				return;
			}

			if (event.hasLoadedAnImage) {
				hasLoadedAnImage = true;
			}

			if (event.runningRequestsCount > 0) {
				boardControls.set("html", loadMoreAnchorTextActive);
				return;
			}

			if (hasLoadedAnImage) {
				boardControls.set("html", loadMoreAnchorTextDefault2);
				return;
			}

			boardControls.set("html", loadMoreAnchorTextDefault1);
		}
	}
})();
