
![Travis](https://img.shields.io/travis/nealfennimore/redux-saga-injector.svg)
[![codecov](https://codecov.io/gh/nealfennimore/redux-saga-injector/branch/master/graph/badge.svg)](https://codecov.io/gh/nealfennimore/redux-saga-injector)

# Redux Saga Injector

Inject sagas using sagas, in a small 3KB package. Automatically queues up and cancels sagas on both the server-side and client-side.

## Installation

```sh
npm install @nfen/redux-saga-injector
# or
yarn add @nfen/redux-saga-injector
```

## Client Side

Components using the SagaInjector, will automatically run with this saga running on the client-side. Make sure to structure your code so that you're not running the `sagaRunner` on the server.

```js
import { spawn } from 'redux-saga/effects';
import { sagaRunner } from '@nfen/redux-saga-injector';

export default function* rootSaga() {
    yield spawn( sagaRunner );
}
```

## Server Side Rendering

This uses a queue in order to inject sagas for the server. Injected sagas are loaded in and then wait til they either finish, are cancelled, or timeout after 5 seconds.

### Setting up

First, update the store with the `augmentStore` function like so. It adds a couple of methods on the store that's used by the queueing system, and for sagas to automatically cancel.

```js
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { augmentStore } from '@nfen/redux-saga-injector';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(/* redux store arguments */);
augmentStoreForSagas( sagaMiddleware, store );
```

#### React Router 4 Example

This example utilizes express.js and async/await syntax

```js

const Application = ( {
    context,
    req,
    store,
} )=> (
    <Provider store={store}>
        <StaticRouter
            location={req.url}
            context={context}
        >
            {/* Your App here */}
            <App />
        </StaticRouter>
    </Provider>
);


async function render( req, res ){
    const store = createStore();
    const context = {};

    // Server saga listens for any injected sagas to finish
    const preload = store.runSaga( preloadQueue );

    // Start initial render to start sagas
    // This is a throwaway render
     ReactDOMServer.renderToString( <Application store={store} context={context} req={req} /> } );

    // Finish early if context was defined
    if( context.url ) {
        // End in progress sagas as we'll never finish render
        store.close();
        return res.redirect( 301, context.url );
    }

    // Proceed after preload saga finishes
    await preload.done;

    // Get markup with updated store
    const html = ReactDOMServer.renderToString( <Application store={store} context={context} req={req} /> } );

    // Send page to client
    res.send( html );
}
```

## React HOC Component

A higher order component is availble and can be used like so. It has two benefits:

- Keeps track of sagas it injects with a unique id, so many components can inject sagas on the same page (for SSR).
- Cancels the running sagas automatically when the component unmounts

```js
import { SagaInjector } from '@nfen/redux-saga-injector/components';
import MyComponent from './MyComponent';
import * as saga from './sagas';

const injector = SagaInjector({
    sagas: [
        saga.one,
        saga.two,
        saga.three
    ]
});

export default injector( MyComponent );
```


## TODO
- Branch out queueing system for easier use with those not using react for injecting sagas