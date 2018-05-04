import { delay, END } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import * as sagas from '../run';

jest.mock( 'src/env', ()=>( {
    __BROWSER__: false,
    __SERVER__: true
} ) );

describe( 'timeout', ()=>{
    test( 'should timeout on server', ()=>{
        const gen = sagas.timeout();
        expect( gen.next().value ).toEqual( call( delay, 5000 ) );
        expect( gen.next().value ).toEqual( put( END ) );
        expect( gen.next().done ).toEqual( true );
    } );
} );
