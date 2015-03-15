'use strict';

angular.module('users').controller('AuthenticationController', [
	'$scope', '$location', 'Authentication', '$cookies', 'ngToast',
	function($scope, $location, Authentication, $cookies, ngToast) {
		$scope.authentication = Authentication;
		$scope.credentials = {};

		// If user is signed in then redirect back home
		if ($scope.authentication.authToken) $location.path('/');

		$scope.signin = function() {
			$scope.isProcessing = true;
			delete $scope.error;
			
			Authentication.login($scope.credentials.username, $scope.credentials.password,
				false,
				function success(response) {
					$scope.isProcessing = false;
					ngToast.create({
						content: 'Signed in!',
						class: 'success'
					});
					$location.path('/home');
				},
				function failure(error) {
					$scope.isProcessing = false;
					$scope.error = error;
				});
		};
	}
]);
