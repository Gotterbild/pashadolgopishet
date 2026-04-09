// Custom search implementation
let searchIndex = null;

// Load search index
async function loadSearchIndex() {
	if (searchIndex) return searchIndex;
	
	try {
		const response = await fetch('/search-index.json');
		searchIndex = await response.json();
		console.log('Search index loaded:', searchIndex.posts.length, 'posts');
		return searchIndex;
	} catch (error) {
		console.error('Failed to load search index:', error);
		return { posts: [] };
	}
}

// Search function
function search(query) {
	console.log('Search called with query:', query);
	if (!searchIndex || !query) {
		console.log('No search index or empty query');
		return [];
	}
	
	const searchTerm = query.toLowerCase().trim();
	console.log('Searching for:', searchTerm);
	const results = [];
	
	searchIndex.posts.forEach(post => {
		let score = 0;
		let matchedIn = [];
		
		// Search in title (highest priority)
		if (post.title && post.title.toLowerCase().includes(searchTerm)) {
			score += 10;
			matchedIn.push('title');
		}
		
		// Search in description
		if (post.description && post.description.toLowerCase().includes(searchTerm)) {
			score += 5;
			matchedIn.push('description');
		}
		
		// Search in tags
		if (post.tags && Array.isArray(post.tags)) {
			const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
			if (tagMatch) {
				score += 3;
				matchedIn.push('tags');
			}
		}
		
		if (score > 0) {
			results.push({
				...post,
				score,
				matchedIn
			});
		}
	});
	
	// Sort by score (highest first)
	results.sort((a, b) => b.score - a.score);
	
	console.log('Search results:', results.length, 'found');
	return results;
}

// Render results
function renderResults(results, query) {
	const container = document.getElementById('search-results-list');
	
	if (!results || results.length === 0) {
		container.innerHTML = `<p class="search-no-results">Ничего не найдено по запросу "${query}"</p>`;
		return;
	}
	
	const html = results.map((post, index) => {
		const title = post.title || 'Без названия';
		const description = post.description ? `<p class="search-result-description">${post.description}</p>` : '';
		const tags = post.tags && post.tags.length > 0 
			? `<div class="search-result-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</div>`
			: '';
		
		return `
			<a href="${post.url}" class="search-result" data-index="${index}">
				<h3 class="search-result-title">${title}</h3>
				<div class="search-result-meta">
					<time class="search-result-date">${post.date}</time>
					${tags}
				</div>
				${description}
			</a>
		`;
	}).join('');
	
	container.innerHTML = html;
	
	// Reset selected index when results change
	window.selectedResultIndex = -1;
}

// Initialize search UI
window.addEventListener('DOMContentLoaded', async () => {
	const searchContainer = document.getElementById('search');
	const searchIcon = document.getElementById('search-icon');
	const searchClose = document.getElementById('search-close');
	const searchInput = document.getElementById('search-input');
	const searchResultsCount = document.getElementById('search-results-count');
	
	// Load index on page load for faster search
	await loadSearchIndex();
	
	// Open search modal
	searchIcon.addEventListener('click', () => {
		searchContainer.classList.add('active');
		setTimeout(() => {
			searchInput.focus();
		}, 100);
	});
	
	// Close search modal
	searchClose.addEventListener('click', () => {
		searchContainer.classList.remove('active');
		searchInput.value = '';
		document.getElementById('search-results-list').innerHTML = '';
		searchResultsCount.textContent = '';
	});
	
	// Close on background click
	searchContainer.addEventListener('click', (e) => {
		if (e.target === searchContainer) {
			searchContainer.classList.remove('active');
			searchInput.value = '';
			document.getElementById('search-results-list').innerHTML = '';
			searchResultsCount.textContent = '';
		}
	});
	
	// Close on Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && searchContainer.classList.contains('active')) {
			searchContainer.classList.remove('active');
			searchInput.value = '';
			document.getElementById('search-results-list').innerHTML = '';
			searchResultsCount.textContent = '';
		}
	});
	
	// Search on input
	let debounceTimer;
	searchInput.addEventListener('input', (e) => {
		clearTimeout(debounceTimer);
		const query = e.target.value;
		
		if (!query || query.trim().length < 2) {
			document.getElementById('search-results-list').innerHTML = '';
			searchResultsCount.textContent = '';
			return;
		}
		
		debounceTimer = setTimeout(() => {
			const results = search(query);
			renderResults(results, query);
			
			if (results.length > 0) {
				const count = results.length;
				const word = count === 1 ? 'результат' : (count < 5 ? 'результата' : 'результатов');
				searchResultsCount.textContent = `Найдено ${count} ${word}`;
			} else {
				searchResultsCount.textContent = '';
			}
		}, 300);
	});
	
	// Keyboard navigation
	window.selectedResultIndex = -1;
	
	searchInput.addEventListener('keydown', (e) => {
		const resultElements = document.querySelectorAll('.search-result');
		
		if (resultElements.length === 0) return;
		
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			window.selectedResultIndex = Math.min(window.selectedResultIndex + 1, resultElements.length - 1);
			updateSelectedResult(resultElements);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			window.selectedResultIndex = Math.max(window.selectedResultIndex - 1, -1);
			updateSelectedResult(resultElements);
		} else if (e.key === 'Enter' && window.selectedResultIndex >= 0) {
			e.preventDefault();
			resultElements[window.selectedResultIndex].click();
		}
	});
	
	function updateSelectedResult(resultElements) {
		resultElements.forEach((el, index) => {
			if (index === window.selectedResultIndex) {
				el.classList.add('selected');
				el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			} else {
				el.classList.remove('selected');
			}
		});
	}
});