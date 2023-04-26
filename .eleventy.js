const { DateTime } = require("luxon");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const Image = require("@11ty/eleventy-img");
const path = require('path');


module.exports = function(eleventyConfig) {

  // Eleventy Navigation https://www.11ty.dev/docs/plugins/navigation/
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Configuration API: use eleventyConfig.addLayoutAlias(from, to) to add
  // layout aliases! Say you have a bunch of existing content using
  // layout: post. If you don’t want to rewrite all of those values, just map
  // post to a new file like this:
  // eleventyConfig.addLayoutAlias("post", "layouts/my_new_post_layout.njk");

  // Merge data instead of overriding
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  // Date formatting (human readable)
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });

  // Date formatting (machine readable)
  eleventyConfig.addFilter("machineDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd");
  });

  // Minify CSS
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // Minify JS
  eleventyConfig.addFilter("jsmin", function(code) {
    let minified = UglifyJS.minify(code);
    if (minified.error) {
      console.log("UglifyJS error: ", minified.error);
      return code;
    }
    return minified.code;
  });

  // Minify HTML output
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if (outputPath.indexOf(".html") > -1) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }
    return content;
  });





  /* Fetch and transform an image to a `picture` with multiple sources */
  async function pictureShortcode(
    src,
    alt,
    sizes = "",
    loading = "eager",
    decoding = "auto"
  ) {
    let metadata = await Image(src, {
      // Set these however you like (the more widths, the more time to build, so not always a good idea to have a ton)
      widths: [600, 1200, 1920],
      // What formats to include. Avif and Webp are small, jpeg is supported more broadly. The browser will pick the right one
      formats: ["avif", "webp", "jpeg"],
      // Output images under _site/img/opt. This can help caching
      outputDir: "_site/img/opt/",
      // Inform the base path for URLs, e.g. in <source> and <img> elements
      urlPath: "/img/opt/",
      // Rename 'box-on-table' to 'box-on-table-hashHere123-1200w.jpg' etc.
      filenameFormat: function (id, src, width, format, options) {
        const extension = path.extname(src);
        const name = path.basename(src, extension);

        return `${name}-${id}-${width}w.${format}`;
      },
    });

    let imageAttributes = {
      alt,
      sizes,
      loading,
      decoding,
    };

    return Image.generateHTML(metadata, imageAttributes, {
      whitespaceMode: "inline",
    });
  }

  eleventyConfig.addNunjucksAsyncShortcode("picture", pictureShortcode);
  eleventyConfig.addLiquidShortcode("picture", pictureShortcode);
  eleventyConfig.addJavaScriptFunction("picture", pictureShortcode);



  // Don't process folders with static assets e.g. images
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("static/img");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("admin/");
  // We additionally output a copy of our CSS for use in Netlify CMS previews
  eleventyConfig.addPassthroughCopy("_includes/assets/css/inline.css");

  /* Markdown Plugins */
  let markdownIt = require("markdown-it");
  let markdownItAnchor = require("markdown-it-anchor");
  let options = {
    breaks: true,
    linkify: true
  };
  let opts = {
    permalink: false
  };

  eleventyConfig.setLibrary("md", markdownIt(options)
    .use(markdownItAnchor, opts)
  );

  return {
    templateFormats: ["md", "njk", "liquid"],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about it.
    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for URLs (it does not affect your file structure)
    pathPrefix: "/",

    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
