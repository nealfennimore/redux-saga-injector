import { delay } from 'redux-saga/effects';
import * as sagas from '../utils';

describe( 'Utils', ()=>{
    test( 'timeout', ()=>{
        const gen = sagas.timeout( 5 );
        expect( gen.next().value ).toEqual(
            delay( 5 )
        );
        expect( gen.next().done ).toEqual( true );
    } );
} );
