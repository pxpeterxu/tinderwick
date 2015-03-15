'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		// Home state routing
		$stateProvider.
		state('home', {
			url: '/home',
			templateUrl: 'modules/core/views/home.client.view.html'
		}).
		state('user', {
			url: '/user/:userId',
			templateUrl: 'modules/core/views/home.client.view.html'
		}).
		state('messages', {
			url: '/messages',
			templateUrl: 'modules/core/views/messages.client.view.html'
		}).
		state('match', {
			url: '/messages/:matchId',
			templateUrl: 'modules/core/views/messages.client.view.html'
		}).
		state('settings', {
			url: '/settings',
			templateUrl: 'modules/core/views/settings.client.view.html'
		});
	}
]);
