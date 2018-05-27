import { delay } from 'redux-saga';
import { call, take, put, spawn, cancel, race, fork, takeEvery } from 'redux-saga/effects';
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

    test( 'timeout', ()=>{
        const gen = sagas.timeout( {timeout: 5} );
        expect( gen.next().value ).toEqual(
            call( delay, 5 )
        );
        expect( gen.next().done ).toEqual( true );
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

    describe( 'startQueue', ()=>{
        let runAction, timedOut;
        beforeEach( ()=>{
            runAction = {};
            timedOut = Promise.resolve();
        } );

        test( 'should iterate through run tasks', ()=>{
            const gen = sagas.startQueue( queue, sagas.defaultOptions );

            expect( gen.next().value ).toEqual(
                take( actions.RUN_SAGAS )
            );

            expect( gen.next( runAction ).value ).toEqual(
                call( sagas.timeout, sagas.defaultOptions )
            );

            expect( gen.next( void 0 ).value ).toEqual(
                race( {
                    runAction,
                    timedOut: void 0
                } )
            );

            expect( gen.next( { runAction } ).value ).toEqual(
                fork( sagas.queueSagaRunner, queue, runAction )
            );

            expect( gen.next().done ).toEqual( false );
        } );
        test( 'should timeout when no run task received', ()=>{
            const gen = sagas.startQueue( queue, sagas.defaultOptions );

            expect( gen.next().value ).toEqual(
                take( actions.RUN_SAGAS )
            );

            expect( gen.next( void 0 ).value ).toEqual(
                call( sagas.timeout, sagas.defaultOptions )
            );

            expect( gen.next( timedOut ).value ).toEqual(
                race( {
                    runAction: void 0,
                    timedOut: timedOut
                } )
            );

            expect( gen.next( {runAction: void 0} ).done ).toEqual( true );
        } );
    } );

    describe( 'preloadQueue', ()=>{
        let emptyTask;
        beforeEach( ()=>{
            emptyTask = createMockTask();
        } );

        test( 'should run through properly', ()=>{
            const gen = sagas.preloadQueue();
            expect( gen.next().value ).toEqual( call( sagas.createQueue ) );
            expect( gen.next( queue ).value ).toEqual(
                takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], sagas.queueEmptier, queue )
            );
            expect( gen.next( emptyTask ).value ).toEqual(
                call( sagas.startQueue, queue, sagas.defaultOptions )
            );
            expect( gen.next().value ).toEqual( cancel( emptyTask ) );
            expect( gen.next().done ).toEqual( true );
        } );
        test( 'should wait for queue to be empty', ()=>{
            queue = queue.add( 'test' );
            const gen = sagas.preloadQueue();
            expect( gen.next().value ).toEqual( call( sagas.createQueue ) );
            expect( gen.next( queue ).value ).toEqual(
                takeEvery( [actions.SAGAS_FINISHED, actions.CANCEL_SAGAS], sagas.queueEmptier, queue )
            );
            expect( gen.next( emptyTask ).value ).toEqual(
                call( sagas.startQueue, queue, sagas.defaultOptions )
            );

            expect( gen.next().value ).toEqual( take( actions.QUEUE_EMPTY ) );
            expect( gen.next().value ).toEqual( cancel( emptyTask ) );
            expect( gen.next().done ).toEqual( true );
        } );
    } );
} );
