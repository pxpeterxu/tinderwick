'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$cookies', '$location', '$http',
	function($cookies, $location, $http) {
		var redirectToSignin = function() {
			$location.path('/signin');
		};
		
		/**
		 * Log in to Facebook and get the Tinder auth token, as well as
		 * save the username and password (if requested) if successful
		 * @param username
		 * @param password
		 * @param persist   whether to save the username and password in cookies
		 * @param success   success callback
		 * @param error     error callback
		 */
		var login = function(username, password, persist, success, error) {
			$http.post('/auth/signin',
					{ username: username, password: password }).success(function(response) {
				if (persist) {
					$cookies.username = username;
					$cookies.password = password;
				}
				
				// If successful we assign the response to the global user model
				$cookies.authToken = response.authToken;
				$cookies.expireTime = (new Date()).getTime() / 1000 +
					parseInt(response.expiresIn, 10);
				$cookies.facebookId = response.facebookId;
				
				if (success) {
					success(response);
				}
			}).error(function(response) {
				if (error) {
					error(response.message);
				}
			});
		};
		
		/**
		 * Returns an object with authToken, facebookId
		 */
		var getAuthData = function() {
			return {
				authToken: $cookies.authToken,
				facebookId: $cookies.facebookId
			};
		};
		
		/**
		 * Checks if we're already logged in. Returns true if we have
		 * a Facebook auth token and it's not expired.
		 */
		var isLoggedIn = function() {
			var now = (new Date()).getTime() / 1000;
			return $cookies.authToken && now < $cookies.expireTime;
		};
		
		/**
		 * Use credentials saved in cookies to ensure that we're logged in,
		 * and if they don't work, redirect to the signin page
		 * @param callbackOnceLoggedIn  callback that's called with the Facebook login data
		 */
		var ensureLoggedIn = function(callbackOnceLoggedIn, redirect) {
			redirect = typeof redirect === 'undefined' ? true : redirect;

			if (isLoggedIn()) {
				// We're logged in and have the auth token
				callbackOnceLoggedIn(getAuthData());
				return;
			}
			
			if ($cookies.username && $cookies.password) {
				// We have the username and password
				// Try doing another login procedure to get the tokens
				login($cookies.username, $cookies.password, false,
					function success(response) {
						if (callbackOnceLoggedIn) {
							callbackOnceLoggedIn(getAuthData());
						}
					},
					function failure(response) {
						delete $cookies.username; // They're wrong. Unset them
						delete $cookies.password;
						if (redirect) {
							console.log('Failed getting Facebook Auth token');
							redirectToSignin();
						}
					}
				);
			} else {
				if (redirect) {
					redirectToSignin();
				}
			}
		};
		
		/**
		 * Sign out by clearing all cookies
		 */
		var signOut = function() {
			delete $cookies.username;
			delete $cookies.password;
			delete $cookies.authToken;
			delete $cookies.expireTime;
			
			redirectToSignin();
		};
		
		
		return {
			login: login,
			ensureLoggedIn: ensureLoggedIn,
			isLoggedIn: isLoggedIn,
			redirectToSignin: redirectToSignin,
			signOut: signOut
		};
	}
]);
