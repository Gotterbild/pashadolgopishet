module.exports = {
	pagination: {
		data: "collections.posts",
		size: 1,
		before: function(paginationData) {
			let yearMap = {};
			paginationData.forEach(post => {
				let year = post.date.getFullYear();
				if (!yearMap[year]) {
					yearMap[year] = [];
				}
				yearMap[year].push(post);
			});
			let years = Object.keys(yearMap).sort((a, b) => b - a);
			// Skip the first (newest) year since it's shown on homepage
			const result = years.slice(1).map((year, index) => ({
				year: parseInt(year),
				posts: yearMap[year],
				isNewest: false
			}));
			return result;
		},
		alias: "yearData"
	},
	layout: "layouts/home.njk",
	eleventyComputed: {
		title: (data) => {
			return `Архив ${data.yearData.year}`;
		},
		permalink: (data) => {
			return `/blog/${data.yearData.year}/`;
		},
		yearNav: (data) => {
			let years = [];
			let yearSet = new Set();
			for(let item of data.collections.posts) {
				yearSet.add(item.date.getFullYear());
			}
			years = Array.from(yearSet).sort((a, b) => b - a);
		
			let nav = '<nav class="special-font" style="text-align: center; font-size: 1.5em; margin-bottom: 1em;">\n';
			years.forEach((year, index) => {
				if (year === data.yearData.year) {
					nav += `<span class="bold">${year}</span>`;
				} else {
					// Link to homepage for the newest year, /blog/YEAR/ for others
					const href = index === 0 ? '/' : `/blog/${year}/`;
					nav += `<a href="${href}">${year}</a>`;
				}
				if (index < years.length - 1) {
					nav += ' ';
				}
			});
			nav += '\n</nav>';
			return nav;
		}
	}
};