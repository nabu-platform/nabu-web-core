if (!nabu) { var nabu = {}; }
if (!nabu.components) { nabu.components = {}; }

Vue.mixin({
	computed: {
		$window: function() {
			return window;
		},
		$document: function() {
			return document;
		}
	}
});

Vue.mixin({
	filters: {
		resolveMasterdataId: function(masterdataId) {
			return this.resolveMasterdataId(masterdataId);
		}	
	},
	methods: {
		resolveMasterdataId: function(masterdataId) {
			var target = this.$root;
			//var target = application.services.vue;
			if (!target) {
				throw "Could not find root vm";
			}
			if (!target.masterdata) {
				target.masterdata = {
					// ids pending resolution
					idsToResolve: [],
					// the resolution timer
					timer: null,
					// id = record
					resolved: {}
				};
			}
			// check if we already have it
			if (target.masterdata.resolved[masterdataId]) {
				return target.masterdata.resolved[masterdataId].name;
			}
			var result = null;
			// check if we have preloaded masterdata
			if (masterdata) {
				for (key in masterdata) {
					if (masterdata[key] instanceof Array) {
						for (var i = 0; i < masterdata[key].length; i++) {
							if (masterdata[key][i].id == masterdataId && masterdata[key][i].name) {
								result = masterdata[key][i];
								break;
							}
						}
					}
					if (result != null) {
						break;
					}
				}
			}
			var self = this;
			// the resolving function
			var resolve = function() {
				var ids = target.masterdata.idsToResolve;
				if (ids && ids.length) {
					var query = "?";
					for (var i = 0; i < ids.length; i++) {
						if (query != "?") {
							query += "&";
						}
						query += "entryId=" + ids[i];
					}
					// reset the state of the resolving
					target.masterdata.idsToResolve.splice(0, target.masterdata.idsToResolve.length);
					target.masterdata.timer = null;
					nabu.utils.ajax({
						method: "GET",
						url: "${server.root()}masterdata/entry/resolve" + query,
						success: function(response) {
							var result = JSON.parse(response.responseText);
							if (result.entries && result.entries.length) {
								for (var i = 0; i < result.entries.length; i++) {
									target.masterdata.resolved[result.entries[i].id] = result.entries[i];
									Vue.set(self.$data, result.entries[i].id, result.entries[i].name);
								}
							}
						}
					});
				}
			};
			if (result != null) {
				return result.name;
			}
			// if we did not find a result, ask the server
			// add it to the idsToResolve
			if (target.masterdata.idsToResolve.indexOf(masterdataId) < 0) {
				target.masterdata.idsToResolve.push(masterdataId);
				// set a value that can be returned and updated later
				Vue.set(self.$data, masterdataId, "");
				// if there is a timer pending, reset it
				if (target.masterdata.timer != null) {
					clearTimeout(target.masterdata.timer);
					target.masterdata.timer = null;
				}
				// set a timeout
				target.masterdata.timer = setTimeout(resolve, 25);
			}
			return self.$data[masterdataId];
		}
	}	
});

// an image replacement that sets it as the background of a div instead of as an image tag which is very hard to style correctly
nabu.components.Image = Vue.component("n-img", {
	props: ["src"],
	template: "<div class='n-img' :style=\"style\"><slot></slot></div>",
	computed: {
		style: function() {
			return "background-image: url('" + this.src + "')";
		}
	}
});

// Injection magic
Vue.directive("inject", {
	terminal: true,
	bind: function() {
		this.context = this.el.parentNode;
		this.next = nabu.utils.elements.next(this.el);
		// if we are directly inside a document fragment, it is rather hard to bind the generated fragment to the correct context
		// as a workaround, we wrap the element in a div which we can use as a target
		// note that the wrapper div is removed again once the element is appended in the correct place
		if (this.context instanceof DocumentFragment) {
			var div = document.createElement("div");
			this.context.replaceChild(div, this.el);
			div.appendChild(this.el);
			this.context = div;
			this.replace = true;
		}
 		this.factory = new Vue.FragmentFactory(this.vm, this.el);
	},
	create: function(key, value) {
 		var host = this._host;
		var parentScope = this._scope || this.vm;
		var scope = Object.create(parentScope);
		// ref holder for the scope
		scope.$refs = Object.create(parentScope.$refs);
		scope.$els = Object.create(parentScope.$els);
		// make sure point $parent to parent scope
		scope.$parent = parentScope;
		scope[key] = value;
		return this.factory.create(this._host, scope, this._frag);
	},
	update: function(newValue, oldValue) {
		var value = null;

		var host = this._host;
		while(host) {
			if (host.stored && host.stored[this.arg ? this.arg : "current"]) {
				value = host.stored[this.arg ? this.arg : "current"];
				break;
			}
			host = host._host;
		}

		var frag = this.create(this.expression, value);
		if (this.context instanceof DocumentFragment) {
			this._host.$el.appendChild(frag.node);
		}
		else if (this.replace) {
			this.context.parentNode.replaceChild(frag.node, this.context);
		}
		else {
			if (this.next) {
				this.context.insertBefore(frag.node, this.next);
			}
			else {
				this.context.appendChild(frag.node);
			}
		}
	},
	unbind: function() {
		if (this.frag) {
			this.frag.remove();
		}
	}
});

Vue.directive("store", {
	priority: 5000,
	update: function(newValue, oldValue) {
		if (!this.vm.stored) {
			this.vm.stored = {};
		}
		this.vm.stored[this.arg ? this.arg : "current"] = newValue;
	}
});

Vue.directive("include", {
	update: function(newValue, oldValue) {
		var definition = Vue.extend({ template: '#' + newValue });
		var component = new definition();
		component.$mount().$appendTo(this.el);
	}
});
/*
Vue.directive("scroll-left", {
	update: function(newValue, oldValue) {
		var self = this;
		// scroll right
		this.vm[newValue] = function() {
			self.el.s
		};
	}
}); */
