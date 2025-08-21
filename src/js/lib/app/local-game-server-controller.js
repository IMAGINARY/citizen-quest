const PlayerAppStates = require('./player-app-states/states');

class LocalGameServerController {
  constructor(playerApp) {
    this.playerApp = playerApp;
  }

  playerStart() {
    this.playerApp.addPc();
    this.playerApp.setState(PlayerAppStates.PLAYING);
  }

  roundEnd() {
    this.playerApp.roundTimer.pause();
    this.playerApp.setState(PlayerAppStates.ENDING);
  }

  playerReady() {
    if (this.playerApp.getState() === PlayerAppStates.ENDING) {
      this.playerApp.removePc();
      this.playerApp.resetGameState();
    }
  }
}

module.exports = LocalGameServerController;
