'use strict';

angular.module('core').controller('SettingsController',
		['$scope', 'Tinder', 'ngToast', '$location',
	function($scope, Tinder, ngToast, $location) {
		$scope.tinder = null;
		$scope.genderOptions = [
			{value: 0, label: 'Male'},
			{value: 1, label: 'Female'}
		];
		
		Tinder.ensureAuthToken(function(tinder) {
			$scope.tinder = tinder;
			
			tinder.getProfile(function(profile) {
				console.log(profile);
        
        profile.interestedInMen = false;
        for (var i = 0; i !== profile.interested_in.length; i++) {
          var interested = profile.interested_in[i];
          if (interested === 0) {
            profile.interestedInMen = true;
          } else if (interested === 1) {
            profile.interestedInWomen = true;
          }
        }
				$scope.profile = profile;
			});
		});
		
		$scope.save = function(valid) {
			if (!valid) return;
      
      // Check profile interested in
      var interests = [];
      if ($scope.profile.interestedInMen) {
        interests.push(0);
        $scope.profile.gender_filter = 0;
      }
      if ($scope.profile.interestedInWomen) {
        interests.push(1);
        $scope.profile.gender_filter = 1;
      }
      if (interests.length !== 1) {
        // None or both checkboxes: allow both men and women
        $scope.profile.gender_filter = -1;  
      }
      
			$scope.tinder.updateProfile($scope.profile, function(err, data) {
				if (err) {
					ngToast.create({
						content: err,
						class: 'danger'
					});
				} else {
					ngToast.create({
						content: 'Your settings have been saved.',
						class: 'success'
					});
					
					$location.path('/');
				}
			});
		};
	}
]);
