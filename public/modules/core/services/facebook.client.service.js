'use strict';

//Menu service used for managing  menus
angular.module('core').service('Tinder',
	['$http', '$cookies', 'Authentication', 'localStorageService',
	function($http, $cookies, Authentication, localStorageService) {
		var authToken;
		
		/**
		 * Get an auth token from Facebook
		 */
		var auth = function(authKey, facebookId, success, error) {
			$http.post('/tinder/auth', {
        facebook_token: authKey,
        facebook_id: facebookId
      }).success(function(data, status, headers, config) {
				authToken = data.token;
				if (success) {
					success(authToken);
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
			if (authToken) {
				callback(new TinderClient(authToken));
			}
			
			Authentication.ensureLoggedIn(function onLoggedIn(data) {
				console.log('here');
				auth(data.authToken, data.facebookId, function(authToken) {
					console.log('success');
					callback(new TinderClient(authToken));
				}, Authentication.redirectToSignin);
			});
		};
		
		var TinderClient = function(authToken) {
			var _this = this;
			
			var recommendations = localStorageService.get('recommendations') || [];
			
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
					{ params: { authToken: authToken }}
				).success(function(data, status, header, config) {
					console.log(data);
					if (callback) {
						callback(data.match);
					}
				});
			};
			
			this.like = function(userId, callback) {
				likeOrPass('like', userId, callback);
			};
			
			this.pass = function(userId, callback) {
				likeOrPass('pass', userId, callback);
			};
		};
		
		return {
			auth: auth,
			ensureAuthToken: ensureAuthToken
		};
	}
]);
