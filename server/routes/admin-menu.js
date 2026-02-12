/**
 * MARIFAH - Admin Menu CRUD
 * Reads/writes data/menu.json
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const MENU_PATH = path.join(__dirname, '..', '..', 'data', 'menu.json');

function readMenu() {
  return JSON.parse(fs.readFileSync(MENU_PATH, 'utf8'));
}

function writeMenu(data) {
  fs.writeFileSync(MENU_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getNextItemId(menu) {
  let maxId = 0;
  for (const cat of menu.categories) {
    for (const item of cat.items) {
      if (item.id > maxId) maxId = item.id;
    }
  }
  return maxId + 1;
}

// GET /api/admin/menu - Get full menu
router.get('/', (req, res) => {
  try {
    res.json(readMenu());
  } catch (error) {
    res.status(500).json({ error: 'Erreur lecture menu' });
  }
});

// PUT /api/admin/menu - Save entire menu
router.put('/', (req, res) => {
  try {
    writeMenu(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde menu' });
  }
});

// ==========================================
// ITEMS
// ==========================================

// POST /api/admin/menu/items - Add item to a category
router.post('/items', (req, res) => {
  try {
    const { categoryId, name, description, price, halfPrice, tags } = req.body;
    const menu = readMenu();
    const category = menu.categories.find(c => c.id === categoryId);

    if (!category) return res.status(404).json({ error: 'Categorie non trouvee' });
    if (!name || !price) return res.status(400).json({ error: 'Nom et prix requis' });

    const item = {
      id: getNextItemId(menu),
      name,
      description: description || { fr: '', en: '' },
      price: Number(price),
      tags: tags || []
    };
    if (halfPrice) item.halfPrice = Number(halfPrice);

    category.items.push(item);
    writeMenu(menu);

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: 'Erreur ajout item' });
  }
});

// PUT /api/admin/menu/items/:id - Update item
router.put('/items/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const menu = readMenu();

    for (const cat of menu.categories) {
      const idx = cat.items.findIndex(i => i.id === id);
      if (idx !== -1) {
        const existing = cat.items[idx];
        const updated = { ...existing, ...req.body, id };
        if (req.body.price !== undefined) updated.price = Number(req.body.price);
        if (req.body.halfPrice !== undefined) updated.halfPrice = req.body.halfPrice ? Number(req.body.halfPrice) : undefined;
        if (!updated.halfPrice) delete updated.halfPrice;

        // Handle category change
        if (req.body.categoryId && req.body.categoryId !== cat.id) {
          const newCat = menu.categories.find(c => c.id === req.body.categoryId);
          if (!newCat) return res.status(404).json({ error: 'Categorie cible non trouvee' });
          cat.items.splice(idx, 1);
          delete updated.categoryId;
          newCat.items.push(updated);
        } else {
          delete updated.categoryId;
          cat.items[idx] = updated;
        }

        writeMenu(menu);
        return res.json({ success: true, item: updated });
      }
    }

    res.status(404).json({ error: 'Item non trouve' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise a jour item' });
  }
});

// DELETE /api/admin/menu/items/:id - Delete item
router.delete('/items/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const menu = readMenu();

    for (const cat of menu.categories) {
      const idx = cat.items.findIndex(i => i.id === id);
      if (idx !== -1) {
        cat.items.splice(idx, 1);
        writeMenu(menu);
        return res.json({ success: true });
      }
    }

    res.status(404).json({ error: 'Item non trouve' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression item' });
  }
});

// ==========================================
// CATEGORIES
// ==========================================

// POST /api/admin/menu/categories - Add category
router.post('/categories', (req, res) => {
  try {
    const { id, name, icon } = req.body;
    const menu = readMenu();

    if (!id || !name) return res.status(400).json({ error: 'ID et nom requis' });
    if (menu.categories.find(c => c.id === id)) {
      return res.status(400).json({ error: 'ID deja utilise' });
    }

    const category = {
      id,
      name: name || { fr: '', en: '' },
      icon: icon || '',
      items: []
    };

    menu.categories.push(category);
    writeMenu(menu);

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ error: 'Erreur ajout categorie' });
  }
});

// PUT /api/admin/menu/categories/:id - Update category
router.put('/categories/:id', (req, res) => {
  try {
    const menu = readMenu();
    const cat = menu.categories.find(c => c.id === req.params.id);

    if (!cat) return res.status(404).json({ error: 'Categorie non trouvee' });

    if (req.body.name) cat.name = req.body.name;
    if (req.body.icon !== undefined) cat.icon = req.body.icon;

    writeMenu(menu);
    res.json({ success: true, category: cat });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise a jour categorie' });
  }
});

// DELETE /api/admin/menu/categories/:id - Delete category (must be empty)
router.delete('/categories/:id', (req, res) => {
  try {
    const menu = readMenu();
    const idx = menu.categories.findIndex(c => c.id === req.params.id);

    if (idx === -1) return res.status(404).json({ error: 'Categorie non trouvee' });
    if (menu.categories[idx].items.length > 0) {
      return res.status(400).json({ error: 'La categorie doit etre vide avant suppression' });
    }

    menu.categories.splice(idx, 1);
    writeMenu(menu);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression categorie' });
  }
});

// PUT /api/admin/menu/categories/reorder - Reorder categories
router.put('/categories/reorder', (req, res) => {
  try {
    const { order } = req.body; // Array of category IDs
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order doit etre un tableau' });

    const menu = readMenu();
    const reordered = [];

    for (const id of order) {
      const cat = menu.categories.find(c => c.id === id);
      if (cat) reordered.push(cat);
    }

    // Append any categories not in the order list
    for (const cat of menu.categories) {
      if (!reordered.find(c => c.id === cat.id)) {
        reordered.push(cat);
      }
    }

    menu.categories = reordered;
    writeMenu(menu);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur reordonnancement' });
  }
});

module.exports = router;
