import { delay } from 'redux-saga';
import { call } from 'redux-saga/effects';
import * as sagas from '../utils';

describe( 'Utils', ()=>{
    test( 'timeout', ()=>{
        const gen = sagas.timeout( 5 );
        expect( gen.next().value ).toEqual(
            call( delay, 5 )
        );
        expect( gen.next().done ).toEqual( true );
    } );
} );
