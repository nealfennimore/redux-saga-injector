import { call, take, put, fork, spawn, cancel, takeEvery } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import * as actions from 'src/actions/sagas';
import { runSagas } from 'src/sagas/run';
import defaultOptions from './options';

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
 * Starts running the sagas if there are any
 *
 * @export
 * @param {Set} queue
 * @param {Object} action
 */
export function* queueSagaRunner( queue, action ) {
    if( action.sagas.length ) {
        yield call( addToQueue, queue, action );
        // This needs to be spawn in order to
        // prevent hanging with an attached 'fork'
        return yield spawn( runSagas, action );
    }
}

/**
 * Removes an item from the queue and dispatches when empty
 *
 * @export
 * @param {Set} queue
 * @param {Object} action
 */
export function* queueEmptier( queue, action ) {
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
 * @param options Options
 * @param {number} [options.preloadTimeout] Timeout duration
 * @export
 */
export function* preloadQueue( options = defaultOptions ) {
    const queue = yield call( createQueue );

    // Start watching for RUN_SAGAS actions
    const runTask = yield takeEvery( actions.RUN_SAGAS, queueSagaRunner, queue );

    // Start watching for finished or cancel actions
    const emptyTask = yield takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], queueEmptier, queue );

    // Give a delay for preloading
    yield call( delay, options.preloadTimeout );

    // Receive no more sagas
    yield cancel( runTask );

    // If we have still have items in the queue, then wait til all sagas finish or are cancelled
    if( queue.size ) {
        yield take( actions.QUEUE_EMPTY );
    }

    // Clean up remaining task
    yield cancel( emptyTask );

    // Done
}
