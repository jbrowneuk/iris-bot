# iris-bot

`iris-bot` is a Discord bot written for the Domain of J community. It was ported from a version I made for Slack, which in turn was ported from a version written for IRC.

The goal of iris-bot is not to have a bot that specialises in a certain functionality with commands, but to have a bot that can interact with using more natural language than others.

# Getting up and running

1. Install Node. The LTS version should be fine.
1. Create a copy of `<root>/conf/config.example.json` as `<root>/config.json`. Update the values inside.
1. Use `<root>/conf/bot.sql` to generate a SQLite file called `<root>/bot.sqlite`. This enables the bot to use responses (outlined below).
1. `npm run quickstart` fetches dependencies, builds and then runs the bot using the start entry point.

# Developing

`npm run develop` spins up a live-reload instance of the bot. Every time you change a file and save it, the bot will restart with the latest changes.

Using `npm run pr-check` will highlight issues that should be addressed before making a PR.

## Major areas needing work

Work needs to be done on the following areas:

1. The bot really needs proper dependency injection. It used to use a framework but this was removed after becoming unstable.
1. Improved handling of disconnections. It relies on the built-in Discord.JS behaviour right now.
1. Settings rework. Currently the settings are used for the initial connection and never touched again after. Each core that needs individual settings then implements it in a different way.
1. Permissions control. Currently everyone can use all permissions.
1. A lot more that I haven't thought about yet!

# Advanced topics

1. Custom responses
2. Running the bot as a systemd service

## 1. Custom responses

In some instances, the bot can respond with a canned response from a phrase set. It does this with the help of a SQLite database containing phrases. An example SQL file used to populate the responses table can be found in the `<root>/conf/bot.sql` file. This contains some of the phrase sets used in the _Domain of J_ community.

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

## 2. Running the bot as a systemd service

The bot can be run on a \*nix server using systemd. An example unit file is provided in the `conf` directory. Please be sure to update the values to match your environment.

Place your systemd service file in the `systemd/system/` directory on the machine and invoke `systemctl daemon-reload`. You can then `enable` and `start` the service as required.
