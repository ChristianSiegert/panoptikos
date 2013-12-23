app.factory("Board", ["$log", "BoardEventTypes", function($log, BoardEventTypes) {
	function Board(boardSelector, columnSelector) {
		this.items = [];
		this.listeners = {};
		this.newlyAddedItems = [];
	}

	Board.New = function() {
		return new Board();
	}

	Board.prototype.addItems = function(boardItems) {
		this.items = this.items.concat(boardItems);
		this.newlyAddedItems = this.newlyAddedItems.concat(boardItems);
		this.fireEvent(BoardEventTypes.DID_ADD_ITEMS);
	};

	Board.prototype.getNewlyAddedItems = function() {
		return this.newlyAddedItems.splice(0, this.newlyAddedItems.length);
	};

	Board.prototype.addEventListener = function(eventType, callback) {
		if (!BoardEventTypes.isEventType(eventType) || !angular.isFunction(callback)) {
			return;
		}

		if (!this.listeners[eventType]) {
			this.listeners[eventType] = [];
		}

		this.listeners[eventType].push(callback);
	};

	Board.prototype.removeEventListener = function(eventType, callback) {
		if (!this.listeners[eventType] || !angular.isFunction(callback)) {
			return;
		}

		for (var i = 0, listenerCount = this.listeners[eventType].length; i < listenerCount; i++) {
			if (this.listeners[eventType][i] === callback) {
				this.listeners[eventType].splice(i, 1);
				return;
			}
		}
	};

	Board.prototype.fireEvent = function(eventType) {
		var listeners = this.listeners[eventType];

		if (!listeners) {
			return;
		}

		for (var i = 0, listenerCount = listeners.length; i < listenerCount; i++) {
			listeners[i]();
		}
	};

	return Board;
}]);
