module.exports = ({ config }) => {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL || "https://your-domain.com";
  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl,
    },
  };
};
