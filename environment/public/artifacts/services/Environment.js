if (!application) { var application = {} }
if (!application.configuration) { application.configuration = {}; }

Vue.service("environment", {
	services: ["swagger", "user"],
	data: function() {
		return {
			settings: {
				data: {}
			}
		}
	},
	activate: function(done) {
		var self = this;
		this.$services.swagger.execute("nabu.web.core.rest.environment").then(function(result) {
			if (result) {
				var scheme = result.scheme ? result.scheme : window.location.protocol.replace(":", "");
				var host = result.host ? result.host : window.location.host;
				// hard to make an educated guess from the url...
				var root = result.root ? result.root : "/";
				application.configuration.scheme = {
					http: scheme,
					ws: scheme == "https" ? "wss" : "ws"
				};
				application.configuration.url = scheme + "://" + host;
				application.configuration.host = host;
				application.configuration.root = root;
				application.configuration.cookiePath = result.cookiePath ? result.cookiePath : root;

				if (result.development) {
					application.configuration.development = true;
				}
				if (result.languagePattern) {
					self.applyPattern(result.languagePattern);
				}
				// merge it reactively into settings		
				Object.keys(result).forEach(function(x) {
					if (x != "data") {
						Vue.set(self.settings, x, result[x])
					}
				});
				// use the first (most important) as default
				if (!result.currentLanguage && result.availableLanguages && result.availableLanguages.length) {
					Vue.set(self.settings, "currentLanguage", result.availableLanguages[0]);
				}
				// we need to set this immediately because the watcher is async and too late
				if (self.settings.currentLanguage) {
					self.applyLanguage(self.settings.currentLanguage.name);
				}
				// data as well
				if (result.data) {
					result.data.forEach(function(x) {
						Vue.set(self.settings.data, x.type, x.content);
					});
				}
			}
			done();
		}, function(error) {
			console.log("Could not load environment information", error);
			done();
		});
	},
	watch: {
		'settings.currentLanguage.name': function(newValue) {
			this.applyLanguage(newValue);
		},
		'settings.languagePattern': function(pattern) {
			this.applyPattern(pattern);
		}
	},
	methods: {
		applyLanguage: function(language) {
			application.configuration.applicationLanguage = language;
			this.$services.swagger.language = language;
		},
		get: function(type) {
			return this.settings.data[type];
		},
		applyPattern: function(pattern) {
			var self = this;
			this.$services.router.router.urlRewriter = {
				incoming: function(path) {
					if (!pattern) {
						return path;
					}
					var identifier = pattern.substring(0, 1);
					// we only care about path based stuff, query etc does not need router-level rewriting
					if (identifier == "/") {
						var index = parseInt(pattern.substring(1));
						var parts = path.replace(/^[/]+/, "").split("/");
						if (index < parts.length) {
							parts.splice(index, 1);
						}
						return "/" + parts.join("/");
					}
					return path;
				},
				outgoing: function(path) {
					if (!pattern) {
						return path;
					}
					var index = parseInt(pattern.substring(1));
					var parts = path ? path.replace(/^[/]+/, "").split("/") : [];
					if (index < parts.length) {
						parts.splice(index, 0, self.settings.currentLanguage.name);
					}
					else {
						parts.push(self.settings.currentLanguage.name);
					}
					return "/" + parts.join("/");
				}
			}
		}
	}
});