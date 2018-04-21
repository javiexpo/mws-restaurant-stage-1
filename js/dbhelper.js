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

  static get REMOTE_SERVER_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get IDB_DATABASE_VERSION() { return 1; }
  static get IDB_DATABASE_NAME() { return 'rest-info-db'; }
  static get IDB_STORE_NAME() { return 'rest-info'; }
  
  static get IDB_PROMISE() {
    //Constructor and Getter for the IndexDB promise
    return idb.open(DBHelper.IDB_DATABASE_NAME,DBHelper.IDB_DATABASE_VERSION,function(upgradeDb){
      let store = upgradeDb.createObjectStore(DBHelper.IDB_STORE_NAME, {
        keyPath: 'id'
      });
      store.createIndex('by-name', 'name');
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchRestaurantsFromIDB(callback);
    /* fetch(DBHelper.REMOTE_SERVER_URL).then(function(response) {
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
    }); */

    /*let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json.restaurants;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();*/
  }

  static saveRestaurantsInIDB(restaurants) {
    DBHelper.IDB_PROMISE.then(function(db){
      let tx = db.transaction(DBHelper.IDB_STORE_NAME,'readwrite');
      let store = tx.objectStore(DBHelper.IDB_STORE_NAME);
      restaurants.forEach(function(rest){
        store.put(rest);
      });
    });
  }

  static fetchRestaurantsFromIDB(callback) {
    DBHelper.IDB_PROMISE.then(function(db){
      let indexStore = db.transaction(DBHelper.IDB_STORE_NAME)
                          .objectStore(DBHelper.IDB_STORE_NAME)
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
    fetch(DBHelper.REMOTE_SERVER_URL).then(function(response) {
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
    
    // fetch all restaurants with proper error handling.
    /*DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });*/
  }

  static fetchRestaurantsByIDFromIDB(id, callback) {
    DBHelper.IDB_PROMISE.then(function(db){
      let store = db.transaction(DBHelper.IDB_STORE_NAME)
                          .objectStore(DBHelper.IDB_STORE_NAME);
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
    fetch(`${DBHelper.REMOTE_SERVER_URL}/${id}`).then(function(response) {
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

}
