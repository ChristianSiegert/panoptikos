(function() {
	var exports = app.namespace("app.ui");

	/**
	 * Class SubredditPicker manages the UI for adding and removing subreddits.
	 */
	exports.SubredditPicker = function() {
		var self = this;

		/**
		 * @var HTMLElement
		 */
		var element;
		var subredditList;

		/**
		 * Array of strings. Each string is the name of a subreddit that the
		 * user wants to see images from. Used to compare against new selection
		 * of subreddits. If there is a difference, the Board is rebuild.
		 * @var array
		 */
		var originallySelectedSubreddits;

		self.open = function() {
			if (element) {
				return;
			}

			app.models.subreddit.setSelectedSubreddits(app.models.subreddit.getSelectedSubreddits());
			originallySelectedSubreddits = app.models.subreddit.getSelectedSubreddits();

			element = createElement();
			$(document.body).grab(element);

			window.addEvent("resize", handleWindowResizeEvent);
		};

		self.close = function() {
			if (!element) {
				return;
			}

			window.removeEvent("resize", handleWindowResizeEvent);

			// Add CSS class "fade-out" to start the CSS animation
			element.addClass("fade-out");

			// Wait for the CSS animation to finish, then remove the element
			(function() {
				element.destroy();
				element = null;
				originallySelectedSubreddits = null;
			}).delay(300);
		};

		function createElement() {
			var backgroundElement = createBackgroundElement();

			var element = new Element("div", {
				id: "subreddit-picker",
				styles: {
					top: window.getScroll().y + 10
				}
			});
			backgroundElement.grab(element);

			var textField = createTextField();
			element.grab(textField);

			subredditList = createSubredditList();
			element.grab(subredditList);

			return backgroundElement;
		};

		function createBackgroundElement() {
			var scrollSize = window.getScrollSize();

			var backgroundElement = new Element("div", {
				id: "subreddit-picker-background",
				styles: {
					height: scrollSize.y,
					width: scrollSize.x
				}
			});

			backgroundElement.addEvent("click", handleBackgroundElementClickEvent);
			return backgroundElement;
		}

		function handleBackgroundElementClickEvent(event) {
			if (event.target.getProperty("id") !== "subreddit-picker-background") {
				return;
			}

			self.close();

			if (!app.models.subreddit.selectedSubredditsHaveChanged(app.models.subreddit.getSelectedSubreddits(), originallySelectedSubreddits)) {
				return;
			}

			window.fireEvent("app.views.subredditPicker.userDidChangeSelectedSubreddits");
		}

		function createSubredditList() {
			var list = new Element("ul", {
				id: "subreddit-picker-subreddit-list"
			});

			var subredditNames = app.models.subreddit.getSelectedSubreddits();

			for (var i = 0, subredditNameCount = subredditNames.length; i < subredditNameCount; i++) {
				var listItem = createSubredditListItem(subredditNames[i]);
				list.grab(listItem);
			}

			list.addEvent("click:relay(button)", handleSubredditListButtonClickEvent);
			return list;
		}

		function handleSubredditListButtonClickEvent(event) {
			var subredditName = event.target.getProperty("data-subreddit-name");

			if (!subredditName) {
				return;
			}

			if (event.target.hasClass("subreddit-picker-subreddit-add-button")) {
				event.target.removeClass("subreddit-picker-subreddit-add-button");
				event.target.addClass("subreddit-picker-subreddit-remove-button");
				app.models.subreddit.addToSelectedSubreddits(subredditName);
				return;
			}

			if (event.target.hasClass("subreddit-picker-subreddit-remove-button")) {
				event.target.removeClass("subreddit-picker-subreddit-remove-button");
				event.target.addClass("subreddit-picker-subreddit-add-button");
				app.models.subreddit.removeFromSelectedSubreddits(subredditName);
				return;
			}
		}

		function createSubredditListItem(subredditName) {
			var listItem = new Element("li", {
				"class": "subreddit-picker-subreddit-list-item"
			});

			var button = new Element("button", {
				"class": "subreddit-picker-subreddit-remove-button",
				"data-subreddit-name": subredditName,
				html: subredditName
			});
			listItem.grab(button);

			return listItem;
		}

		function handleWindowResizeEvent() {
			if (!element) {
				return;
			}

			element.setStyles({
				height: window.getScrollSize().y,
				width: window.getSize().x
			});
		}

		function createTextField() {
			var textField = new Element("input", {
				id: "subreddit-picker-text-field",
				placeholder: "Enter subreddit and press return",
				type: "text"
			});

			textField.addEvent("keydown", handleTextFieldKeyDownEvent);
			return textField;
		}

		function handleTextFieldKeyDownEvent(event) {
			if (event.key !== "enter") {
				return;
			}

			var subredditListItem = createSubredditListItem(event.target.value);
			subredditList.grab(subredditListItem);

			app.models.subreddit.addToSelectedSubreddits(event.target.value);
			event.target.value = "";
		}
	};
})();
