(function() {
	"use strict";

	var template = new sprinkles.Template("/settings/settings.html");
	var Config = custom.main.Config;
	var Settings = custom.settings.Settings;

	function SettingsController(router) {
		this.router = router;
		this.settingsListElement = null;
		this.checkboxOnlyShowPostsWithImages = null;
		this.checkboxOpenExternalLinksInNewTab = null;
		this.checkboxShowInfo = null;
		this.checkboxShowPostTitles = null;
	};

	SettingsController.prototype.init = function() {
		// If it is the user’s first visit, make the default settings the user’s
		// settings.
		if (Settings.get("version") === null) {
			Settings.set("version", "2015-07-02");
			Settings.setOnlyShowPostsWithImages(Config.threadList.onlyShowPostsWithImages);
			Settings.setOpenExternalLinksInNewTab(Config.threadList.openExternalLinksInNewTab);
			Settings.setShowInfo(Config.threadList.showInfo);
			Settings.setShowPostTitles(Config.threadList.showPostTitles);
		}

		this.router.registerRoute("/settings", this.loadPage.bind(this));
	};

	SettingsController.prototype.loadPage = function() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load(this.handleRequest.bind(this, page));
	};

	SettingsController.prototype.handleRequest = function(page) {
		this.settingsListElement = document.getElementById("settings-list");
		this.checkboxOnlyShowPostsWithImages = document.getElementById("setting-only-show-posts-with-images");
		this.checkboxOpenExternalLinksInNewTab = document.getElementById("setting-open-external-links-in-new-tab");
		this.checkboxShowInfo = document.getElementById("setting-show-info");
		this.checkboxShowPostTitles = document.getElementById("setting-show-post-titles");

		if (!this.settingsListElement
				|| !this.checkboxOnlyShowPostsWithImages
				|| !this.checkboxOpenExternalLinksInNewTab
				|| !this.checkboxShowInfo
				|| !this.checkboxShowPostTitles) {
			app.logger.error("SettingsController: A required element is missing.");
			return;
		}

		this.checkboxOnlyShowPostsWithImages.checked = Settings.getOnlyShowPostsWithImages();
		this.checkboxOpenExternalLinksInNewTab.checked = Settings.getOpenExternalLinksInNewTab();
		this.checkboxShowInfo.checked = Settings.getShowInfo();
		this.checkboxShowPostTitles.checked = Settings.getShowPostTitles();
		this.checkboxShowPostTitles.disabled = !this.checkboxOnlyShowPostsWithImages.checked;

		this.settingsListElement.addEventListener("click", this.onListClick.bind(this));

		if (!app.storage.localStorageIsAvailable) {
			var message = "Your settings can’t be saved permanently because your browser doesn’t allow storing data. This can happen if you disabled local storage in your browser’s settings or if you browse in privacy mode.";
			app.session.addFlashWarningMessage(message);
		}
	};

	SettingsController.prototype.onListClick = function(event) {
		Settings.setOnlyShowPostsWithImages(this.checkboxOnlyShowPostsWithImages.checked);
		Settings.setOpenExternalLinksInNewTab(this.checkboxOpenExternalLinksInNewTab.checked);
		Settings.setShowInfo(this.checkboxShowInfo.checked);
		Settings.setShowPostTitles(this.checkboxShowPostTitles.checked);

		this.checkboxShowPostTitles.disabled = !this.checkboxOnlyShowPostsWithImages.checked;
		if (this.checkboxShowPostTitles.disabled) {
			this.checkboxShowPostTitles.checked = true;
			Settings.setShowPostTitles(true);
		}
	};

	sprinkles.provide("custom.settings.SettingsController", SettingsController);
})();
