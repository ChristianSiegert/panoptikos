app.factory("ThreadList", ["$log", "ThreadListItem", function($log, ThreadListItem) {
	function ThreadList() {
		this.items = [];
		this.lastThreadId = "";
	}

	ThreadList.fromRedditThreadList = function(redditThreadList) {
		if (!angular.isObject(redditThreadList)
				|| !angular.isObject(redditThreadList.data)
				|| !angular.isString(redditThreadList.data.after)
				|| !angular.isArray(redditThreadList.data.children)) {
			return false;
		}

		var threadList = new ThreadList();

		// Fill threadList.items
		var redditThreadListItems = redditThreadList.data.children;

		for (var i = 0, count = redditThreadListItems.length; i < count; i++) {
			var threadListItem = ThreadListItem.fromRedditThreadListItem(redditThreadListItems[i]);

			if (!threadListItem) {
				$log.warn("Services: ThreadList: Dropped threadListItem because of invalid data from Reddit:", redditThreadListItems[i]);
				continue;
			}

			threadList.items.push(threadListItem);
		}

		// Fill threadList.lastThreadId
		threadList.lastThreadId = redditThreadList.data.after;

		return threadList;
	};

	return ThreadList;
}]);
