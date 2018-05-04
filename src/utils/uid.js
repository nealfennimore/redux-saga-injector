/* eslint-disable import/prefer-default-export */
export const genUID = ()=> '_' + Date.now().toString( 36 ).substr( 2, 9 );
