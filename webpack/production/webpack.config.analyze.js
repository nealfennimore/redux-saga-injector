const BundleAnalyzerPlugin = require( 'webpack-bundle-analyzer' ).BundleAnalyzerPlugin;
const merge = require( 'webpack-merge' );
const config = require( './webpack.config.client' );

module.exports = merge.strategy( {
    'plugins': 'append'
} )(
    config,
    {
        plugins: [
            new BundleAnalyzerPlugin()
        ]
    }
);
