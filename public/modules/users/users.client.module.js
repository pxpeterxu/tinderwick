'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users',
  ['LocalStorageModule', 'ngCookies', 'ngToast']);
