const EventEmitter = require('events');
class RoundTimer {
  constructor(seconds) {
    this.durationSecs = seconds;
    this.remainingSecs = 0;
    this.events = new EventEmitter();
    this.ended = !(this.durationSecs > 0);
  }

  setDuration(seconds) {
    this.durationSecs = seconds;
  }

  setRemainingTime(seconds) {
    this.remainingSecs = seconds;
    this.events.emit('update', this.remainingSecs);
    if (this.remainingSecs <= 0) {
      this.onEnd();
    }
  }

  getRemainingTime() {
    return this.remainingSecs;
  }

  start() {
    this.ended = !(this.durationSecs > 0);
    this.setRemainingTime(this.durationSecs);
    if (this.getRemainingTime() > 0) {
      this.startTimer();
    }
  }

  pause() {
    this.endTimer();
  }

  forceEnd() {
    this.setRemainingTime(0);
  }

  onEnd() {
    this.endTimer();
    if (!this.ended) {
      this.ended = true;
      this.events.emit('end');
    }
  }

  startTimer() {
    this.endTimer();
    this.interval = setInterval(() => {
      this.setRemainingTime(this.getRemainingTime() - 1);
    }, 1000);
  }

  endTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = RoundTimer;
