/**
 * MARIFAH - Menu Editor UI
 */

const MenuAdmin = {
  menu: null,

  async init() {
    if (!Admin.requireAuth()) return;
    await this.load();
  },

  async load() {
    try {
      this.menu = await Admin.apiGet('/api/admin/menu');
      this.render();
    } catch (err) {
      console.error('Failed to load menu:', err);
    }
  },

  render() {
    const container = document.getElementById('menuContent');
    if (!this.menu || !this.menu.categories.length) {
      container.innerHTML = '<div class="table-empty">Aucune categorie. Ajoutez-en une!</div>';
      return;
    }

    container.innerHTML = this.menu.categories.map(cat => `
      <div class="category-section" data-category="${cat.id}">
        <div class="category-header">
          <div class="category-header__left">
            <span class="icon">${cat.icon || ''}</span>
            <h3>${Admin.escapeHtml(cat.name.fr)}</h3>
            <span class="count">(${cat.items.length} items)</span>
          </div>
          <div class="category-header__actions">
            <button class="btn btn--secondary btn--sm" onclick="MenuAdmin.editCategory('${cat.id}')">Modifier</button>
            <button class="btn btn--danger btn--sm" onclick="MenuAdmin.deleteCategory('${cat.id}')">Supprimer</button>
          </div>
        </div>
        <ul class="menu-items-list">
          ${cat.items.length === 0 ? '<li class="menu-item" style="justify-content:center;color:var(--color-text-muted)">Aucun item dans cette categorie</li>' : ''}
          ${cat.items.map(item => `
            <li class="menu-item" data-item-id="${item.id}">
              <div class="menu-item__info">
                <div class="menu-item__name">${Admin.escapeHtml(item.name)}</div>
                <div class="menu-item__desc">${Admin.escapeHtml(item.description?.fr || '')}</div>
              </div>
              <div class="menu-item__tags">
                ${(item.tags || []).map(t => `<span class="badge badge--${t}">${t}</span>`).join('')}
              </div>
              <div class="menu-item__price">
                ${item.price} CHF
                ${item.halfPrice ? `<br><small>${item.halfPrice} CHF</small>` : ''}
              </div>
              <div class="menu-item__actions">
                <button class="btn btn--secondary btn--sm" onclick="MenuAdmin.editItem(${item.id})">Modifier</button>
                <button class="btn btn--danger btn--sm" onclick="MenuAdmin.deleteItem(${item.id})">Suppr.</button>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  },

  // ==========================================
  // ITEMS
  // ==========================================
  addItem() {
    document.getElementById('itemModalTitle').textContent = 'Ajouter un item';
    document.getElementById('itemId').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemDescFr').value = '';
    document.getElementById('itemDescEn').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemHalfPrice').value = '';
    document.getElementById('tagSpicy').checked = false;
    document.getElementById('tagVegetarian').checked = false;
    document.getElementById('tagPopular').checked = false;
    this.populateCategorySelect();
    Admin.openModal('itemModal');
  },

  editItem(id) {
    let item = null;
    let catId = null;
    for (const cat of this.menu.categories) {
      const found = cat.items.find(i => i.id === id);
      if (found) { item = found; catId = cat.id; break; }
    }
    if (!item) return;

    document.getElementById('itemModalTitle').textContent = 'Modifier l\'item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemDescFr').value = item.description?.fr || '';
    document.getElementById('itemDescEn').value = item.description?.en || '';
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemHalfPrice').value = item.halfPrice || '';
    document.getElementById('tagSpicy').checked = (item.tags || []).includes('spicy');
    document.getElementById('tagVegetarian').checked = (item.tags || []).includes('vegetarian');
    document.getElementById('tagPopular').checked = (item.tags || []).includes('popular');
    this.populateCategorySelect(catId);
    Admin.openModal('itemModal');
  },

  populateCategorySelect(selectedId) {
    const select = document.getElementById('itemCategory');
    select.innerHTML = this.menu.categories.map(c =>
      `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name.fr}</option>`
    ).join('');
  },

  async saveItem() {
    const id = document.getElementById('itemId').value;
    const tags = [];
    if (document.getElementById('tagSpicy').checked) tags.push('spicy');
    if (document.getElementById('tagVegetarian').checked) tags.push('vegetarian');
    if (document.getElementById('tagPopular').checked) tags.push('popular');

    const data = {
      categoryId: document.getElementById('itemCategory').value,
      name: document.getElementById('itemName').value,
      description: {
        fr: document.getElementById('itemDescFr').value,
        en: document.getElementById('itemDescEn').value
      },
      price: document.getElementById('itemPrice').value,
      halfPrice: document.getElementById('itemHalfPrice').value || null,
      tags
    };

    if (!data.name || !data.price) {
      Admin.toast('Nom et prix requis', 'error');
      return;
    }

    try {
      if (id) {
        await Admin.apiPut(`/api/admin/menu/items/${id}`, data);
      } else {
        await Admin.apiPost('/api/admin/menu/items', data);
      }
      Admin.closeModal('itemModal');
      Admin.toast(id ? 'Item modifie' : 'Item ajoute');
      await this.load();
    } catch (err) {
      // Error already shown by api wrapper
    }
  },

  async deleteItem(id) {
    if (!confirm('Supprimer cet item ?')) return;
    try {
      await Admin.apiDelete(`/api/admin/menu/items/${id}`);
      Admin.toast('Item supprime');
      await this.load();
    } catch (err) {}
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  addCategory() {
    document.getElementById('categoryModalTitle').textContent = 'Ajouter une categorie';
    document.getElementById('categoryEditId').value = '';
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryId').disabled = false;
    document.getElementById('categoryNameFr').value = '';
    document.getElementById('categoryNameEn').value = '';
    document.getElementById('categoryIcon').value = '';
    Admin.openModal('categoryModal');
  },

  editCategory(id) {
    const cat = this.menu.categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('categoryModalTitle').textContent = 'Modifier la categorie';
    document.getElementById('categoryEditId').value = id;
    document.getElementById('categoryId').value = id;
    document.getElementById('categoryId').disabled = true;
    document.getElementById('categoryNameFr').value = cat.name.fr;
    document.getElementById('categoryNameEn').value = cat.name.en;
    document.getElementById('categoryIcon').value = cat.icon;
    Admin.openModal('categoryModal');
  },

  async saveCategory() {
    const editId = document.getElementById('categoryEditId').value;
    const data = {
      id: document.getElementById('categoryId').value,
      name: {
        fr: document.getElementById('categoryNameFr').value,
        en: document.getElementById('categoryNameEn').value
      },
      icon: document.getElementById('categoryIcon').value
    };

    if (!data.id || !data.name.fr) {
      Admin.toast('ID et nom francais requis', 'error');
      return;
    }

    try {
      if (editId) {
        await Admin.apiPut(`/api/admin/menu/categories/${editId}`, data);
      } else {
        await Admin.apiPost('/api/admin/menu/categories', data);
      }
      Admin.closeModal('categoryModal');
      Admin.toast(editId ? 'Categorie modifiee' : 'Categorie ajoutee');
      await this.load();
    } catch (err) {}
  },

  async deleteCategory(id) {
    const cat = this.menu.categories.find(c => c.id === id);
    if (cat && cat.items.length > 0) {
      Admin.toast('La categorie doit etre vide avant suppression', 'error');
      return;
    }
    if (!confirm('Supprimer cette categorie ?')) return;
    try {
      await Admin.apiDelete(`/api/admin/menu/categories/${id}`);
      Admin.toast('Categorie supprimee');
      await this.load();
    } catch (err) {}
  }
};

MenuAdmin.init();
