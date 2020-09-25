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
  const formattedData = `export const GIT_COMMIT = '${data}';`;

  writeFile(outputFile, formattedData, err => {
    if (err) {
      process.exitCode = 1;
      return console.error(err);
    }
  });
}

// Get the revision of HEAD using rev-parse
const revParse = spawn('git', ['rev-parse', '--short', 'HEAD']);

let gitCommit = null;
revParse.stdout.on('data', data => {
  gitCommit = `${data}`.trim();
});

revParse.stderr.on('data', data => {
  console.error(error);
  process.exitCode = 1;
});

revParse.on('error', data => {
  console.error(error);
  process.exitCode = 1;
});

revParse.on('close', code => {
  if (code !== 0) {
    return console.error(`Command exited with code ${code}`);
  }

  writeGitInfo(gitCommit || 'unknown');
});
