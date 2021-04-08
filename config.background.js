const Path = require('path');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
	mode : 'production',
	entry: './src/background.js',
	output: {
		filename: 'background.min.js',
		path: Path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new WebpackObfuscator ({ rotateStringArray: true })
	],
	performance: {
		hints: process.env.NODE_ENV === 'production' ? 'warning' : false
	}
};