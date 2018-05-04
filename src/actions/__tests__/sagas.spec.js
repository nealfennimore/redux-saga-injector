import * as actions from '../sagas';

describe( 'Saga actions', ()=>{
    test( 'runSagas', ()=>{
        expect(
            actions.runSagas( [jest.fn()], 'uid' )
        ).toMatchSnapshot();
    } );
    test( 'sagasFinished', ()=>{
        expect(
            actions.sagasFinished( 'uid' )
        ).toMatchSnapshot();
    } );
    test( 'cancelSagas', ()=>{
        expect(
            actions.cancelSagas( 'uid' )
        ).toMatchSnapshot();
    } );
    test( 'queueEmpty', ()=>{
        expect(
            actions.queueEmpty()
        ).toMatchSnapshot();
    } );
} );
