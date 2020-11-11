const cacheName = 'v1';
const dataCacheName = 'v1';

// Cache Individual Files
const cacheAssets = [
	'/',
	'index.html',
	'./styles.css',
	'./index.js',
	'./indexedDB.js',
	'./manifest.webmanifest',
	'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
	'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
];

// Call Install Event
self.addEventListener('install', (e) => {
	console.log('Service Worker: Installed');

	e.waitUntil(
		caches
			.open(cacheName)
			.then((cache) => {
				console.log('Service Worker: Caching Files');
				cache.addAll(cacheAssets);
			})
			.then(() => {
				self.skipWaiting();
			})
	);
});

// Call Activate Event
self.addEventListener('activate', (e) => {
	console.log('Service Worker: Activated');

	// Remove unwanted caches
	e.waitUntil(
		caches.key().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cache) => {
					if (cache !== cacheName && cache !== dataCacheName) {
						console.log('Service Worker: Clearing Old Cache');
						return caches.delete(cache);
					}
				})
			);
		})
	);

	self.clients.claim();
});

// Call Fetch Event
self.addEventListener('fetch', (e) => {
	console.log('Service Worker: Fetching');

	if (e.request.url.includes('/api')) {
		console.log('Service Worker Fetch Data', e.request.url);
		e.respondWith(
			caches
				.open(dataCacheName)
				.then((cache) => {
					return fetch(e.request)
						.then((response) => {
							if (response.status === 200) {
								cache.put(e.request.url, response.clone());
							}
							return response;
						})
						.catch((err) => {
							return cache.match(e.request);
						});
				})
				.catch((err) => {
					console.log(err);
				})
		);

		return;
	}

	e.respondWith(
		caches.open(cacheName).then((cache) => {
			return cache.match(e.request).then((response) => {
				return response || fetch(e.request);
			});
		})
	);
});
