BEGIN TRANSACTION;

-- -----------------------------------------------------------------------------
-- Bot SQLite database transaction for fast initialisation
-- -----------------------------------------------------------------------------
-- This initialises the bot to have similar behaviour to that found on the
-- Domain of J community - i.e. the personality of Skye. The major areas are
-- commented to allow for customisation for your community.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- Tally/total count table
-- -----------------------
-- Used by the tally personality to keep a running tally.
-- `guildId` is the guild ID
-- `count` is the current tally
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "tally" (
	"guildId"	TEXT,
	"count"	INTEGER
);

-- -----------------------------------------------------------------------------
-- Hangman Game persistence
-- ------------------------
-- Used by the hangman game personality to persist game data between restarts.
-- `guildId` is the guild ID
-- `timeStarted` is the timestamp of when the game was started
-- `currentWord` is the game's current word
-- `currentDisplay` is the game's word, as guessed by the players. Missing
--                  letters are blanked with a symbol.
-- `livesRemaining` is the remaining chances of making guesses for the game
-- `wrongLetters` is a set of incorrect letter guesses, separated by a symbol
-- `wrongWords` is a set of incorrect word guesses, separated by a symbol
-- `totalWins` is the total number of wins for the guild
-- `totalLosses` is the total number of losses for the guild
-- `currentStreak` is the current win streak for the guild
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "hangman" (
	"guildId"	TEXT,
	"timeStarted"	INTEGER,
	"currentWord"	TEXT,
	"currentDisplay"	TEXT,
	"livesRemaining"	INTEGER,
	"wrongLetters"	TEXT,
	"wrongWords"	TEXT,
	"totalWins"	INTEGER,
	"totalLosses"	INTEGER,
	"currentStreak"	INTEGER
);

-- -----------------------------------------------------------------------------
-- Responses table
-- ---------------
-- Used to control the responses provided by the response generator:
-- `type` is the name of the phrase set this response belongs to, and is the
--        identifier used in-code to fetch a phrase.
-- `mood` is the general tone of voice of this phrase, and is be used to vary
--        the responses based upon the bot's mood. The values are:
--        - 'none' (neutral mood)
--        - 'happy' (positive mood)
--        - 'sad' (negative mood)
-- `text` is the actual textual content of the response.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "responses" (
	"type"	TEXT,
	"mood"	TEXT,
	"text"	TEXT
);
--
-- phrase: addressedNoResponse
-- used when addressed (@bot message) but nothing has handled the message
--
INSERT INTO "responses" VALUES ('addressedNoResponse','none','hm?');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','I won’t answer that.');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','I’m not in the mood');
--
-- phrase: addressedNoCommand
-- used when addressed but there's nothing after the ping
--
INSERT INTO "responses" VALUES ('addressedNoCommand','none','you called?');
INSERT INTO "responses" VALUES ('addressedNoCommand','happy','I’m here 🙃');
INSERT INTO "responses" VALUES ('addressedNoCommand','sad','talking about me?');
--
-- phrase: mood
-- used when asking the bot what's up or how they feel
--
INSERT INTO "responses" VALUES ('mood','none','I’m okay.');
INSERT INTO "responses" VALUES ('mood','happy','Doing pretty good!');
INSERT INTO "responses" VALUES ('mood','sad','Not great.');
--
-- phrase: highFive
-- used when addressed with a 'high five'
--
INSERT INTO "responses" VALUES ('highFive','none','high five!');
INSERT INTO "responses" VALUES ('highFive','none','^5');
INSERT INTO "responses" VALUES ('highFive','happy','*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','sad','*leaves {£user} hanging*');
INSERT INTO "responses" VALUES ('highFive','sad','…');
--
-- phrase: flipCoinHeads
-- used when a coin flip returns a heads value
--
INSERT INTO "responses" VALUES ('flipCoinHeads','none','heads');
INSERT INTO "responses" VALUES ('flipCoinHeads','happy','heads 👌');
INSERT INTO "responses" VALUES ('flipCoinHeads','sad','heads, I guess');
--
-- phrase: flipCoinTails
-- used when a coin flip returns a tails value
--
INSERT INTO "responses" VALUES ('flipCoinTails','none','tails');
INSERT INTO "responses" VALUES ('flipCoinTails','happy','Tails.');
INSERT INTO "responses" VALUES ('flipCoinTails','sad','I hope you didn’t bet on that one.\nTails');
--
-- phrase: dieRollFail
-- used when dice roll feature could not parse any die
--
INSERT INTO "responses" VALUES ('dieRollFail','none','I, uh, *can’t actually do that*.');
INSERT INTO "responses" VALUES ('dieRollFail','none','Try again ^_^');
INSERT INTO "responses" VALUES ('dieRollFail','none','try again ^^');
--
-- phrase: dieRollParseFail
-- used when dice roll feature cannot parse a single die
--
INSERT INTO "responses" VALUES ('dieRollParseFail','none','A *{£bit}* is not a type of die.');
--
-- phrase: dieRollCorrectionCount
-- used when dice roll feature needs to correct the number of dice being rolled
--
INSERT INTO "responses" VALUES ('dieRollCorrectionCount','none','I’m not liking how many times you told me to roll that die.');
INSERT INTO "responses" VALUES ('dieRollCorrectionCount','none','{£rolls} is far too many for a simple person such as myself..');
--
-- phrase: dieRollCorrectionSides
-- used when dice roll feature needs to correct the number of sides to a die
--
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','All bow before {£user} and their almighty {£die} which I shall not roll.');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','The die you chose for a roll couldn’t physically exist.');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','I assumed that you typo’ed that die. That number of sides doesn’t exist.');
--
-- phrase: dieRollLimit
-- used when there's too many die to roll
--
INSERT INTO "responses" VALUES ('dieRollLimit','none','I think it’s best I stop rolling—for now.');
INSERT INTO "responses" VALUES ('dieRollLimit','none','There’s far too many things to do here.');
--

-- -----------------------------------------------------------------------------
-- Call-response table
-- -------------------
-- Used to create responses to specific messages
-- `call` is message text to look for
-- `response` is the response to the message text
-- -----------------------------------------------------------------------------
CREATE TABLE "call_response" (
	"call"	TEXT,
	"response"	TEXT
);
--
INSERT INTO "call_response" VALUES ('hello','hi');

--
COMMIT;
