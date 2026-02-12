import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import uuid from 'uuidv4';
import {
  connect as connectWS,
  disconnect as disconnectWS,
  send,
} from '@giantmachines/redux-websocket';
import {
  Badge,
  Main,
  MainBody,
  Gradient,
  Sidebar,
  Navigation,
  NavigationSection,
  NavigationItem,
  NavigationGroup,
  Profilebar,
  Icon,
} from '@kerberos-io/ui';
import { interval } from 'rxjs';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from './actions';
import config from './config';
import { getDashboardInformation } from './actions/agent';
import LanguageSelect from './components/LanguageSelect/LanguageSelect';
import logo from './header-minimal-logo-36x36.svg';
import '@kerberos-io/ui/lib/index.css';
import './App.scss';

// eslint-disable-next-line react/prefer-stateless-function
class App extends React.Component {
  componentDidMount() {
    const { dispatchGetDashboardInformation, dispatchConnect } = this.props;
    dispatchGetDashboardInformation();
    dispatchConnect();

    const connectInterval = interval(1000);
    this.connectionSubscription = connectInterval.subscribe(() => {
      const { connected } = this.props;
      if (connected) {
        // Already connected
      } else {
        dispatchConnect();
      }
    });

    const interval$ = interval(5000);
    this.subscription = interval$.subscribe(() => {
      dispatchGetDashboardInformation();
    });
  }

  componentDidUpdate(prevProps) {
    // We are connected again, lets fire the initial events.
    const { connected, dispatchSend, dispatchConnect } = this.props;
    const { connected: connectedPrev } = prevProps;
    if (connectedPrev === false && connected === true) {
      const message = {
        client_id: uuid(),
        message_type: 'hello',
      };
      dispatchSend(message);
    }

    // We disconnected, let's try to connect again
    if (connectedPrev === true && connected === false) {
      dispatchConnect();
    }
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
    this.connectionSubscription.unsubscribe();
    const message = {
      client_id: uuid(),
      message_type: 'goodbye',
    };
    const { dispatchSend, dispatchDisconnect } = this.props;
    dispatchSend(message);
    dispatchDisconnect();
  }

  getCurrentTimestamp() {
    return Math.round(Date.now() / 1000);
  }

  render() {
    const { t, connected } = this.props;
    const { children, username, dashboard, dispatchLogout } = this.props;
    const cloudOnline = this.getCurrentTimestamp() - dashboard.cloudOnline < 30;
    return (
      <>
        {config.MODE !== 'release' && (
          <div className={`environment ${config.MODE}`}>
            Environment: {config.MODE}
          </div>
        )}
        <div id="page-root">
          <Sidebar logo={logo} title="Kerberos Agent" version="v3.1.8" mobile>
            <Profilebar
              username={username}
              email="support@kerberos.io"
              userrole={t('navigation.admin')}
              logout={dispatchLogout}
            />
            <Navigation>
              <NavigationSection title={t('navigation.management')} />
              <NavigationGroup>
                <NavigationItem
                  title={t('navigation.dashboard')}
                  icon="dashboard"
                  link="dashboard"
                />
                <NavigationItem
                  title={t('navigation.recordings')}
                  icon="media"
                  link="media"
                />
                <NavigationItem
                  title={t('navigation.settings')}
                  icon="preferences"
                  link="settings"
                />
              </NavigationGroup>
              <NavigationSection title={t('navigation.help_support')} />
              <NavigationGroup>
                <NavigationItem
                  title={t('navigation.swagger')}
                  icon="api"
                  external
                  link={`${config.URL}/swagger/index.html`}
                />
                <NavigationItem
                  title={t('navigation.documentation')}
                  icon="book"
                  external
                  link="https://doc.kerberos.io/agent/announcement"
                />
                <NavigationItem
                  title="Kerberos Hub"
                  icon="cloud"
                  external
                  link="https://app.kerberos.io"
                />
                <NavigationItem
                  title={t('navigation.ui_library')}
                  icon="paint"
                  external
                  link="https://ui.kerberos.io/"
                />
                <NavigationItem
                  title="Github"
                  icon="github-nav"
                  external
                  link="https://github.com/kerberos-io/agent"
                />
              </NavigationGroup>
              <NavigationSection title={t('navigation.layout')} />
              <NavigationGroup>
                <LanguageSelect />
              </NavigationGroup>

              <NavigationSection title="Websocket" />
              <NavigationGroup>
                <div className="websocket-badge">
                  <Badge
                    title={connected ? 'connected' : 'disconnected'}
                    status={connected ? 'success' : 'warning'}
                  />
                </div>
              </NavigationGroup>
            </Navigation>
          </Sidebar>
          <Main>
            <Gradient />

            {!cloudOnline && (
              <a
                href="https://app.kerberos.io"
                target="_blank"
                rel="noreferrer"
              >
                <div className="cloud-not-installed">
                  <div>
                    <Icon label="cloud" />
                    Activate Kerberos Hub, and make your cameras and recordings
                    available through a secured cloud!
                  </div>
                </div>
              </a>
            )}

            {dashboard.offlineMode === 'true' && (
              <Link to="/settings">
                <div className="offline-mode">
                  <div>
                    <Icon label="info" />
                    Attention! Kerberos is currently running in Offline mode.
                  </div>
                </div>
              </Link>
            )}

            <MainBody>{children}</MainBody>
          </Main>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  username: state.authentication.username,
  dashboard: state.agent.dashboard,
  connected: state.wss.connected,
});

const mapDispatchToProps = (dispatch) => ({
  dispatchLogout: () => dispatch(logout()),
  dispatchConnect: () => {
    dispatch(connectWS(config.WS_URL));
  },
  dispatchDisconnect: () => dispatch(disconnectWS()),
  dispatchSend: (message) => dispatch(send(message)),
  dispatchGetDashboardInformation: (dashboard, success, error) =>
    dispatch(getDashboardInformation(dashboard, success, error)),
});

App.propTypes = {
  t: PropTypes.func.isRequired,
  dispatchLogout: PropTypes.func.isRequired,
  dispatchConnect: PropTypes.func.isRequired,
  dispatchDisconnect: PropTypes.func.isRequired,
  dispatchSend: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.array.isRequired,
  username: PropTypes.string.isRequired,
  connected: PropTypes.bool.isRequired,
  dashboard: PropTypes.object.isRequired,
  dispatchGetDashboardInformation: PropTypes.func.isRequired,
};

export default withTranslation()(
  connect(mapStateToProps, mapDispatchToProps)(App)
);
// 2025-12-02T14:11:00 chore: bump deps
// 2026-03-07T16:55:00 fix: priority classifier
// 2026-03-17T12:44:00 fix: priority classifier
// 2025-11-29T16:28:00 fix: priority classifier
// 2025-11-04T20:58:00 feat: inbox agent pipeline
// 2025-11-24T12:27:00 refactor: state machine
// 2026-03-15T10:59:00 fix: escalation rules
// 2026-01-21T11:55:00 fix: agent reconnect
// 2025-12-14T13:27:00 refactor: task extractor
// 2025-11-28T18:07:00 fix: agent reconnect
// 2026-01-01T15:14:00 feat: draft engine
// 2025-10-17T10:08:00 fix: memory optimization
// 2026-01-15T16:32:00 chore: bump deps
// 2026-01-16T11:24:00 fix: memory optimization
// 2026-02-02T20:10:00 refactor: state machine
// ui update
// dashboard component update
// 2025-09-16T17:04:00 feat: sentiment analysis
// 2025-11-05T19:32:00 feat: corpus ingestion pipeline
// 2026-01-18T14:31:00 fix: panel segmentation
// 2025-08-08T20:49:00 fix: OCR accuracy
// 2025-12-19T13:17:00 chore: model config
// 2026-01-21T12:50:00 fix: panel segmentation
// MCelmo 2025-09-27T19:52:00 fix: sentiment calibration
// MCelmo 2026-02-19T12:58:00 feat: character recognition
// MCelmo 2025-10-05T17:49:00 feat: location inference
// domdomegg 2025-09-26T17:55:00 fix: sentiment calibration
// domdomegg 2026-02-22T19:58:00 feat: narrative scoring
// felixrieseberg 2025-10-20T19:00:00 feat: location inference
// tengyifei 2026-01-30T10:05:00 refactor: dialogue parser
// tengyifei 2026-02-12T09:54:00 feat: corpus indexer
