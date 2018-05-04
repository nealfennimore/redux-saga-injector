const merge = require( 'webpack-merge' );
const config = require( '../common/webpack.config.client' );

module.exports = merge.strategy( {
    'module.rules': 'append',
    'plugins': 'append'
} )(
    config
);
