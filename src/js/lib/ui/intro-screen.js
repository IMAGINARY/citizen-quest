const EventEmitter = require('events');
const SpeechText = require('../dialogues/speech-text');
const { I18nTextAdapter } = require('../helpers/i18n');
const { textWithEmojisToSpeechLines } = require('../helpers/emoji-utils');

class IntroScreen {
  constructor(config, lang) {
    this.config = config;
    this.events = new EventEmitter();
    this.lang = lang;

    this.$element = $('<div></div>')
      .addClass('intro-screen-wrapper');

    this.$styleWrapper = $('<div></div>')
      .appendTo(this.$element);

    this.$screen = $('<div></div>')
      .addClass('intro-screen')
      .appendTo(this.$styleWrapper);

    this.$text = $('<div></div>')
      .addClass('intro-screen-text')
      .appendTo(this.$screen);

    this.speech = new SpeechText();
    this.$text.append(this.speech.$element);

    this.speechI18n = new I18nTextAdapter((text) => {
      const { revealComplete } = this.speech;
      this.speech.showText(textWithEmojisToSpeechLines(text));
      if (revealComplete) {
        this.speech.revealAll();
      }
    }, this.lang);
    this.speech.events.on('complete', () => {
      this.showContinue();
    });

    this.$continue = $('<div></div>')
      .addClass(['waiting-text', 'waiting-text-decision-screen'])
      .appendTo(this.$screen)
      .hide();

    this.$continueText = $('<span></span>')
      .addClass('text')
      .appendTo(this.$continue);

    this.continueI18n = new I18nTextAdapter(
      (text) => { this.$continueText.text(text); },
      this.lang,
      this.config.i18n.ui.pressToContinue
    );
  }

  showIntro(introText, classes) {
    this.$styleWrapper.removeClass();
    this.$styleWrapper.addClass(classes);
    this.$element.addClass('visible');
    setTimeout(() => {
      this.revealStarted = true;
      this.speechI18n.setText(introText, true);
    }, 0);
  }

  setLang(lang) {
    this.lang = lang;
    this.speechI18n.setLang(lang);
    this.continueI18n.setLang(lang);
  }

  isTextRevealed() {
    return this.speech.revealComplete;
  }

  revealText() {
    this.speech.revealAll();
  }

  showContinue() {
    this.$continue.show();
  }
}

module.exports = IntroScreen;
