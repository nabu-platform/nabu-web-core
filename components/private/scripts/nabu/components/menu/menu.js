if (!nabu) { nabu = {}; }
if (!nabu.components) { nabu.components = {}; }

nabu.components.List = Vue.component("n-menu", {
	props: ["items"],
	template: "#n-menu",
	data: function() {
		return {
			active: null
		}
	},
	created: function() {
		var self = this;
		document.addEventListener("click", function(e) {
			self.active = null;
		}, true);
	},
	methods: {
		toggle: function(item) {
			if (this.active == item) {
				this.active = null;
			}
			else {
				this.active = item;
			}
		},
		activated: function(item) {
			return this.active == item;
		}
	}
});
