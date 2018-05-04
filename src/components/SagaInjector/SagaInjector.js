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

    class SagaInjector extends Component {
        static displayName = `SagaInjector(${ componentName })`
        static propTypes = {
            [ STORE_KEY ]: PropTypes.object // eslint-disable-line
        }
        static contextTypes = {
            [ STORE_KEY ]: PropTypes.object
        }

        state = {
            injectedSagas: false,
        }

        uid = genUID()
        sagas = sagas

        componentWillMount() {
            this.injectSagas();
        }

        componentWillUnmount() {
            this.store.dispatch( cancelSagas( this.uid ) );
        }

        get store() {
            return this.props[STORE_KEY] || this.context[STORE_KEY];
        }

        get hasSagas() {
            return !! this.sagas.length;
        }

        get hasInjectedSagas() {
            return this.state.injectedSagas;
        }

        set hasInjectedSagas( injectedSagas ) {
            this.setState( {injectedSagas} );
        }

        injectSagas() {
            if ( this.hasSagas && ! this.hasInjectedSagas ) {
                this.store.dispatch( runSagas( this.sagas, this.uid ) );
                this.hasInjectedSagas = true;
            }
        }

        render() {
            return (
                <WrappedComponent {...this.props} />
            );
        }
    }

    return SagaInjector;
}

export default curry( SagaInjectorHOC );
