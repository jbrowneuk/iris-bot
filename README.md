# iris-bot
Discord version of my slack chatbot, rewritten from the ground up

// TODO make readme better

## Getting up and running 
1. Install Node. The LTS version should be fine. 
2. `npm run quickstart` fetches dependencies, builds and then runs the bot using the start entry point.
 
## Developing 
1. `npm run develop` spins up a live-reload instance of the bot. Every time you change a file and save it, the bot will restart with the latest changes

## Responses
In some instances, the bot can respond with a canned response from a phrase set. It does this with the help of a SQLite database.

In order to initialize the database with the correct table structure, run the following SQL statement:

```sql
CREATE TABLE `responses` ( `type` TEXT, `mood` TEXT, `text` TEXT )
```

- `type` is the name of the phrase set this response belongs to, and is the identifier used in-code to fetch a phrase.
- `mood` is the general tone of voice of this phrase, and will be used to vary the responses based upon the bot's mood. Currently, only 'none' is supported.
- `text` is the actual textual content of the response.

For example, there may be a phrase set used to welcome new people to the server titled `'welcome'`. It could contain the following entries:
```json
[
  { "type": "welcome", "mood": "none", "text": "hey!" },
  { "type": "welcome", "mood": "none", "text": "hi" },
  { "type": "welcome", "mood": "none", "text": "welcome" },
]
```

When the bot uses the `'welcome'` phrase set, the resulting message may be either "hey!", "hi" or "welcome".

To use this feature in your personality constructs, grab the singleton instance of the class implementing `ResponseGenerator` using dependency injection or getting the value from the container itself.

```typescript
class myPersonality implements Personality {

  // Injected into the constructor - use this.responses.generateResponse('phrase') elsewhere in the class
  constructor(@inject(TYPES.ResponseGenerator) private responses: ResponseGenerator) {}

  // Used by getting the value from the container
  function myResponse(message: discord.Message): Promise<string> {
    if (message.content === '!command') {
      const responseGen = container.get<ResponseGenerator>(TYPES.ResponseGenerator);
      return responseGen.generateResponse('my-phrase-here');
    }

    return Promise.resolve(null);
  }
}
```
