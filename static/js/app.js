let maps = [];
let selectedMaps = new Set();
let activeTagFilters = new Set();
let allTags = new Set();
let expandedCategories = new Set(['Player Count', 'Size', 'Type']);

// Close filters dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.filters-dropdown');
    const button = document.querySelector('.filters-button');
    if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

function toggleFilters(event) {
    event.stopPropagation();
    const dropdown = document.querySelector('.filters-dropdown');
    dropdown.classList.toggle('show');
}

// Tag categories for organization
const tagCategories = {
    'Player Count': tag => /^\d+p\+?$/.test(tag),
    'Size': tag => ['Small', 'Medium', 'Large', 'Huge'].includes(tag),
    'Type': tag => ['diner', 'kitchen', 'restaurant', 'cafe', 'solo', 'split', 'boxed'].includes(tag),
    'Difficulty': tag => ['easy', 'hard'].includes(tag),
    'Authors': tag => tag.startsWith('by '),
    'Other': tag => {
        // If tag doesn't belong to any other category
        return !Object.values(tagCategories).slice(0, -1).some(fn => fn(tag));
    }
};

function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (activeTagFilters.size === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = Array.from(activeTagFilters).map(tag => `
        <span class="filter-badge">
            ${tag}
            <span class="remove-filter" onclick="event.stopPropagation(); toggleTagFilter('${tag}')">×</span>
        </span>
    `).join('');
}

function updateTagFilters() {
    const container = document.getElementById('tagFilters');
    const tags = Array.from(allTags);
    
    // Group tags by category
    const groupedTags = {};
    Object.keys(tagCategories).forEach(category => {
        groupedTags[category] = tags.filter(tagCategories[category]);
    });

    // Sort tags within each group
    Object.values(groupedTags).forEach(group => {
        group.sort((a, b) => a.localeCompare(b));
    });

    // Create HTML for each group
    container.innerHTML = Object.entries(groupedTags)
        .filter(([_, tags]) => tags.length > 0)
        .map(([category, tags]) => `
            <div class="tag-group">
                <div class="tag-group-header" onclick="toggleTagGroup('${category}')">
                    <span class="tag-group-title">${category}</span>
                    <span class="bi ${expandedCategories.has(category) ? 'bi-chevron-up' : 'bi-chevron-down'}"></span>
                </div>
                <div class="tag-group-content ${expandedCategories.has(category) ? 'show' : ''}">
                    ${tags.map(tag => `
                        <span class="tag ${activeTagFilters.has(tag) ? 'active' : ''}" 
                              onclick="toggleTagFilter('${tag}')">${tag}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
}

function toggleTagGroup(category) {
    if (expandedCategories.has(category)) {
        expandedCategories.delete(category);
    } else {
        expandedCategories.add(category);
    }
    updateTagFilters();
}

function toggleTagFilter(tag) {
    if (activeTagFilters.has(tag)) {
        activeTagFilters.delete(tag);
    } else {
        activeTagFilters.add(tag);
    }
    updateActiveFilters();
    filterMaps();
}

function clearFilters() {
    activeTagFilters.clear();
    document.getElementById('searchInput').value = '';
    updateActiveFilters();
    filterMaps();
}

function filterMaps() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('mapContainer');
    let visibleCount = 0;

    maps.forEach((map, index) => {
        const card = document.getElementById(`map-${index}`);
        const matchesSearch = map.name.toLowerCase().includes(searchTerm);
        const matchesTags = activeTagFilters.size === 0 || 
            Array.from(activeTagFilters).every(tag => map.tags.includes(tag));

        if (matchesSearch && matchesTags) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    if (visibleCount === 0) {
        if (!document.querySelector('.no-maps-message')) {
            const message = document.createElement('div');
            message.className = 'no-maps-message col-12';
            message.innerHTML = 'No maps match your filters. Try adjusting your search criteria.';
            container.appendChild(message);
        }
    } else {
        const message = document.querySelector('.no-maps-message');
        if (message) message.remove();
    }
}

function toggleMapSelection(index) {
    const map = maps[index];
    const card = document.getElementById(`map-${index}`);
    
    if (selectedMaps.has(index)) {
        selectedMaps.delete(index);
        card.classList.remove('selected');
    } else {
        selectedMaps.add(index);
        card.classList.add('selected');
    }
    
    document.getElementById('selectedCount').textContent = selectedMaps.size;
}

function saveSelection() {
    const selectedMapData = Array.from(selectedMaps).map(index => maps[index]);
    const blob = new Blob([JSON.stringify(selectedMapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'default.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize
document.getElementById('searchInput').addEventListener('input', filterMaps);

// Fetch and load map data
fetch('maps_data.json')
    .then(response => response.json())
    .then(data => {
        maps = data;
        
        // Collect all unique tags
        maps.forEach(map => {
            map.tags.forEach(tag => allTags.add(tag));
        });
        
        // Create map cards
        const container = document.getElementById('mapContainer');
        maps.forEach((map, index) => {
            const card = document.createElement('div');
            card.className = 'col-md-4 col-lg-3 mb-4';
            card.innerHTML = `
                <div id="map-${index}" class="card map-card" onclick="toggleMapSelection(${index})">
                    <img src="${map.image}" class="map-image" alt="${map.name}">
                    <div class="card-body">
                        <h5 class="card-title">${map.name}</h5>
                        <div class="map-tags">
                            ${map.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        
        updateTagFilters();
    })
    .catch(error => {
        console.error('Error loading map data:', error);
        const container = document.getElementById('mapContainer');
        container.innerHTML = '<div class="col-12 text-center text-danger">Error loading map data. Please try refreshing the page.</div>';
    }); 