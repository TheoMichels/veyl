module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    storageMode: process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'development' ? 'supabase' : 'local',
  },
});
