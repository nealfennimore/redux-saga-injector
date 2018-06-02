/* eslint-disable max-len */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import createSagaMiddleware, { delay } from 'redux-saga';
import { put, call, take } from 'redux-saga/effects';
import { applyMiddleware, createStore, compose } from 'redux';
import { connect } from 'react-redux';
import augment from '../store';

//
// ─── REDUCER ────────────────────────────────────────────────────────────────────
//

const INITIALIZE = 'INITIALIZE';

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
    } ),
    dispatch => ( {
        increment: ()=> dispatch( increment() ),
        initialize: ()=> dispatch( { type: INITIALIZE} )
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

class _IncrementOnMount extends Component {
    static propTypes = {
        initialize: PropTypes.func.isRequired,
        count: PropTypes.number.isRequired
    }

    componentWillMount() {
        this.props.initialize();
    }

    render() {
        return (
            <div>{this.props.count}</div>
        );
    }
}

export const IncrementOnMount = enhance( _IncrementOnMount );

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

export function* initializeThenIncrement() {
    yield take( INITIALIZE );
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
