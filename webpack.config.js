const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = function (options, webpackRef) {
  let appName = "default";

  // ✅ Try to detect from entry (normal case)
  const entryFile = options?.entry?.main?.import?.[0];
  if (entryFile) {
    const match = entryFile.match(/apps[\\/](.*?)[\\/]/);
    if (match && match[1]) appName = match[1];
  } else {
    // ✅ Try to detect from process args (like "nest start api-gateway")
    const args = process.argv.join(" ");
    const match = args.match(/start\s+([^\s]+)/);
    if (match && match[1]) appName = match[1];
  }

  console.log(`⚙️ Building for app: ${appName}`);

  return {
    ...options,
    externals: [nodeExternals()],
    output: {
      ...options.output,
      path: path.resolve(__dirname, `dist/apps/${appName}`),
      filename: "main.js",
    },
  };
};
