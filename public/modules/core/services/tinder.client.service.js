'use strict';

//Menu service used for managing  menus
angular.module('core').service('Tinder',
	['$http', '$interval', 'Authentication', 'localStorageService',
	function($http, $interval, Authentication, localStorageService) {
		var tinderClient;
		
		/**
		 * Get an auth token from Facebook
		 */
		var auth = function(authKey, facebookId, success, error) {
			$http.post('/tinder/auth', {
        facebook_token: authKey,
        facebook_id: facebookId
      }).success(function(data, status, headers, config) {
				var authToken = data.token;
				tinderClient = new TinderClient(authToken);
				
				if (success) {
					success(tinderClient);
				}
			}).error(function(data, status, headers, config) {
				if (error) {
					error(data, status, headers, config);
				}
			});
		};
		
		/**
		 * Ensure that we're authenticated, and redirect to the signin page
		 * if needed.
		 * @param callback	callback that gets passed the auth token
		 */
		var ensureAuthToken = function(callback) {
			if (tinderClient) {
				callback(tinderClient);
			}
			
			Authentication.ensureLoggedIn(function onLoggedIn(data) {
				auth(data.authToken, data.facebookId, function(tinderClient) {
					callback(tinderClient);
				}, Authentication.redirectToSignin);
			});
		};
		
		/**
		 * Get the TinderClient object only if we're logged in, or false
		 * otherwise
		 */
		var getTinderClient = function() {
			return tinderClient;
		};
		
		var TinderClient = function(authToken) {
			var _this = this;
			
			var recommendations = localStorageService.get('recommendations') || [];
      
      var clearRecommendationsCache = function() {
        recommendations = [];
        localStorageService.clearAll();
      };
			
			/**
			 * Get one recommendation's data; uses a buffer
			 * @param callback  callback that will be passed one result
			 */
			this.getRecommendation = function(callback) {
				if (recommendations.length === 0) {
					$http.get('/tinder/user/recs', {
						params: { limit: 10, authToken: authToken }
					}).success(function(data, status, headers, config) {
						recommendations = data.results;
						localStorageService.set('recommendations', recommendations);
						callback(recommendations.shift());
					});
				} else {
					localStorageService.set('recommendations', recommendations);
					callback(recommendations.shift());
				}
			};
			
			var likeOrPass = function(action, userId, callback) {
				$http.get('/tinder/' + action + '/' + userId,
					{ params: { authToken: authToken } }
				).success(function(data, status, header, config) {
					console.log(data);
					if (callback) {
						if ('match' in data) {
							callback(data.match);
						} else {
							callback();
						}
					}
				}).error(function(data, status, header, config) {
					console.log('error');
					console.log(data);
				});
			};
			
      /**
       * Like (swipe right) on a user
       */
			this.like = function(userId, callback) {
				likeOrPass('like', userId, callback);
			};
			
      /**
       * Pass (swipe left) on a user
       */
			this.pass = function(userId, callback) {
				likeOrPass('pass', userId, callback);
			};
			
			var getUpdates = function(lastActivity, callback) {
				var options = lastActivity ?
					{ last_activity_date: lastActivity.toISOString() } : null;
				
				$http.post('/tinder/updates', options, { params: { authToken: authToken } }).
					success(function(data, status, header, config) {
						// Get all user IDs mentioned in the matches
						// var userIds = [];
						// for (var i = 0; i < data.matches.length; i++) {
							// user
						// }
						callback(data);
					}).
					error(function(data, status, header, config) {
						console.log(data);
						console.log(status);
					});
			};
			
			this.getAllUpdates = function(callback) {
				getUpdates(null, callback);
			};
			
			this.getUpdatesSince = getUpdates;
			
			/**
			 * Get own profile, including settings
			 */
			this.getProfile = function(callback) {
				$http.get('/tinder/profile', { params: { authToken: authToken } }).
					success(function(data, status, header, config) {
            clearRecommendationsCache();
						callback(data);
					}).
					error(function(data, status, header, config) {
						console.log(data);
					});
			};
			
			this.updateProfile = function(profile, callback) {
				var postParams = {
					age_filter_min: profile.age_filter_min,
					age_filter_max: profile.age_filter_max,
					distance_filter: profile.distance_filter,
					gender: profile.gender,
					bio: profile.bio,
          gender_filter: profile.gender_filter,
          interested_in: profile.interested_in
				};
				console.log(postParams);
				$http.post('/tinder/profile',
					postParams,
					{ params: { authToken: authToken } }).
					success(function(data, status, header, config) {
						callback(null, data);
            console.log(data);
					}).
					error(function(data, status, header, config) {
						callback('There was an error trying to update your Tinder settings; please try again later.');
						console.log(data);
					});
			};
      
      this.sendMessage = function(matchId, message, callback, errorCallback) {
        $http.post('/tinder/user/matches/' + matchId,
					{ message: message },
					{ params: { authToken: authToken } }).
					success(function(data, status, header, config) {
						console.log(data);
						if (callback) {
							callback(data);
						}
					}).
					error(function(data, status, header, config) {
						if (errorCallback) {
							errorCallback(data);
						}
						console.log(data);
					});
      };
			
			this.getUser = function(userId, callback, error) {
				$http.get('/tinder/user/' + userId, { params: { authToken: authToken } }).
					success(function(data, status, header, config) {
						if (callback) {
							callback(data);
						}
					}).
					error(function(data, status, header, config) {
						if (error) {
							error(data);
						}
					});
			};
			
			this.test = function() {
				// $http.get('/tinder/profile', { params: { authToken: authToken } }).
					// success(function(data, status, header, config) {
						// console.log(data);
					// }).
					// error(function(data, status, header, config) {
						// console.log(data);
					// });
			};
		};
		
		var signOut = function() {
			localStorageService.clearAll();
			tinderClient = null;
			Authentication.signOut();
		};
		
		/**
		 * Update listeners: this will repeatedly ask for updates, and when received,
		 * incorporate them into the original matches and call callbacks
		 */
		var lastUpdateTime = null;
		var lastUpdate = null;
		var updateListeners = {}; // Only listens to UPDATES, not the first data pull
		var completeUpdateListeners = {}; // Listens to ALL updates, includng the first data pull
		
		var triggerCompleteUpdateListeners = function() {
			angular.forEach(completeUpdateListeners, function(fn, name) {
				fn(lastUpdate, lastUpdateTime);
			});
		};
		
		var triggerUpdateListeners = function(newestUpdate) {
			angular.forEach(updateListeners, function(fn, name) {
				fn(newestUpdate, lastUpdate, lastUpdateTime);
			});
			triggerCompleteUpdateListeners();
		};
		
		var repeatedUpdates = $interval(function() {
			if (!tinderClient) {
				// We've logged out; reset
				lastUpdate = null;
				lastUpdateTime = null;
				return;
			}
			
			if (!updateListeners) return; // Don't update if no listeners
			
			var prevUpdateTime = lastUpdateTime;
			lastUpdateTime = new Date();
			
			tinderClient.getUpdatesSince(prevUpdateTime, function(data) {
				if (!lastUpdate) {
					// First update
					lastUpdate = data;
					triggerCompleteUpdateListeners();
				} else if (data.matches.length !== 0) {
					// Add the new messages for each match
					for (var i = 0; i < data.matches.length; i++) {
						var match = data.matches[i];
						var existingMatch = null;
						
						// Find the existing match with this ID
						for (var j = 0; j < lastUpdate.matches.length; j++) {
							if (lastUpdate.matches[j]._id === match._id) {
								existingMatch = lastUpdate.matches[j];
								break;
							}
						}
						
						// No existing match: add it
						if (!existingMatch) {
							lastUpdate.matches.push(match);
						} else {
							// Get list of existing messages so that we don't duplicate any
							var existingMessages = {};
							for (var k = 0; k < existingMatch.messages.length; k++) {
								existingMessages[existingMatch.messages[k]._id] = true;
							}
							
							for (var m = 0; m < match.messages.length; m++) {
								var message = match.messages[m];
								if (!existingMessages[message._id]) {
									existingMatch.messages.push(message);
								}
							}
							
							// Update the last_activity_date
							existingMatch.last_activity_date = match.last_activity_date;
						}
					}
					
					// Only triggered for updates, rather than for first messages
					triggerUpdateListeners(data);
				}
			});
			
		}, 2000);
		
		var getLastUpdate = function() {
			return lastUpdate;
		};
		
		return {
			auth: auth,
			ensureAuthToken: ensureAuthToken,
			getTinderClient: getTinderClient,
			signOut: signOut,
			updateListeners: updateListeners,
			completeUpdateListeners: completeUpdateListeners,
			getLastUpdate: getLastUpdate
		};
	}
]);
