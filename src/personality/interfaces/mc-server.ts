export interface ServerInformation {
  url: string;
  channelId: string | undefined | null;
  lastKnownOnline: boolean;
}

export interface ServerVersion {
  name_clean: string;
}

export interface ServerPlayer {
  name_clean: string;
}

export interface ServerPlayers {
  online: number;
  max: number;
  list: ServerPlayer[];
}

export interface ServerMotd {
  clean: string;
}

export interface ServerResponse {
  online: boolean;
  host: string;
  port: number;
  version?: ServerVersion;
  players?: ServerPlayers;
  motd?: ServerMotd;
  icon?: string;
}
