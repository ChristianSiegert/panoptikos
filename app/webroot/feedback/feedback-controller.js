app.controller("FeedbackController", ["$http", "$scope", "Flash", function($http, $scope, Flash) {
	var groupKey = "feedback";

	$scope.$on("$destroy", function() {
		Flash.ClearAll(groupKey);
	});

	$scope.submit = function() {
		Flash.ClearAll(groupKey);

		var url = "/api/1/feedback";

		var data = {
			message: $scope.message,
			sender: $scope.sender,
		};

		$http
			.post(url, data)
			.error(handleError)
			.success(handleSuccess)
		;
	};

	function handleError() {
		Flash.AddErrorMessage("There was a problem sending your message. Please try again.", groupKey);
	}

	function handleSuccess() {
		$scope.message = "";
		$scope.sender = "";
		Flash.AddInfoMessage("Your message was sent sucessfully.", groupKey);
	}
}]);
