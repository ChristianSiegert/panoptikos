(function() {
	"use strict";

	var template = new sprinkles.Template("/settings/settings.html");
	var Config = custom.main.Config;
	var Settings = custom.settings.Settings;

	function SettingsController(router) {
		this.router = router;
		this.settingsTableElement = null;
		this.themeLinkElement = null;

		this.checkboxOnlyShowPostsWithImages = null;
		this.checkboxOpenExternalLinksInNewTab = null;
		this.checkboxShowInfo = null;
		this.checkboxShowPostTitles = null;
		this.themeSelectElement = null;
	}

	// init sets the initial settings values and registers the route
	// “/settings”.
	SettingsController.prototype.init = function() {
		// If it is the user’s first visit, make the default settings the user’s
		// settings.
		if (Settings.getVersion() === null) {
			Settings.setOnlyShowPostsWithImages(Config.threadList.onlyShowPostsWithImages);
			Settings.setOpenExternalLinksInNewTab(Config.threadList.openExternalLinksInNewTab);
			Settings.setShowInfo(Config.threadList.showInfo);
			Settings.setShowPostTitles(Config.threadList.showPostTitles);
			Settings.setVersion("2015-07-02");
		}

		// Update settings
		if (Settings.getVersion() === "2015-07-02") {
			Settings.setTheme(Config.defaultTheme);
			Settings.setVersion("2015-10-16");
		}

		this.router.registerRoute("/settings", this.loadPage.bind(this));
	};

	SettingsController.prototype.loadPage = function() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load(this.handleRequest.bind(this, page));
	};

	SettingsController.prototype.handleRequest = function(page) {
		this.settingsTableElement = document.getElementById("settings-table");
		this.checkboxOnlyShowPostsWithImages = document.getElementById("setting-only-show-posts-with-images");
		this.checkboxOpenExternalLinksInNewTab = document.getElementById("setting-open-external-links-in-new-tab");
		this.checkboxShowInfo = document.getElementById("setting-show-info");
		this.checkboxShowPostTitles = document.getElementById("setting-show-post-titles");
		this.themeSelectElement = document.getElementById("setting-theme");

		if (!this.settingsTableElement
				|| !this.checkboxOnlyShowPostsWithImages
				|| !this.checkboxOpenExternalLinksInNewTab
				|| !this.checkboxShowInfo
				|| !this.checkboxShowPostTitles
				|| !this.themeSelectElement) {
			app.logger.error(["SettingsController: Element is missing."]);
			return;
		}

		this.checkboxOnlyShowPostsWithImages.checked = Settings.getOnlyShowPostsWithImages();
		this.checkboxOpenExternalLinksInNewTab.checked = Settings.getOpenExternalLinksInNewTab();
		this.checkboxShowInfo.checked = Settings.getShowInfo();
		this.checkboxShowPostTitles.checked = Settings.getShowPostTitles();
		this.checkboxShowPostTitles.disabled = !this.checkboxOnlyShowPostsWithImages.checked;

		var options = this.themeSelectElement.childNodes;
		var theme = Settings.getTheme();
		for (var i = 0; i < options.length; i++) {
			var option = this.themeSelectElement.options[i];
			if (option.value === theme) {
				option.selected = true;
			}
		}

		if (!app.storage.localStorageIsAvailable) {
			var message = "Your settings can’t be saved permanently because your browser doesn’t allow storing data. This can happen if you disabled local storage in your browser’s settings or if you browse in privacy mode.";
			app.session.addFlashWarningMessage(message);
		}

		this.settingsTableElement.addEventListener("click", this.onTableClick.bind(this));
		this.themeSelectElement.addEventListener("change", this.onThemeChange.bind(this));
	};

	SettingsController.prototype.onTableClick = function(event) {
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

	SettingsController.prototype.onThemeChange = function(event) {
		Settings.setTheme(this.themeSelectElement.value);
		this.loadTheme(Settings.getTheme());
	};

	// loadTheme loads the CSS file associated with theme.
	SettingsController.prototype.loadTheme = function(theme) {
		if (!Settings.isTheme(theme)) {
			return;
		}

		// Theme “light” is included in the default CSS files, an extra theme
		// CSS file does not need to be loaded.
		if (theme === "light") {
			if (this.themeLinkElement !== null) {
				document.head.removeChild(this.themeLinkElement);
				this.themeLinkElement = null;
			}
			return;
		}

		if (this.themeLinkElement === null) {
			this.themeLinkElement = document.createElement("link");
			this.themeLinkElement.href = "/themes/" + theme + ".css";
			this.themeLinkElement.rel = "stylesheet";
			document.head.appendChild(this.themeLinkElement);
			return;
		}

		this.themeLinkElement.href = "/themes/" + theme + ".css";
	};

	sprinkles.provide("custom.settings.SettingsController", SettingsController);
})();
