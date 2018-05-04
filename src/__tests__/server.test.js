import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware, { delay } from 'redux-saga';
import { put, call } from 'redux-saga/effects';
import * as actions from 'src/actions/sagas';
import * as sagas from '../sagas/queue';

const INCREMENT = 'INCREMENT';
const increment = ()=> ( {
    type: INCREMENT
} );

const createReducer = ()=>{
    return function testReducer( state, action ) {
        switch ( action.type ) {
        case INCREMENT:
            return {
                count: ++state.count
            };
        default:
            return state;
        }
    };
};

function* incrementSaga() {
    yield put( increment() );
}

function* delayedIncrementSaga() {
    yield call( delay, 6000 );
    yield call( incrementSaga );
}

const createuids = ( amount )=>  Array( amount ).fill( 0 ).map( ( v,k )=>`uid${k}` );

describe( 'server integration', ()=>{
    let store, reducer, sagaMiddleware;
    beforeEach( ()=>{
        reducer = createReducer();
        sagaMiddleware = createSagaMiddleware();
        store = createStore(
            reducer,
            { count: 0 },
            compose( applyMiddleware( sagaMiddleware ) )
        );
    } );

    test( 'should handle no sagas', async()=>{
        const serverQueue = sagaMiddleware.run( sagas.serverQueueSaga );
        store.dispatch(
            actions.runSagas( [], 'uid' )
        );
        await serverQueue.done;
        expect( store.getState() ).toEqual( {count: 0} );
    } );
    test( 'should finish server queue', async()=>{
        const serverQueue = sagaMiddleware.run( sagas.serverQueueSaga );
        store.dispatch(
            actions.runSagas( [
                incrementSaga,
                incrementSaga,
                incrementSaga
            ], 'uid' )
        );
        store.dispatch(
            actions.sagasFinished( 'uid' )
        );
        await serverQueue.done;
        expect( store.getState() ).toEqual( {count: 3} );
    } );
    test( 'should finish server queue until all queues are finished', async()=>{
        const serverQueue = sagaMiddleware.run( sagas.serverQueueSaga );
        const uids = createuids( 3 );

        uids.forEach( ( uid )=>{
            store.dispatch(
                actions.runSagas( [
                    incrementSaga
                ], uid )
            );
        } );
        uids.forEach( ( uid )=>{
            store.dispatch(
                actions.sagasFinished( uid )
            );
        } );
        await serverQueue.done;
        expect( store.getState() ).toEqual( {count: 3} );
    } );
    test( 'should finish server queue until all queues are finished or cancelled', async()=>{
        const serverQueue = sagaMiddleware.run( sagas.serverQueueSaga );
        const uids = createuids( 2 );

        uids.forEach( ( uid )=>{
            store.dispatch(
                actions.runSagas( [
                    incrementSaga
                ], uid )
            );
        } );

        store.dispatch(
            actions.runSagas( [
                delayedIncrementSaga
            ], 'uid2' )
        );

        uids.forEach( ( uid )=>{
            store.dispatch(
                actions.sagasFinished( uid )
            );
        } );

        store.dispatch(
            actions.cancelSagas( 'uid2' )
        );
        await serverQueue.done;
        expect( store.getState() ).toEqual( {count: 2} );
    } );
    test( 'should finish server queue when all sagas are cancelled', async()=>{
        const serverQueue = sagaMiddleware.run( sagas.serverQueueSaga );
        const uids = createuids( 3 );

        uids.forEach( ( uid )=>{
            store.dispatch(
                actions.runSagas( [
                    delayedIncrementSaga
                ], uid )
            );
        } );

        uids.forEach( ( uid )=>{
            store.dispatch(
                actions.cancelSagas( uid )
            );
        } );

        await serverQueue.done;
        expect( store.getState() ).toEqual( {count: 0} );
    } );
} );
