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
	 * Class BoardControls manages a button element that users click on to load
	 * more images.
	 *
	 * When we create the button, we give it the text "Loading...", even though
	 * no images are loading yet, to reduce the perceived page load time.
	 *
	 * When users click on the button, we immediately change the button text
	 * from "Load more" to "Loading...", even though no requests have been sent
	 * yet, to increase the perceived responsiveness.
	 */
	function BoardControls() {
		var self = this;

		/**
		 * @var HTMLElement
		 */
		var boardControls;
		var loadMoreButton;

		/**
		 * @var string
		 */
		var loadMoreButtonTextActive = "Loading images&hellip;";
		var loadMoreButtonTextDefault1 = "Load images";
		var loadMoreButtonTextDefault2 = "Load more";
		var loadMoreButtonTextDisabled = "You reached the end";

		/**
		 * Flag that indicates if at least one image has been loaded. Used to
		 * determine appropriate button text.
		 * @var boolean
		 */
		var hasLoadedAnImage = false;

		/**
		 * True if Reddit can't deliver any more threads, false otherwise.
		 * @var boolean
		 */
		var hasReachedEnd = false;

		self.create = function() {
			boardControls = new Element("div", {
				id: "board-controls"
			});

			loadMoreButton = createLoadMoreButton();
			boardControls.grab(loadMoreButton);

			window.addEvent("app.views.board.didCompleteRequest", updateLoadMoreButtonText);
			return boardControls;
		};

		function createLoadMoreButton() {
			var button = new Element("button", {
				html: loadMoreButtonTextActive
			});

			button.addEvent("click", handleLoadMoreButtonClickEvent);
			return button;
		}

		function handleLoadMoreButtonClickEvent() {
			if (hasReachedEnd) {
				return;
			}

			loadMoreButton.set("html", loadMoreButtonTextActive);
			window.fireEvent("app.views.boardControls.userDidAskForImages");
		};

		function updateLoadMoreButtonText(event) {
			if (!event || hasReachedEnd) {
				return;
			}

			if (event.hasReachedEnd) {
				hasReachedEnd = true;
				loadMoreButton.set("html", loadMoreButtonTextDisabled);
				return;
			}

			if (typeof(event.runningRequestsCount) !== "number" || isNaN(event.runningRequestsCount)) {
				return;
			}

			if (event.hasLoadedAnImage) {
				hasLoadedAnImage = true;
			}

			if (event.runningRequestsCount > 0) {
				loadMoreButton.set("html", loadMoreButtonTextActive);
				return;
			}

			if (hasLoadedAnImage) {
				loadMoreButton.set("html", loadMoreButtonTextDefault2);
				return;
			}

			loadMoreButton.set("html", loadMoreButtonTextDefault1);
		}
	}
})();
