/* eslint-disable import/prefer-default-export */
import { call, delay } from 'redux-saga/effects';

/**
 * Timeout
 * @export
 * @param {number} duration Duration of timeout
 */
export function* timeout( duration ) {
    return yield call( delay, duration );
}
