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

// allows us to apply custom stuff to our components
nabu.components.Component = Vue.component("n-component", {
	props: ["id", "classList"],
	template: "<div :class='[ id, classList ]'><slot></slot></div>"
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
	update: function(newValue, oldValue) {
		this.vm[newValue] = nabu.tmp[this.arg ? this.arg : "current"];
	}
});

Vue.directive("store", {
	priority: 5000,
	update: function(newValue, oldValue) {
		nabu.tmp[this.arg ? this.arg : "current"] = newValue;
	}
});
