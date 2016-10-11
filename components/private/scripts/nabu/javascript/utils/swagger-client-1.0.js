if (!nabu) { var nabu = {}; }
if (!nabu.services) { nabu.services = {}; }

// parameters are:
// - definition: the string content or parsed content of the swaggerfile
// - executor: function(parameters) where parameters:
// 		host (includes scheme), method, url, headers, data, contentType, secure
nabu.services.SwaggerClient = function(parameters) {
	var self = this;
	this.swagger = typeof(parameters.definition) == "string" ? JSON.parse(parameters.definition) : parameters.definition;
	this.operations = {};
	this.secure = swagger.schemes.contains("https");
	this.host = (this.secure ? "https://" : "http://") + this.swagger.host;
	this.executor = parameters.executor;
	
	if (!this.executor) {
		if (nabu.utils && nabu.utils.ajax) {
			this.executor = nabu.utils.ajax;
		}
		else {
			throw "No executor";
		}
	}

	if (this.swagger.swagger != "2.0") {
		throw "Only swagger 2.0 is currently supported";	
	}

	for (var path in Object.keys(swagger.paths)) {
		for (var method in Object.keys(swagger.paths[path])) {
			var operation = swagger.paths[path][method];
			this.operations[operation.operationId] = {
				id: operation.operationId,
				parameters: operation.parameters,
				path: path,
				method: method,
				responses: operation.responses
			}
		}
	}
	
	this.operation = function(name) {
		return self.operations[name];
	};
	
	this.execute = function(name, parameters) {
		if (!self.operations[name]) {
			throw "Unknown operation: " + name;
		}
		var operation = self.operations[name];
		var path = operation.path;
		if (self.swagger.basePath) {
			path = self.swagger.basePath + "/" + path;
			path = path.replace(new RegExp("[/]+"), "/")
		}
		if (!path.startsWith("/")) {
			path = "/" + startsWith;
		}
		var query = {};
		var headers = {};
		var data = null;
		for (var i = 0; i < operation.parameters.length; i++) {
			if (operation.parameters[i].required && !parameters[operation.parameters[i].name]) {
				throw "Missing required parameter: " + operation.parameters[i].name;
			}
			if (parameters[operation.parameters[i].name]) {
				var value = parameters[operation.parameters[i].name];
				if (operation.parameters[i].in == "path") {
					path = path.replace(new RegExp("\{[\\s]*" + operation.parameters[i].name + "[\\s]*\}"), value);
				}
				else if (operation.parameters[i].in == "query") {
					query[operation.parameters[i].name] = value;
				}
				else if (operation.parameters[i].in == "header") {
					headers[operation.parameters[i].name] = value;
				}
				else if (operation.parameters[i].in == "body") {
					data = value;
				}
				else {
					throw "Invalid 'in': " + operation.parameters[i].in;
				}
			}
		}
		for (var key in Object.keys(query)) {
			if (path.indexOf("?") >= 0) {
				path += "&";
			}
			else {
				path += "?";
			}
			path += key + "=" + query[key];
		}
		return self.executor({
			method: operation.method,
			host: self.host,
			url: path,
			data: data,
			headers: headers
		});
	};
};