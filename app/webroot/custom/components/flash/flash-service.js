(function() {
	function FlashManager() {
		this.ErrorMessages = [];
		this.InfoMessages = [];
		this.WarnMessages = [];
	}

	function Message(text, groupKey) {
		this.text = text || "";
		this.groupKey = groupKey || "";
	}

	FlashManager.prototype.AddErrorMessage = function(text, groupKey) {
		this.ErrorMessages.push(new Message(text, groupKey));
	};

	FlashManager.prototype.AddInfoMessage = function(text, groupKey) {
		this.InfoMessages.push(new Message(text, groupKey));
	};

	FlashManager.prototype.AddWarnMessage = function(text, groupKey) {
		this.WarnMessages.push(new Message(text, groupKey));
	};

	FlashManager.prototype.ClearErrorMessages = function(groupKey) {
		this.clear(this.ErrorMessages, groupKey);
	};

	FlashManager.prototype.ClearInfoMessages = function(groupKey) {
		this.clear(this.InfoMessages, groupKey);
	};

	FlashManager.prototype.ClearWarnMessages = function(groupKey) {
		this.clear(this.WarnMessages, groupKey);
	};

	FlashManager.prototype.ClearAll = function(groupKey) {
		this.ClearErrorMessages(groupKey);
		this.ClearInfoMessages(groupKey);
		this.ClearWarnMessages(groupKey);
	};

	FlashManager.prototype.clear = function(queue, groupKey) {
		if (!groupKey) {
			queue = [];
			return;
		}

		for (var i = 0, count = queue.length; i < count; i++) {
			if (queue[i].groupKey === groupKey) {
				queue.splice(i, 1);
				count--;
			}
		};
	};

	app.constant("Flash", new FlashManager());
})();
