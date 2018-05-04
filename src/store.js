import { END } from 'redux-saga';
import { curry } from './utils/fp';

export function augmentStore( sagaMiddleware, store ) {
    store.runSaga = sagaMiddleware.run;
    store.close = ()=> store.dispatch( END );
    return store;
}

export default curry( augmentStore );
