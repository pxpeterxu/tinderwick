'use strict';

angular.module('core').run(['$rootScope', '$location', function ($rootScope, $location) {
	var history = [];

	$rootScope.$on('$locationChangeSuccess', function() {
		history.push($location.$$path);
	});

	$rootScope.back = function() {
		var prevUrl = history.length > 1 ? history.splice(-2)[0] : '/';
		$location.path(prevUrl);
	};
	
	$rootScope.hasBack = function() {
		return history.length > 1;
	};
}]);
