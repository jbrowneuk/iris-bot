export interface ServerInformation {
  url: string;
  channelId: string;
  lastKnownOnline: boolean;
}

export interface ServerPlayer {
  name: string;
}

export interface ServerResponse {
  version: string;
  onlinePlayers: number;
  maxPlayers: number;
  samplePlayers: ServerPlayer[];
}
