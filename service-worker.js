var CACHE_VERSION = 1;

// Shorthand identifier mapped to specific versioned cache.
var CURRENT_CACHES = `cache-resources-v${CACHE_VERSION}`;

//
const resourcesList = [
    './',
    './index.html',
    './index.html?launcher=true', 
    './js/main.js',
    './js/dbhelper.js',
    './js/restaurant_info.js',
    './data/restaurants.json',
    './css/styles.css',
    './css/fontawesome-all.min.css',
    './webfonts/fa-regular-400.eot',
    './webfonts/fa-regular-400.svg',
    './webfonts/fa-regular-400.ttf',
    './webfonts/fa-regular-400.woff',
    './webfonts/fa-regular-400.woff2',
    './webfonts/fa-solid-900.eot',
    './webfonts/fa-solid-900.svg',
    './webfonts/fa-solid-900.ttf',
    './webfonts/fa-solid-900.woff',
    './webfonts/fa-solid-900.woff2',
    './restaurant.html',
    './img/1-360.jpg',
    './img/2-360.jpg',
    './img/3-360.jpg',
    './img/4-360.jpg',
    './img/5-360.jpg',
    './img/6-360.jpg',
    './img/7-360.jpg',
    './img/8-360.jpg',
    './img/9-360.jpg',
    './img/10-360.jpg',
    './img/1-800.jpg',
    './img/2-800.jpg',
    './img/3-800.jpg',
    './img/4-800.jpg',
    './img/5-800.jpg',
    './img/6-800.jpg',
    './img/7-800.jpg',
    './img/8-800.jpg',
    './img/9-800.jpg',
    './img/10-800.jpg'
];

self.addEventListener('install', function(evt) {
    evt.waitUntil(precache());
});

self.addEventListener('fetch', function(evt) {
    evt.respondWith(fromCache(evt.request));
    evt.waitUntil(update(evt.request));
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CURRENT_CACHES];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

function precache() {
  return caches.open(CURRENT_CACHES).then(function(cache) {
    return cache.addAll(resourcesList);
  });
}

function fromCache(request) {
  return caches.open(CURRENT_CACHES).then(function(cache) {
    return cache.match(request).then(function(matching) {
        return matching || fetch(request);
      //return matching || Promise.reject('no-match');
    });
  });
}

function update(request) {
    return caches.open(CURRENT_CACHES).then(function (cache) {
      return fetch(request).then(function (response) {
        return cache.put(request, response);
      });
    });
}
