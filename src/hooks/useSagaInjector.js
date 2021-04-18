/**
 * External Dependencies
 */
import { useEffect, useState } from 'react';
import {
    useDispatch
} from 'react-redux';

/**
 * Internal Dependencies
 */
import { genUID } from 'src/utils/uid';
import {
    cancelSagas,
    runSagas
} from 'src/actions/sagas';


export default function useSagaInjector( sagas ) {
    if( ! ( sagas && sagas.length ) ) {
        throw new Error( 'No sagas given' );
    }

    const dispatch = useDispatch();
    const [ uid ] = useState( genUID() );

    useEffect(
        ()=>{
            dispatch( runSagas( sagas, uid ) );
            return ()=>{
                dispatch( cancelSagas( uid ) );
            };
        },
        [uid]
    );
}
