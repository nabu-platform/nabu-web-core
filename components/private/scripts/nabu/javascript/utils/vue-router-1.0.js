if (!nabu) { var nabu = {}; }
if (!nabu.components) { nabu.components = {}; }
if (!nabu.services) { nabu.services = {}; }
if (!nabu.state) { nabu.state = {}; }
if (!nabu.utils) { nabu.utils = {}; }

nabu.services.VueRouter = function(parameters) {
	var self = this;
	this.components = {};
	this.router = new nabu.services.Router(parameters);

	this.route = function(alias, parameters, anchor) {
		this.initialize();
		self.router.route(alias, parameters, anchor);
	}
	this.routeInitial = function(anchor) {
		this.initialize();
		this.router.routeInitial(anchor);
	};
	this.register = function(route) {
		route = self.create(route);
		self.router.register(route);
		return route;
	};
	this.create = function(route) {
		if (route.enter) {
			var originalEnter = route.enter;
			route.enter = function(anchorName, parameters, previousRoute, previousParameters) {
				var anchor = nabu.utils.anchors.find(anchorName);
				if (!anchor) {
					throw "Can not route to unknown anchor: " + anchorName;
				}
				var component = originalEnter(parameters, previousRoute, previousParameters);
				// if we have a return value, we need to add it to the anchor
				if (component) {
					// if you return a string, we assume it is a template id
					if (typeof component == "string") {
						if (!self.components[component]) {
							self.components[component] = Vue.extend({
								template: "#" + component
							});
						}
						component = new self.components[component]({ data: parameters });
					}
					// a function to complete the appending of the component to the anchor
					var complete = function() {
						// unless we explicitly want to append content, wipe the current content
						if (!route.append) {
							anchor.clear();
						}
						// it's a vue component
						if (component.$appendTo) {
							component.$appendTo(anchor.$el);
						}
						// we assume it's a html element
						else {
							anchor.$el.appendChild(component);
						}
						// enrich the anchor with contextually relevant information
						anchor.$el.setAttribute("route", route.alias);
						if (component.$options && component.$options.template) {
							if (component.$options.template.substring(0, 1) == "#") {
								var id = component.$options.template.substring(1);
								anchor.$el.setAttribute("template", id);
								var template = document.getElementById(id);
								for (var i = 0; i < template.attributes.length; i++) {
									if (template.attributes[i].name != "id") {
										anchor.$el.setAttribute(template.attributes[i].name, template.attributes[i].value);
									}
								}
							}
						}
					};
					// it's a vue component
					if (component.$mount) {
						var mounted = component.$mount();
						// if we have an activate method, call it, it can perform asynchronous actions
						if (mounted.$options.activate) {
							mounted.$options.activate.call(component, complete);
						}
						else {
							complete();
						}
					}
					// for HTML components we simply stop
					else {
						complete();
					}
				}
				return component;
			};
		}
		var originalLeave = route.leave;
		route.leave = function(anchorName, currentParameters, newRoute, newParameters) {
			var anchor = nabu.utils.anchors.find(anchorName);
			if (anchor) {
				for (var i = 0; i < anchor.$el.attributes.length; i++) {
					if (anchor.$el.attributes[i].name != "id") {
						anchor.$el.removeAttribute(anchor.$el.attributes[i].name);
					}
				}
			}
			if (originalLeave) {
				originalLeave(currentParameters, newRoute, newParameters);
			}
		};
		return route;
	};

	this.initialize = function() {
		// make sure we register the body anchor
		if (!nabu.state.anchors) {
			nabu.state.anchors = [];
		}
		// register the body as an anchor
		if (!nabu.utils.anchors.find("body")) {
			nabu.state.anchors.push({
				id: "body",
				$el: document.body,
				clear: function() {
					var childNodes = this.$el.childNodes;
					for (var i = childNodes.length - 1; i >= 0; i--) {
						if (!childNodes[i].tagName || childNodes[i].tagName.toLowerCase() != "template") {
							this.$el.removeChild(childNodes[i]);
						}
					}
				},
				show: function() {},
				hide: function() {}
			});
		}
	}
}

nabu.components.Anchor = Vue.component("anchor", {
	props: ["id", "hidden"],
	template: "<div id=\"{{ id }}\"><slot></slot></div>",
	created: function() {
		if (!nabu.state.anchors) {
			nabu.state.anchors = [];
		}
		// if an anchor already exists with this id, remove it
		var currentAnchor = nabu.utils.anchors.find(this.id);
		if (currentAnchor) {
			nabu.state.anchors.splice(nabu.state.anchors.indexOf(currentAnchor, 1));
		}
		// then add this anchor
		nabu.state.anchors.push(this);
	},
	activated: function() {
		if (this.hidden) {
			this.$el.style.display = "none";
		}
	},
	methods: {
		hide: function() {
			if (!this.hidden) {
				this.hidden = true;
				this.$el.style.display = "none";
			}
		},
		show: function() {
			if (this.hidden) {
				this.hidden = false;
				this.$el.style.display = "block";
			}
		},
		clear: function() {
			while (this.$el.firstChild) {
				this.$el.removeChild(this.$el.firstChild);
			}
		}
	}
});


nabu.utils.anchors = {
	find: function(id) {
		if (nabu.state.anchors) {
			for (var i = 0; i < nabu.state.anchors.length; i++) {
				if (nabu.state.anchors[i].id == id) {
					return nabu.state.anchors[i];
				}
			}
		}
		return null;
	}
}
