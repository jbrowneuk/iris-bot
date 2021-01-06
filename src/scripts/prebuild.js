// =============================================================================
// Prebuild script to write current git commit to a file used in compilation
// Enables quickly telling which commit the bot was compiled from for debugging
// purposes. Uses git to return the sha of HEAD's revision.
// =============================================================================
const { spawn } = require('child_process');
const { writeFile } = require('fs');
const { join } = require('path');

const outputFile = join(__dirname, '..', 'git-commit.ts');

/**
 * Writes the given data to a file
 *
 * @param {string} data data from the git command
 */
function writeGitInfo(data) {
  const json = JSON.stringify(data);

  // Format to make eslint happy :D
  const formatRegex = /"(\w+)":"([\w\d-]+)"/g;
  const formattedOutput = json.replace(formatRegex, "$1: '$2'");
  const outputData = `export const GIT_COMMIT = ${formattedOutput};`;

  writeFile(outputFile, outputData, (err) => {
    if (err) {
      process.exitCode = 1;
      return console.error(err);
    }
  });
}

let gitInfo = {
  commit: '',
  date: '',
  refs: ''
};

// Get the details of HEAD using log
const revParse = spawn('git', ['log', '-n', '1', '--pretty=%h|%as|%D']);
revParse.stdout.on('data', (data) => {
  const rawOutput = `${data}`.trim();
  const parts = rawOutput.split('|', 3);
  gitInfo.commit = parts[0];
  gitInfo.date = parts[1];
  const refs = parts[2] || 'unknown';
  gitInfo.refs = refs.replace('HEAD -> ', ''); // HEAD is a given
});

revParse.stderr.on('data', () => {
  console.error(error);
  process.exitCode = 1;
});

revParse.on('error', () => {
  console.error(error);
  process.exitCode = 1;
});

revParse.on('close', (code) => {
  if (code !== 0) {
    return console.error(`Command exited with code ${code}`);
  }

  writeGitInfo(gitInfo || 'unknown');
});
