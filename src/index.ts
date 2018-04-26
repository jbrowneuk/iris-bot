import * as discord from 'discord.js';

const client = new discord.Client();
const token = ''; // DO NOT SUBMIT

client.on('ready', () => {
  console.log('connected');
});

client.on('message', (message: discord.Message) => {
  if (message.author === client.user) {
    return;
  }

  if (message.channel.type !== 'text') {
    return;
  }

  if (message.content === '+echo') {
    message.channel.send('echo!');
  }
});

client.login(token);
