const { resolve } = require( 'path' );

module.exports = {
    context: resolve( __dirname, '../..' ),
    output: {
        filename: '[name].js',
        chunkFilename: '[id].js'
    },
    resolve: {
        extensions: [ '.js', '.jsx', '.json', '.pcss' ]
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: [ 'babel-loader', ],
                exclude: /node_modules/
            }
        ]
    }
};
