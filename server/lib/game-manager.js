const EventEmitter = require('events');
const logger = require('winston');
const reportError = require('./errors');
const GameManagerStates = require('./game-manager-states/states');
const StorylineManager = require('../../src/js/lib/model/storyline-manager');
const getHandler = require('./game-manager-states/get-handler');
const GameRound = require('./game-round');

class GameManager {
  constructor(config) {
    this.config = config;
    this.storylineManager = new StorylineManager(this.config);
    this.events = new EventEmitter();

    this.stateHandler = null;
    this.round = null;
    this.lastStoryline = null;
    this.playerQueue = new Set();
  }

  init() {
    this.setState(GameManagerStates.IDLE);
  }

  getNextStoryline() {
    this.lastStoryline = this.storylineManager.getNext(this.lastStoryline);
    return this.lastStoryline;
  }

  /**
   * Create a new round.
   */
  initializeRound() {
    if (this.getState() !== GameManagerStates.IDLE) {
      reportError('Error: Attempting to start round when not in IDLE state');
      return;
    }

    this.round = new GameRound(this.getNextStoryline(), this.config.game.duration);
    logger.verbose(`Round ${this.round.id} created with storyline ${this.round.storyline}`);
  }

  /**
   * Destroy the current round.
   */
  destroyRound() {
    this.round = null;
  }

  /**
   * Returns true if there's a round in progress.
   */
  hasRound() {
    return this.round !== null;
  }

  handleAddPlayer(playerId) {
    this.getStateHandler().onAddPlayer(playerId);
  }

  /**
   * Add a player to the game.
   *
   * @param {string} playerId
   */
  addPlayer(playerId) {
    if (this.config.players[playerId] === undefined) {
      reportError(`Error: Attempting to add unknown player ${playerId}`);
      return;
    }

    if (this.config.players[playerId].enabled === false) {
      reportError(`Error: Attempting to add disabled player ${playerId}`);
      return;
    }

    if (this.round.hasPlayer(playerId)) {
      reportError(`Error: Attempting to add already added player ${playerId}`);
      return;
    }

    this.round.addPlayer(playerId, this.config.players[playerId]);
  }

  handleRemovePlayer(playerId) {
    this.getStateHandler().onRemovePlayer(playerId);
  }

  /**
   * Remove a player from the game.
   *
   * @param {string} playerId
   */
  removePlayer(playerId) {
    if (this.round.hasPlayer(playerId)) {
      this.round.removePlayer(playerId);
    }
  }

  handlePlayerReady(playerId) {
    this.getStateHandler().onPlayerReady(playerId);
  }

  queuePlayer(playerId) {
    this.playerQueue.add(playerId);
    logger.verbose(`Player ${playerId} queued`);
  }

  clearPlayerQueue() {
    this.playerQueue.clear();
    logger.debug('Player queue cleared');
  }

  hasQueuedPlayers() {
    return this.playerQueue.size > 0;
  }

  addQueuedPlayers() {
    logger.debug('Adding queued players');
    this.playerQueue.forEach((playerId) => {
      this.addPlayer(playerId);
    });
    this.clearPlayerQueue();
  }

  getState() {
    return (this.stateHandler && this.stateHandler.state) ?? null;
  }

  getStateHandler() {
    return this.stateHandler;
  }

  /**
   * Set the current game stateHandler.
   *
   * @param {string} state
   */
  setState(state) {
    if (this.getState() === state) {
      return;
    }
    logger.verbose(`State change: ${this.getState()} -> ${state}`);
    // Check if the stateHandler is valid.
    if (Object.values(GameManagerStates).indexOf(state) === -1) {
      reportError(`Error: Attempting to set invalid state ${state}`);
      return;
    }

    this.clearStateTimeout();
    const oldState = this.getState();
    if (this.stateHandler) {
      this.stateHandler.onExit(state);
    }
    this.stateHandler = getHandler(this, state);
    if (this.stateHandler) {
      this.stateHandler.onEnter(oldState);
    }
  }

  clearStateTimeout() {
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }
  }

  setStateTimeout(duration) {
    this.stateTimeout = setTimeout(() => {
      logger.verbose(`State '${this.stateHandler.state}' timed out after ${duration}ms`);
      this.stateHandler.onTimeout();
    }, duration);
  }
}

module.exports = GameManager;
