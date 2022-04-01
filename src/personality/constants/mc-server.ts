import { COMMAND_PREFIX } from '../../constants/personality-constants';

// Commands
export const statusCommand = COMMAND_PREFIX + 'MCSTATUS';
export const setCommand = COMMAND_PREFIX + 'MCSET';
export const announceCommand = COMMAND_PREFIX + 'MCANNOUNCE';

// Responses
export const noAssociationCopy = 'No Minecraft server associated with this Discord';
export const defaultDescription = 'The Minecraft server associated with this Discord.';
