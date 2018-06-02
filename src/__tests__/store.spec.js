import augmentStore from '../store';

describe( 'Store augmentation', ()=>{
    let store, sagaMiddleware;
    beforeEach( ()=>{
        store = {
            dispatch: jest.fn()
        };
        sagaMiddleware = {
            run: jest.fn()
        };
        augmentStore( sagaMiddleware, store );
    } );

    test( 'store close should end all running sagas', ()=>{
        store.close();
        expect( store.dispatch.mock.calls ).toMatchSnapshot();
    } );
    test( 'should alias sagaMiddleware run', ()=>{
        expect( store.runSaga ).toEqual( sagaMiddleware.run );
    } );
} );
