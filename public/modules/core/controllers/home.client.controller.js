'use strict';


angular.module('core').controller('HomeController',
		['$scope', '$location', '$stateParams', '$document', '$window', 'Authentication', 'Tinder', 'ngToast', '$cookies',
	function($scope, $location, $stateParams, $document, $window, Authentication, Tinder, ngToast, $cookies) {
		$scope.tinder = null;
		
		//
		// Functions for getting next recommendation, passing, liking
		//
		
		// Set a user as the current user in the UI
		var setCurUser = function(user) {
				
			user.age = Math.floor((new Date() - new Date(user.birth_date)) /
				(1000 * 60 * 60 * 24 * 365.25));
			
			// Placeholders until we get data back from Facebook
			$scope.common_likes = [];
			$scope.common_friends = [];
			
			$scope.user = user;
			setCurPhoto(user.photos[0]);
			
			// Get the list of Facebook IDs
			var fbIds = user.common_likes.concat(user.common_friends);
			
			if (fbIds.length !== 0) {
				/* global FB */
				FB.api('/?fields=name,picture&ids=' + fbIds.join(','), function(response) {
					var likes = [], friends = [];
					angular.forEach(user.common_likes, function(id) {
						likes.push(response[id]);
					});
					angular.forEach(user.common_friends, function(id) {
						friends.push(response[id]);
					});
					
					$scope.common_likes = likes;
					$scope.common_friends = friends;
					
					$scope.$apply();
				});
			}
		};
		
		var nextRec = function() {
			$scope.user = null;
			
			$scope.tinder.getRecommendation(function processRec(rec) {
				setCurUser(rec);
			});
		};
		
		var like = function() {
			if ($scope.disableActions) return; // If viewing profiles, disabled
			
			$scope.tinder.like($scope.user._id, (function() {
				var name = $scope.user.name;
				return function(match) { // Need to create closure for previous match
					if (match) {
						ngToast.create({
							content: '<strong>You matched with ' + name + '!</strong> ' +
								'Go to <a href="/#!/messages">your messages</a> and start a conversation.',
							class: 'success'
						});
					}
				};
			})());				

			ngToast.create({
				content: 'Liked <strong>' + $scope.user.name + '</strong>',
				class: 'success'
			});
			nextRec();
		};
		
		var pass = function() {
			if ($scope.disableActions) return; // If viewing profiles, disabled
			
			$scope.tinder.pass($scope.user._id);
			ngToast.create({
				content: 'Passed <strong>' + $scope.user.name + '</strong>',
				class: 'danger'
			});
			nextRec();
		};
		
		var setCurPhoto = function(photo) {
			$scope.curPhoto = photo;
		};
		
		//
		// User action handling, including button presses and keyboard actions
		//
		
		var keys = [
			['q', 0],
			['w', 1],
			['a', 2],
			['s', 3],
			['z', 4],
			['x', 5],
			['e', 6],
			['r', 7],
			['d', 8],
			['f', 9]
		];
		var keyMap = {}, reverseKeyMap = {};
		for (var i = 0; i < keys.length; i++) {
			var keyChar = keys[i][0];
			var index = keys[i][1];
			keyMap[keyChar] = index;
			reverseKeyMap[index] = keyChar;
		}
		
		$scope.reverseKeyMap = reverseKeyMap;
		
		// Handle left or right keypresses so that they're equivalent
		// to swiping left or right
		var keyHandler = function(e) {
			if ($scope.user) {
				var keyChar = String.fromCharCode(e.keyCode || e.which).toLowerCase();
				if (keyChar in keyMap) {
					var index = keyMap[keyChar];
					if (index < $scope.user.photos.length) {
						setCurPhoto($scope.user.photos[index]);
						$scope.$apply(); // This keypress handler might not trigger digests
					}
				}
				
				if (e.keyCode === 37) { // Left arrow
					pass();
				}
				if (e.keyCode === 39) {
					like();
				}
			}
		};
		$document.on('keydown', keyHandler);
		$scope.$on('$destroy', function(){
			$document.off('keydown', keyHandler);
		});
		
		
		// Handle swiping with the buttons so that they show a hint
		$scope.like = function() {
			if (!$cookies.seenLikeMessage) {
				ngToast.create({
					content: 'You can also <strong>use the → (right arrow) key</strong> to like someone!',
					class: 'info',
					timeout: 7000
				});
				$cookies.seenLikeMessage = true;
			}
			like();
		};
		
		$scope.pass = function() {
			if (!$cookies.seenPassMessage) {
				ngToast.create({
					content: 'You can also <strong>use the ← (left arrow) key</strong> to pass someone!',
					class: 'info',
					timeout: 7000
				});
				$cookies.seenPassMessage = true;
			}
			pass();
		};
		
		$scope.setCurPhoto = function(photo) {
			if (!$cookies.seenPhotoMessage) {
				ngToast.create({
					content: 'You can also <strong>use the keys on pictures (e.g., q, w, a, s, etc.)</strong> to view a particular picture!',
					class: 'info',
					timeout: 7000
				});
				$cookies.seenPhotoMessage = true;
			}
			setCurPhoto(photo);
		};
		
		//
		// Actual initialization code
		//
		
		Tinder.ensureAuthToken(function(tinder) {
			$scope.tinder = tinder;
			
			if ($stateParams.userId) {
        // We're viewing a profile rather than viewing our recommendations
				tinder.getUser($stateParams.userId, function(data) {
					setCurUser(data.results);
					$scope.disableActions = true;
				});

			} else {
				nextRec();
			}
		});
	}
]);
