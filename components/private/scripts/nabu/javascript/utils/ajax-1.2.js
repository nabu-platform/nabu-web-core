// version 1.2

if (!nabu) { var nabu = {}; }
if (!nabu.utils) { nabu.utils = {}; }
if (!nabu.handlers) { nabu.handlers = {}; }

// set default handlers for ajax
nabu.handlers.ajax = {
	error: function(request) {
		if (request.status != 0) {
			console.log("Could not fullfill ajax request", request);
		}
	},
	success: function(request) {
		if (request.target) {
			document.getElementById(request.target).innerHTML = request.responseText;
		}
	}
};

/**
parameters:
	host: the host server (e.g. for mobile apps)
	url: the target
	method: GET, POST,...
	user, pass,
	async (false does not work on firefox 3+?)
	opened: the handler for when the connection is opened
	sent: the handler for when the request is sent
	loading: the handler for when the request is loading
	completed: the handler for when the request is completed
	success: the handler for when completed successfully
	error: the handler for when completed unsuccessfully
	headers: any headers you want to pass along in an associative form
	target: the default "success" handler will see if there is a target, if so, it will put the response directly into that element
	data: the data to be sent to the target (for post requests this should be in the same form as GET: key=value&key2=value2...)
	params: an associative array which acts as data in a post and url parameters in a get
	contentType: the content type of the data,
	binary: boolean to indicate whether content should be sent as binary blob (automatically set for image content types),
	progress: a handler that is triggered periodically on progress of request
*/
nabu.utils.ajax = function(parameters) {
	var newXmlHttpRequest = function() {
		if (window.XMLHttpRequest) {
			// code for IE7+, Firefox, Chrome, Opera, Safari
			return new window.XMLHttpRequest();
		}
		else {
			// code for IE6, IE5
			try {
				return new ActiveXObject("Msxml2.XMLHTTP");
			}
			catch (e1) {
				try {
					return new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch (e2) {
					try {
						return new ActiveXObject("Msxml2.XMLHTTP.6.0");
					}
					catch (e3) {
						return new ActiveXObject("Msxml2.XMLHTTP.3.0");
					}
				}
			}
		}
		throw "Could not get request";
	}

	var request = newXmlHttpRequest();

	if (!parameters.url) {
		throw "Could not find url";
	}

	// if we have a host, prefix it to the url
	if (parameters.host) {
		var host = parameters.host;
		// does not end with a "/"
		if (host.indexOf("/", host.length - 1) < 0) {
			host += "/";
		}
		// the host ends with "/", so we need to make sure the url does not start with it
		if (parameters.url.substring(0, 1) == "/") {
			parameters.url = host + parameters.url.substring(1);
		}
		else {
			parameters.url = host + parameters.url;
		}
	}

	if (!parameters.method) {
		parameters.method = "GET";
	}
	else {
		parameters.method = parameters.method.toUpperCase();
	}

	if (parameters.parameters) {
		var tmp = "";
		for (var key in parameters.parameters) {
			tmp += (tmp == "" ? "" : "&") + key + "=" + encodeURIComponent(parameters.parameters[key]);
		}
		// if it's a get or something else with data attached, append them to
		// the url, this assumes no "?"
		if (parameters.method == "GET" || parameters.data) {
			parameters.url += "?" + tmp;
		}
		// otherwise it's data
		else {
			parameters.data = tmp;
		}
	}

	if (!parameters.async) {
		parameters.async = true;
	}

	// apparently opera can not handle "null" being sent, so check
	// note that firefox does not seem to accept "false" (meaning synchronous)
	// communication
	if (parameters.user) {
		request.open(parameters.method.toUpperCase(), parameters.url, parameters.async, parameters.user, parameters.pass);
	}
	else {
		request.open(parameters.method.toUpperCase(), parameters.url, parameters.async);
	}

	var acceptHeader = false;
	if (parameters.headers) {
		for (var key in parameters.headers) {
			request.setRequestHeader(key, parameters.headers[key]);
			if (key.toUpperCase() == "ACCEPT") {
				acceptHeader = true;
			}
		}
	}

	if (parameters.target) {
		request.target = parameters.target;
	}

	if (parameters.progress) {
		request.onprogress = progress;
	}

	var promise = new nabu.utils.promise();
	request.onreadystatechange = function() {
		switch (request.readyState) {
			case 0:
				// not initialized, do nothing
			break;
			// request set up
			case 1:
				if (parameters.opened) {
					parameters.opened(request);
				}
			break;
			// request sent
			case 2:
				if (parameters.sent) {
					parameters.sent(request);
				}
			break;
			// started loading response
			case 3:
				if (parameters.loading) {
					parameters.loading(request);
				}
			break;
			// response loaded
			case 4:
				if (request.status >= 200 && request.status < 300) {
					if (parameters.success) {
						parameters.success(request);
					}
					else if (parameters.completed) {
						parameters.completed(request);
					}
					else if (nabu.handlers.ajax.success) {
						nabu.handlers.ajax.success(request);
					}
					promise.succeed(request);
				}
				else {
					if (parameters.error) {
						parameters.error(request);
					}
					else if (parameters.completed) {
						parameters.completed(request);
					}
					else if (nabu.handlers.ajax.error) {
						nabu.handlers.ajax.error(request);
					}
					promise.fail(request);
				}
			break;
		}
	}

	if (!acceptHeader) {
		request.setRequestHeader("Accept", "application/json, text/html");
	}

	// need to add these headers for post
	if (parameters.method.toUpperCase() == "POST" || parameters.method.toUpperCase() == "PUT" || parameters.method.toUpperCase() == "DELETE") {
		// if we are sending an object as data, jsonify it
		if (parameters.data && typeof(parameters.data) == "object" && !(parameters.data instanceof File)) {
			parameters.data = JSON.stringify(parameters.data);
			parameters.contentType = "application/json";
		}
		else if (parameters.data instanceof File) {
			if (parameters.data.name) {
				request.setRequestHeader("Content-Disposition", "attachment; filename=" + parameters.data.name);
				if (!parameters.contentType) {
					if (parameters.data.name.match(/.*\.png/i)) {
						parameters.contentType = "image/png";
					}
					else if (parameters.data.name.match(/.*\.jpg/i) || parameters.data.name.match(/.*\.jpeg/i)) {
						parameters.contentType = "image/jpeg";
					}
				}
			}
			if (!parameters.contentType) {
				parameters.contentType = "application/octet-stream";
			}
		}
		if (!parameters.contentType) {
			parameters.contentType = "application/x-www-form-urlencoded";
		}
		request.setRequestHeader("Content-Type", parameters.contentType);
		if (parameters.binary || (parameters.contentType.substring(0, 6) == "image/" && !(parameters.data instanceof File))) {
			parameters.data = nabu.utils.binary.blob(parameters.data, parameters.contentType);
		}
	}
	else {
		parameters.data = null;
	}

	request.send(parameters.data ? parameters.data : null);
	return promise;
}


nabu.utils.when = function(promises) {
	return new nabu.utils.promises(promises);
};

nabu.utils.promise = function() {
	var self = this;
	this.state = null;
	this.successHandlers = [];
	this.errorHandlers = [];
	this.response = null;
	this.succeed = function(response) {
		self.response = response;
		self.state = "success";
		for (var i = 0; i < self.successHandlers.length; i++) {
			self.successHandlers[i](response);
		}
	};
	this.fail = function(response) {
		self.response = response;
		self.state = "error";
		for (var i = 0; i < self.errorHandlers.length; i++) {
			self.errorHandlers[i](response);
		}
	};
	this.success = function(handler) {
		self.successHandlers.push(handler);
		// if already resolved, call immediately
		if (self.state == "success") {
			handler(self.response);
		}
		return self;
	};
	this.error = function(handler) {
		self.errorHandlers.push(handler);
		// if already resolved, call immediately
		if (self.state == "error") {
			handler(self.response);
		}
		return self;
	};
	this.then = function(successHandler, errorHandler) {
		if (successHandler) {
			self.success(successHandler);
		}
		if (errorHandler) {
			self.error(errorHandler);
		}
		return self;
	};
};
nabu.utils.promises = function(promises) {
	var self = this;
	this.promises = promises ? promises : [];
	this.resolution = null;
	this.successHandlers = [];
	this.errorHandlers = [];
	this.state = null;
	
	this.resolver = function() {
		var failed = 0;
		var succeeded = 0;
		var responses = [];
		for (var i = 0; i < self.promises.length; i++) {
			if (self.promises[i].state == "success") {
				succeeded++;
				responses.push(self.promises[i].response);
			}
			else if (self.promises[i].state == "error") {
				failed++;
				responses.push(self.promises[i].response);
			}
		}
		if (succeeded == self.promises.length) {
			self.state = "success";
			for (var i = 0; i < self.successHandlers.length; i++) {
				self.successHandlers[i](responses);
			}
		}
		else if (succeeded + failed == self.promises.length) {
			self.state = "error";
			for (var i = 0; i < self.errorHandlers.length; i++) {
				self.errorHandlers[i](responses);
			}
		}
	};

	for (var i = 0; i < this.promises.length; i++) {
		this.promises[i]
			.success(this.resolver)
			.error(this.resolver);
	}

	this.success = function(handler) {
		self.successHandlers.push(handler);
		// if already resolved, call immediately
		if (self.state == "success") {
			handler(self.response);
		}
		return self;
	};
	this.error = function(handler) {
		self.errorHandlers.push(handler);
		// if already resolved, call immediately
		if (self.state == "error") {
			handler(self.response);
		}
		return self;
	};
	this.then = function(successHandler, errorHandler) {
		if (successHandler) {
			self.success(successHandler);
		}
		if (errorHandler) {
			self.error(errorHandler);
		}
		return self;
	};
	this.resolver();
}


nabu.utils.binary = {
	blob: function(binaryData, contentType, sliceSize) {
  		contentType = contentType ? contentType : "application/octet-stream";
  		sliceSize = sliceSize ? sliceSize : 512;
		var bytes = [];
		for (var offset = 0; offset < binaryData.length; offset += sliceSize) {
			var slice = binaryData.slice(offset, Math.min(offset + sliceSize, binaryData.length));
			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			bytes.push(new Uint8Array(byteNumbers));
		}
		return new Blob(bytes, { type: contentType });
	}
};
