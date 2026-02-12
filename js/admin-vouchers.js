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
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Aucun voucher. Creez-en un!</td></tr>';
      return;
    }

    tbody.innerHTML = this.vouchers.map(v => {
      const discountLabel = v.discount_type === 'percent'
        ? `${v.discount_value}%`
        : `${v.discount_value} CHF`;

      const expiryLabel = v.expiry_date
        ? Admin.formatDate(v.expiry_date)
        : 'Aucune';

      const isExpired = v.expiry_date && new Date(v.expiry_date) < new Date();

      const claimed = v.claims_count || 0;
      const used = v.used_count || 0;

      return `
        <tr>
          <td><strong>${Admin.escapeHtml(v.code)}</strong></td>
          <td>${Admin.escapeHtml(v.title || '-')}</td>
          <td><span class="badge badge--${v.discount_type}">${discountLabel}</span></td>
          <td>${expiryLabel} ${isExpired ? '<span class="badge badge--cancelled">expire</span>' : ''}</td>
          <td>
            <span class="claims-count" onclick="VoucherAdmin.viewClaims(${v.id}, '${Admin.escapeHtml(v.code)}')" style="cursor:pointer;text-decoration:underline" title="Voir les claims">
              ${claimed} reclame${claimed !== 1 ? 's' : ''} / ${used} utilise${used !== 1 ? 's' : ''}
            </span>
          </td>
          <td><span class="badge badge--${v.is_active ? 'active' : 'inactive'}">${v.is_active ? 'Actif' : 'Inactif'}</span></td>
          <td>
            <button class="btn btn--secondary btn--sm" onclick="VoucherAdmin.copyLink('${Admin.escapeHtml(v.code)}')" title="Copier le lien">Lien</button>
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
    document.getElementById('voucherTitleInput').value = '';
    document.getElementById('voucherDesc').value = '';
    document.getElementById('voucherType').value = 'percent';
    document.getElementById('voucherValue').value = '';
    document.getElementById('voucherExpiry').value = '';
    document.getElementById('voucherMaxUses').value = '';
    document.getElementById('voucherActive').checked = true;
    document.getElementById('bgFileInput').value = '';
    this.resetBgPreview();
    Admin.openModal('voucherModal');
  },

  edit(id) {
    const v = this.vouchers.find(x => x.id === id);
    if (!v) return;

    document.getElementById('voucherModalTitle').textContent = 'Modifier le voucher';
    document.getElementById('voucherId').value = v.id;
    document.getElementById('voucherCode').value = v.code;
    document.getElementById('voucherCode').disabled = true;
    document.getElementById('voucherTitleInput').value = v.title || '';
    document.getElementById('voucherDesc').value = v.description || '';
    document.getElementById('voucherType').value = v.discount_type;
    document.getElementById('voucherValue').value = v.discount_value;
    document.getElementById('voucherExpiry').value = v.expiry_date || '';
    document.getElementById('voucherMaxUses').value = v.max_uses || '';
    document.getElementById('voucherActive').checked = !!v.is_active;
    document.getElementById('bgFileInput').value = '';

    // Show background preview if exists
    if (v.background_image) {
      this.showBgPreview(`/uploads/vouchers/${v.background_image}`);
    } else {
      this.resetBgPreview();
    }

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
      is_active: document.getElementById('voucherActive').checked,
      title: document.getElementById('voucherTitleInput').value.trim() || null,
      description: document.getElementById('voucherDesc').value.trim() || null
    };

    if (!data.code || !data.discount_value) {
      Admin.toast('Code et valeur requis', 'error');
      return;
    }

    try {
      let result;
      if (id) {
        result = await Admin.apiPut(`/api/admin/vouchers/${id}`, data);
      } else {
        result = await Admin.apiPost('/api/admin/vouchers', data);
      }

      const voucherId = id || (result && result.id);

      // Upload background image if file selected
      const fileInput = document.getElementById('bgFileInput');
      if (fileInput.files.length > 0 && voucherId) {
        await this.uploadBackground(voucherId, fileInput.files[0]);
      }

      Admin.closeModal('voucherModal');
      Admin.toast(id ? 'Voucher modifie' : 'Voucher cree');
      await this.load();
    } catch (err) {}
  },

  async uploadBackground(voucherId, file) {
    const formData = new FormData();
    formData.append('background', file);

    try {
      const token = Admin.getToken();
      const res = await fetch(`/api/admin/vouchers/${voucherId}/background`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        Admin.toast(data.error || 'Erreur upload image', 'error');
      }
    } catch (err) {
      Admin.toast('Erreur upload image', 'error');
    }
  },

  async removeBackground() {
    const id = document.getElementById('voucherId').value;
    if (!id) {
      this.resetBgPreview();
      return;
    }

    try {
      await Admin.apiDelete(`/api/admin/vouchers/${id}/background`);
      this.resetBgPreview();
      Admin.toast('Image supprimee');
      await this.load();
    } catch (err) {}
  },

  showBgPreview(url) {
    document.getElementById('bgPlaceholder').classList.add('hidden');
    const img = document.getElementById('bgPreviewImg');
    img.src = url;
    img.classList.remove('hidden');
    document.getElementById('bgRemoveBtn').classList.remove('hidden');
  },

  resetBgPreview() {
    document.getElementById('bgPlaceholder').classList.remove('hidden');
    document.getElementById('bgPreviewImg').classList.add('hidden');
    document.getElementById('bgPreviewImg').src = '';
    document.getElementById('bgRemoveBtn').classList.add('hidden');
  },

  async remove(id) {
    if (!confirm('Supprimer ce voucher ?')) return;
    try {
      await Admin.apiDelete(`/api/admin/vouchers/${id}`);
      Admin.toast('Voucher supprime');
      await this.load();
    } catch (err) {}
  },

  copyLink(code) {
    const url = `${window.location.origin}/voucher.html?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url).then(() => {
      Admin.toast('Lien copie dans le presse-papier');
    }).catch(() => {
      // Fallback: select and copy
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      Admin.toast('Lien copie dans le presse-papier');
    });
  },

  async viewClaims(voucherId, code) {
    document.getElementById('claimsModalTitle').textContent = `Claims - ${code}`;
    document.getElementById('claimsBody').innerHTML = '<tr><td colspan="5" class="table-empty">Chargement...</td></tr>';
    Admin.openModal('claimsModal');

    try {
      const data = await Admin.apiGet(`/api/admin/vouchers/${voucherId}/claims`);
      const claims = data.claims || [];

      if (claims.length === 0) {
        document.getElementById('claimsBody').innerHTML = '<tr><td colspan="5" class="table-empty">Aucun claim pour ce voucher.</td></tr>';
        return;
      }

      document.getElementById('claimsBody').innerHTML = claims.map(c => {
        const claimedAt = Admin.formatDateTime(c.claimed_at);
        const isUsed = !!c.used_at;

        return `
          <tr>
            <td>${Admin.escapeHtml(c.customer_name || '-')}</td>
            <td>${Admin.escapeHtml(c.phone)}</td>
            <td>${claimedAt}</td>
            <td>
              ${isUsed
                ? '<span class="badge badge--confirmed">Utilise</span>'
                : '<span class="badge badge--pending">Actif</span>'}
            </td>
            <td>
              ${isUsed
                ? '-'
                : `<button class="btn btn--primary btn--sm" onclick="VoucherAdmin.markUsed(${c.id}, ${voucherId}, '${Admin.escapeHtml(code)}')">Marquer utilise</button>`}
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      document.getElementById('claimsBody').innerHTML = '<tr><td colspan="5" class="table-empty">Erreur de chargement.</td></tr>';
    }
  },

  async markUsed(claimId, voucherId, code) {
    if (!confirm('Marquer ce bon comme utilise ?')) return;
    try {
      await Admin.apiPut(`/api/admin/vouchers/claims/${claimId}/use`);
      Admin.toast('Bon marque comme utilise');
      // Refresh claims modal and table
      await this.viewClaims(voucherId, code);
      await this.load();
    } catch (err) {}
  }
};

// File input preview
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('bgFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        VoucherAdmin.showBgPreview(url);
      }
    });
  }
});

VoucherAdmin.init();
