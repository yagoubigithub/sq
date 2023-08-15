const path = require('path');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

/**
 * Custom angular webpack configuration
 */

module.exports = (config, options) => {
    config.target = 'electron-renderer';
    if (options.customWebpackConfig.target) {
        config.target = options.customWebpackConfig.target;
    } else if (options.fileReplacements) {
        for(let fileReplacement of options.fileReplacements) {
            if (fileReplacement.replace !== 'src/environments/environment.ts') {
                continue;
            }

            let fileReplacementParts = fileReplacement['with'].split('.');
            if (['dev', 'prod', 'test', 'electron-renderer'].indexOf(fileReplacementParts[1]) < 0) {
                config.target = fileReplacementParts[1];
            }
            break;
        }
	}

	config.resolve = {
		alias: {
			'typeorm': path.resolve(__dirname, "./node_modules/typeorm")
		},
		extensions: ['.js', '.ts']
	};

	Object.assign(config.externals = config.externals || {}, {
		'sqlite3': "require('electron').remote.require('sqlite3')",
		'axios': "require('electron').remote.require('axios')",
		'socket.io-client': "require('electron').remote.require('socket.io-client')",
		'sudo-prompt': "require('electron').remote.require('sudo-prompt')"
	});

	(config.plugins = config.plugins || []).push(
		new FilterWarningsPlugin({
			exclude: [ /react-native/ ]
		})
	);

    return config;
}
