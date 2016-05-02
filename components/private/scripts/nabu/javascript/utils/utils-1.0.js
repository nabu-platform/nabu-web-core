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
	remove: function(array) {
		for (var i = 1; i < arguments.length; i++) {
			if (arguments[i] instanceof Array) {
				for (var j = 0; j < arguments[i].length; j++) {
					nabu.utils.arrays.remove(array, arguments[i][j]);
				}
			}
			else {
				var index = array.indexOf(arguments[i]);
				if (index >= 0) {
					array.splice(index, 1);
				}
			}
		}
	},
	flatten: function(array, field, includeUndefined) {
		var results = [];
		for (var i = 0; i < array.length; i++) {
			if (array[i][field] || includeUndefined) {
				results.push(array[i][field]);
			}
		}
		return results;
	},
	find: function(array, parameters, amount) {
		if (typeof amount == "undefined") {
			amount = 1;
		}
		var results = [];
		for (var i = 0; i < array.length; i++) {
			var matches = true;
			for (var key in parameters) {
				if ((parameters[key] instanceof Array && parameters[key].indexOf(array[i][key]) < 0) || (!(parameters[key] instanceof Array) && array[i][key] != parameters[key])) {
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
	},
	clear: function(array) {
		array.splice(0, array.length);
	}
};

nabu.utils.objects = {
	merge: function(original) {
		if (original instanceof Array) {
			var args = [];
			// the arguments aren't really an array, can't use default merge stuff
			for (var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			// for each entry in the original, perform a merge
			for (var i = 0; i < original.length; i++) {
				args.unshift(original[i]);
				nabu.utils.objects.merge.apply(null, args);
				args.shift();
			}
		}
		else {
			for (var i = 1; i < arguments.length; i++) {
				var overwrite = typeof(arguments[i].$overwrite) == "undefined" ? true : arguments[i].$overwrite;
				for (var key in arguments[i]) {
					if (key == "$overwrite") {
						continue;
					}
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
						if (!original[key] || overwrite) {
							original[key] = arguments[i][key];
						}
					}
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

nabu.utils.dates = {
	dayOfWeek: function(date) {
		// starts on sunday
		var day = date.getDay() - 1;
		if (day < 0) {
			day = 6;
		}
		return day;
	}
};
