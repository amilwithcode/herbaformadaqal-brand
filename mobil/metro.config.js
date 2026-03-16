const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const rnwRoot = path.dirname(require.resolve("react-native-web/package.json"));

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (moduleName === "react-native") {
      return context.resolveRequest(context, "react-native-web", platform);
    }
    const subpathMatch = moduleName.match(/^react-native-web\/(dist\/exports\/[^/]+)\/?$/);
    if (subpathMatch) {
      const filePath = path.join(rnwRoot, subpathMatch[1], "index.js");
      return { type: "sourceFile", filePath };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
