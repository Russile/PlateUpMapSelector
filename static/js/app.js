let maps = [];
let selectedMaps = new Set();
let activeTagFilters = new Set();
let allTags = new Set();
let expandedCategories = new Set(['Player Count', 'Size', 'Type']);

// Close filters dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.filters-dropdown');
    const button = document.querySelector('.filters-button');
    
    // Don't close if clicking inside the dropdown, on a tag, or on a category header
    if (!dropdown.contains(event.target) && 
        !event.target.classList.contains('tag') && 
        !event.target.closest('.tag-group-header')) {
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
    // Stop event propagation to prevent the dropdown from closing
    event.stopPropagation();
    
    if (expandedCategories.has(category)) {
        expandedCategories.delete(category);
    } else {
        expandedCategories.add(category);
    }
    updateTagFilters();
}

function toggleTagFilter(tag) {
    // Stop event propagation to prevent the dropdown from closing
    event.stopPropagation();
    
    if (activeTagFilters.has(tag)) {
        activeTagFilters.delete(tag);
    } else {
        activeTagFilters.add(tag);
    }
    updateActiveFilters();
    updateTagFilters();
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
    
    // Clear the container
    container.innerHTML = '';
    
    // Create a document fragment to hold the filtered cards
    const fragment = document.createDocumentFragment();
    
    maps.forEach((map, index) => {
        const matchesSearch = map.name.toLowerCase().includes(searchTerm);
        const matchesTags = activeTagFilters.size === 0 || 
            Array.from(activeTagFilters).every(tag => map.tags.includes(tag));

        if (matchesSearch && matchesTags) {
            const card = document.createElement('div');
            card.className = 'col-md-4 col-lg-3 mb-4';
            card.innerHTML = `
                <div id="map-${index}" class="card map-card" onclick="toggleMapSelection(${index})">
                    <img src="${map.image || ''}" class="map-image" alt="${map.name || 'Unnamed Map'}" 
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f8f9fa%22/><text x=%2250%22 y=%2250%22 font-size=%2212%22 text-anchor=%22middle%22 fill=%22%23666%22>No Image</text></svg>'">
                    <div class="card-body">
                        <h5 class="card-title">${map.name || 'Unnamed Map'}</h5>
                        <div class="map-tags">
                            ${(map.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            // Restore selected state if the map was previously selected
            if (selectedMaps.has(index)) {
                card.querySelector('.map-card').classList.add('selected');
            }
            
            fragment.appendChild(card);
            visibleCount++;
        }
    });

    // Add all filtered cards to the container at once
    container.appendChild(fragment);

    if (visibleCount === 0) {
        container.innerHTML = `
            <div class="no-maps-message col-12">
                No maps match your filters. Try adjusting your search criteria.
            </div>
        `;
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
    // Create an object to store selected maps
    const exportData = {};

    // Add each selected map to the export data
    selectedMaps.forEach(index => {
        const map = maps[index];
        if (map.name && map.map_string) {
            exportData[map.name] = map.map_string;
        }
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
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
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data || !data.maps || !Array.isArray(data.maps)) {
            throw new Error('Data is not in the expected format (should contain maps array)');
        }
        
        // Add default maps
        const defaultMaps = [
            {
                name: "Running Sushi",
                map_string: "1NTowOjIsMjsxLDM6MTgsMTI6Mi4zOSwxLjYsMi42LDEuNiwyLjYsMS42LDIuNiwxLjYsMi42LDEuNiwyLjYsMS42LDEuNiwyLjYsMS42LDEuNiwyLjYsMS42LDEuNiwyLjYsMS42LDEuNiwyLjYsMS42LDEuNiwyLjYsMS42LDEuMzk6Miw3LDMsNywyOzIsNiwzLDYsMjsyLDUsMyw1LDI7Miw0LDMsNCwyOzEsLTEsMSwwLDM7NSw4LDUsOSwyOzQsOCw0LDksMjs2LDgsNiw5LDI7OCw4LDgsOSwyOzksOCw5LDksMjs3LDgsNyw5LDI7MTAsOCwxMCw5LDI7MTEsOCwxMSw5LDI7MTIsOCwxMiw5LDI7MTMsOCwxMyw5LDI7MTQsNywxNSw3LDI7MTQsNiwxNSw2LDI7MTQsNCwxNSw0LDI7MTMsMiwxMywzLDI7MTIsMiwxMiwzLDI7MTEsMiwxMSwzLDI7MTAsMiwxMCwzLDI7OCwyLDgsMywyOzcsMiw3LDMsMjs1LDIsNSwzLDI7NCwyLDQsMywyOzE0LDUsMTUsNSwxOzYsMiw2LDMsMTs5LDIsOSwzLDI7Miw4LDMsOCwyOzMsOCwzLDksMjsxNCw4LDE0LDksMjsxNCw4LDE1LDgsMjsxNCwzLDE1LDMsMjsxNCwyLDE0LDMsMjsyLDMsMywzLDI7MywyLDMsMywyOg==",
                tags: ["diner", "Large", "4p+"],
                image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23f8f9fa'/><text x='50%' y='50%' font-size='16' text-anchor='middle' fill='%23666'>Default Running Sushi</text></svg>"
            },
            {
                name: "Creative Mode Map",
                map_string: "1NTowOjIsMjsxLDM6MjEsMTI6Mi4xMjAsMS4xMzI6NCwtMSw0LDAsMzs5LDAsMTAsMCwyOzksMiwxMCwyLDI7OSwzLDEwLDMsMjs5LDQsMTAsNCwyOzksNSwxMCw1LDI7OSw3LDEwLDcsMjs5LDYsMTAsNiwyOzksOCwxMCw4LDI7OSw5LDEwLDksMjs5LDEwLDEwLDEwLDI7OSwxMSwxMCwxMSwyOzksMSwxMCwxLDE6",
                tags: ["creative", "Medium", "2p+"],
                image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23f8f9fa'/><text x='50%' y='50%' font-size='16' text-anchor='middle' fill='%23666'>Default Creative Mode</text></svg>"
            },
            {
                name: "Kitchen and Garden",
                map_string: "2NTU3OTQzMTU1OjQ0NzQzNzE2MzoyLDI7Myw0OzEsMzoyMiwxMToyLjMzLDMuMiwxLjksMy4yLDEuOSwzLjIsMS45LDMuMiwxLjksMy4yLDEuOSwzLjIsMS45LDMuMiwxLjksMy4yLDEuOSwzLjIsMS45LDMuMiwxLjksMy4yLDEuOSwzLjIsMS45LDMuMiwxLjksMy4yLDEuOSwzLjIsMS45LDMuMiwxLjksMy4yLDEuOSwzLjIsMS45LDMuMiwxLjk6MywxLDMsMiwyOzQsMSw0LDIsMjs1LDEsNSwyLDI7NiwxLDYsMiwyOzgsMSw4LDIsMjs3LDEsNywyLDI7OSwxLDksMiwyOzEwLDEsMTAsMiwyOzEyLDEsMTIsMiwyOzExLDEsMTEsMiwyOzEzLDEsMTMsMiwyOzE0LDEsMTQsMiwyOzE1LDEsMTUsMiwyOzE3LDEsMTcsMiwyOzE2LDEsMTYsMiwyOzE5LDEsMTksMiwyOzE4LDEsMTgsMiwyOzIwLDEsMjAsMiwyOzIxLDEsMjEsMiwyOzMsLTEsMywwLDI7NCwtMSw0LDAsMjs1LC0xLDUsMCwyOzYsLTEsNiwwLDI7NywtMSw3LDAsMjs4LC0xLDgsMCwyOzksLTEsOSwwLDI7MTAsLTEsMTAsMCwyOzExLC0xLDExLDAsMjsxMiwtMSwxMiwwLDI7MTMsLTEsMTMsMCwyOzE0LC0xLDE0LDAsMjsxNSwtMSwxNSwwLDI7MTYsLTEsMTYsMCwyOzE3LC0xLDE3LDAsMjsxOCwtMSwxOCwwLDI7MTksLTEsMTksMCwyOzIwLC0xLDIwLDAsMjsyMSwtMSwyMSwwLDI7Miw5LDMsOSwxOzEsLTEsMSwwLDM7MiwwLDMsMCwxOg==",
                tags: ["garden", "kitchen", "Large", "3p+"],
                image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23f8f9fa'/><text x='50%' y='50%' font-size='16' text-anchor='middle' fill='%23666'>Default Kitchen and Garden</text></svg>"
            },
            {
                name: "Private Seating",
                map_string: "1MTowOjEsMzsyLDI7MywxOjIxLDEzOjIuNCwzLjEsMS44LDIuNCwzLjEsMS44LDIuNCwzLjEsMS44LDMuNiwyLjQsMS4zLDMuNiwyLjQsMS4zLDIuNCwzLjIsMi40LDEuMywyLjQsMy4xLDEuOCwyLjQsMy4yLDIuNCwxLjMsMy42LDIuNCwxLjMsMy42LDIuNCwxLjMsMy41LDEuOCwzLjYsMi40LDEuMywzLjYsMi40LDEuMywyLjQsMy4yLDIuNCwxLjMsMi40LDMuMSwxLjgsMi40LDMuMiwyLjQsMS4zLDMuNiwyLjQsMS4zLDMuNiwyLjQsMS4zLDIuNCwzLjEsMS44LDIuNCwzLjEsMS44LDIuNCwzLjEsMS44OjUsNSw2LDUsMjs4LDUsOCw2LDE7MTQsNSwxNSw1LDI7MiwyLDMsMiwxOzcsMiw4LDIsMTsxMiwyLDEzLDIsMTsxNywyLDE4LDIsMTsxNiw1LDE2LDYsMTs0LDUsNCw2LDE7Niw0LDYsNSwyOzYsNSw3LDUsMjs5LDUsMTAsNSwyOzEwLDUsMTEsNSwyOzEwLDQsMTAsNSwyOzEyLDUsMTIsNiwxOzE0LDQsMTQsNSwyOzEzLDUsMTQsNSwyOzEsNCwxLDUsMTsxOSw0LDE5LDUsMTs2LC0xLDYsMCwzOg==",
                tags: ["private", "restaurant", "Large", "4p+"],
                image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23f8f9fa'/><text x='50%' y='50%' font-size='16' text-anchor='middle' fill='%23666'>Default Private Seating</text></svg>"
            },
            {
                name: "Booths",
                map_string: "1MTowOjIsMjszLDE7MSwzOjE5LDk6My4yNywyLjUsMS40LDIuNSwxLjQsMi41LDEuNCwzLjIsMi4zLDMuMiwxLjIsMi41LDEuNCwyLjUsMS40LDIuNSwxLjQsMy4yLDIuMywzLjIsMS4yLDIuNSwxLjQsMi41LDEuNCwyLjUsMS40LDMuMiwyLjMsMy4yLDEuMiwyLjUsMS40LDIuNSwxLjQsMi41LDEuNCwyLjUsMS40OjE3LC0xLDE3LDAsMzsxNyw0LDE3LDUsMTsyLDYsMyw2LDE7MiwzLDMsMywxOzUsMCw2LDAsMjs1LDEsNiwxLDI7NiwxLDYsMiwyOzYsMSw3LDEsMjs2LDAsNywwLDI7OSwwLDEwLDAsMjs5LDEsMTAsMSwyOzEwLDEsMTAsMiwyOzEwLDEsMTEsMSwyOzEwLDAsMTEsMCwyOzEzLDAsMTQsMCwyOzEzLDEsMTQsMSwyOzE0LDEsMTQsMiwyOzE0LDEsMTUsMSwyOzE0LDAsMTUsMCwyOzUsNSw2LDUsMjs1LDYsNiw2LDI7Niw2LDYsNywyOzYsNiw3LDYsMjs2LDUsNyw1LDI7OSw1LDEwLDUsMjs5LDYsMTAsNiwyOzEwLDYsMTAsNywyOzEwLDYsMTEsNiwyOzEwLDUsMTEsNSwyOzEzLDUsMTQsNSwyOzEzLDYsMTQsNiwyOzE0LDYsMTQsNywyOzE0LDYsMTUsNiwyOzE0LDUsMTUsNSwyOzEyLDQsMTIsNSwyOzgsNCw4LDUsMjs0LDQsNCw1LDI6",
                tags: ["booths", "restaurant", "Large", "4p+"],
                image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23f8f9fa'/><text x='50%' y='50%' font-size='16' text-anchor='middle' fill='%23666'>Default Booths</text></svg>"
            }
        ];

        // Combine default maps with loaded maps
        maps = [...defaultMaps, ...data.maps];
        console.log(`Loaded ${maps.length} maps (including ${defaultMaps.length} default maps)`);
        
        // Collect all unique tags
        maps.forEach(map => {
            if (map.tags && Array.isArray(map.tags)) {
                map.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        // Create map cards
        const container = document.getElementById('mapContainer');
        maps.forEach((map, index) => {
            const card = document.createElement('div');
            card.className = 'col-md-4 col-lg-3 mb-4';
            card.innerHTML = `
                <div id="map-${index}" class="card map-card" onclick="toggleMapSelection(${index})">
                    <img src="${map.image || ''}" class="map-image" alt="${map.name || 'Unnamed Map'}" 
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f8f9fa%22/><text x=%2250%22 y=%2250%22 font-size=%2212%22 text-anchor=%22middle%22 fill=%22%23666%22>No Image</text></svg>'">
                    <div class="card-body">
                        <h5 class="card-title">${map.name || 'Unnamed Map'}</h5>
                        <div class="map-tags">
                            ${(map.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
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
        container.innerHTML = `
            <div class="col-12 text-center text-danger">
                <p>Error loading map data: ${error.message}</p>
                <p>Please try refreshing the page. If the error persists, check the console for more details.</p>
            </div>
        `;
    }); 