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

// an image replacement that sets it as the background of a div instead of as an image tag which is very hard to style correctly
nabu.components.Image = Vue.component("n-img", {
	props: ["src"],
	template: "<div class='n-img' :style=\"style\"><slot></slot></div>",
	ready: function() {
		console.log("SRC", this.src, this.style);
	},
	computed: {
		style: function() {
			return "background-image: url('" + this.src + "')";
		}
	}
});

nabu.tmp = {}
// Injection magic
Vue.directive("inject", {
	priority: 5000,
	terminal: true,
	bind: function() {
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
		console.log("iNJECTIN", newValue, this.arg, nabu.tmp[this.arg ? this.arg : "current"]);
		var frag = this.create(newValue, nabu.tmp[this.arg ? this.arg : "current"]);
		this._host.$el.appendChild(frag.node);
	},
	unbind: function() {
		if (this.frag) {
			this.frag.remove();
		}
		Vue.util.remove(this.anchor);
	}
});

Vue.directive("store", {
	priority: 5000,
	update: function(newValue, oldValue) {
		nabu.tmp[this.arg ? this.arg : "current"] = newValue;
	}
});
