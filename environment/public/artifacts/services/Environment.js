if (!application) { var application = {} }
if (!application.configuration) { application.configuration = {}; }

Vue.service("environment", {
	services: ["swagger"],
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
				if (result.language) {
					application.configuration.applicationLanguage = result.language;
				}

				// merge it reactively into settings		
				Object.keys(result).forEach(function(x) {
					if (x != "data") {
						Vue.set(self.settings, x, result[x])
					}
				});
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
	methods: {
		get: function(type) {
			return this.settings.data[type];
		}
	}
});