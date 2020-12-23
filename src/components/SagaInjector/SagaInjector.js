import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { cancelSagas, runSagas } from 'src/actions/sagas';
import { curry } from 'src/utils/fp';
import { genUID } from 'src/utils/uid';

/**
 * Inject sagas to run with component lifecycle
 *
 * @param {Object} options Should contain sagas as an array
 * @param {any} WrappedComponent Component to wrap
 * @returns SagaInjector
 */
function SagaInjectorHOC( options, WrappedComponent ) {
    const { sagas, STORE_KEY } = Object.assign( { sagas: [], STORE_KEY: 'store' }, options );

    const componentName = WrappedComponent.displayName ||
	WrappedComponent.name ||
    'Component';

    return class SagaInjector extends Component {
        constructor( ...args ) {
            super( ...args );
            this.uid = genUID();
            this.sagas = sagas;

            this.injectSagas();
        }

        static displayName = `SagaInjector(${ componentName })`
        static propTypes = {
            [ STORE_KEY ]: PropTypes.object // eslint-disable-line
        }
        static contextTypes = {
            [ STORE_KEY ]: PropTypes.object
        }

        componentWillUnmount() {
            this.cancelSagas();
        }

        get store() {
            return this.props[STORE_KEY] || this.context[STORE_KEY];
        }

        injectSagas() {
            if ( this.sagas.length ) {
                this.store.dispatch( runSagas( this.sagas, this.uid ) );
            }
        }

        cancelSagas() {
            this.store.dispatch( cancelSagas( this.uid ) );
        }

        render() {
            return (
                <WrappedComponent {...this.props} />
            );
        }
    };
}

export default curry( SagaInjectorHOC );
