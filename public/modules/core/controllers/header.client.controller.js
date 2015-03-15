'use strict';

angular.module('core').controller('HeaderController',
	['$scope', '$location', '$document', 'Authentication', 'Tinder', 'Menus', 'ngToast',
	function($scope, $location, $document, Authentication, Tinder, Menus, ngToast) {
    // Used for logged in icons
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');
		$scope.hasNewMessage = false;

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
		
		// Keep checking for updates, and if we've received any change the 
		// color of the messages notification icon
		Tinder.updateListeners.header = function(update, data) {
			// Only trigger on other people's messages
			// 1. Get the match person ID for each match
			var i, j;
			var personForMatch = {};
      var match;
			for (i = 0; i !== data.matches.length; i++) {
				match = data.matches[i];
				personForMatch[match._id] = match.person._id;
			}
			
			for (i = 0; i !== update.matches.length; i++) {
				match = update.matches[i];
				for (j = 0; j !== match.messages.length; j++) {
					var matchedPerson = personForMatch[match._id];
					if (match.messages[j].from === matchedPerson) {
						// Not our own message; message from match
						$scope.hasNewMessage = true;
					}
				}
			}
		};
		
		//
		// Messaging and matches popovers
		//
    
		$scope.lastUpdate = null;
		$scope.curMatch = null;
		$scope.showMatches = false;
		// Listen for updates to populate the matches popover
		Tinder.completeUpdateListeners.matches = function(data) {
			$scope.lastUpdate = data;
				
			// Modify curMatch so that it's updated as well
			if (!$scope.curMatch) return;
			for (var i = 0; i !== data.matches.length; i++) {
				var match = data.matches[i];
				if (match._id === $scope.curMatch._id) {
					$scope.curMatch = match;
				}
			}
		};
		
		$scope.messageButtonClicked = function($event) {
			$scope.hasNewMessage = false;
			$scope.showMatches = !$scope.showMatches;
			// Allow clicking the button again to hide it
			
			$event.stopPropagation();
		};
		
    // Show messages box
    $scope.setCurMatch = function(match) {
			$scope.curMatch = match;
			$scope.showMatches = false; // Hide the matches box
      //$location.path('/user/' + match.person._id);
    };
		
		// Hide matches box when clicked outside
		$document.on('click', function() {
			$scope.showMatches = false;
			$scope.$apply();
		});
		
		$scope.$on('$destroy', function() {
			delete Tinder.updateListeners.header;
			delete Tinder.completeUpdateListeners.matches;
		});
		
		/**
		 * Listen for keypressed of the enter key in the message box,
		 * and send the message if it's the case.
		 */
		$scope.messageKeyHandler = function(e) {
			if (e.keyCode === 13 && !e.shiftKey) {
				$scope.sendMessage();
			}
			e.stopPropagation();
			// Stopping propagation
		};

		$scope.sendMessage = function() {
			var message = $scope.curMatch.draftMessage;
			var matchId = $scope.curMatch._id;
			
			if (!message || message.length === 0 || !matchId) return;
			// No empty message sending
			
			$scope.curMatch.sendDisabled = true;
			
			var tinderClient = Tinder.getTinderClient();
			tinderClient.sendMessage(matchId, message,
				function success(data) {
					var curMatch = $scope.curMatch;
					curMatch.sendDisabled = false;
					curMatch.draftMessage = ''; // Clear message box
					// The server response is usually a new message. Add it to the match/messages
					
					var message = data;
					
					var annotateMatch = function(match) {
						match.messages.push(message);
						match.last_activity_date = message.sent_date;
					};
					annotateMatch(curMatch);
					
					// var matches = $scope.lastUpdate.matches;
					// for (var i = 0; i !== matches.length; i++) {
						// var match = matches[i];
						// if (match._id === $scope.curMatch._id) {
							// annotateMatch(match);
						// }
					// }
				},
				function error(errorData) {
					$scope.curMatch.sendDisabled = false;
					ngToast.create({
							content: 'We could not send your message; please try again later',
							class: 'danger'
						});
				});
		};
		
		$scope.signOut = function() {
			$scope.hasNewMessage = false;
			$scope.showMatches = false;
			$scope.curMatch = null;
			
			ngToast.create({
				content: 'Signed out!',
				class: 'success'
			});
			Tinder.signOut();
		};
	}
]);