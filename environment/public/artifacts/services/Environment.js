if (!application) { var application = {} }
if (!application.configuration) { application.configuration = {}; }

Vue.service("environment", {
	services: ["swagger"],
	data: function() {
		return {
			settings: {}
		}
	},
	activate: function(done) {
		var self = this;
		this.$services.swagger.execute("nabu.web.core.rest.environment").then(function(result) {
			if (result) {
				nabu.utils.objects.merge(self.settings, result);
				
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
			}
			done();
		}, function(error) {
			console.log("Could not load environment information", error);
			done();
		});
	}
});