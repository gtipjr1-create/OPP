export const APP_CONFIG = {
  shortName: 'OPP',
  yearMark: '2026',
  fullName: 'Organized Persistent Plans',
  owner: 'Tipler Enterprise Group',
} as const;

export const APP_TITLE = `${APP_CONFIG.shortName} | ${APP_CONFIG.fullName}`;
export const APP_DESCRIPTION = `By ${APP_CONFIG.owner}`;