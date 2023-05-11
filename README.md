# iris-bot — a Discord bot focusing on natural language interaction

`iris-bot` is a Discord bot written for the Domain of J community. It was ported from a version I made for Slack, which in turn was ported from a version written for IRC.

The goal of iris-bot is not to have a bot that specialises in a certain functionality with commands, but to have a bot that users can interact with using natural language.

# Getting up and running

1. Install Node. The LTS version should be fine.
1. Create a copy of `<root>/conf/config.example.json` as `<root>/config.json`. Update the values inside.
1. Run `npm run gen-db` to initialise the bot configuration DB using the example file as a starting point. This enables the bot to save settings and use responses (outlined below).
1. `npm run quickstart` fetches dependencies, builds and then runs the bot using the start entry point.

# Developing

To get started developing quickly, follow the first three points in the section directly above. This will set up the configuration that the bot needs in order to run. Following this, run `npm install` to pull down packages.

When developing, there are some NPM scripts that can be used to make development easier:

- `npm run develop` spins up a a development version of the bot. It should also live reload when files are changed.
- `npm run test` runs the bot’s unit tests in the console.
- `npm run coverage` also runs the tests, but generates a code coverage report as well.
- `npm run pr-check` will highlight issues that should be addressed before making a PR.

# Bot configuration

The bot stores the majority of its configuration in a SQLite database, `<root>/bot.sqlite`. An example SQL file used to populate the responses table can be found in the `<root>/conf/bot.sql` file.

To generate a database from the example file, run `npm run gen-db`. This can then be viewed and modified using a tool like [DB Browser for SQLite](https://sqlitebrowser.org/).

The main tables generated are documented in the SQL example file, however in summary:

- `tally` is used by the tally core to store the count for a server
- `hangman` is used by the hangman core to store the game information for a server
- `responses` is used to control the responses provided by the response generator
- `call_response` is used to respond to specific calls

# Adding functionality

The bot uses personality plugins, often called `cores` in a loose reference to Portal. These are placed in `src/personality` and implement the `Personality` interface found in `src/interfaces/personality.ts`.

## `Personality` interface: required methods

The interface defines the following **required** method signatures:

### `onMessage(message: Message): Promise<MessageType>`

This is called whenever the bot receives a message.

The parameters are:

- `message: Message` - the source message object from Discord

Return a `Promise` resolving to `null` to ignore the message, or resolving to one of the `MessageType`s to handle it.

### `onAddressed(message: Message, addressedMessage: string): Promise<MessageType>`

This is called when the bot detects that it has been addressed by a user, i.e. when someone types `@botname message` in the chat.

The parameters are:

- `message: Message` - the source message object from Discord
- `addressedMessage: string` - the message text after the mention, i.e. `@bot hi` returns `hi`

Return a `Promise` resolving to `null` to ignore the message, or resolving to one of the `MessageType`s to handle it.

## `Personality` interface: optional methods

The interface defines the following **optional** method signatures:

### `initialise(): void`

This is called when the bot starts up but before it is connected to the server. Use this method to initialise long-running setup tasks in preference of doing it all in the constructor.

### `destroy(): void`

This is called as the bot is shutting down but before the core components are unloaded. It can be used as a place to store settings to i.e. the database. Long-running tasks should be avoided here as there is no guarantee they will complete in time.

### `onHelp(): Promise<MessageType>`

This is called when a user requests help for the specific core. If this method is implemented, _your core will show up in the help list with a lowercase string version of the class name_.

The parameters are:

- `message: Message` - the source message object from Discord

Return a `Promise` resolving to one of the `MessageType`s. Resolving to null is not recommended — simply do not implement this instead.

# Generating responses from a set

The bot can generate multiple responses by selecting a random response from a phrase set, meaning responses for a particular command can vary. It does this with the help of three things: the `responses` table in the configuration DB, a simulated “mood” and and the response generator.

The structure of the response database table is as follows:

```sql
CREATE TABLE `responses` ( `type` TEXT, `mood` TEXT, `text` TEXT )
```

- `type` is the name of the phrase set this response belongs to, and is the identifier used in-code to fetch a phrase.
- `mood` is the general tone of voice of this phrase, and is be used to vary the responses based upon the bot's mood. The values are 'none' (neutral mood), 'happy' (positive mood) and 'sad' (negative mood).
- `text` is the actual textual content of the response.

For example, there may be a phrase set used to welcome new people to the server titled `'welcome'`. It could contain the following entries:

```json
[
  { "type": "welcome", "mood": "none", "text": "hey!" },
  { "type": "welcome", "mood": "none", "text": "hi" },
  { "type": "welcome", "mood": "none", "text": "welcome" }
]
```

When the bot uses the `'welcome'` phrase set with a neutral mood, the resulting message may be either "hey!", "hi" or "welcome".

To use this feature in your personality constructs, use the `responses` property of the `DependencyContainer`. Pass this to your personality construct in the index file.

```typescript
class myPersonality implements Personality {
  // Dependency container is made available through `this.deps`
  constructor(private deps: DependencyContainer) {}

  /* other code removed for clarity */

  // Example usage in a custom function
  private myResponse(message: discord.Message): Promise<string> {
    if (message.content === '!command') {
      return this.deps.responses.generateResponse('my-phrase-here');
    }

    return Promise.resolve(null);
  }
}
```

# Running the bot as a systemd service

The bot can be run on a \*nix server using systemd. An example unit file is provided in the `conf` directory. Please be sure to update the values to match your environment.

Place your systemd service file in the `systemd/system/` directory on the machine and invoke `systemctl daemon-reload`. You can then `enable` and `start` the service as required.
