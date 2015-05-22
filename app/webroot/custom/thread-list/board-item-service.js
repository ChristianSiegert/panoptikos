app.factory("BoardItem", function() {
	function BoardItem() {
		this.imageFullSizeUrl = "";
		this.imagePreviewUrl = "";
		this.threadListItem = null;
	}

	BoardItem.New = function(threadListItem, imagePreviewUrl, imageFullSizeUrl) {
		if (!threadListItem
				|| (imageFullSizeUrl && !angular.isString(imageFullSizeUrl))
				|| (imagePreviewUrl && !angular.isString(imagePreviewUrl))) {
			return null;
		}

		var boardItem = new BoardItem();
		boardItem.imageFullSizeUrl = imageFullSizeUrl || "";
		boardItem.imagePreviewUrl = imagePreviewUrl || "";
		boardItem.threadListItem = threadListItem || null;

		return boardItem;
	};

	return BoardItem;
});
