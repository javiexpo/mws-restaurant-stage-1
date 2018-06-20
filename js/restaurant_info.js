let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}
/**
 * Handle  Online and Offline events
 */
window.ononline = () => {
  console.log('User went Online from restaurant_info.js');
  DBHelper.syncPendingReviewWithServer();
}

window.onoffline = () => {
console.log('User went Offline');
}

/**
 * Get the viewport width
 */
getViewportWidth = () => Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();

      DBHelper.fetchRestaurantReviewsById(id, (error, reviews) => {
        self.restaurant.reviews = reviews;
        if (!reviews) {
          console.error(error);
          callback(null, self.restaurant);
        }
        fillReviewsHTML();
        callback(null, self.restaurant);
      });
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label', restaurant.name);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label', restaurant.address);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = `Image of ${restaurant.name} Restaurant`;
  image.setAttribute('aria-label', restaurant.name);
  
  let imgUrl = DBHelper.imageUrlForRestaurant(restaurant); 
  let viewPortWidth = 360
  if (getViewportWidth() > 400) {
    viewPortWidth = 800
  }
  //imgUrl = imgUrl.replace(`.jpg`, `-${viewPortWidth}.jpg`)
  imgUrl = imgUrl.concat(`-${viewPortWidth}.jpg`);
  image.src = imgUrl;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    let openHours = operatingHours[key];
    openHours = openHours.replace('-', 'to');
    //time.innerHTML = operatingHours[key];
    time.innerHTML = openHours;
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  // const title = document.createElement('h4');
  // title.innerHTML = 'Reviews';
  // title.setAttribute('tabindex', 0);
  // container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!... Do you want to be the first? :)';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex',0);
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('aria-label', `Person name ${review.name}`);
  name.setAttribute('class', 'reviewListName');
  li.appendChild(name);

  const reviewDate = new Date(review.updatedAt);
  const date = document.createElement('p');
  date.setAttribute('aria-label', `Review date ${reviewDate.toDateString()}`);
  date.setAttribute('class', 'reviewListDate');
  date.innerHTML = reviewDate.toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute('class', 'reviewListRating');
  rating.setAttribute('aria-label', `Rating value ${review.rating}`);
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute('class', 'reviewListReview');
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Functions to handle POST Reviews
 */
const formReview = document.getElementById('review-form');
formReview.addEventListener('submit', function(e){
  //console.log(e);
  e.preventDefault();
  submitReview(e);
});

submitReview = (event) => {
  const userName = document.getElementById('userName').value;
  const userRating = document.getElementById('userRating').value;
  const userComments = document.getElementById('userComments').value;
  const reviewContent = {
    "restaurant_id": parseInt(self.restaurant.id),
    "name": userName,
    "rating": parseInt(userRating),
    "comments": userComments
  };
  
  if (navigator.onLine) {
    DBHelper.saveReviewForRestaurantInServer(reviewContent, appendReviewToList); 
  } else {
    DBHelper.savePendingReviewForRestaurantInIDB(reviewContent, appendReviewToList);
  }
}

appendReviewToList = (review) => {
  //console.log('appendReviewToList');
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  clearFormData();
}

clearFormData = () => {
  document.getElementById('userName').value = '';
  document.getElementById('userRating').value = '';
  document.getElementById('userComments').value = '';
}