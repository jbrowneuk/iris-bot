import * as discord from 'discord.js';
import { IMock, Mock, It, Times } from 'typemoq';
import { DiscordClient } from './discord-client';

import { DISCORD_EVENTS } from './discord-events';

const MOCK_TOKEN = '12345abcde';

describe('Discord client wrapper', () => {
  let discordMock: IMock<discord.Client>;
  let client: DiscordClient;

  beforeEach(() => {
    discordMock = Mock.ofType<discord.Client>();

    client = new DiscordClient();
    spyOn((client as any), 'generateClient').and.returnValue(discordMock.object);
  });

  it('should connect with token', () => {
    discordMock.setup(m => m.login(It.isAnyString()));

    client.connect(MOCK_TOKEN);

    discordMock.verify(m => m.login(It.isValue(MOCK_TOKEN)), Times.once());
  });

  it('should initialise event listeners on connect', () => {
    discordMock.setup(m => m.on(It.isAnyString(), It.isAny()));

    client.connect(MOCK_TOKEN);

    // Connected and message
    discordMock.verify(m => m.on(It.isValue('ready'), It.isAny()), Times.once());
    discordMock.verify(m => m.on(It.isValue('message'), It.isAny()), Times.once());
  });
});
