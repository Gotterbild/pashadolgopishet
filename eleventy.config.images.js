const path = require("path");
const eleventyImage = require("@11ty/eleventy-img");

function relativeToInputPath(inputPath, relativeFilePath) {
	let split = inputPath.split("/");
	split.pop();

	return path.resolve(split.join(path.sep), relativeFilePath);

}

function isFullUrl(url) {
	try {
		new URL(url);
		return true;
	} catch(e) {
		return false;
	}
}

module.exports = function(eleventyConfig) {

	eleventyConfig.addPassthroughCopy("content/**/*.svg");
	eleventyConfig.addPassthroughCopy("content/**/*.png");
	eleventyConfig.addPassthroughCopy("content/**/*.jpg");
	eleventyConfig.addPassthroughCopy("content/**/CNAME");
	eleventyConfig.addPassthroughCopy("content/**/*.mp4");

	// Eleventy Image shortcode
	// https://www.11ty.dev/docs/plugins/image/
	eleventyConfig.addAsyncShortcode("image", async function imageShortcode(src, alt, widths, sizes) {
		// Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
		// Warning: Avif can be resource-intensive so take care!
		let formats = ["svg", "auto"];
		// let formats = ["auto"];
		let input;
		if(isFullUrl(src)) {
			input = src;
		} else {
			input = relativeToInputPath(this.page.inputPath, src);
		}

		let metadata = await eleventyImage(input, {
			// widths: ["auto"],
			// widths: widths || ["auto"],
			// formats,
			outputDir: path.join(eleventyConfig.dir.output, "img"), // Advanced usage note: `eleventyConfig.dir` works here because we’re using addPlugin.
		});

		// TODO loading=eager and fetchpriority=high
		let imageAttributes = {
			alt,
			// sizes,
			loading: "lazy",
			decoding: "async",
		};

		return `<picture data-pagefind-ignore>
			${Object.values(metadata)
				.map((imageFormat) => {
					return `  <source type="${
						imageFormat[0].sourceType
					}" srcset="${imageFormat
						.map((entry) => entry.srcset)
						.join(", ")}" sizes="${sizes}">`;
				})
				.join("\n")}
				<img
					src="${metadata.jpeg[0].url}"
					width="${metadata.jpeg[0].width}"
					height="${metadata.jpeg[0].height}"
					alt="${alt}"
					title="${alt}"
					loading="lazy"
					decoding="async"
					data-pagefind-ignore>
				<span>${alt}</span>
			</picture>
		`
		// return eleventyImage.generateHTML(metadata, imageAttributes);
	});
	

};
