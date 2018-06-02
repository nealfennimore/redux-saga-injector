import express from 'express';
import request from 'request';
import createStore, {ShowCount, incrementSaga, delayedIncrementSaga} from '../__fixtures__/store';
import renderer from '../__fixtures__/renderer';
import SagaInjector from '../components/SagaInjector';

const ResponseFactory = ( response )=>{
    let send = resolve => ( ...args )=> {
        resolve( response.send( ...args ) );
    };
    const promise = new Promise( ( resolve )=>{
        send = send( resolve );
    } );
    return {
        promise,
        send,
    };
};

describe( 'Express SSR', ()=>{
    let AppComponent, app, store, server, req, response, res;
    beforeEach( ()=>{
        AppComponent = SagaInjector( {
            sagas: [
                incrementSaga,
                incrementSaga,
                incrementSaga
            ]
        } )( ShowCount );
        req = jest.fn();
        response = {
            send: jest.fn()
        };
        res = ResponseFactory( response );
        store = createStore();
        app = express();
    } );
    afterEach( ()=>{
        server.close();
    } );

    test( 'should increment correctly', async()=>{
        app.get( '*', renderer( AppComponent, store, req, res ) );
        server = app.listen( 3001, '127.0.0.1' );
        request( 'http://localhost:3001' );

        await res.promise;

        expect( response.send.mock.calls ).toMatchSnapshot();
    } );
    test( 'should increment correctly 9 times', async()=>{
        AppComponent = SagaInjector( {
            sagas: [
                incrementSaga,
                incrementSaga,
                incrementSaga,
                incrementSaga,
                incrementSaga,
                incrementSaga,
                incrementSaga,
                incrementSaga,
                incrementSaga,
            ]
        } )( ShowCount );
        app.get( '*', renderer( AppComponent, store, req, res ) );
        server = app.listen( 3001, '127.0.0.1' );
        request( 'http://localhost:3001' );

        await res.promise;

        expect( response.send.mock.calls ).toMatchSnapshot();
    } );
    test( 'should increment correctly when delayed', async()=>{
        AppComponent = SagaInjector( {
            sagas: [
                delayedIncrementSaga,
                delayedIncrementSaga,
                delayedIncrementSaga,
            ]
        } )( ShowCount );
        app.get( '*', renderer( AppComponent, store, req, res ) );
        server = app.listen( 3001, '127.0.0.1' );
        request( 'http://localhost:3001' );

        await res.promise;

        expect( response.send.mock.calls ).toMatchSnapshot();
    } );
} );
