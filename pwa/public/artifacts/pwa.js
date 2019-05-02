if (!application) {
	var application = {};
}

window.addEventListener("beforeinstallprompt", function(event) {
	// prevent older browsers from automatically prompting
	event.preventDefault();
	// we store the event for later so we can show it
	application.installPrompt = event;
});

window.addEventListener("offline", function(e) {
	if (application && application.services && application.services.pwa) {
		application.services.pwa.online = false;
	}
}, false);

window.addEventListener("online", function(e) {
	if (application && application.services && application.services.pwa) {
		application.services.pwa.online = true;
	}
}, false);

window.addEventListener("fetchfailed", function(e) {
	if (application && application.services && application.services.pwa) {
		application.services.pwa.online = false;
	}
}, false);

window.addEventListener("fetchsucceeded", function(e) {
	if (application && application.services && application.services.pwa) {
		application.services.pwa.online = true;
	}
}, false);

nabu.services.VueService(Vue.extend({
	data: function() {
		return {
			installable: false,
			online: true
		}
	},
	created: function() {
		this.scanForPrompt();
		this.online = navigator.onLine;
	},
	methods: {
		scanForPrompt: function() {
			var value = this.$services.cookies.get("pwa-ignore-install");
			if (value == "true") {
				return;
			}
			if (application.installPrompt != null) {
				this.installable = true;
			}
			else {
				setTimeout(this.scanForPrompt, 300);
			}
		},
		install: function() {
			var promise = this.$services.q.defer();
			if (application.installPrompt && this.installable) {
				if (application && application.services && application.services.analysis && application.services.analysis.emit) {
					application.services.analysis.emit("pwa-install-prompt", null, null, true);
				}
				// you can only use it once
				this.installable = false;
				application.installPrompt.prompt();
				application.installPrompt.userChoice.then(function(result) {
					if (result.outcome == "accepted") {
						promise.resolve();
					}
					else {
						promise.reject();
					}
					application.installPrompt = null;
				});
			}
			else {
				promise.reject();
			}
			return promise;
		},
		ignoreInstall: function(days) {
			// by default we ignore for +- 3 months
			if (!days) {
				days = 90;
			}
			this.$services.cookies.set("pwa-ignore-install", "true", parseInt(days));
		}
	}
}), { name: "nabu.services.web.Pwa" });

window.addEventListener("load", function() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('${server.root()}pwa-sw').then(function(registration) {
			console.log('ServiceWorker registration successful with scope', registration.scope);
		}, function(err) {
			console.log('ServiceWorker registration failed', err);
		});
	}
	
	application.bootstrap(function($services) {
		return $services.$register({
			pwa: nabu.services.web.Pwa
		});
	});
});

window.addEventListener('appinstalled', function(event) {
	console.log("Application installed successfully");
	if (application && application.services && application.services.analysis && application.services.analysis.emit) {
		application.services.analysis.emit("pwa-installed", null, null, true);
	}
});
