const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const existingBlockList = config.resolver.blockList;
const localSkillsPattern = /[/\\]\.local[/\\].*/;

if (existingBlockList instanceof RegExp) {
  config.resolver.blockList = new RegExp(
    `${existingBlockList.source}|${localSkillsPattern.source}`
  );
} else if (Array.isArray(existingBlockList)) {
  config.resolver.blockList = [...existingBlockList, localSkillsPattern];
} else {
  config.resolver.blockList = localSkillsPattern;
}

module.exports = config;
