'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core',
	['LocalStorageModule', 'angularMoment', 'ngToast', 'duScroll', 'luegg.directives']);
