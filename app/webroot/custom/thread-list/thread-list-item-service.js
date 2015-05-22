app.factory("ThreadListItem", function() {
	function ThreadListItem() {
		this.author = "";
		this.commentCount = 0;
		this.commentUrl = "";
		this.creationTime = 0;
		this.downvotes = 0;
		this.id = "";
		this.isNsfw = false;
		this.reportCount = 0;
		this.subredditId = "";
		this.subredditName = "";
		this.title = "";
		this.upvotes = 0;
		this.url = "";
	}

	ThreadListItem.fromRedditThreadListItem = function(redditThreadListItem) {
		if (!angular.isObject(redditThreadListItem) || !angular.isObject(redditThreadListItem.data)) {
			return false;
		}

		var redditThreadListItemData = redditThreadListItem.data;

		if (!angular.isString(redditThreadListItemData.author)
				|| !angular.isNumber(redditThreadListItemData.num_comments)
				|| redditThreadListItemData.num_comments === NaN
				|| !angular.isString(redditThreadListItemData.permalink)
				|| !angular.isNumber(redditThreadListItemData.created_utc)
				|| redditThreadListItemData.created_utc === NaN
				|| !angular.isNumber(redditThreadListItemData.downs)
				|| redditThreadListItemData.downs === NaN
				|| !angular.isString(redditThreadListItemData.id)
				|| (redditThreadListItemData.over_18 !== true && redditThreadListItemData.over_18 !== false)
				|| (!angular.isNumber(redditThreadListItemData.num_reports) && redditThreadListItemData.num_reports !== null)
				|| redditThreadListItemData.num_reports === NaN
				|| !angular.isString(redditThreadListItemData.subreddit_id)
				|| !angular.isString(redditThreadListItemData.subreddit)
				|| !angular.isString(redditThreadListItemData.title)
				|| !angular.isNumber(redditThreadListItemData.ups)
				|| redditThreadListItemData.ups === NaN
				|| !angular.isString(redditThreadListItemData.url)) {
			return false;
		}

		var threadListItem = new ThreadListItem();
		threadListItem.author = redditThreadListItemData.author;
		threadListItem.commentCount = redditThreadListItemData.num_comments;
		threadListItem.commentUrl = redditThreadListItemData.permalink;
		threadListItem.creationTime = redditThreadListItemData.created_utc;
		threadListItem.downvotes = redditThreadListItemData.downs;
		threadListItem.id = redditThreadListItemData.id;
		threadListItem.isNsfw = redditThreadListItemData.over_18;
		threadListItem.reportCount = redditThreadListItemData.num_reports || 0;
		threadListItem.subredditId = redditThreadListItemData.subreddit_id;
		threadListItem.subredditName = redditThreadListItemData.subreddit;
		threadListItem.title = redditThreadListItemData.title;
		threadListItem.upvotes = redditThreadListItemData.ups;
		threadListItem.url = redditThreadListItemData.url;

		return threadListItem;
	};

	return ThreadListItem;
});
