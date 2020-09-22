/* eslint-disable import/prefer-default-export */
import { delay } from 'redux-saga/effects';

/**
 * Timeout
 * @export
 * @param {number} duration Duration of timeout
 */
export function* timeout( duration ) {
    return yield delay( duration );
}
