import React, { Component } from 'react';
import renderer from 'react-test-renderer';
import SagaInjector from '../SagaInjector';

jest.mock( 'src/utils/uid', ()=>( {
    genUID: ()=>'uid'
} ) );

class Test extends Component {
    render() {
        return 'test';
    }
}

describe( 'SagaInjector', ()=>{
    let store, sagas, TestComponent;
    beforeEach( ()=>{
        store = {
            dispatch: jest.fn()
        };

        sagas = [
            jest.fn(),
            jest.fn(),
            jest.fn()
        ];

        TestComponent = SagaInjector( { sagas } )( Test );
    } );

    test( 'should match snapshot', ()=>{
        const component = renderer.create(
            <TestComponent store={store} />
        );
        expect( component.toJSON() ).toMatchSnapshot();
    } );

    describe( 'lifecycle', ()=>{
        test( 'should inject sagas on mount', ()=>{
            const component = mount(
                <TestComponent store={store} />
            );

            expect( component.instance().store ).toEqual( store );
            expect( component.instance().sagas ).toEqual( sagas );
            expect( component.instance().hasSagas ).toEqual( true );
            expect( store.dispatch.mock.calls ).toMatchSnapshot();
        } );
        test( 'should not inject when no sagas', ()=>{
            TestComponent = SagaInjector( {} )( Test );
            const component = mount(
                <TestComponent store={store} />
            );

            expect( component.instance().store ).toEqual( store );
            expect( component.instance().sagas ).toEqual( [] );
            expect( component.instance().hasSagas ).toEqual( false );
            expect( store.dispatch ).not.toBeCalled();
        } );
        test( 'should unmount properly', ()=>{
            const component = mount(
                <TestComponent store={store} />
            );
            const spy = jest.spyOn( component.instance(), 'componentWillUnmount' );
            component.update();
            component.unmount();
            expect( spy ).toBeCalled();
            expect( store.dispatch.mock.calls ).toMatchSnapshot();
        } );
    } );


} );
