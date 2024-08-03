module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("static");

  // This line is required for hot reloading of changes to passthrough copy
  // dirs like static/
  //
  // Docs: https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  return {
    dir: {
      input: "views",
      output: "_site",
    },
  };
};
