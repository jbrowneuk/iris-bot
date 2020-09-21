# iris-bot
Discord version of my slack chatbot, rewritten from the ground up

// TODO make readme better

## Getting up and running
1. Install Node. The LTS version should be fine.
1. Create a copy of `config.example.json` as `config.json`. Update the values inside.
1. Use `bot.sql` to generate a SQLite file called `bot.sqlite`. This enables the bot to use responses (outlined below).
1. `npm run quickstart` fetches dependencies, builds and then runs the bot using the start entry point.

### Developing 
`npm run develop` spins up a live-reload instance of the bot. Every time you change a file and save it, the bot will restart with the latest changes

## Responses
In some instances, the bot can respond with a canned response from a phrase set. It does this with the help of a SQLite database containing phrases. An example SQL file used to populate the responses table can be found in the `bot.sql` file. This contains some of the phrase sets used in the *Domain of J* community.

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
  { "type": "welcome", "mood": "none", "text": "welcome" },
]
```

When the bot uses the `'welcome'` phrase set with a neutral mood, the resulting message may be either "hey!", "hi" or "welcome".

To use this feature in your personality constructs, use the `responses` property of the `DependencyContainer`. Pass this to your personality construct in the index file.

```typescript
class myPersonality implements Personality {

  // Dependency container is made available through `this.deps`
  constructor(private deps: DependencyContainer) {}

  /* other code removed for clarity */

  // Usage
  private myResponse(message: discord.Message): Promise<string> {
    if (message.content === '!command') {
      return this.deps.responses.generateResponse('my-phrase-here');
    }

    return Promise.resolve(null);
  }
}
```

## Major areas of work
Work needs to be done on the following areas:
1. The bot really needs proper dependency injection. It used to use a framework but this was removed after becoming unstable.
1. Improved handling of disconnections. It relies on the built-in Discord.JS behaviour right now.
1. Settings rework. Currently the settings are used for the initial connection and never touched again after. Each core that needs individual settings then implements it in a different way.
1. Permissions control. Currently everyone can use all permissions.
1. A lot more that I haven't thought about yet!
