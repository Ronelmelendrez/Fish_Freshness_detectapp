module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "nativewind/babel"],
    plugins: [
      [
        "module-resolver",
        {
          alias: { "@": "./src" },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
      // ✅ Frame-processor worklet plugin (v5 uses react-native-worklets-core)
      require.resolve("react-native-worklets-core/plugin"),
    ],
  };
};