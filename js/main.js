let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

let currentImgSize;

var lastIndx = 2;

const FAVORITE_ON = 'Marked as Favorite';
const FAVORITE_OFF = 'No marked as Favorite';
const REST_ID = 'rest-id';

/**
 * Intersection Observer for the list of restaurants
 */

const preloadImage = el => {  
	const src = el.getAttribute('data-src');
	if (!src) {
		return;
	}
  el.src = src;
  console.log(`Image from source: ${src} is visible!`);
	el.removeAttribute('data-src');  
};

const io = new IntersectionObserver((entries, self) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      preloadImage(entry.target);
      // Stop watching and load the image
      self.unobserve(entry.target);
    }
  });
});

/**
 * Get the viewport width
 */
getViewportWidth = () => Math.max(document.documentElement.clientWidth, window.innerWidth || 0);


/**
 * Adding CSS 
 */
addCss = (fileName) => {
  var head = document.head;
  var link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = `css/${fileName}`;
  head.appendChild(link);
}

/**
 * Get to know when the viewport size has change
 */
window.onresize = () => {
  let restaurantImgSize = 0;
  if (getViewportWidth() < 400)
    restaurantImgSize = 360;
  else
    restaurantImgSize = 800;

  if (!currentImgSize ||  currentImgSize != restaurantImgSize) {
    currentImgSize = restaurantImgSize;
    updateRestaurants();
  }
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  addCss('fontawesome-all.min.css');
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Detect when the user come online in order to Sync Pending Reviews to server
 */
window.ononline = () => {
  console.log('User went Online from main.js');
  DBHelper.syncPendingReviewWithServer();
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.setAttribute('role','option');
    option.setAttribute('aria-label', neighborhood);
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.setAttribute('role','option');
    option.setAttribute('aria-label', cuisine);
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');

  // var indx = 0;
  // for (let i = 0; i < lastIndx; i++) {
  //   const restaurant = restaurants[i];
  //   var restElem = createRestaurantHTML(restaurant);
  //   ul.append(restElem);
  // }

  //Create Sentinel Element to monitor on Intersection Observer
  // const sentinelElement = createIOSentinelHTML();
  // Observe for Sentinel Element
  // io.observe(sentinelElement);
  //Add Sentinel element at the end of the list
  // ul.append(sentinelElement);

  restaurants.forEach(restaurant => {
    var restElem = createRestaurantHTML(restaurant);
    ul.append(restElem);
  });
  
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', 0);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  let imgUrl = DBHelper.imageUrlForRestaurant(restaurant); 
  let viewPortWidth = 360;
  if (getViewportWidth() > 400) {
    viewPortWidth = 800;
  }
  //imgUrl = imgUrl.replace(`.jpg`, `-${viewPortWidth}.jpg`);
  imgUrl = imgUrl.concat(`-${viewPortWidth}.jpg`);
  //image.src = imgUrl;
  image.setAttribute('data-src', imgUrl);
  image.alt = `Image of ${restaurant.name} Restaurant`;
  io.observe(image);
  li.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  const favorite = createFavoriteIconHtml(restaurant);
  li.append(favorite);

  return li;
}

/**
 * Create Favorite HTML Icon
 */
createFavoriteIconHtml = (rest) => {
  const favoriteDiv = document.createElement('div');
  favoriteDiv.setAttribute('class', 'favorite');

  const favorite =document.createElement('i');
  favorite.setAttribute('aria-hidden', 'true');
  favorite.setAttribute('tabindex', '0');
  if (rest.is_favorite) {
    favorite.setAttribute('class', 'fas fa-star');
    favorite.setAttribute('aria-label', FAVORITE_ON);  
  } else {
    favorite.setAttribute('class', 'far fa-star');
    favorite.setAttribute('aria-label', FAVORITE_OFF);
  }
  favorite.setAttribute(REST_ID, rest.id);
  
  favoriteDiv.appendChild(favorite);
  favoriteDiv.addEventListener('click', toggleFavoriteRestaurant);
  return favoriteDiv;
}

toggleFavoriteRestaurant = (event) => {
  const restId = event.srcElement.getAttribute(REST_ID);
  console.log('toggleFavorite for Restaurant id ', restId);

  DBHelper.toggleRestaurantFavoriteById(restId, (error, restaurant) => {
    if (restaurant) {
      if(restaurant.is_favorite) {
        event.srcElement.setAttribute('class', 'fas fa-star');
        event.srcElement.setAttribute('aria-label', FAVORITE_ON);
      } else {
        event.srcElement.setAttribute('class', 'far fa-star');
        event.srcElement.setAttribute('aria-label', FAVORITE_OFF);
      }
    }
  });
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}


createIOSentinelHTML = (restaurant) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', -1);
  li.setAttribute('id', 'sentinel');
  return li;
}
