'use strict';

var rawAssets = {
	lib: {
		css: [
			'public/lib/ngtoast/dist/ngToast.min.css'
		],
		js: [
			'public/lib/angular/angular.js',
			'public/lib/angular-resource/angular-resource.js', 
			'public/lib/angular-cookies/angular-cookies.js', 
			'public/lib/angular-animate/angular-animate.js', 
			'public/lib/angular-touch/angular-touch.js', 
			'public/lib/angular-sanitize/angular-sanitize.js', 
			'public/lib/angular-ui-router/release/angular-ui-router.js',
			'public/lib/angular-ui-utils/ui-utils.js',
			'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
			'public/lib/angular-local-storage/dist/angular-local-storage.js',
			'public/lib/moment/moment.js',
			'public/lib/angular-moment/angular-moment.js',
			'public/lib/ngtoast/dist/ngToast.min.js',
			'public/lib/angular-scroll/angular-scroll.js',
			'public/lib/angular-scroll-glue/src/scrollglue.js'
		]
	},
	css: [
		'public/css/**/*.css'
	],
	js: [
		'public/config.js',
		'public/application.js',
		'public/modules/*/*.js',
		'public/modules/*/*[!tests]*/*.js'
	],
	tests: [
		'public/lib/angular-mocks/angular-mocks.js',
		'public/modules/*/tests/*.js'
	]
};

module.exports = {
	app: {
		title: 'Tinderwick',
		description: 'Web interface for the popular Tinder dating app',
		keywords: 'Tinder'
	},
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	sessionSecret: 'tinderwIckedman',
	sessionCollection: 'sessions',
	assets: rawAssets, // Assets that get served
	compileAssets: rawAssets // Assets that get compiled in production
};