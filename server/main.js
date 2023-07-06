/* eslint-disable no-console */
const yargs = require('yargs');
const yaml = require('js-yaml');
const { hideBin } = require('yargs/helpers');
const createServer = require('./lib/server');
const CfgLoader = require('../src/js/lib/loader/cfg-loader');
const CfgReaderFile = require('../src/js/lib/loader/cfg-reader-file');

const { port, settingsFile } = yargs(hideBin(process.argv))
  .option('p', {
    alias: 'port',
    default: process.env.PORT || '4850',
    coerce: opt => Number.parseInt(opt, 10),
  })
  .option('s', {
    alias: 'settings-file',
    default: process.env.SETTINGS_FILE || '../settings.yml',
  })
  .argv;

const cfgLoader = new CfgLoader(CfgReaderFile, yaml.load);
cfgLoader.load([
  '../config/players.yml',
  '../config/textures.yml',
  '../config/town.yml',
  '../config/gamepads.yml',
  settingsFile,
])
  .catch((err) => {
    console.error('Error loading configuration');
    console.error(err);
    process.exit(1);
  })
  .then((config) => {
    createServer(port, config);
    console.log(`Listening on port ${port}`);
  });
