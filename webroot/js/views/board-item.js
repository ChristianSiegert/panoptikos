(function() {
	var exports = app.namespace("app.views.boardItem");

	/**
	 * createInstance returns a new instance of class BoardItem.
	 * @returns object BoardItem
	 */
	exports.createInstance = function() {
		return new BoardItem();
	};

	/**
	 * Class BoardItem manages an image and related anchor elements.
	 */
	function BoardItem() {
		var self = this;

		/**
		 * create returns an HTML element that contains other markup that all
		 * together creates a board item, e.g. an image and anchor elements.
		 * @param object thread Object representing a Reddit thread
	 	 * @param object image HTML image
	 	 * @returns HTMLElement boardItem
	 	 */
		self.create = function(thread, image, fullsizeImageUrl) {
			var boardItem = new Element("div", {
				"class": "board-item"
			});

			var imageAnchor = createImageAnchor(image, fullsizeImageUrl);
			boardItem.grab(imageAnchor);

			var titleAnchor = createTitleAnchor(thread);
			boardItem.grab(titleAnchor);

			return boardItem;
		};

		function createImageAnchor(image, fullsizeImageUrl) {
			var imageAnchor = new Element("a", {
				"class": "board-item-image-anchor",
				href: fullsizeImageUrl ? fullsizeImageUrl : image.src
			});

			var image = createImage(image);
			imageAnchor.grab(image);

			return imageAnchor;
		}

		function createImage(image) {
			var image = new Element("img", {
				"class": "board-item-image",
				"data-original-src": image.src,
				src: image.src,
			});

			return image;
		}

		function createTitleAnchor(thread) {
			var titleAnchor = new Element("a", {
				"class": "board-item-title-anchor",
				href: "http://www.reddit.com" + thread.permalink,
				html: thread.title,
			});

			return titleAnchor;
		}
	};
})();
