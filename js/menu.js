/**
 * MARIFAH - Menu Page Controller
 * Loads menu data and handles filtering/search
 */

let menuData = null;
let currentFilter = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
  await loadMenuData();
  renderMenu();
  initFilters();
  initSearch();
  initScrollSpy();
});

/**
 * Load menu data from JSON
 */
async function loadMenuData() {
  try {
    const response = await fetch('data/menu.json');
    menuData = await response.json();
  } catch (error) {
    console.error('Failed to load menu data:', error);
    // Fallback: show error message
    document.getElementById('menuSections').innerHTML = `
      <p style="text-align: center; color: var(--gray-500); padding: var(--space-8);">
        Unable to load menu. Please refresh the page.
      </p>
    `;
  }
}

/**
 * Render the full menu
 */
function renderMenu() {
  if (!menuData) return;

  const lang = window.i18n?.getCurrentLang() || 'fr';
  const sectionsContainer = document.getElementById('menuSections');
  const navContainer = document.getElementById('categoryNav');

  // Clear containers
  sectionsContainer.innerHTML = '';
  navContainer.innerHTML = '';

  // Render each category
  menuData.categories.forEach((category, index) => {
    // Filter items based on current filter and search
    const filteredItems = filterItems(category.items);

    // Skip empty categories after filtering
    if (filteredItems.length === 0 && (currentFilter !== 'all' || currentSearch)) {
      return;
    }

    // Create section
    const section = document.createElement('section');
    section.className = 'menu-section fade-up';
    section.id = category.id;
    section.style.transitionDelay = `${index * 50}ms`;

    section.innerHTML = `
      <div class="menu-section__header">
        <span class="menu-section__icon">${category.icon}</span>
        <h2 class="menu-section__title">${category.name[lang]}</h2>
      </div>
      <div class="menu-items">
        ${filteredItems.map(item => renderMenuItem(item, lang)).join('')}
      </div>
    `;

    sectionsContainer.appendChild(section);

    // Create nav item
    const navItem = document.createElement('li');
    navItem.className = 'menu-sidebar__item';
    navItem.innerHTML = `
      <a href="#${category.id}" class="menu-sidebar__link" data-category="${category.id}">
        <span>${category.icon}</span>
        <span>${category.name[lang]}</span>
      </a>
    `;
    navContainer.appendChild(navItem);
  });

  // Trigger scroll reveal
  setTimeout(() => {
    document.querySelectorAll('.fade-up, .fade-left').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);
}

/**
 * Render a single menu item
 */
function renderMenuItem(item, lang) {
  const tags = item.tags || [];
  const tagsHtml = tags.map(tag => {
    const labels = {
      spicy: { fr: '🌶️ Épicé', en: '🌶️ Spicy' },
      vegetarian: { fr: '🌱 Végétarien', en: '🌱 Vegetarian' },
      popular: { fr: '⭐ Populaire', en: '⭐ Popular' }
    };
    return `<span class="menu-item__tag menu-item__tag--${tag}">${labels[tag]?.[lang] || tag}</span>`;
  }).join('');

  const halfPriceHtml = item.halfPrice
    ? `<div class="menu-item__price-half">${menuData.config.halfPortionLabel[lang]}: ${item.halfPrice}.-</div>`
    : '';

  const priceUnit = item.priceUnit
    ? ` <span style="font-size: var(--text-sm); font-weight: normal;">${item.priceUnit[lang]}</span>`
    : '.-';

  return `
    <article class="menu-item">
      <div class="menu-item__content">
        <div class="menu-item__header">
          <span class="menu-item__number">${item.id}.</span>
          <h3 class="menu-item__name">${item.name}</h3>
        </div>
        <p class="menu-item__description">${item.description[lang]}</p>
        ${tagsHtml ? `<div class="menu-item__tags">${tagsHtml}</div>` : ''}
      </div>
      <div class="menu-item__price">
        <div class="menu-item__price-main">${item.price}${typeof item.price === 'number' && !item.priceUnit ? '.-' : priceUnit}</div>
        ${halfPriceHtml}
      </div>
    </article>
  `;
}

/**
 * Filter items based on current filter and search
 */
function filterItems(items) {
  return items.filter(item => {
    // Filter check
    if (currentFilter !== 'all') {
      if (!item.tags || !item.tags.includes(currentFilter)) {
        return false;
      }
    }

    // Search check
    if (currentSearch) {
      const lang = window.i18n?.getCurrentLang() || 'fr';
      const searchLower = currentSearch.toLowerCase();
      const nameMatch = item.name.toLowerCase().includes(searchLower);
      const descMatch = item.description[lang].toLowerCase().includes(searchLower);
      if (!nameMatch && !descMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Initialize filter buttons
 */
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update filter and re-render
      currentFilter = btn.dataset.filter;
      renderMenu();
    });
  });
}

/**
 * Initialize search functionality
 */
function initSearch() {
  const searchInput = document.getElementById('menuSearch');
  if (!searchInput) return;

  // Debounce search
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value.trim();
      renderMenu();
    }, 300);
  });
}

/**
 * Initialize scroll spy for sidebar navigation
 */
function initScrollSpy() {
  const sections = document.querySelectorAll('.menu-section');
  const navLinks = document.querySelectorAll('.menu-sidebar__link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;

        // Update nav active state
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.category === id);
        });
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '-100px 0px -50% 0px'
  });

  sections.forEach(section => observer.observe(section));
}

// Re-render on language change
window.addEventListener('languageChanged', () => {
  renderMenu();
});
