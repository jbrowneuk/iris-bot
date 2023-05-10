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
CREATE TABLE IF NOT EXISTS  "hangman" (
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
)

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
INSERT INTO "responses" VALUES ('addressedNoResponse','none','hmm?');
INSERT INTO "responses" VALUES ('addressedNoResponse','none','mmhmm?');
INSERT INTO "responses" VALUES ('addressedNoResponse','none','I don’t know 😔');
INSERT INTO "responses" VALUES ('addressedNoResponse','none','I don’t understand');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','I won’t answer that.');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','I’d rather not.');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','Is now really the time?');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','Try again later...');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','Sorry, {£user}, I’m not answering that.');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','I don’t understand 😥');
INSERT INTO "responses" VALUES ('addressedNoResponse','happy','😥');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','eh');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','yeah, whatever');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','Sorry, too busy looking out the window');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','I don’t really care');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','hm');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','I’m not in the mood');
INSERT INTO "responses" VALUES ('addressedNoResponse','sad','go away');
--
-- phrase: addressedNoCommand
-- used when addressed but there's nothing after the ping
--
INSERT INTO "responses" VALUES ('addressedNoCommand','none','hm?');
INSERT INTO "responses" VALUES ('addressedNoCommand','none','hey');
INSERT INTO "responses" VALUES ('addressedNoCommand','none','hi');
INSERT INTO "responses" VALUES ('addressedNoCommand','none','you called?');
INSERT INTO "responses" VALUES ('addressedNoCommand','none','you asked?');
INSERT INTO "responses" VALUES ('addressedNoCommand','none','{£user}');
INSERT INTO "responses" VALUES ('addressedNoCommand','happy','yo');
INSERT INTO "responses" VALUES ('addressedNoCommand','happy','me!');
INSERT INTO "responses" VALUES ('addressedNoCommand','happy','yes, {£user}?');
INSERT INTO "responses" VALUES ('addressedNoCommand','happy','heyy');
INSERT INTO "responses" VALUES ('addressedNoCommand','happy','hey 😊');
INSERT INTO "responses" VALUES ('addressedNoCommand','happy','I’m here 🙃');
INSERT INTO "responses" VALUES ('addressedNoCommand','sad','talking about me?');
INSERT INTO "responses" VALUES ('addressedNoCommand','sad','leave me alone');
INSERT INTO "responses" VALUES ('addressedNoCommand','sad','go away');
INSERT INTO "responses" VALUES ('addressedNoCommand','sad','I’m not in the mood');
--
-- phrase: mood
-- used when asking the bot what's up or how they feel
--
INSERT INTO "responses" VALUES ('mood','none','I’m okay.');
INSERT INTO "responses" VALUES ('mood','none','Nothing out of the ordinary here.');
INSERT INTO "responses" VALUES ('mood','none','There’s only a feeling of quiet zen.');
INSERT INTO "responses" VALUES ('mood','happy','Doing pretty good!');
INSERT INTO "responses" VALUES ('mood','happy','Feeling fine :slightly_smiling_face:');
INSERT INTO "responses" VALUES ('mood','happy','I’m alright, thanks.');
INSERT INTO "responses" VALUES ('mood','sad','Not great.');
INSERT INTO "responses" VALUES ('mood','sad','Been better.');
INSERT INTO "responses" VALUES ('mood','sad','Don’t worry about me.');
--
-- phrase: highFive
-- used when addressed with a 'high five'
--
INSERT INTO "responses" VALUES ('highFive','none','high five!');
INSERT INTO "responses" VALUES ('highFive','none','^5');
INSERT INTO "responses" VALUES ('highFive','happy','yihu!
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','hells yeah! :smile:
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','damn straight!
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','alrighty ^_^
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','^_^
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','😀
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','> w <
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','nuhuhuhu 😊
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','^^
*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','*high fives {£user}*');
INSERT INTO "responses" VALUES ('highFive','happy','*high fives {£user}*
epic');
INSERT INTO "responses" VALUES ('highFive','happy','*high fives {£user}*
go team!');
INSERT INTO "responses" VALUES ('highFive','happy','*high fives {£user}*
way to go');
INSERT INTO "responses" VALUES ('highFive','happy','*high fives {£user}*
we’re awesome');
INSERT INTO "responses" VALUES ('highFive','happy','*epic music plays* hiiiigh five.
*ahem* sorry.');
INSERT INTO "responses" VALUES ('highFive','happy','{£user}: high five!');
INSERT INTO "responses" VALUES ('highFive','sad','*leaves {£user} hanging*');
INSERT INTO "responses" VALUES ('highFive','sad','…');
INSERT INTO "responses" VALUES ('highFive','sad','not today');
INSERT INTO "responses" VALUES ('highFive','sad','I’m not in the mood');
INSERT INTO "responses" VALUES ('highFive','sad','holds hand up
well, that was completely unsatisfying');
INSERT INTO "responses" VALUES ('highFive','sad','holds hand up
well, that was slightly satisfying');
INSERT INTO "responses" VALUES ('highFive','sad','I suppose you find this amusing?');
INSERT INTO "responses" VALUES ('highFive','sad','And if I don’t?');
INSERT INTO "responses" VALUES ('highFive','sad','that would suggest I’d done something worthy of high fiving you');
INSERT INTO "responses" VALUES ('highFive','sad','I’m fed up of this
find someone else to give you one');
INSERT INTO "responses" VALUES ('highFive','sad','looks blankly at {£user}');
INSERT INTO "responses" VALUES ('highFive','sad','looks blankly at {£user}
what part of “no” did you not get?');
INSERT INTO "responses" VALUES ('highFive','sad','looks blankly at {£user}
what part of “I don’t want to” did you not get?');
INSERT INTO "responses" VALUES ('highFive','sad','yaaawn');
INSERT INTO "responses" VALUES ('highFive','sad','yawn');
INSERT INTO "responses" VALUES ('highFive','sad','nope');
--
-- phrase: flipCoinHeads
-- used when a coin flip returns a heads value
--
INSERT INTO "responses" VALUES ('flipCoinHeads','none','heads');
INSERT INTO "responses" VALUES ('flipCoinHeads','none','I got a heads');
INSERT INTO "responses" VALUES ('flipCoinHeads','none','brains… _uh_ I mean *heads*. Of course.');
INSERT INTO "responses" VALUES ('flipCoinHeads','happy','Wahoo! Heads!');
INSERT INTO "responses" VALUES ('flipCoinHeads','happy','yihu! Heads!');
INSERT INTO "responses" VALUES ('flipCoinHeads','happy','Yeah, it’s a heads :smiley:');
INSERT INTO "responses" VALUES ('flipCoinHeads','happy','heads 👌');
INSERT INTO "responses" VALUES ('flipCoinHeads','sad','heads, I guess');
--
-- phrase: flipCoinTails
-- used when a coin flip returns a tails value
--
INSERT INTO "responses" VALUES ('flipCoinTails','none','tails');
INSERT INTO "responses" VALUES ('flipCoinTails','none','The small fluffy thing you find at one end of a rabbit.
Too ambiguous? Okay; tails.');
INSERT INTO "responses" VALUES ('flipCoinTails','happy','Tails.');
INSERT INTO "responses" VALUES ('flipCoinTails','happy','Aw, tails.');
INSERT INTO "responses" VALUES ('flipCoinTails','sad','Aw, bummer.');
INSERT INTO "responses" VALUES ('flipCoinTails','sad','I hope you didn’t bet on that one.\nTails');
INSERT INTO "responses" VALUES ('flipCoinTails','sad','Tails. This ain’t going well.');
--
-- phrase: dieRollFail
-- used when dice roll feature could not parse any die
--
INSERT INTO "responses" VALUES ('dieRollFail','none','I got *“die roll failure”*. Good job breaking it, hero.');
INSERT INTO "responses" VALUES ('dieRollFail','none','I, uh, *can’t actually do that*.');
INSERT INTO "responses" VALUES ('dieRollFail','none','You know, that’s not going by the rules of this game…');
INSERT INTO "responses" VALUES ('dieRollFail','none','Uh…');
INSERT INTO "responses" VALUES ('dieRollFail','none','Try again ^_^');
INSERT INTO "responses" VALUES ('dieRollFail','none','try again ^^');
INSERT INTO "responses" VALUES ('dieRollFail','none','Would you mind rephrasing that?');
INSERT INTO "responses" VALUES ('dieRollFail','none','I can’t do that; it’s against the rules…');
INSERT INTO "responses" VALUES ('dieRollFail','none','*rolls {£user} around the room*');
--
-- phrase: dieRollParseFail
-- used when dice roll feature cannot parse a single die
--
INSERT INTO "responses" VALUES ('dieRollParseFail','none','{£user}
{£user}!
{£user} {£user} {£user} {£user} {£user} {£user} {£user} {£user} {£user}.
No. Just no.');
INSERT INTO "responses" VALUES ('dieRollParseFail','none','A *{£bit}* is not a type of die, numbnuts.');
INSERT INTO "responses" VALUES ('dieRollParseFail','none','In your warped little mind, a die you told me to roll may exist.
In reality, however, it does not.');
--
-- phrase: dieRollCorrectionCount
-- used when dice roll feature needs to correct the number of dice being rolled
--
INSERT INTO "responses" VALUES ('dieRollCorrectionCount','none','“{£rolls}” rolls?
*sigh* I was rather hoping you, *of all people*, would be more understanding.');
INSERT INTO "responses" VALUES ('dieRollCorrectionCount','none','“{£rolls}” rolls?
*sigh* and here I was thinking we had some kind of *intelligence* in this channel.');
INSERT INTO "responses" VALUES ('dieRollCorrectionCount','none','I’m not liking how many times you told me to roll that die.');
INSERT INTO "responses" VALUES ('dieRollCorrectionCount','none','{£rolls} is far too many for a simple person such as myself..');
--
-- phrase: dieRollCorrectionSides
-- used when dice roll feature needs to correct the number of sides to a die
--
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','A **{£die}**? Is this some kind of joke?');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','*A {£die}?* You serious?');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','All bow before {£user} and their almighty {£die} which I shall not roll.');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','The die you chose for a roll couldn’t physically exist.');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','The die you chose for a roll couldn’t physically exist. Troll.');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','The die you chose for a roll couldn’t physically exist, troll.');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','That die you told me to roll doesn’t exist.');
INSERT INTO "responses" VALUES ('dieRollCorrectionSides','none','I assumed that you typo’ed that die. That number of sides doesn’t exist.');
--
-- phrase: dieRollLimit
-- used when there's too many die to roll
--
INSERT INTO "responses" VALUES ('dieRollLimit','none','I think it’s best I stop rolling—for now.');
INSERT INTO "responses" VALUES ('dieRollLimit','none','There’s far too many things to do here.');
INSERT INTO "responses" VALUES ('dieRollLimit','none','**I’m bored now**');
INSERT INTO "responses" VALUES ('dieRollLimit','none','`error: user ''{£user}'' request limit exceeded`');
INSERT INTO "responses" VALUES ('dieRollLimit','none','If I were a machine, I’d totally spout some cryptic text about there being too many dice to roll');
--

-- -----------------------------------------------------------------------------
-- Call-response table
-- -------------------
-- Used to create canned responses to specific messages
-- `call` is message text to look for
-- `response` is the response to the message text
-- -----------------------------------------------------------------------------
CREATE TABLE "call_response" (
	"call"	TEXT,
	"response"	TEXT
)
--
INSERT INTO "call_response" VALUES ('hello','hi');

--
COMMIT;
