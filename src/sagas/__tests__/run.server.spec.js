import { call } from 'redux-saga/effects';
import * as sagas from '../run';
import { timeout } from '../utils';

jest.mock( 'src/env', ()=>( {
    __BROWSER__: false,
    __SERVER__: true
} ) );

describe( 'timeout', ()=>{
    test( 'should timeout on server', ()=>{
        const gen = sagas.timeout( {sagaTimeout: 5000} );
        expect( gen.next().value ).toEqual( call( timeout, 5000 ) );
        expect( gen.next().value ).toEqual( put( END ) );
        expect( gen.next().done ).toEqual( true );
    } );
} );
