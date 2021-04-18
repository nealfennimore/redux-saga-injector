import Enzyme from 'enzyme';
import renderer from 'react-test-renderer';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

Enzyme.configure( { adapter: new Adapter() } );

global.shallow = Enzyme.shallow;
global.render = Enzyme.render;
global.mount = Enzyme.mount;
global.renderer = renderer;
