const { I18nTextAdapter } = require('../helpers/i18n');
const Countdown = require('./countdown');
const QuestOverlay = require('./quest-overlay');
const TextScreen = require('./text-screen');
const ImageDisplayOverlay = require('./image-display-overlay');
const DialogueOverlay = require('./dialogue-overlay');
const ScoringOverlay = require('./scoring-overlay');
const TitleOverlay = require('./title-overlay');
const IntroScreen = require('./intro-screen');
const DecisionScreen = require('./decision-screen');
const ScoreCounterOverlay = require('./score-counter-overlay');
const ScoreCounterAdapter = require('../adapters/score-counter-adapter');

class PlayerOverlayManager {
  constructor(config, lang, playerId, flags) {
    this.config = config;
    this.lang = lang;
    this.playerId = playerId;
    this.flags = flags;

    const width = this.config?.game?.playerAppWidth ?? 1024;
    const height = this.config?.game?.playerAppHeight ?? 768;
    this.screenRatio = width / height;
    this.fontRatio = this.config?.game?.playerAppFontRatio ?? 0.0175;

    this.$element = $('<div></div>')
      .addClass('player-app')
      .addClass(`player-${playerId}`);

    this.$pixiWrapper = $('<div></div>')
      .addClass('pixi-wrapper')
      .appendTo(this.$element);

    this.$uiOverlay = $('<div></div>')
      .addClass('ui-overlay')
      .css({
        width: this.config?.game?.playerAppUiWidth ?? null,
        height: this.config?.game?.playerAppUiHeight ?? null,
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        margin: 'auto',
      })
      .appendTo(this.$element);

    this.imageDisplayOverlay = new ImageDisplayOverlay(this.config, this.lang);
    this.$element.append(this.imageDisplayOverlay.$element);

    this.$storylineBar = $('<div></div>')
      .addClass('storyline-bar')
      .appendTo(this.$uiOverlay)
      .hide();

    this.$decisionLabel = $('<div></div>')
      .addClass('decision-label')
      .appendTo(this.$storylineBar);

    this.decisionLabelI18n = new I18nTextAdapter((text) => {
      this.$decisionLabel.html(text);
    }, this.lang);

    this.introScreen = null;
    this.endingScreen = null;

    this.countdown = new Countdown();
    this.countdown.$element.appendTo(this.$uiOverlay);
    this.countdown.hide();

    this.questOverlay = new QuestOverlay(this.config, this.lang);
    this.$uiOverlay.append(this.questOverlay.$element);

    this.textScreen = new TextScreen(this.config, this.lang);
    this.$element.append(this.textScreen.$element);

    this.dialogueOverlay = new DialogueOverlay(this.config, this.lang);
    this.$uiOverlay.append(this.dialogueOverlay.$element);

    if (this.config.game.scoreCounter) {
      const options = this.config.game.scoreCounter;
      this.scoreCounterOverlay = new ScoreCounterOverlay(
        this.config,
        options.categories.map((category) => category.id)
      );
      this.$element.append(this.scoreCounterOverlay.$element);
      this.scoreCounterAdapter = new ScoreCounterAdapter(
        options,
        this.flags,
        this.scoreCounterOverlay
      );
    }

    this.scoringOverlay = new ScoringOverlay(this.config, this.lang);
    this.$element.append(this.scoringOverlay.$element);

    this.titleOverlay = new TitleOverlay(this.config, this.lang);
    this.$element.append(this.titleOverlay.$element);

    $(window).on('resize', () => {
      this.handleResize();
    });
  }

  refresh() {
    this.handleResize();
  }

  handleResize() {
    this.$element.fillWithAspect(this.screenRatio);
    this.$element.css('font-size', `${(this.$element.width() * this.fontRatio).toFixed(3)}px`);
  }

  setLang(lang) {
    this.lang = lang;

    this.titleOverlay.setLang(this.lang);
    this.imageDisplayOverlay.setLang(this.lang);
    this.dialogueOverlay.setLang(this.lang);
    this.textScreen.setLang(this.lang);
    this.questOverlay.setLang(this.lang);
    this.decisionLabelI18n.setLang(this.lang);
    this.scoringOverlay.setLang(this.lang);
    if (this.introScreen) {
      this.introScreen.setLang(this.lang);
    }
    if (this.endingScreen) {
      this.endingScreen.setLang(this.lang);
    }
  }

  showTitleScreen() {
    this.titleOverlay.show();
  }

  hideTitleScreen() {
    this.titleOverlay.hide();
  }

  showIntroScreen(introText, inclusions) {
    this.hideIntroScreen();
    this.introScreen = new IntroScreen(this.config, this.lang);
    this.$element.append(this.introScreen.$element);
    this.introScreen.showIntro(introText, [], inclusions);
  }

  hideIntroScreen() {
    if (this.introScreen) {
      this.introScreen.$element.remove();
      this.introScreen = null;
    }
  }

  showDefaultPrompt() {
    this.questOverlay.showPrompt({ text: this.config?.i18n?.ui?.defaultPrompt || '' });
  }

  showQuestPrompt(promptText, counter = null) {
    this.questOverlay.showPrompt({
      text: promptText,
      counter,
      withCheckmark: true,
    });
  }

  changeQuestPromptText(promptText) {
    this.questOverlay.updatePrompt({ text: promptText });
  }

  setQuestStageCounter(count) {
    this.questOverlay.setCounter(count);
  }

  markStageDone() {
    this.questOverlay.markDone();
  }

  markQuestDone() {
    this.questOverlay.markDone(1500, 500);
  }

  showEndingScreen(endingText, classes, inclusionTypes) {
    this.endingScreen = new DecisionScreen(this.config, this.lang);
    this.$element.append(this.endingScreen.$element);
    this.endingScreen.showDecision(endingText, classes, inclusionTypes);
  }

  hideEndingScreen() {
    if (this.endingScreen) {
      this.endingScreen.$element.remove();
      this.endingScreen = null;
    }
  }

  showTextScreen(text) {
    this.textScreen.setText(text);
    this.textScreen.show();
  }

  hideTextScreen() {
    this.textScreen.hide();
    this.textScreen.setText('');
  }
}

module.exports = PlayerOverlayManager;
