import { PREFIX } from 'src/prefix';

export const RUN_SAGAS = `${PREFIX}/RUN_SAGAS`;
export function runSagas( sagas, uid ) {
    return {
        type: RUN_SAGAS,
        sagas,
        uid
    };
}

export const SAGAS_FINISHED = `${PREFIX}/SAGAS_FINISHED`;
export function sagasFinished( uid ) {
    return {
        type: SAGAS_FINISHED,
        uid
    };
}

export const CANCEL_SAGAS = `${PREFIX}/CANCEL_SAGAS`;
export function cancelSagas( uid ) {
    return {
        type: CANCEL_SAGAS,
        uid
    };
}

export const QUEUE_EMPTY = `${PREFIX}/QUEUE_EMPTY`;
export function queueEmpty() {
    return {
        type: QUEUE_EMPTY,
    };
}
