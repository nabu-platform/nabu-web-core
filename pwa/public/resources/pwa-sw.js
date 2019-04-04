var CACHE_NAME = 'cache-v2';

var urlsToCache = [
  'resources/css',
  'resources/javascript'
];

self.addEventListener('install', function(event) {
	console.log("install event", event);
  // Perform install steps
  /*event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache', urlsToCache);
        return cache.addAll(urlsToCache);
      })
  );*/
});


self.addEventListener('fetch', function(event) {
	console.log("fetch event", event);
	event.respondWith(
		caches.match(event.request).then(function(response) {
			console.log("got match!", response);
			if (response) {
				return response;
			}
			var liveResponse = fetch(event.request);
			console.log("response is", liveResponse);
			return liveResponse;
		})
	);
});
