import { TASK } from '@redux-saga/symbols';
import { call, take, all, race, put, cancel, takeEvery } from 'redux-saga/effects';
import * as actions from 'src/actions/sagas';
import { timeout as timeoutSaga } from 'src/sagas/utils';
import { __BROWSER__ } from 'src/env';
import defaultOptions from './options';

/**
 * Determine if redux saga task
 *
 * @param {Object} task Task object
 * @returns Boolean
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
    yield cancel( [...tasks] );
}

/**
 * Run all sagas by `call`
 *
 * @export
 * @param {Array} sagas Array of generator functions
 * @returns Array
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
 * @param {string} uid Unique ID
 * @param action Received action
 * @param {string} [action.type] Action type
 * @param {Array} [action.sagas] Array of sagas
 * @param {string} [action.uid] Unique id
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
 * @param {string} uid Unique ID
 */
export function* watchCancellation( uid ) {
    while ( true ) {
        const action = yield take( actions.CANCEL_SAGAS );
        if( yield call( isValidCancel, uid, action ) ) {
            break;
        }
    }
}

/**
 * Timeout function
 *
 * @export
 * @param options Options
 * @param {number} [options.sagaTimeout] Timeout duration
 */
export function* timeout( options ) {
    // Never timeout when browser
    if ( __BROWSER__ ) {
        return yield take( '__NEVER_END__' );
    }
    yield call( timeoutSaga, options.sagaTimeout );
    yield put( END );
}

/**
 * Run injected sagas
 *
 * @export
 * @param options Options
 * @param {number} [options.sagaTimeout] Timeout duration
 * @param action Received action
 * @param {string} [action.type] Action type
 * @param {Array} [action.sagas] Array of sagas
 * @param {string} [action.uid] Unique ID
 */
export function* _runSagas( options, action ) {
    try {
        const result = yield race( {
            sagas: call( runAll, action.sagas ),
            cancelled: call( watchCancellation, action.uid ),
            timeout: call( timeout, options ),
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
 * Wrapper for _runSagas
 * @description Ensures options are always the first argument
 * @param args
 */
export function* runSagas( ...args ) {
    if( args.length === 1 ) {
        args.unshift( defaultOptions );
    }
    return yield call( _runSagas, ...args );
}

/**
 * Run sagas on the client
 *
 * @export
 * @param options Options
 * @param {number} [options.sagaTimeout] Timeout duration
 */
export function* sagaRunner( options = defaultOptions ) {
    yield takeEvery( actions.RUN_SAGAS, runSagas, options );
}
