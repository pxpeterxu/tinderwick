'use strict';

var request = require('request');
var url = require('url');
var querystring = require('querystring');

function FacebookClient() {
	var _this = this;

	var FACEBOOK_ROOT = 'https://www.facebook.com';
	var HOME_URL = FACEBOOK_ROOT + '/';
	var OAUTH_URL = FACEBOOK_ROOT + '/dialog/oauth';
	var LOGIN_URL = FACEBOOK_ROOT + '/login.php';
	var SUCCESS_URL = FACEBOOK_ROOT + '/connect/login_success.html';
	
	// Set user-agent
	this.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0';
	
	// Cookie jar
	var jar = request.jar();
	
	/**
	 * Get default request options, including headers and cookie jar
	 */
	var getRequestOptions = function() {
		return {
			jar: jar,
			headers: {
				'User-Agent': _this.userAgent
			}
		};
	};
	
	/**
	 * Try to get the OAuth token for a particular client app.
	 * @param {number} the ID of the client
	 * @param {(string|string[])} list of permissions we need
	 * @param {function} function to be called on success, which is passed
	 *									 the access token and expires_in that Facebook provides
	 */
	this.oauth = function(clientId, scope, callback) {
		scope = Array.isArray(scope) ? scope.join(',') : scope;
		
		// Setup the request
		var options = getRequestOptions();
		options.url = OAUTH_URL;
		options.followRedirect = false;
		options.qs = {
			client_id: clientId,
			scope: scope,
			redirect_uri: SUCCESS_URL,
			response_type: 'token'
		};
		
		request.get(options, function(error, response, body) {
			if (response.headers.location) {
				// Redirects
				var loc = response.headers.location;
				
				// To the redirect we provided
				if (loc.indexOf(SUCCESS_URL) !== -1) {
					var resolved = url.parse(loc);
					var qs = querystring.parse(resolved.hash.substring(1));
					
					// Success!
					callback(null, qs.access_token, qs.expires_in);

				} else if (loc.indexOf(LOGIN_URL) !== -1) {
					// To the login page
					callback('You are not logged in: call .login(username, password) first');

				} else {
					callback('We failed with an unknown error. Please contact the administrator.');
				}
			} else {
				callback('Your account doesn\'t seem to have authorized the app. Authorize it first!');
			}
		});
	};
	
	/**
	 * Try to login to Facebook
	 * @param {string} username, or email, or phone number to login with
	 * @param {string} password to login with
	 * @param {function} callback({null|string} error, {number} facebookId) on login response
	 */
	this.login = function(email, password, callback) {
		var first = getRequestOptions();
		first.url = LOGIN_URL;
		
		// Get a particular hidden field
		function getField(name, body) {
			var regexText = 'name="' + name + '" value="([^"]*)';
			return body.match(new RegExp(regexText))[1];
		}
		
		request.get(first, function(error, response, body) {
			var lsd = getField('lsd', body);
			var lgnrnd = getField('lgnrnd', body);
			var lgnjs = getField('lgnjs', body);
			
			// Get ready for the actual login
			var options = getRequestOptions();
			options.url = LOGIN_URL;
			options.followRedirect = false;
			options.form = {
				lsd: lsd,
				lgnrnd: lgnrnd,
				trynum: 1,
				email: email,
				pass: password
			};
			request.post(options, function(error, response, body) {
				if (response.headers.location && response.headers.location.search(HOME_URL) !== -1) {
					// Search through the cookies for the User ID
					var userId = null;
					response.headers['set-cookie'].forEach(function(cookie) {
						var matches = cookie.match(/c_user=(\d+)/);
						if (matches) {
							userId = +matches[1];
						}
					});
					
					callback(null, userId);
				} else {
					callback('Failed to sign in: please check your email/Facebook ID and password. We also currently don\'t support Login Approvals, if you\'ve turned that on.');
				}
			});
		});
	};
}

module.exports.FacebookClient = FacebookClient;
