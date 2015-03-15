'use strict';

/**
 * Module dependencies.
 */
var request = require('request');
var TINDER_HOST = 'https://api.gotinder.com';

exports.index = function(req, res) {
	res.render('index', {
		user: req.user || null,
		request: req
	});
};

exports.tinderProxy = function(req, res) {
	var path = req.path.replace(/^\/tinder/, '');
	var headers = {
		'User-Agent' : 'Tinder/4.0.9 (iPhone; iOS 7.1.1; Scale/2.00)',
		'os_version' : '123'
	};
	var query = req.query;
	if (query.authToken) {
		headers['X-Auth-Token'] = query.authToken;
		delete query.authToken;
	}
	
	var options = {
		url: TINDER_HOST + path,
		headers: headers,
		method: req.method,
		json: req.body,
		qs: query
	};

	request(options).pipe(res);
};
