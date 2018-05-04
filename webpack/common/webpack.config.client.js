const { resolve } = require( 'path' );
const merge = require( 'webpack-merge' );
const common = require( './webpack.config' );

module.exports = merge(
    common,
    {
        name: 'lib',
        target: 'node',
        output: {
            path: resolve( __dirname, '../../dist' ),
            library: 'redux-saga-injector',
            filename: 'redux-saga-injector.js',
            libraryTarget: 'umd',
            umdNamedDefine: true
        },
        entry: {
            main: [
                './src/index.js',
                './src/components/index.js',
            ]
        },
        externals: [
            {
                react: 'react',
                'prop-types': 'prop-types',
                redux: 'redux',
            },
            /^redux-saga*/
        ],
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    use: [ 'babel-loader', ],
                    exclude: /node_modules/
                }
            ]
        }
    }
);
