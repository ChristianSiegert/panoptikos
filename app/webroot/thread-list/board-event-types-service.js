app.factory("BoardEventTypes", function() {
	var BoardEventTypes = {
		DID_ADD_ITEMS: "DID_ADD_ITEMS"
	};

	BoardEventTypes.isEventType = function(eventType) {
		return !!BoardEventTypes[eventType];
	};

	return BoardEventTypes;
});
