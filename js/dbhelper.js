/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

  static get REMOTE_RESTAURANTS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REMOTE_REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  static get IDB_DATABASE_VERSION() { return 1; }
  static get IDB_DATABASE_NAME() { return 'rest-info-db'; }
  static get IDB_STORE_REST_INFO() { return 'rest-info'; }
  static get IDB_STORE_REST_REVIEW() { return 'rest-review'; }
  static get IDB_STORE_REST_REVIEW_PENDING() { return 'rest-review-pending'; }
  
  static get IDB_PROMISE() {
    //Constructor and Getter for the IndexDB promise
    return idb.open(DBHelper.IDB_DATABASE_NAME,DBHelper.IDB_DATABASE_VERSION,function(upgradeDb){
      let storeRestInfo = upgradeDb.createObjectStore(DBHelper.IDB_STORE_REST_INFO, {
        keyPath: 'id'
      });
      storeRestInfo.createIndex('by-name', 'name');
      let storeRestReview = upgradeDb.createObjectStore(DBHelper.IDB_STORE_REST_REVIEW, {
        keyPath: 'id'
      });
      let storeRestReviewPending = upgradeDb.createObjectStore(DBHelper.IDB_STORE_REST_REVIEW_PENDING, {
        keyPath: 'id',
        autoincrement: true
      });
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchRestaurantsFromIDB(callback);
  }

  static saveRestaurantsInIDB(restaurants) {
    DBHelper.IDB_PROMISE.then(function(db){
      let tx = db.transaction(DBHelper.IDB_STORE_REST_INFO,'readwrite');
      let store = tx.objectStore(DBHelper.IDB_STORE_REST_INFO);
      restaurants.forEach(function(rest){
        store.put(rest);
      });
    });
  }

  static fetchRestaurantsFromIDB(callback) {
    DBHelper.IDB_PROMISE.then(function(db){
      let indexStore = db.transaction(DBHelper.IDB_STORE_REST_INFO)
                          .objectStore(DBHelper.IDB_STORE_REST_INFO)
                          .index('by-name');
      indexStore.getAll().then(function(restaurants){
        if(restaurants && restaurants.length > 0)
          callback(null, restaurants);
        else
          DBHelper.fetchRestaurantsFromServer(callback);
      });
    });
  }

  static fetchRestaurantsFromServer(callback) {
    fetch(DBHelper.REMOTE_RESTAURANTS_URL).then(function(response) {
      if(response.ok) {
        return response.json();
      } else {
        callback('Restaurants not found', null);
      }
    }).then(function(restaurants) {
      DBHelper.saveRestaurantsInIDB(restaurants);
      callback(null, restaurants);
    }).catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      callback(error.message, null);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch restaurant by Id from IndexDb if is not then fetch from remote server
    DBHelper.fetchRestaurantsByIDFromIDB(id, callback);
  }

  static fetchRestaurantsByIDFromIDB(id, callback) {
    DBHelper.IDB_PROMISE.then(function(db){
      let store = db.transaction(DBHelper.IDB_STORE_REST_INFO)
                          .objectStore(DBHelper.IDB_STORE_REST_INFO);
      store.getAll().then(function(restaurants){
        if(restaurants && restaurants.length > 0) {
          let restaurant;
          restaurants.forEach(function(rest){
            if (rest.id == id)
              restaurant = rest;
          })
          if(restaurant)
            callback(null, restaurant);
          else
            DBHelper.fetchRestaurantsByIDFromServer(id,callback);  
        } else {
          DBHelper.fetchRestaurantsByIDFromServer(id,callback);
        }
      });
    });
  }

  static fetchRestaurantsByIDFromServer(id, callback) {
    fetch(`${DBHelper.REMOTE_RESTAURANTS_URL}/${id}`).then(function(response) {
      if(response.ok) {
        return response.json();
      } else {
        callback('Restaurant does not exist', null);
      }
    }).then(function(restaurant) {
      callback(null, restaurant);
    }).catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      callback('Sorry there has been a problem, please try again later', null);
    });
  }


  static toggleRestaurantFavoriteById(id, callback) {
    // fetch restaurant by Id from IndexDb if is not then fetch from remote server
    DBHelper.fetchRestaurantsByIDFromIDB(id, (error, restaurant) => {
      if (!restaurant) {
        console.error(error);
        callback(error, null);
        return;
      }

      if (restaurant.is_favorite) {
        restaurant.is_favorite = false;
      } else {
        restaurant.is_favorite = true;
      }

      DBHelper.IDB_PROMISE.then(function(db){
        let tx = db.transaction(DBHelper.IDB_STORE_REST_INFO,'readwrite');
        let store = tx.objectStore(DBHelper.IDB_STORE_REST_INFO);
        store.put(restaurant);
        callback(null, restaurant);
        return tx.complete; 
      }).then(function(restaurant){
          console.log('fetchPUTFavoriteRestaurant');
      });

      this.fetchPUTFavoriteRestaurant(restaurant);
    });
  }

  static fetchPUTFavoriteRestaurant(rest){
    var request = new Request(`${DBHelper.REMOTE_RESTAURANTS_URL}/${rest.id}/?is_favorite=${rest.is_favorite}`, {
	    method: 'PUT', 
	    mode: 'cors'
    });

    // headers: new Headers({
    //   'Content-Type': 'text/plain'
    // })

    fetch(request).then(function(responseObj) { 
      if (responseObj.ok) {
        console.log('fetchPUTFavoriteRestaurant succceed');
      } else {
        return responseObj.error;
      }
    }).then(function(error){
      if(error)
        console.log(error);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Favorite Restaurant URL.
   */
  static urlForFavoriteRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static fetchRestaurantReviewsById(id, callback) {
    // fetch restaurant by Id from IndexDb if is not then fetch from remote server
    DBHelper.fetchRestaurantReviewsByIDFromIDB(id, callback);
  }

  static fetchRestaurantReviewsByIDFromIDB(id, callback) {
    DBHelper.IDB_PROMISE.then(function(db){
      let store = db.transaction(DBHelper.IDB_STORE_REST_REVIEW)
                          .objectStore(DBHelper.IDB_STORE_REST_REVIEW);
      store.getAll().then(function(reviews){
        if(reviews && reviews.length > 0) {
          let restReviews = [];
          reviews.forEach(function(rev){
            if (rev.restaurant_id == id)
              restReviews.push(rev);
          })
          if(restReviews.length > 0)
            callback(null, restReviews);
          else
            DBHelper.fetchRestaurantReviewsByIDFromServer(id,callback);  
        } else {
          DBHelper.fetchRestaurantReviewsByIDFromServer(id,callback);
        }
      });
    });
  }

  static fetchRestaurantReviewsByIDFromServer(id, callback) {
    fetch(`${DBHelper.REMOTE_REVIEWS_URL}/?restaurant_id=${id}`).then(function(response) {
      if(response.ok) {
        return response.json();
      } else {
        callback('No reviews yet!', null);
      }
    }).then(function(restaurantReviews) {
      DBHelper.saveRestaurantReviewsInIDB(restaurantReviews);
      callback(null, restaurantReviews);
    }).catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      callback('Sorry there has been a problem, please try again later', null);
    });
  }

  static saveRestaurantReviewsInIDB(restaurantReviews) {
    DBHelper.IDB_PROMISE.then(function(db){
      let tx = db.transaction(DBHelper.IDB_STORE_REST_REVIEW,'readwrite');
      let store = tx.objectStore(DBHelper.IDB_STORE_REST_REVIEW);
      restaurantReviews.forEach(function(review){
        store.put(review);
      });
    });
  }

  static savePendingReviewForRestaurantInIDB(review, callback) {
    review.id = 0;
    DBHelper.IDB_PROMISE.then(function(db){
      let tx = db.transaction(DBHelper.IDB_STORE_REST_REVIEW_PENDING,'readwrite');
      let store = tx.objectStore(DBHelper.IDB_STORE_REST_REVIEW_PENDING);
      store.put(review);
      callback(review);
    });
  }

  static syncPendingReviewWithServer() {
    DBHelper.IDB_PROMISE.then(function(db){
      let store = db.transaction(DBHelper.IDB_STORE_REST_REVIEW_PENDING)
                          .objectStore(DBHelper.IDB_STORE_REST_REVIEW_PENDING);
      store.getAll().then(function(pendingReviews){
        if(pendingReviews && pendingReviews.length > 0) {
          pendingReviews.forEach(function(pendingReview){
            const reviewContent = {
              "restaurant_id": pendingReview.restaurant_id,
              "name": pendingReview.name,
              "rating": pendingReview.rating,
              "comments": pendingReview.comments
            };
            DBHelper.saveReviewForRestaurantInServer(reviewContent, function(review){
              if(review && review.id != 0) {
                //Delete record from Pending Review Table
                DBHelper.deletePendingReviewInIDB(pendingReview);
              }
            });
          });
        }
      });
    });
  }

  static deletePendingReviewInIDB(pendingReview) {
    DBHelper.IDB_PROMISE.then(function(db){
      let tx = db.transaction(DBHelper.IDB_STORE_REST_REVIEW_PENDING,'readwrite');
      let store = tx.objectStore(DBHelper.IDB_STORE_REST_REVIEW_PENDING);
      store.delete(pendingReview.id);
    });
  }

  static saveReviewForRestaurantInIDB(review, callback) {
    DBHelper.IDB_PROMISE.then(function(db){
      let tx = db.transaction(DBHelper.IDB_STORE_REST_REVIEW,'readwrite');
      let store = tx.objectStore(DBHelper.IDB_STORE_REST_REVIEW);
      store.put(review);
      if (callback)
        callback(review);
    });
  }

  static saveReviewForRestaurantInServer(review, callback) {
    fetch(`${DBHelper.REMOTE_REVIEWS_URL}/`, {
	    method: 'POST', 
	    body: JSON.stringify(review),
	    headers: new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
	    })
    }).then(function(resp) {
      return resp.json();
    }).then(function(reviewWithId){
      console.log('reviewWithId', reviewWithId);
      DBHelper.saveReviewForRestaurantInIDB(reviewWithId,callback);
    });
  }

}
