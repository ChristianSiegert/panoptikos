(function() {
	"use strict";

	function ThreadListItem(apiItem) {
		this.commentCount = 0;
		this.commentUrl = "";
		this.id = "";
		this.imageFullSizeUrl = "";
		this.imagePreviewUrl = "";
		this.subredditId = "";
		this.subredditName = "";
		this.title = "";
		this.url = "";

		if (apiItem && apiItem.kind === "t3" && apiItem.data) {
			this.commentCount = apiItem.data.num_comments;
			this.commentUrl = apiItem.data.permalink;
			this.id = apiItem.data.id;
			this.subredditId = apiItem.data.subreddit_id;
			this.subredditName = apiItem.data.subreddit;
			this.title = apiItem.data.title;
			this.url = apiItem.data.url;
		}
	}

	ThreadListItem.prototype.toElement = function() {
		var openExternalLinksInNewTab = custom.settings.Settings.getOpenExternalLinksInNewTab();

		var listElement = document.createElement("li");
		listElement.className = "board-item";

		if (this.imagePreviewUrl) {
			var imageAnchorElement = document.createElement("a");
			imageAnchorElement.href = this.url;
			imageAnchorElement.className = "board-item-image-anchor";
			if (openExternalLinksInNewTab) {
				imageAnchorElement.target = "_blank";
			}
			listElement.appendChild(imageAnchorElement);

			var imageElement = document.createElement("img");
			imageElement.className = "board-item-image";
			imageElement.src = this.imagePreviewUrl;
			imageAnchorElement.appendChild(imageElement);
		}

		var titleAnchorElement = document.createElement("a");
		titleAnchorElement.className = "board-item-title-anchor";
		titleAnchorElement.href = this.url;
		titleAnchorElement.textContent = this.title;
		if (openExternalLinksInNewTab) {
			titleAnchorElement.target = "_blank";
		}
		listElement.appendChild(titleAnchorElement);

		var infoElement = document.createElement("div");
		infoElement.className = "board-item-info";
		listElement.appendChild(infoElement);

		var commentsAnchorElement = document.createElement("a");
		commentsAnchorElement.className = "board-item-info-cell board-item-comments-anchor";
		commentsAnchorElement.href = "http://www.reddit.com" + this.commentUrl;
		commentsAnchorElement.textContent = this.commentCount === 1 ? "1 Comment" : this.commentCount + " Comments";
		if (openExternalLinksInNewTab) {
			commentsAnchorElement.target = "_blank";
		}
		infoElement.appendChild(commentsAnchorElement);

		// if (this.isMultiReddit) {
			var subredditAnchorElement = document.createElement("a");
			subredditAnchorElement.className = "board-item-info-cell board-item-info-cell-right board-item-subreddit-anchor";
			subredditAnchorElement.href = "/r/" + this.subredditName;
			subredditAnchorElement.textContent = "/r/" + this.subredditName;
			infoElement.appendChild(subredditAnchorElement);
		// }

		return listElement
	};

	sprinkles.namespace("custom.reddit.ThreadListItem", ThreadListItem);
})();
