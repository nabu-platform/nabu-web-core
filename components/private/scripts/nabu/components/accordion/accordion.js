if (!nabu) { nabu = {}; }
if (!nabu.components) { nabu.components = {}; }

nabu.components.List = Vue.component("n-accordion", {
	props: ["items", "active", "multiple"],
	template: "#n-accordion",
	data: function() {
		return {
		}
	},
	created: function() {
		// Arrays via props aren't watched
		var toMerge = this.active;
		this.$set("active", []);
		if (toMerge) {
			nabu.utils.arrays.merge(this.active, toMerge);
		}
	},
	methods: {
		activated: function(item) {
			return this.active.indexOf(item) >= 0;
		},
		toggle: function(item) {
			this.$emit("toggle", item);
		}
	},
	events: {
		toggle: function(item) {
			var index = this.active.indexOf(item);
			if (index >= 0) {
				this.active.splice(index, 1);
				this.$emit("deactivate", item);
			}
			else {
				// deselect others if not set to multiple
 				if (!this.multiple && this.active.length > 0) {
					this.$emit("deactivate", this.active.pop());
				}
				this.active.push(item);
				this.$emit("activate", item);
			}
		}
	}
});