(function() {
	var exports = app.namespace("app.views.boardControls");

	exports.createInstance = function() {
		return new BoardControls();
	};

	function BoardControls() {
		var self = this;

		self.create = function() {
			var element = new Element("div", {
				styles: {
					"background-color": "blue",
					height: 50,
					margin: "0 auto",
					width: 200
				}
			});

			element.addEvent("click", handleClickEvent);
			return element;
		};

		function handleClickEvent() {
			window.fireEvent("app.views.board.loadMoreImages");
		};
	}
})();
