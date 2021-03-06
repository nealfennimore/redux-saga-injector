
![Travis](https://img.shields.io/travis/nealfennimore/redux-saga-injector.svg)
[![codecov](https://codecov.io/gh/nealfennimore/redux-saga-injector/branch/master/graph/badge.svg)](https://codecov.io/gh/nealfennimore/redux-saga-injector)

# Redux Saga Injector

Inject sagas using sagas, in a small 3KB package. Automatically queues up and cancels sagas on both the server-side and client-side.

This package is intended to solve issues where sagas need to be injected dynamically, and then cancelled when they're no longer needed i.e. when a user goes to another page in a SPA. It prevents side effects from occuring when sagas use similar actions or logic.

Good for composing components with their needed business logic, such as in the case of using [react loadable](https://github.com/jamiebuilds/react-loadable) or [react universal component](https://github.com/faceyspacey/react-universal-component), or only running business logic on a single page.

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

### Manual Saga Injection

You can have more granular control over the injection and cancellation of sagas by dispatching actions.

The sagas to be injected need some sort of differentiator, so that they can be properly cancelled if needed.

```js
import { runSagas, cancelSagas } from '@nfen/redux-saga-injector/actions';
import { genUID } from '@nfen/redux-saga-injector/utils';
import * as sagas from './sagas';
import store from './store';

const sagasToInject = [ sagas.one, sagas.two, sagas.three ];
const sagasId = genUID();

store.dispatch( runSagas(sagasToInject, sagasId) );

// Do some stuff...

store.dispatch( cancelSagas(sagasId) );
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

### Use HOC with react-redux-injector

By utilizing our [sister package](https://github.com/nealfennimore/redux-reducer-injector), you can dynamically inject reducers and sagas on the fly.

```js
import { compose } from 'redux';
import { SagaInjector } from '@nfen/redux-saga-injector/components';
import { ReducerInjector } from '@nfen/redux-reducer-injector/components';
import MyComponent from './MyComponent';
import * as saga from './sagas';
import * as reducers from './reducers';

const injector = (options) => compose(
    SagaInjector(options),
    ReducerInjector(options),
);

export default injector( MyComponent );
```