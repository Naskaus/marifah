/**
 * MARIFAH - Voucher Admin UI
 */

const VoucherAdmin = {
  vouchers: [],

  async init() {
    if (!Admin.requireAuth()) return;
    await this.load();
  },

  async load() {
    try {
      this.vouchers = await Admin.apiGet('/api/admin/vouchers') || [];
      this.render();
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    }
  },

  render() {
    const tbody = document.getElementById('vouchersBody');

    if (this.vouchers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Aucun voucher. Creez-en un!</td></tr>';
      return;
    }

    tbody.innerHTML = this.vouchers.map(v => {
      const discountLabel = v.discount_type === 'percent'
        ? `${v.discount_value}%`
        : `${v.discount_value} CHF`;

      const usesLabel = v.max_uses
        ? `${v.current_uses} / ${v.max_uses}`
        : `${v.current_uses} (illimite)`;

      const expiryLabel = v.expiry_date
        ? Admin.formatDate(v.expiry_date)
        : 'Aucune';

      const isExpired = v.expiry_date && new Date(v.expiry_date) < new Date();

      return `
        <tr>
          <td><strong>${Admin.escapeHtml(v.code)}</strong></td>
          <td><span class="badge badge--${v.discount_type}">${discountLabel}</span></td>
          <td>${expiryLabel} ${isExpired ? '<span class="badge badge--cancelled">expire</span>' : ''}</td>
          <td>${usesLabel}</td>
          <td><span class="badge badge--${v.is_active ? 'active' : 'inactive'}">${v.is_active ? 'Actif' : 'Inactif'}</span></td>
          <td>
            <button class="btn btn--secondary btn--sm" onclick="VoucherAdmin.showQr(${v.id}, '${Admin.escapeHtml(v.code)}')">QR</button>
            <button class="btn btn--secondary btn--sm" onclick="VoucherAdmin.edit(${v.id})">Modifier</button>
            <button class="btn btn--danger btn--sm" onclick="VoucherAdmin.remove(${v.id})">Suppr.</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  add() {
    document.getElementById('voucherModalTitle').textContent = 'Nouveau voucher';
    document.getElementById('voucherId').value = '';
    document.getElementById('voucherCode').value = '';
    document.getElementById('voucherCode').disabled = false;
    document.getElementById('voucherType').value = 'percent';
    document.getElementById('voucherValue').value = '';
    document.getElementById('voucherExpiry').value = '';
    document.getElementById('voucherMaxUses').value = '';
    document.getElementById('voucherActive').checked = true;
    Admin.openModal('voucherModal');
  },

  edit(id) {
    const v = this.vouchers.find(x => x.id === id);
    if (!v) return;

    document.getElementById('voucherModalTitle').textContent = 'Modifier le voucher';
    document.getElementById('voucherId').value = v.id;
    document.getElementById('voucherCode').value = v.code;
    document.getElementById('voucherCode').disabled = true;
    document.getElementById('voucherType').value = v.discount_type;
    document.getElementById('voucherValue').value = v.discount_value;
    document.getElementById('voucherExpiry').value = v.expiry_date || '';
    document.getElementById('voucherMaxUses').value = v.max_uses || '';
    document.getElementById('voucherActive').checked = !!v.is_active;
    Admin.openModal('voucherModal');
  },

  async save() {
    const id = document.getElementById('voucherId').value;
    const data = {
      code: document.getElementById('voucherCode').value.trim(),
      discount_type: document.getElementById('voucherType').value,
      discount_value: document.getElementById('voucherValue').value,
      expiry_date: document.getElementById('voucherExpiry').value || null,
      max_uses: document.getElementById('voucherMaxUses').value || null,
      is_active: document.getElementById('voucherActive').checked
    };

    if (!data.code || !data.discount_value) {
      Admin.toast('Code et valeur requis', 'error');
      return;
    }

    try {
      if (id) {
        await Admin.apiPut(`/api/admin/vouchers/${id}`, data);
      } else {
        await Admin.apiPost('/api/admin/vouchers', data);
      }
      Admin.closeModal('voucherModal');
      Admin.toast(id ? 'Voucher modifie' : 'Voucher cree');
      await this.load();
    } catch (err) {}
  },

  async remove(id) {
    if (!confirm('Supprimer ce voucher ?')) return;
    try {
      await Admin.apiDelete(`/api/admin/vouchers/${id}`);
      Admin.toast('Voucher supprime');
      await this.load();
    } catch (err) {}
  },

  showQr(id, code) {
    document.getElementById('qrModalTitle').textContent = `QR Code - ${code}`;
    document.getElementById('qrCode').textContent = code;
    document.getElementById('qrImage').src = `/api/admin/vouchers/${id}/qr?t=${Date.now()}`;
    Admin.openModal('qrModal');
  }
};

VoucherAdmin.init();
