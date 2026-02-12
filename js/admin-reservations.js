/**
 * MARIFAH - Reservation Admin UI
 */

const ResAdmin = {
  currentPage: 1,

  async init() {
    if (!Admin.requireAuth()) return;
    await this.load();
  },

  async load(page) {
    if (page) this.currentPage = page;

    const status = document.getElementById('filterStatus').value;
    const source = document.getElementById('filterSource').value;
    const date = document.getElementById('filterDate').value;

    const params = new URLSearchParams();
    params.set('page', this.currentPage);
    params.set('limit', '20');
    if (status) params.set('status', status);
    if (source) params.set('source', source);
    if (date) params.set('date', date);

    try {
      const data = await Admin.apiGet(`/api/admin/reservations?${params}`);
      if (!data) return;
      this.render(data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    }
  },

  render(data) {
    const tbody = document.getElementById('reservationsBody');

    if (data.items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="table-empty">Aucune reservation trouvee</td></tr>';
    } else {
      tbody.innerHTML = data.items.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>
            <strong>${Admin.escapeHtml(r.name)}</strong>
            ${r.email ? `<br><small>${Admin.escapeHtml(r.email)}</small>` : ''}
          </td>
          <td>${Admin.formatDate(r.date)}</td>
          <td>${Admin.escapeHtml(r.time)}</td>
          <td>${r.guests}</td>
          <td><a href="tel:${Admin.escapeHtml(r.phone)}">${Admin.escapeHtml(r.phone)}</a></td>
          <td><span class="badge badge--${r.source}">${r.source}</span></td>
          <td>
            <select class="form-control" style="width:auto;padding:2px 24px 2px 8px;font-size:12px"
              onchange="ResAdmin.updateStatus(${r.id}, this.value)">
              <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>En attente</option>
              <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>Confirme</option>
              <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Annule</option>
            </select>
          </td>
          <td>
            <a href="https://wa.me/41${(r.phone || '').replace(/^0|\+41|[^0-9]/g, '')}" target="_blank" class="btn btn--sm btn--secondary">WA</a>
          </td>
        </tr>
      `).join('');
    }

    // Pagination
    const info = document.getElementById('paginationInfo');
    info.textContent = `${data.total} reservation(s) - Page ${data.page}/${data.pages || 1}`;

    const buttons = document.getElementById('paginationButtons');
    buttons.innerHTML = '';

    if (data.page > 1) {
      const prev = document.createElement('button');
      prev.className = 'btn btn--secondary btn--sm';
      prev.textContent = 'Precedent';
      prev.onclick = () => this.load(data.page - 1);
      buttons.appendChild(prev);
    }

    if (data.page < data.pages) {
      const next = document.createElement('button');
      next.className = 'btn btn--secondary btn--sm';
      next.textContent = 'Suivant';
      next.onclick = () => this.load(data.page + 1);
      buttons.appendChild(next);
    }
  },

  async updateStatus(id, status) {
    try {
      await Admin.apiPut(`/api/admin/reservations/${id}/status`, { status });
      Admin.toast('Statut mis a jour');
    } catch (err) {}
  }
};

ResAdmin.init();
