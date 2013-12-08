app.factory("BoardItem", function() {
	function BoardItem(thread, imageUrl) {
		this.imageUrl = imageUrl || "";
		this.thread = thread || null;
	}

	return BoardItem;
});
