import { delay } from 'redux-saga';
import { call, take, put, spawn, cancel, takeEvery } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import { runSagas } from 'src/sagas/run';
import * as actions from 'src/actions/sagas';
import * as sagas from '../queue';

describe( 'Queue Utils', ()=>{
    let queue, uid, action;
    beforeEach( ()=>{
        queue = new Set();
        uid  = 'uid';
        action = { uid };
    } );

    test( 'createQueue', ()=>{
        expect( sagas.createQueue() ).toBeInstanceOf( Set );
    } );

    test( 'addToQueue', ()=>{
        sagas.addToQueue( queue, action );
        expect( queue.has( uid ) ).toEqual( true );
        expect( queue.size ).toEqual( 1 );
    } );
    test( 'removeFromQueue', ()=>{
        sagas.addToQueue( queue, action );
        expect( queue.has( uid ) ).toEqual( true );
        expect( queue.size ).toEqual( 1 );
        sagas.removeFromQueue( queue, action );
        expect( queue.has( uid ) ).toEqual( false );
        expect( queue.size ).toEqual( 0 );
    } );
} );

describe( 'Queue Sagas', ()=>{
    let queue, uid, action;
    beforeEach( ()=>{
        queue = new Set();
        uid  = 'uid';
        action = { uid, sagas: [jest.fn()] };
    } );

    describe( 'startup', ()=>{
        test( 'should start with sagas', ()=>{
            const gen = sagas.startup( queue, action );
            expect( gen.next().value ).toEqual( call( sagas.addToQueue, queue, action ) );
            expect( gen.next().value ).toEqual( spawn( runSagas, action ) );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should do nothing when no sagas', ()=>{
            action = { uid, sagas: [] };
            const gen = sagas.startup( queue, action );
            expect( gen.next().done ).toEqual( true );
        } );
    } );

    describe( 'waitTilEmpty saga', ()=>{
        test( 'should only remove', ()=>{
            queue = queue.add( 'test' );
            const gen = sagas.waitTilEmpty( queue, action );
            expect( gen.next().value ).toEqual( call( sagas.removeFromQueue, queue, action ) );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should emit when empty remove', ()=>{
            const gen = sagas.waitTilEmpty( queue, action );
            expect( gen.next().value ).toEqual( call( sagas.removeFromQueue, queue, action ) );
            expect( gen.next().value ).toEqual( put( actions.queueEmpty() ) );
            expect( gen.next().done ).toEqual( true );
        } );
    } );

    describe( 'serverQueueSaga', ()=>{
        test( 'should run through properly', ()=>{
            const gen = sagas.serverQueueSaga();
            const runTask = createMockTask();
            const emptyTask = createMockTask();
            expect( gen.next().value ).toEqual( call( sagas.createQueue ) );
            expect( gen.next( queue ).value ).toEqual(
                takeEvery( actions.RUN_SAGAS, sagas.startup, queue )
            );
            expect( gen.next( runTask ).value ).toEqual(
                takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], sagas.waitTilEmpty, queue )
            );
            expect( gen.next( emptyTask ).value ).toEqual( call( delay, 0 ) );
            expect( gen.next().value ).toEqual( cancel( runTask ) );
            expect( gen.next().value ).toEqual( cancel( emptyTask ) );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should wait for queue to be empty', ()=>{
            queue = queue.add( 'test' );
            const gen = sagas.serverQueueSaga();
            const runTask = createMockTask();
            const emptyTask = createMockTask();
            expect( gen.next().value ).toEqual( call( sagas.createQueue ) );
            expect( gen.next( queue ).value ).toEqual(
                takeEvery( actions.RUN_SAGAS, sagas.startup, queue )
            );
            expect( gen.next( runTask ).value ).toEqual(
                takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], sagas.waitTilEmpty, queue )
            );
            expect( gen.next( emptyTask ).value ).toEqual( call( delay, 0 ) );
            expect( gen.next().value ).toEqual( cancel( runTask ) );
            expect( gen.next().value ).toEqual( take( actions.QUEUE_EMPTY ) );
            expect( gen.next().value ).toEqual( cancel( emptyTask ) );
            expect( gen.next().done ).toEqual( true );
        } );
    } );
} );
