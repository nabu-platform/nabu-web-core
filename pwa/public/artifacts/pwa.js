if (!application) {
	var application = {};
}

window.addEventListener("beforeinstallprompt", function(event) {
	// prevent older browsers from automatically prompting
	event.preventDefault();
	// we store the event for later so we can show it
	application.installPrompt = event;
});

nabu.services.VueService(Vue.extend({
	data: function() {
		return {
			installable: false
		}
	},
	created: function() {
		this.scanForPrompt();	
	},
	methods: {
		scanForPrompt: function() {
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
