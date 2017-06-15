/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */
var path = require('path');

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	config.extraPlugins = 'eqneditor,easykeymap,mathjax,widget,lineutils,widgetselection,base64image';
	config.mathJaxLib = '../../node_modules/mathjax/MathJax.js?config=TeX-AMS_HTML';
	config.removeButtons = 'Image';
};
