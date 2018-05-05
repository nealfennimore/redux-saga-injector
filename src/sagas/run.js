import { delay, END } from 'redux-saga';
import { call, take, all, race, put, cancel, takeEvery } from 'redux-saga/effects';
import { TASK } from 'redux-saga/utils';
import * as actions from 'src/actions/sagas';
import { __BROWSER__ } from 'src/env';

/**
 * Determine if redux saga task
 *
 * @param {Object} task
 */
export function isTask( task ) {
    return !! ( typeof task === 'object' && task[TASK] );
}

/**
 * Cancel any saga that returns a task
 * Mostly intended for cancelling fork/spawn
 *
 * @export
 * @param {Array} sagas array of sagas
 */
export function* cancelTasks( sagas ) {
    const tasks = sagas.filter( isTask );
    yield cancel( ...tasks );
}

/**
 * Run all sagas by `call`
 *
 * @export
 * @param {Array} sagas Array of generator functions
 * @returns {Array}
 */
export function* runAll( sagas ) {
    return yield all(
        sagas.map( saga => call( saga ) )
    );
}

/**
 * Tell if an action is a valid cancel based on the uid
 *
 * @export
 * @param {String} uid
 * @param {Object} action
 * @returns {Boolean}
 */
export function isValidCancel( uid, action ) {
    return action.type === actions.CANCEL_SAGAS &&
    action.uid === uid;
}

/**
 * Watches until sagas based on uid are cancelled
 *
 * @export
 * @param {String} uid
 */
export function* watchCancellation( uid ) {
    while ( true ) {
        const action = yield take( actions.CANCEL_SAGAS );
        const isCancelled = yield call( isValidCancel, uid, action );
        if( isCancelled ) {
            break;
        }
    }
}

/**
 * Timeout function
 *
 * @export
 */
export function* timeout() {
    // Never timeout when browser
    if ( __BROWSER__ ) {
        return yield take( '__NEVER_END__' );
    }
    yield call( delay, 5000 );
    yield put( END );
}

/**
 * Run injected sagas
 *
 * @export
 * @param {Object} action
 */
export function* runSagas( action ) {
    try {
        const result = yield race( {
            sagas: call( runAll, action.sagas ),
            cancelled: call( watchCancellation, action.uid ),
            timeout: call( timeout ),
        } );
        if( result.sagas ) {
            yield put( actions.sagasFinished( action.uid ) );
        } else {
            yield call( cancelTasks, action.sagas );
            yield put( actions.cancelSagas( action.uid ) );
        }
    } catch ( error ) {
        yield put( actions.cancelSagas( action.uid ) );
    }
}


/**
 * Run sagas on the client
 *
 * @export
 */
export function* sagaRunner() {
    yield takeEvery( actions.RUN_SAGAS, runSagas );
}
