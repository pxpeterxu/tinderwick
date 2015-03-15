'use strict';

module.exports = {
	assets: {
		lib: {
			js: [],
			css: []
		},
		js: ['public/dist/application.min.js'],
		css: ['public/dist/application.min.css']
	},
	app: {
		title: 'tinderwick - Tinder in your browser'
	},
	port: process.env.PORT || 40080
};
