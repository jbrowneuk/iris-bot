import * as discord from 'discord.js';

import * as LifecycleEvents from './constants/lifecycle-events';
import { DiscordClient } from './client/discord-client';

const token = ''; // DO NOT SUBMIT
const client = new DiscordClient(token);

client.on(LifecycleEvents.CONNECTED, () => console.log('Connected'));

client.on(LifecycleEvents.MESSAGE, (message: discord.Message) => {
  if (message.content === '+echo') {
    client.queueMessages(['echo!'], message.channel);
  }

  if (message.content === '+leave') {
    client.disconnect();
  }
});

client.connect();
