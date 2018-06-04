import { call, take, put, spawn, cancel, takeEvery } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import { delay } from 'redux-saga';
import { runSagas } from 'src/sagas/run';
import * as actions from 'src/actions/sagas';
import * as sagas from '../queue';
import defaultOptions from '../options';

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

    describe( 'queueSagaRunner', ()=>{
        test( 'should start with sagas', ()=>{
            const gen = sagas.queueSagaRunner( queue, action );
            expect( gen.next().value ).toEqual( call( sagas.addToQueue, queue, action ) );
            expect( gen.next().value ).toEqual( spawn( runSagas, action ) );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should do nothing when no sagas', ()=>{
            action = { uid, sagas: [] };
            const gen = sagas.queueSagaRunner( queue, action );
            expect( gen.next().done ).toEqual( true );
        } );
    } );

    describe( 'queueEmptier saga', ()=>{
        test( 'should only remove', ()=>{
            queue = queue.add( 'test' );
            const gen = sagas.queueEmptier( queue, action );
            expect( gen.next().value ).toEqual( call( sagas.removeFromQueue, queue, action ) );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should emit when empty remove', ()=>{
            const gen = sagas.queueEmptier( queue, action );
            expect( gen.next().value ).toEqual( call( sagas.removeFromQueue, queue, action ) );
            expect( gen.next().value ).toEqual( put( actions.queueEmpty() ) );
            expect( gen.next().done ).toEqual( true );
        } );
    } );

    describe( 'preloadQueue', ()=>{
        let runTask, emptyTask;
        beforeEach( ()=>{
            runTask = createMockTask();
            emptyTask = createMockTask();
        } );

        test( 'should run through properly', ()=>{
            const gen = sagas.preloadQueue();
            expect( gen.next().value ).toEqual( call( sagas.createQueue ) );
            expect( gen.next( queue ).value ).toEqual(
                takeEvery( actions.RUN_SAGAS, sagas.queueSagaRunner, queue )
            );
            expect( gen.next( runTask ).value ).toEqual(
                takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], sagas.queueEmptier, queue
                )
            );
            expect( gen.next( emptyTask ).value ).toEqual( call( delay, defaultOptions.preloadTimeout ) );
            expect( gen.next().value ).toEqual( cancel( runTask ) );
            expect( gen.next().value ).toEqual( cancel( emptyTask ) );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should wait for queue to be empty', ()=>{
            queue = queue.add( 'test' );
            const gen = sagas.preloadQueue();
            expect( gen.next().value ).toEqual( call( sagas.createQueue ) );
            expect( gen.next( queue ).value ).toEqual(
                takeEvery( actions.RUN_SAGAS, sagas.queueSagaRunner, queue )
            );
            expect( gen.next( runTask ).value ).toEqual(
                takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], sagas.queueEmptier, queue )
            );
            expect( gen.next( emptyTask ).value ).toEqual( call( delay, defaultOptions.preloadTimeout ) );
            expect( gen.next().value ).toEqual( cancel( runTask ) );
            expect( gen.next().value ).toEqual( take( actions.QUEUE_EMPTY ) );
            expect( gen.next().value ).toEqual( cancel( emptyTask ) );
            expect( gen.next().done ).toEqual( true );
        } );
    } );
} );
