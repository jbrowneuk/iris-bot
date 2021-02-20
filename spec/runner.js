// Very simple wrapper to run Jasmine using ts-node
// Inspired by https://github.com/svi3c/jasmine-ts
const path = require('path');
const tsnode = require('ts-node');
const Jasmine = require('jasmine');
const Command = require('jasmine/lib/command');

tsnode.register();
const projectBaseDir = path.resolve();
const jasmine = new Jasmine({ projectBaseDir });
const command = new Command(projectBaseDir, '', console.log);
command.run(jasmine, []);
