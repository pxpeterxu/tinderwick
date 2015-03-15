'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');
var facebook = require('./helpers/facebook.server.controller');
var TINDER_CLIENT = '464891386855067';
var TINDER_PERMISSIONS = 'basic_info';

/**
 * Authentication: just try to get the token from Facebook
 */
exports.signin = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	
	if (!username || !password) {
		res.status(400).json({ message: 'Please enter a username and password' });
		return;
	}
	
	var client = new facebook.FacebookClient();
	client.login(username, password, function(error, facebookId) {
		if (error) {
			res.status(400).json({ message: error });
			return;
		}
		
		client.oauth(TINDER_CLIENT, TINDER_PERMISSIONS, function(error, authToken, expiresIn) {
			if (error) {
				res.status(400).json({ message: error });
				return;
			}
			
			res.json({
				message: 'You have successfully logged in to your Tinder account!',
				authToken: authToken,
				expiresIn: expiresIn,
				facebookId: facebookId
			});
		});
	});
};
