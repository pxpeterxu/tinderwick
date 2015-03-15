'use strict';


angular.module('core').controller('MessagesController',
		['$scope', '$location', '$stateParams', '$document', 'Tinder', 'ngToast',
	function($scope, $location, $stateParams, $document, Tinder, ngToast) {
		$scope.tinder = null;
		$scope.data = null;
		$scope.curMatch = null;
		$scope.currentMessage = '';
		
		Tinder.ensureAuthToken(function(tinder) {
			$scope.tinder = tinder;
			
			var lastUpdate = Tinder.getLastUpdate();
			
			var updateCurMatch = function() {
				// Optionally update curMatch using the URL
				var matchId = $stateParams.matchId;
				if (matchId && $scope.data) {
					// Find it in the array
					for (var i = 0; i !== $scope.data.matches.length; i++) {
						var match = $scope.data.matches[i];
						if (match._id === matchId) {
							$scope.curMatch = match;
							break;
						}
					}
				}
			};
			
			if (lastUpdate) {
				$scope.data = lastUpdate;
				updateCurMatch();
			} else {
				tinder.getAllUpdates(function(data) {
					$scope.data = data;
					updateCurMatch();
				});
			}
			
			Tinder.updateListeners.messages = function(update, latestData) {
				$scope.data = latestData;
				
				// Modify curMatch so that it's updated as well
				if (!$scope.curMatch) return;
				for (var i = 0; i !== latestData.matches.length; i++) {
					var match = latestData.matches[i];
					if (match._id === $scope.curMatch._id) {
						$scope.curMatch = match;
					}
				}
			};
			
			$scope.$on('$destroy', function() {
				delete Tinder.updateListeners.messages;
			});
		});
		
		$scope.setCurMatch = function(match) {
			$document.scrollTop(0, 500);
			$location.path('/messages/' + match._id);
		};
		
		/**
		 * Listen for keypressed of the enter key in the message box,
		 * and send the message if it's the case.
		 */
		$scope.messageKeyHandler = function(e) {
			if (e.keyCode === 13 && !e.shiftKey) {
				$scope.sendMessage();
			}
		};
		
		$scope.sendMessage = function() {
			var message = $scope.curMatch.draftMessage;
			var matchId = $scope.curMatch._id;
			
			if (!message || message.length === 0 || !matchId) return;
			// No empty message sending
			
			$scope.curMatch.sendDisabled = true;
			$scope.tinder.sendMessage(matchId, message,
				function success(data) {
					$scope.curMatch.sendDisabled = false;
					$scope.curMatch.draftMessage = ''; // Clear message box
					// The server response is usually a new message. Add it to the match/messages
					$scope.curMatch.messages.push(data);
				},
				function error(errorData) {
					$scope.curMatch.sendDisabled = false;
					ngToast.create({
							content: 'We could not send your message; please try again later',
							class: 'danger'
						});
				});
		};
	}
]);
