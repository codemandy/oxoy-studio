const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const { DateTime } = require("luxon");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
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

  // Sitemap
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://example.com",
    },
  });

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

   //Collections
   eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("./posts/**/*.md");
  });
   eleventyConfig.addCollection("cv", function (collectionApi) {
    return collectionApi.getFilteredByGlob("./pages/cv.md");
  });
   eleventyConfig.addCollection("contact", function (collectionApi) {
    return collectionApi.getFilteredByGlob("./pages/contact.md");
  });

// Add the filter.
  function sortByOrder(values) {
    let vals = [...values];
    return vals.sort((a, b) => Math.sign(a.data.order - b.data.order));
  }
  eleventyConfig.addFilter("sortByOrder", sortByOrder);


  async function pictureShortcode(
    src,
    alt,
    sizes = "",
    loading = "eager",
    decoding = "auto"
  ) {
    const imagePath = src.replace(/^\//, ''); // Remove leading slash from the image path
    const metadata = await Image(imagePath, {
      widths: [600, 1200, 1920],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "_site/img/opt/",
      urlPath: "img/opt/",
      filenameFormat: function (id, src, width, format, options) {
        const extension = path.extname(src);
        const name = path.basename(src, extension);
        return `${name}-${id}-${width}w.${format}`;
      },
    });
  
    const imageAttributes = {
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
eleventyConfig.addPassthroughCopy("img/favicon");
  eleventyConfig.addPassthroughCopy("admin/");
  // We additionally output a copy of our CSS for use in Netlify CMS previews
  eleventyConfig.addPassthroughCopy("_includes/assets/css/inline.css");
  eleventyConfig.addPassthroughCopy("_includes/assets/css/tailwind.css");
  eleventyConfig.addPassthroughCopy("_includes/assets/fonts/");

  /* Markdown Plugins */
   // Configure markdown-it
   const md = markdownIt({
    html: true, // Enable HTML tags in source
    breaks: true, // Convert '\n' in paragraphs into <br>
    linkify: true // Autoconvert URL-like text to links
  });
  md.use(markdownItAttrs); // Enable attributes on Markdown elements

  // Tell 11ty to use markdown-it to parse Markdown files
  eleventyConfig.setLibrary("md", md);


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
