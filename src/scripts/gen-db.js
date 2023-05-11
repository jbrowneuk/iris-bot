// =============================================================================
// Script to take the example database SQL file and generate a useable SQLite DB
// from it.
// =============================================================================
'use strict';

const sqlite3 = require('sqlite3').verbose();
const { readFile, stat } = require('fs');
const { join } = require('path');

console.warn('WARNING: this will use the example SQL file to generate a SQLite DB');
console.warn('Ensure you read the SQL file and understand the commands before using the DB.');

const upDir = '..';
const inputSqlFile = join(__dirname, upDir, upDir, 'conf', 'bot.sql');
const outputSqliteFile = join(__dirname, upDir, upDir, 'bot.sqlite');

// Check for existence of existing DB - bail if one exists
stat(outputSqliteFile, (err, _) => {
  if (!err) {
    console.error('Database file already exists, aborting!');
    process.exitCode = 1;
    return;
  }

  readFile(inputSqlFile, 'utf-8', (err, sqlData) => {
    if (err) {
      console.error('Unable to load SQL data:', err.message);
      process.exitCode = 1;
      return;
    }

    const validSqlStatements = sqlData
      .split('\n')
      .filter(line => !line.startsWith('--') && line.trim().length > 0)
      .join('');

    const db = new sqlite3.Database(outputSqliteFile);
    db.exec(validSqlStatements, err => {
      if (err) {
        console.error('Unable to run SQL from example file:', err.message);
        process.exitCode = 1;
      } else {
        console.log('Creation of initial bot database complete!');
      }

      db.close();
    });
  });
});
