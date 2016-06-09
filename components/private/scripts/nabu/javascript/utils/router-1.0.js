/*
This file contains a basic router that allows you to go to a state using an alias.
It has the ability to optionally bind an URL to a state with or without parameters.
On initial load it can deduce the state from the URL by using routeInitial();
Note that you can toggle the usage of hashtags.

A route can be registered using the register:

router.register({
	alias: "theAliasForTheRoute",
	enter: function(anchor, parameters, previousRoute, previousParameters),
	leave: function(anchor, currentParameters, newRoute, newParameters),
	url: "/path/to/{myVar}/{myOtherVar}
});

When creating a router instance you can pass in a global enter/leave method.
These global methods are called with exactly the same parameters as the route-specific enter/leaves but adds one more parameter at the end: the return of the specific enter/leave (if any)

TODO:
- differentiate the "current route" per anchor instead of globally
- allow updates of the URL only if the route is in the default anchor
*/

if (!nabu) { var nabu = {}; }
if (!nabu.services) { nabu.services = {}; }

nabu.services.Router = function(parameters) {
	var self = this;
	this.defaultAnchor = parameters.defaultAnchor ? parameters.defaultAnchor : "main";
	this.useHash = parameters.useHash ? true : false;
	// all the routes available
	this.routes = [];
	// the current route
	this.current = null;
	this.enter = parameters.enter ? parameters.enter : null;
	this.leave = parameters.leave ? parameters.leave : null;
	this.unknown = parameters.unknown ? parameters.unknown : null;

	this.changingHash = false;

	// listen to hash changes
	window.addEventListener("hashchange", function() {
		if (self.useHash && !self.changingHash) {
			self.routeInitial();
		}
	}, false);

	// route to a new alias
	this.route = function(alias, parameters, anchor, mask) {
		if (!anchor) {
			anchor = self.defaultAnchor;
		}
		var chosenRoute = null;
		for (var i = 0; i < self.routes.length; i++) {
			if (self.routes[i].alias == alias) {
				chosenRoute = self.routes[i];
				break;
			}
		}
		if (chosenRoute == null && self.unknown) {
			chosenRoute = self.unknown(alias, parameters, anchor);
		}
		if (chosenRoute == null) {
			throw "Unknown route: " + alias;
		}
		var leaveReturn = null;
		if (self.current && self.current.route.leave) {
			leaveReturn = self.current.route.leave(anchor, self.current.parameters, chosenRoute, parameters);
		}
		if (self.leave != null) {
			self.leave(anchor, self.current.parameters, chosenRoute, parameters, leaveReturn);
		}
		var enterReturn = chosenRoute.enter(anchor, parameters, self.current ? self.current.route : null, self.current ? self.current.parameters : null);
		if (self.enter != null) {
			self.enter(anchor, parameters, self.current ? self.current.route : null, self.current ? self.current.parameters : null, enterReturn);
		}
		self.current = {
			route: chosenRoute,
			parameters: parameters
		};
		// update the current URL if the state has a URL attached to it
		if (chosenRoute.url && !mask) {
			var url = chosenRoute.url;
			for (var key in parameters) {
				url = url.replace(new RegExp("{[\s]*" + key + "[\s]*:[^}]+}"), parameters[key]).replace(new RegExp("{[\s]*" + key + "[\s]*}"), parameters[key]);
			}
			url = url.replace(/[\/]{2,}/, "/");
			if (self.useHash) {
				self.changingHash = true;
				window.location.hash = "#" + url;
				self.changingHash = false;
			}
			else if (window.history) {
				window.history.pushState({}, chosenRoute.alias, url);
			}
		}
	};

	this.findRoute = function(path, initial) {
		if (!path) {
			path = "/";
		}
		var chosenRoute = null;
		var parameters = {};
		for (var i = 0; i < self.routes.length; i++) {
			if (self.routes[i].url && ((!initial && !self.routes[i].initial) || (initial && self.routes[i].initial))) {
				var template = "^" + self.routes[i].url.replace(/\{[\s]*[^}:]+[\s]*:[\s]*([^}]+)[\s]*\}/g, "($1)").replace(/\{[\s]*[^}]+[\s]*\}/g, "([^/]+)") + "$";
				var matches = path.match(template);
				if (matches) {
					var variables = self.routes[i].url.match(template);
					if (!variables) {
						throw "Could not extract variables from: " + self.routes[i].url;
					}
					if (variables.length != matches.length) {
						throw "The amount of variables does not equal the amount of values";
					}
					// the first hit is the entire string
					for (var j = 1; j < variables.length; j++) {
						parameters[variables[j].substring(1, variables[j].length - 1).replace(/:.*$/, "")] = matches[j];
					}
					chosenRoute = self.routes[i];
					break;
				}
			}
		}
		return chosenRoute == null ? null : {
			route: chosenRoute,
			parameters: parameters
		};
	};

	// the initial route on page load
	this.routeInitial = function(anchor) {
		if (!anchor) {
			anchor = self.defaultAnchor;
		}
		var initial = null;
		// check for initial route to build framework around data
		if (self.useHash) {
			initial = self.findRoute(window.location.hash && window.location.hash.length > 1 ? window.location.hash.substring(1) : "/", true);
		}
		else {
			initial = self.findRoute(window.location.pathname ? window.location.pathname : "/", true);
		}
		if (initial != null) {
			initial.route.enter("body", initial.parameters, null, null);
		}
		// check for actual data route
		if (self.useHash) {
			self.current = self.findRoute(window.location.hash && window.location.hash.length > 1 ? window.location.hash.substring(1) : "/");
		}
		else {
			self.current = self.findRoute(window.location.pathname ? window.location.pathname : "/");
		}
		if (self.current != null) {
			self.current.route.enter(anchor, self.current.parameters, null, null);
		}
		return this;
	};

	this.register = function(route) {
		self.routes.push(route);
		return route;
	};

}
