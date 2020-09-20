module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@components": "./src/components",
            "@stores": "./src/stores",
            "@modules": "./src/modules",
            "@apis": "./src/apis",
            "@shared": "../../shared",
          },
        },
      ],
    ],
  };
};
