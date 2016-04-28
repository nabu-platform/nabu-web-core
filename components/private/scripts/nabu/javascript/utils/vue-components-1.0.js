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
