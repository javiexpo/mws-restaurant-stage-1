var CACHE_VERSION = 1;

// Shorthand identifier mapped to specific versioned cache.
var CURRENT_CACHES = {
  font: 'cache-resources-v' + CACHE_VERSION
};

const resourcesList = [
    './', 
    './js/main.js',
    './js/dbhelper.js',
    './js/restaurant_info.js',
    './data/restaurants.json',
    './css/styles.css',
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
    console.log('Service worker is beign installed!');
    evt.waitUntil(precache());
});

self.addEventListener('fetch', function(evt) {
    console.log('Handling fetch event for', evt.request.url);
    evt.respondWith(fromCache(evt.request));
    evt.waitUntil(update(evt.request));
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