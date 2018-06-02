/* eslint-disable max-len */
import React from 'react';
import PropTypes from 'prop-types';
import createSagaMiddleware, { delay } from 'redux-saga';
import { put, call } from 'redux-saga/effects';
import { applyMiddleware, createStore, compose } from 'redux';
import { connect } from 'react-redux';
import augment from '../store';

//
// ─── REDUCER ────────────────────────────────────────────────────────────────────
//

const INCREMENT = 'INCREMENT';
export const increment = ()=> ( {
    type: INCREMENT
} );

export const createReducer = ()=>{
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

//
// ─── COMPONENTS ─────────────────────────────────────────────────────────────────
//

const enhance = connect(
    state => ( {
        count: state.count
    } )
);

const _ShowCount = ( {
    count
} ) =>{
    return (
        <div>{count}</div>
    );
};

_ShowCount.propTypes = {
    count: PropTypes.number.isRequired,
};

export const ShowCount = enhance( _ShowCount );

//
// ─── SAGAS ──────────────────────────────────────────────────────────────────────
//

export function* incrementSaga() {
    yield put( increment() );
}

export function* delayedIncrementSaga( timeout = 3000 ) {
    yield call( delay, timeout );
    yield call( incrementSaga );
}

//
// ─── STORE ──────────────────────────────────────────────────────────────────────
//


export default function StoreFactory() {
    const reducer = createReducer();
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        reducer,
        { count: 0 },
        compose( applyMiddleware( sagaMiddleware ) )
    );
    augment( sagaMiddleware, store );
    return store;
}
