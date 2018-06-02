import PropTypes from 'prop-types';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { Provider } from 'react-redux';
import createStore from '../__fixtures__/store';
import { preloadQueue } from '../sagas/queue';

const Application = ( {
    store,
    children,
} )=> (
    <Provider store={store}>
        { children }
    </Provider>
);

Application.propTypes = {
    store: PropTypes.shape( {} ).isRequired,
    children: PropTypes.node.isRequired,
};


const renderMarkup = ( App, {store} )=> (
    ReactDOMServer.renderToString(
        <Application store={store}>
            <App store={store} />
        </Application>
    )
);

export default function render( App, store, req, res, options ) {
    return async function() {
        // Server saga listens for any injected sagas to finish
        const preload = store.runSaga( preloadQueue, options );

        // Start initial render to start sagas
        // This is a throw away render
        renderMarkup( App, { store } );

        // Proceed after preload saga finishes
        await preload.done;

        // Get markup with updated store
        const html = renderMarkup( App, { store } );

        res.send( `
            <!DOCTYPE html>
            <html>
                <head>
                </head>
                <body>
                    <div id="app">${html}</div>
                </body>
            </html>
        ` );
    };
}
