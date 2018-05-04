/* eslint-disable import/prefer-default-export */
export const curry = ( fn, ...args ) =>
    ( fn.length <= args.length ) ?
        fn( ...args ) :
        ( ...more ) => curry( fn, ...args, ...more );
