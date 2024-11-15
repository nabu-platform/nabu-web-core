if (!nabu) { nabu = {}; }
if (!nabu.components) { nabu.components = {}; }

nabu.components.List = Vue.component("n-list", {
	props: ["items", "selector", "toggle", "multiple", "active", "minimumSelection", "maximumSelection", "autosize", "forceNavigationSlots"],
	template: "#n-list",
	data: function() {
		return {
			selected: [],
			iteratorActive: false
		}
	},
	created: function() {
		if (!this.selector) {
			this.selector = new nabu.services.iterators.Static();
		}
		// Arrays via props aren't watched
		var toMerge = this.active;
		this.$set("active", []);
		nabu.utils.arrays.merge(this.active, toMerge);
		this.selector.next(this.items, this.selected);
	},
	ready: function() {
		if (this.active.length > 0) {
			var divs = this.$el.getElementsByClassName("active");
			if (divs.length > 0) {
				divs[0].scrollIntoView();
			}
		}
		this.resize();
		// register a resize event listener
		if (this.autosize && this.$window && this.selector.autosize) {
			this.$window.addEventListener("resize", this.resize);
		}
	},
	methods: {
		getOptimalHorizontalAmountOfItems: function() {
			// get the target by classname
			var target = this.$el.getElementsByClassName("n-list-items")[0];
			// total width
			var width = this.$el.offsetWidth;
			// deduct the width of the children that are not the target
			for (var i = 0; i < this.$el.children.length; i++) {
				if (this.$el.children[i] != target) {
					width -= this.$el.children[i].offsetWidth;
				}
			}
			// based on the target width, estimate average child size
			var averageChildWidth = Math.ceil(target.offsetWidth / this.selected.length);
			// based on average child size, deduce the optimal amount of children
			return Math.floor(width / averageChildWidth);
		},
		toggle: function(item) {
			this.$emit("toggle", item);
		},
		next: function() {
			if (this.hasNext) {
				this.iteratorActive = true;
				this.selector.next(this.items, this.selected);
				this.iteratorActive = false;
			}
		},
		previous: function() {
			if (this.hasPrevious) {
				this.iteratorActive = true;
				this.selector.previous(this.items, this.selected);
				this.iteratorActive = false;
			}
		},
		activated: function(item) {
			return this.active.indexOf(item) >= 0;
		},
		resize: function() {
			if (this.autosize && this.selector.autosize) {
				var amount = this.getOptimalHorizontalAmountOfItems();
				if (amount != Infinity && !isNaN(amount) && amount > 0 && this.selected.length != amount) {
					this.selector.autosize(this.items, this.selected, amount);
				}
			}
		}
	},
	computed: {
		hasNext: function() {
			return this.selector.hasNext(this.items, this.selected);
		},
		hasPrevious: function() {
			return this.selector.hasPrevious(this.items, this.selected);
		}
	},
	events: {
		toggle: function(item) {
			if (this.toggle || this.multiple) {
				var index = this.active.indexOf(item);
				if (index >= 0) {
					if (!this.minimumSelection || this.active.length > this.minimumSelection) {
						this.active.splice(index, 1);
						this.$emit("deactivate", item);
					}
				}
				else {
					// deselect others if not set to multiple
 					if (!this.multiple && this.active.length > 0) {
						this.$emit("deactivate", this.active.pop());
					}
					// if we are bumping up against the maximum selection size, remove the first item
					else if (this.active.length > 0 && this.maximumSelection && this.active.length >= this.maximumSelection) {
						this.toggle(this.active[0]);
					}
					this.active.push(item);
					this.$emit("activate", item);
				}
			}
			else {
				this.$emit("activate", item);
			}
		}
	},
	watch: {
		items: function() {
			// if the items array was updated externally (not by the iterator), we need to update the selection
			if (!this.iteratorActive) {
				this.selected.splice(0, this.selected.length);
				this.selector.next(this.items, this.selected);
			}
		},
		selected: function() {
			this.resize();
		},
		active: function(newValue) {
			if (!(newValue instanceof Array)) {
				this.active = [newValue];
			}
		}
	}
});
