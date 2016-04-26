if (typeof(nabu) == "undefined") { nabu = {}; }
if (!nabu.utils) { nabu.utils = {}; }

nabu.utils.arrays = {
	merge: function(original) {
		for (var i = 1; i < arguments.length; i++) {
			if (arguments[i] instanceof Array) {
				for (var j = 0; j < arguments[i].length; j++) {
					original.push(arguments[i][j]);
				}
			}
			else if (typeof arguments[i] != "undefined") {
				original.push(arguments[i]);
			}
		}
		return original;
	},
	offer: function(original) {
		for (var i = 1; i < arguments.length; i++) {
			if (arguments[i] instanceof Array) {
				for (var j = arguments[i].length - 1; j >= 0; j--) {
					original.unshift(arguments[i][j]);
				}
			}
			else if (typeof arguments[i] != "undefined") {
				original.unshift(arguments[i]);
			}
		}
		return original;
	},
	find: function(array, parameters, amount) {
		if (typeof amount == "undefined") {
			amount = 1;
		}
		var results = [];
		for (var i = 0; i < array.length; i++) {
			var matches = true;
			for (var key in parameters) {
				if (array[i][key] != parameters[key]) {
					matches = false;
					break;
				}
			}
			if (matches) {
				results.push(array[i]);
			}
			if (amount != 0 && results.length >= amount) {
				break;
			}
		}
		if (amount == 1) {
			return results.length == 0 ? null : results[0];
		}
		else {
			return results;
		}
	}
};

nabu.utils.objects = {
	merge: function(original) {
		for (var i = 1; i < arguments.length; i++) {
			for (var key in arguments[i]) {
				if (arguments[i][key] instanceof Array) {
					throw "Can not merge arrays (yet)";
				}
				else if (typeof arguments[i][key] == "object") {
					if (!original[key]) {
						original[key] = arguments[i][key];
					}
					else {
						nabu.utils.objects.merge(original[key], arguments[i][key]);
					}
				}
				else if (typeof arguments[i][key] != "undefined") {
					original[key] = arguments[i][key];
				}
			}
		}
	},
	get: function(original, path, separator) {
		if (!separator) {
			separator = "/";
		}
		var parts = path.split(separator);
		for (var i = 0; i < parts.length; i++) {
			original = original[parts[i]];
			if (!original) {
				break;
			}
		}
		return original ? original : null;
	}
};

nabu.utils.elements = {
	first: function(element) {
		if (element.firstChild) {
			var child = element.firstChild;
			while (child) {
				if (child.nodeType === 1) {
					return child;
				}
				child = child.nextSibling;
			}
		}
		return null;
	},
	next: function(element) {
		if (element.nextSibling) {
			var sibling = element.nextSibling;
			while (sibling) {
				if (sibling.nodeType === 1) {
					return sibling;
				}
				sibling = sibling.nextSibling;
			}
		}
		return null;
	},
	previous: function(element) {
		if (element.previousSibling) {
			var sibling = element.previousSibling;
			while (sibling) {
				if (sibling.nodeType === 1) {
					return sibling;
				}
				sibling = sibling.previousSibling;
			}
		}
		return null;
	},
	clear: function(element) {
		while(element.firstChild) {
			element.removeChild(element.firstChild);
		}
	}
};
