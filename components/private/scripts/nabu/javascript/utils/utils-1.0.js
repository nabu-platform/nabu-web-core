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

nabu.utils.shim = function(object, parameters) {
	if (object instanceof Array) {
		// default merge true
		if (typeof(parameters.added) == "undefined") {
			parameters.added = true;
		}
		// default merge removed
		if (typeof(parameters.removed) == "undefined") {
			parameters.removed = true;
		}

		var shim = [];
		for (var i = 0; i < object.length; i++) {
			shim[i] = nabu.utils.shim(objects[i]);
		}
		shim.pushed = [];
		shim.unshifted = [];
		shim.popped = [];
		shim.shifted = [];
		shim.spliced = [];
		if (parameters.added) {
			// wrap the push
			var oldPush = shim.push;
			shim.push = function() {
				shim.pushed.push.apply(null, arguments);
				oldPush.apply(null, arguments);
			};
			// wrap the unshift
			var oldUnshift = shim.unshift;
			shim.push = function() {
				shim.unshifted.push.apply(null, arguments);
				oldUnshift.apply(null, arguments);
			};
		}
		if (parameters.removed) {
			// wrap the pop
			var oldPop = shim.pop;
			shim.pop = function() {
				shim.popped.push(oldPop.apply(null, arguments));
			};
			// wrap the shift
			var oldShift = shim.shift;
			shim.shift = function() {
				shim.shifted.push(oldShift.apply(null, arguments));
			};
		}
		// splice is slightly tricker so use with caution
		var oldSplice = shim.splice;
		shim.splice = function(index, length) {
			shim.spliced.push({
				starting: shim[index],
				added: arguments.slice(2),
				removed: oldSplice.apply(null, arguments);
			});
		};
		shim.$commit = function() {
			if (shim.pushed) {
				for (var i = 0; i < shim.pushed.length; i++) {
					object.push(shim.pushed[i]);
				}
			}
			if (shim.popped) {
				for (var i = 0; i < shim.popped.length; i++) {
					var index = object.indexOf(shim.popped[i]);
					if (index >= 0) {
						object.splice(index, 1);
					}
					else {
						console.log("Can not find popped element", shim.shifted[i]);
					}
				}
			}
			if (shim.unshifted) {
				for (var i = 0; i < shim.unshifted.length; i++) {
					object.unshift(shim.unshifted[i]);
				}
			}
			if (shim.shifted) {
				for (var i = 0; i < shim.shifted.length; i++) {
					var index = object.indexOf(shim.shifted[i]);
					if (index >= 0) {
						object.splice(index, 1);
					}
					else {
						console.log("Can not find shifted element", shim.shifted[i]);
					}
				}
			}
			if (shim.spliced) {
				for (var i = 0; i < shim.spliced.length; i++) {
					var index = object.indexOf(shim.spliced[i].starting);
					if (index >= 0) {
						// splice in the new stuff
						object.splice(index, 0, shim.spliced[i].added);
						for (var j = 0; j < shim.spliced[i].removed.length; j++) {
							index = object.indexOf(shim.spliced[i].removed[j]);
							if (index >= 0) {
								object.splice(index, 1);
							}
							else {
								console.log("Can not find spliced element", shim.spliced[i].removed[j]);
							}
						}
					}
					else {
						console.log("Can not find splice start poing", shim.spliced[i].starting);
					}
				}
			}
			// apply the merge where possible
			for (var i = 0; i < object.length; i++) {
				if (object[i].$commit) {
					object[i].$commit();
				}
			}
		};
		shim.$rollback = function() {
			// reset elements
			shim.splice(0, shim.length, object);
			// reset arrays
			shim.pushed = [];
			shim.unshifted = [];
			shim.popped = [];
			shim.shifted = [];
			shim.spliced = [];
		};
		return shim;
	}
	else if (typeof(object) == "object") {
		// create a new object to hold updates
		var shim = {};
		shim.$rollback = function() {
			for (var key in object) {
				// recursively shim
				if (object[key] instanceof Array || typeof(object[key]) == "object") {
					shim[key] = nabu.utils.shim(object[key]);
				}
				else {
					shim[key] = object[key];
				}
			}
		}
		shim.$rollback();
		shim.$commit = function() {
			// merge the new stuff in
			for (var key in shim) {
				if (shim[key] instanceof Array || typeof(shim[key]) == "object") {
					shim[key].$commit();
				}
				else {
					object[key] = shim[key];
				}
			}
		}
		return shim;
	}
	else {
		throw "Can only shim arrays of objects or objects";
	}
};
