'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function($stateProvider) {
		// Users state routing
		$stateProvider.
		state('signin', {
			url: '/',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		}).
    state('signin2', {
			url: '/signin',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		})
	}
]);