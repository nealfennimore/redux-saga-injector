import { delay } from 'redux-saga';
import { call, take, put, spawn, cancel, takeEvery } from 'redux-saga/effects';
import * as actions from 'src/actions/sagas';
import { runSagas } from 'src/sagas/run';


/**
 * Adds a uid to the queue
 *
 * @export
 * @param {Set} queue
 * @param {Object} action
 */
export function addToQueue( queue, action ) {
    queue.add( action.uid );
}

/**
 * Removes a uid to the queue
 *
 * @export
 * @param {Set} queue
 * @param {Object} action
 */
export function removeFromQueue( queue, action ) {
    queue.delete( action.uid );
}

/**
 * Starts up running the sagas if there are any
 *
 * @export
 * @param {Set} queue
 * @param {Object} action
 */
export function* startup( queue, action ) {
    if( action.sagas.length ) {
        yield call( addToQueue, queue, action );
        yield spawn( runSagas, action );
    }
}

/**
 * Removes an item from the queue and dispatches when empty
 *
 * @export
 * @param {Set} queue
 * @param {Object} action
 */
export function* waitTilEmpty( queue, action ) {
    yield call( removeFromQueue, queue, action );
    if( ! queue.size ) {
        yield put( actions.queueEmpty() );
    }
}

/**
 * Creates a queue
 *
 * @export
 * @returns Set
 */
export function createQueue() {
    return new Set();
}

/**
 * Saga for server side rendering
 * Creates a queue, runs sagas, and completes when queue is empty
 *
 * @export
 */
export function* serverQueueSaga() {
    const queue = yield call( createQueue );
    const runTask = yield takeEvery( actions.RUN_SAGAS, startup, queue );
    const emptyTask = yield takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], waitTilEmpty, queue );

    // Give time to receive sagas
    yield call( delay, 0 );

    // Receive no more sagas
    yield cancel( runTask );

    // If we have a queue, then wait til all sagas finish or are cancelled
    if( queue.size ) {
        yield take( actions.QUEUE_EMPTY );
    }

    // Clean up remaining task
    yield cancel( emptyTask );

    // Done
}
