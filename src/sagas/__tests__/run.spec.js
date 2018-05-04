import { call, take, all, race, put, cancel, takeEvery } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import * as actions from 'src/actions/sagas';
import * as sagas from '../run';

const sagaGenerator = ( mockFn )=>{
    return function* () {
        yield call( mockFn );
    };
};

describe( 'Run Utils', ()=>{
    let uid, action;
    beforeEach( ()=>{
        uid  = 'uid';
        action = {
            type: actions.CANCEL_SAGAS,
            uid
        };
    } );

    test( 'isValidCancel', ()=>{
        expect( sagas.isValidCancel( uid, action ) ).toEqual( true );
        expect( sagas.isValidCancel( 'uid1', action ) ).toEqual( false );
        expect( sagas.isValidCancel( uid, { uid, type: '' } ) ).toEqual( false );
    } );
    test( 'isTask', ()=>{
        expect( sagas.isTask( createMockTask() ) ).toEqual( true );
        expect( sagas.isTask( {} ) ).toEqual( false );
    } );
} );

describe( 'Sagas', ()=>{
    let uid, mockFn, _sagas;
    beforeEach( ()=>{
        uid = 'uid';
        mockFn = jest.fn();

        _sagas = [
            sagaGenerator( mockFn ),
            sagaGenerator( mockFn ),
            sagaGenerator( mockFn ),
        ];
    } );

    describe( 'cancelTask', ()=>{
        test( 'should cancel task', ()=>{
            const tasks = [
                createMockTask(),
                createMockTask(),
            ];

            const gen = sagas.cancelTasks( tasks );

            expect( gen.next().value ).toEqual(
                cancel( ...tasks )
            );
        } );
        test( 'should only cancel tasks', ()=>{
            const tasks = [
                {},
                createMockTask(),
                createMockTask(),
            ];

            const gen = sagas.cancelTasks( tasks );

            expect( gen.next().value ).toEqual(
                cancel( ...tasks.slice( 1 ) )
            );
        } );
    } );

    describe( 'watchCancellation', ()=>{
        test( 'should stop when cancelled', ()=>{
            const gen = sagas.watchCancellation( uid );
            const action = actions.cancelSagas( uid );
            expect( gen.next().value ).toEqual( take( actions.CANCEL_SAGAS ) );
            expect( gen.next( action ).value ).toEqual( call( sagas.isValidCancel, uid, action ) );
            expect( gen.next( true ).done ).toEqual( true );
        } );
    } );

    describe( 'runAll', ()=>{
        test( 'should run all sagas', ()=>{

            const gen = sagas.runAll( _sagas );
            expect( gen.next().value ).toEqual(
                all(
                    _sagas.map( saga => call( saga ) )
                )
            );
            expect( gen.next().done ).toEqual( true );
        } );
    } );

    describe( 'runSagas', ()=>{
        test( 'should call sagas', ()=>{
            const gen = sagas.runSagas( {sagas, uid} );
            expect( gen.next( mockFn ).value ).toEqual(
                race( {
                    sagas: call( sagas.runAll, sagas ),
                    cancelled: call( sagas.watchCancellation, uid ),
                    timeout: call( sagas.timeout )
                } )
            );
            expect( gen.next( {sagas: true} ).value ).toEqual(
                put( actions.sagasFinished( uid ) )
            );
            expect( gen.next( {sagas: true} ).done ).toEqual( true );
        } );
        test( 'should be cancelled', ()=>{
            const gen = sagas.runSagas( {sagas, uid} );
            expect( gen.next( mockFn ).value ).toEqual(
                race( {
                    sagas: call( sagas.runAll, sagas ),
                    cancelled: call( sagas.watchCancellation, uid ),
                    timeout: call( sagas.timeout )
                } )
            );
            expect( gen.next( {cancelled: true} ).value ).toEqual(
                call( sagas.cancelTasks, sagas )
            );
            expect( gen.next().value ).toEqual(
                put( actions.cancelSagas( uid ) )
            );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should timeout', ()=>{
            const gen = sagas.runSagas( {sagas, uid} );
            expect( gen.next( mockFn ).value ).toEqual(
                race( {
                    sagas: call( sagas.runAll, sagas ),
                    cancelled: call( sagas.watchCancellation, uid ),
                    timeout: call( sagas.timeout )
                } )
            );
            expect( gen.next( {timeout: true} ).value ).toEqual(
                call( sagas.cancelTasks, sagas )
            );
            expect( gen.next().value ).toEqual(
                put( actions.cancelSagas( uid ) )
            );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should handle errors', ()=>{
            const gen = sagas.runSagas( {sagas, uid} );
            expect( gen.next( mockFn ).value ).toEqual(
                race( {
                    sagas: call( sagas.runAll, sagas ),
                    cancelled: call( sagas.watchCancellation, uid ),
                    timeout: call( sagas.timeout )
                } )
            );
            expect( gen.throw( 'error' ).value ).toEqual(
                put( actions.cancelSagas( uid ) )
            );
            expect( gen.next().done ).toEqual( true );
        } );
    } );

    describe( 'timeout', ()=>{
        test( 'should never timeout on browser', ()=>{
            const gen = sagas.timeout();
            expect( gen.next().value ).toEqual( take( '__NEVER_END__' ) );
            expect( gen.next().done ).toEqual( true );
        } );
    } );

    describe( 'clientSaga', ()=>{
        test( 'should listen for saga runs', ()=>{
            const gen = sagas.clientSaga();
            expect( gen.next().value ).toEqual( takeEvery( actions.RUN_SAGAS, sagas.runSagas ) );
            expect( gen.next().done ).toEqual( true );
        } );
    } );
} );
