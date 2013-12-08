app.factory("Board", ["$log", "$timeout", function($log, $timeout) {
	function Board(boardSelector, columnSelector) {
		// Board id and column class used in the template so we can select the
		// right DOM elements.
		this.boardSelector = boardSelector;
		this.columnSelector = columnSelector;

		this.boardElement = angular.element(this.boardSelector);
		this.columnElements = [];

		this.columns = [];
		this.items = [];
		this.itemWidth = 328;
	}

	Board.prototype.addItem = function(boardItem, delay, isResize, onCompleteCallback) {
		$timeout(angular.bind(this, function() {
			if (!isResize) {
				this.items.push(boardItem);
			}

			var index = this.getIndexOfShortestColumn();

			if (index === null) {
				$log.warn("Board service: Index of shortest column is null. Skipping adding of boardItem.");
				return;
			}

			this.columns[index].push(boardItem);

			if (angular.isFunction(onCompleteCallback)) {
				onCompleteCallback();
			}
		}), delay);
	};

	Board.prototype.getIndexOfShortestColumn = function() {
		var columnElementCount = this.columnElements.length;

		if (columnElementCount === 0) {
			return null;
		}

		if (columnElementCount === 1) {
			return 0;
		}

		var shortestColumnHeight = null;
		var shortestColumnIndex = null;

		for (var i = 0; i < columnElementCount; i++) {
			var columnHeight = this.columnElements[i].offsetHeight;

			if (shortestColumnIndex === null || columnHeight < shortestColumnHeight) {
				shortestColumnHeight = columnHeight;
				shortestColumnIndex = i;
			}
		}

		return shortestColumnIndex;
	}

	/**
	 * computeBoardColumnCount returns the number of columns that can be
	 * displayed on the board.
	 * @private
	 * @return {number}
	 */
	Board.prototype.getOptimalColumnCount = function() {
		if (!this.boardElement || !this.itemWidth) {
			$log.error("Board service: Missing board element or itemWidth.");
			return 0;
		}

		var boardWidth = this.boardElement.width();
		var marginBetweenColumns = 10;
		var optimalBoardColumnCount = 1 + Math.max(Math.floor((boardWidth - this.itemWidth) / (this.itemWidth + marginBetweenColumns)), 0);

		return optimalBoardColumnCount;
	}

	Board.prototype.rebuild = function(onCompleteCallback) {
		var optimalColumnCount = this.getOptimalColumnCount();

		if (optimalColumnCount === this.columns.length) {
			return;
		}

		// Delete columns
		this.columns = [];

		// Create new columns
		for (var i = 0; i < optimalColumnCount; i++) {
			this.columns.push([]);
		}

		// Trigger new cycle so the DOM elements are created and can be selected
		$timeout(angular.bind(this, function() {
			this.columnElements = angular.element(this.columnSelector);

			for (var i = 0, itemCount = this.items.length; i < itemCount; i++) {
				this.addItem(this.items[i], 0, true);
			}

			if (angular.isFunction(onCompleteCallback)) {
				onCompleteCallback();
			}
		}), 0);
	};

	return Board;
}]);
