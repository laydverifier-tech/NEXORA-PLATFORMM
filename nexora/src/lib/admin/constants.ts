export const STAGES = ['GROUP_A', 'GROUP_B', 'LAST_CHANCE', 'GRAND_FINAL'] as const;
export const ROOM_STATUSES = ['SCHEDULED', 'OPEN', 'LIVE', 'FINISHED', 'CANCELLED'] as const;
export const DISCORD_WEBHOOK_RE = /^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d{5,25}\/[A-Za-z0-9_-]{20,120}$/;
