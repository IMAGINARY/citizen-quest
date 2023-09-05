const ServerSocketConnector = require('./lib/net/server-socket-connector');
const ConnectionStateView = require('./lib/net/connection-state-view');
const showFatalError = require('./lib/loader/show-fatal-error');
require('../sass/default.scss');
const { getApiServerUrl, getSocketServerUrl } = require('./lib/net/server-url');
const { initSentry } = require('./lib/helpers/sentry');
const PlayerApp = require('./lib/app/player-app');
const GameServerController = require('./lib/app/game-server-controller');
const fetchConfig = require('./lib/helpers-client/fetch-config');
const fetchTextures = require('./lib/helpers-client/fetch-textures');
const { PlayerAppStates } = require('./lib/app/player-app-states');

(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('p') || '1';
    const statsPanel = urlParams.get('s') || null;
    const configUrl = `${getApiServerUrl()}config`;

    const sentryDSN = urlParams.get('sentry-dsn') || process.env.SENTRY_DSN;
    if (sentryDSN) {
      initSentry(sentryDSN);
    }

    const config = await fetchConfig(configUrl);
    const textures = await fetchTextures('./static/textures', config.textures, 'town-view');
    const playerApp = new PlayerApp(config, textures, playerId);

    $('[data-component="PlayerApp"]').replaceWith(playerApp.$element);
    playerApp.resize();
    $(window).on('resize', () => {
      playerApp.resize();
    });

    let syncReceived = false;
    const connector = new ServerSocketConnector(getSocketServerUrl());
    const connStateView = new ConnectionStateView(connector);
    $('body').append(connStateView.$element);

    playerApp.setGameServerController(new GameServerController(playerApp, connector));
    playerApp.setState(PlayerAppStates.IDLE);

    connector.events.on('connect', () => {
      syncReceived = true;
    });
    connector.events.on('sync', (message) => {
      syncReceived = true;
      playerApp.stats.ping();
      if (message.state && message.state !== playerApp.getState()) {
        if (message.players[playerId] === undefined) {
          playerApp.setState(PlayerAppStates.IDLE);
        } else {
          playerApp.setState(message.state);
        }
      }
      if (message.roundCountdown) {
        const seconds = Math.ceil(message.roundCountdown / 1000);
        if (seconds < playerApp.countdown.remainingSeconds) {
          playerApp.countdown.setRemainingSeconds(seconds);
        }
      }
      Object.entries(message.players).forEach(([id, player]) => {
        if (id === playerId) {
          if (playerApp.pcView === null) {
            playerApp.addPc();
            playerApp.pc.setPosition(player.position.x, player.position.y);
          }
        }
        if (id !== playerId) {
          if (playerApp.remotePcs[id] === undefined) {
            playerApp.addRemotePcView(id);
          }
          if (player.position) {
            playerApp.remotePcs[id].setPosition(player.position.x, player.position.y);
          }
          if (player.speed) {
            playerApp.remotePcs[id].setSpeed(player.speed.x, player.speed.y);
          }
        }
      });
      // Remove players that were not included in the sync
      Object.keys(playerApp.remotePcs).forEach((id) => {
        if (message.players[id] === undefined) {
          playerApp.removeRemotePcView(id);
        }
      });
      // Remove the PC if it was not included in the sync
      if (playerApp.pc !== null && message.players[playerId] === undefined) {
        playerApp.removePc();
      }
      if (message.flags) {
        // Add all the flags from message.flags not present in playerApp.flags.flags
        Object.keys(message.flags).forEach((flag) => {
          if (!playerApp.flags.exists(flag)) {
            playerApp.flags.set(flag, message.flags[flag], 'remote');
            console.log(`Adding flag ${flag} with value ${message.flags[flag]}`);
          }
        });
      }
    });
    playerApp.pixiApp.ticker.add(() => {
      if (syncReceived) {
        connector.sync(playerApp.pc, playerApp.flags);
        syncReceived = false;
      }
    });

    if (statsPanel) {
      playerApp.stats.showPanel(statsPanel);
    }
  } catch (err) {
    showFatalError(err.message, err);
    // eslint-disable-next-line no-console
    console.error(err);
  }
})();
