import { delay } from 'redux-saga';
import { call, take, put, spawn, cancel, fork, race, takeEvery } from 'redux-saga/effects';
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
 * Starts running the sagas if there are any
 *
 * @export
 * @param {Set} queue
 * @param {Object} action
 */
export function* queueSagaRunner( queue, action ) {
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
 * Timeout for 5ms
 * @export
 */
export function* timeout() {
    return yield delay( 5 );
}

/**
 * Starts up queue
 * Loops until no more RUN_SAGAS are received
 * @export
 * @param {Set} queue
 */
export function* startQueue( queue ) {
    while ( true ) {
        const { runAction } = yield race( {
            runAction: yield take( actions.RUN_SAGAS ),
            timedOut: yield call( timeout )
        } );
        if( runAction ) {
            yield fork( queueSagaRunner, queue, runAction );
        } else {
            break; // Finish
        }
    }
}

/**
 * Saga for server side rendering
 * Creates a queue, runs sagas, and completes when queue is empty
 *
 * @export
 */
export function* preloadQueue() {
    const queue = yield call( createQueue );

    // Start watching for finished or cancel actions
    const emptyTask = yield takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], queueEmptier, queue );

    // Start queue and proceed after receiving all RUN_SAGAS actions
    yield call( startQueue, queue );

    // If we have still have items in the queue, then wait til all sagas finish or are cancelled
    if( queue.size ) {
        yield take( actions.QUEUE_EMPTY );
    }

    // Clean up remaining task
    yield cancel( emptyTask );

    // Done
}
