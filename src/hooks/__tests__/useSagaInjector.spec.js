import React, {
    Component
} from 'react';
import { useDispatch } from 'react-redux';
import renderer from 'react-test-renderer';
import useSagaInjector from '../useSagaInjector';

jest.mock( 'src/utils/uid', () => ( {
    genUID: () => 'uid'
} ) );

jest.spyOn( React, 'useEffect' ).mockImplementation( f => f() );

const dispatch = jest.fn();
function mockUseDispatch() {
    return dispatch;
}
jest.mock( 'react-redux', ()=>( {
    useDispatch: mockUseDispatch
} ) );

function TestComponent( props ) {
    useSagaInjector( props.sagas );

    return <div>1</div>;
}

describe( 'useSagaInjector', () => {
    let sagas;
    beforeEach( () => {
        sagas = [
            jest.fn(),
            jest.fn(),
            jest.fn()
        ];
        dispatch.mockReset();
    } );

    it( 'should match snapshot', () => {
        const component = renderer.create( <TestComponent sagas={sagas} />
        );
        expect( component.toJSON() ).toMatchSnapshot();
    } );

    describe( 'lifecycle', () => {
        it( 'should inject sagas on mount', () => {
            const component = mount( <TestComponent sagas={sagas} /> );

            expect( component.props().sagas ).toEqual( sagas );
            expect( dispatch.mock.calls ).toMatchSnapshot();
        } );
        it( 'should throw when no sagas', () => {
            expect( ()=> mount( <TestComponent sagas={[]} /> ) ).toThrow( Error );
        } );
        it( 'should unmount properly', () => {
            const component = mount( <TestComponent sagas={sagas} /> );
            component.update();
            component.unmount();
            expect( dispatch.mock.calls ).toMatchSnapshot();
        } );
    } );
} );
