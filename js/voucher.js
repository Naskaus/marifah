/**
 * MARIFAH - Public Voucher Page
 * Fetch voucher by code, claim flow, show active card
 */

const VoucherPage = {
  voucher: null,
  code: null,

  init() {
    const params = new URLSearchParams(window.location.search);
    this.code = params.get('code');

    if (!this.code) {
      this.showError('Lien invalide', 'Aucun code de bon trouve dans ce lien.');
      return;
    }

    this.load();
  },

  async load() {
    try {
      const phone = this.getPhone();
      const headers = {};
      if (phone) headers['x-customer-phone'] = phone;

      const res = await fetch(`/api/vouchers/${encodeURIComponent(this.code)}`, { headers });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        this.showError('Bon non disponible', data.error || 'Ce bon n\'est pas valide.');
        return;
      }

      this.voucher = await res.json();
      this.renderVoucher();

      // Determine state: claimed, used, or need to claim
      if (this.voucher.claim) {
        if (this.voucher.claim.used_at) {
          this.showUsedState();
        } else {
          this.showActiveState();
        }
      } else if (phone) {
        // Phone in localStorage but no claim yet → auto-claim
        await this.autoClaim(phone);
      } else {
        this.showClaimForm();
      }
    } catch (err) {
      console.error('Load error:', err);
      this.showError('Erreur', 'Impossible de charger le bon. Reessayez.');
    }
  },

  renderVoucher() {
    document.getElementById('stateLoading').classList.add('hidden');
    document.getElementById('stateVoucher').classList.remove('hidden');

    // Discount display
    const discountEl = document.getElementById('voucherDiscount');
    if (this.voucher.discount_type === 'percent') {
      discountEl.textContent = `-${this.voucher.discount_value}%`;
    } else {
      discountEl.textContent = `-${this.voucher.discount_value} CHF`;
    }

    // Title
    const titleEl = document.getElementById('voucherTitle');
    titleEl.textContent = this.voucher.title || this.voucher.code;

    // Description
    const descEl = document.getElementById('voucherDescription');
    if (this.voucher.description) {
      descEl.textContent = this.voucher.description;
    } else {
      descEl.style.display = 'none';
    }

    // Expiry
    const expiryEl = document.getElementById('voucherExpiry');
    if (this.voucher.expiry_date) {
      const d = new Date(this.voucher.expiry_date);
      expiryEl.innerHTML = `&#128197; Valable jusqu'au ${d.toLocaleDateString('fr-CH', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    } else {
      expiryEl.style.display = 'none';
    }

    // Background image
    if (this.voucher.background_image) {
      const bgEl = document.getElementById('voucherBg');
      bgEl.style.backgroundImage = `url('/uploads/vouchers/${this.voucher.background_image}')`;
    }
  },

  showError(title, text) {
    document.getElementById('stateLoading').classList.add('hidden');
    document.getElementById('stateError').classList.remove('hidden');
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorText').textContent = text;
  },

  showClaimForm() {
    document.getElementById('stateClaim').classList.remove('hidden');

    // Pre-fill phone from localStorage if available
    const phone = this.getPhone();
    if (phone) {
      document.getElementById('claimPhone').value = phone;
    }
  },

  showActiveState() {
    document.getElementById('stateClaim').classList.add('hidden');
    document.getElementById('stateActive').classList.remove('hidden');
    document.getElementById('stateUsed').classList.add('hidden');

    const badge = document.getElementById('voucherBadge');
    badge.textContent = 'Actif';
    badge.classList.remove('hidden', 'voucher-card__badge--used');

    this.initPinInputs();
  },

  showUsedState() {
    document.getElementById('stateClaim').classList.add('hidden');
    document.getElementById('stateActive').classList.add('hidden');
    document.getElementById('stateUsed').classList.remove('hidden');

    const badge = document.getElementById('voucherBadge');
    badge.textContent = 'Utilise';
    badge.classList.remove('hidden');
    badge.classList.add('voucher-card__badge--used');
  },

  async autoClaim(phone) {
    try {
      const res = await fetch(`/api/vouchers/${encodeURIComponent(this.code)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      if (res.ok) {
        const data = await res.json();
        this.voucher.claim = data.claim;
        if (data.claim.used_at) {
          this.showUsedState();
        } else {
          this.showActiveState();
        }
      } else {
        // If auto-claim fails, show the form
        this.showClaimForm();
      }
    } catch (err) {
      this.showClaimForm();
    }
  },

  async claim() {
    const phone = document.getElementById('claimPhone').value.trim();
    const name = document.getElementById('claimName').value.trim();
    const email = document.getElementById('claimEmail').value.trim();
    const errorEl = document.getElementById('claimError');
    const btn = document.getElementById('claimBtn');

    if (!phone || phone.length < 6) {
      errorEl.textContent = 'Veuillez entrer un numero de telephone valide.';
      errorEl.classList.add('visible');
      return;
    }

    errorEl.classList.remove('visible');
    btn.disabled = true;
    btn.textContent = 'Activation...';

    try {
      const res = await fetch(`/api/vouchers/${encodeURIComponent(this.code)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name || undefined, email: email || undefined })
      });

      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Erreur lors de l\'activation.';
        errorEl.classList.add('visible');
        btn.disabled = false;
        btn.textContent = 'Activer mon bon';
        return;
      }

      // Save phone to localStorage
      this.savePhone(phone);

      this.voucher.claim = data.claim;
      if (data.claim.used_at) {
        this.showUsedState();
      } else {
        this.showActiveState();
      }
    } catch (err) {
      errorEl.textContent = 'Erreur de connexion. Reessayez.';
      errorEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Activer mon bon';
    }
  },

  initPinInputs() {
    const digits = document.querySelectorAll('.voucher-redeem__pin-digit');
    const redeemBtn = document.getElementById('redeemBtn');
    if (!digits.length) return;

    const updateBtn = () => {
      const filled = Array.from(digits).every(d => d.value.length === 1);
      redeemBtn.disabled = !filled;
    };

    digits.forEach((input, i) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val.slice(0, 1);
        if (val && i < digits.length - 1) {
          digits[i + 1].focus();
        }
        updateBtn();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) {
          digits[i - 1].focus();
          digits[i - 1].value = '';
          updateBtn();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
        for (let j = 0; j < pasted.length && j < digits.length; j++) {
          digits[j].value = pasted[j];
        }
        if (pasted.length > 0) {
          digits[Math.min(pasted.length, digits.length) - 1].focus();
        }
        updateBtn();
      });
    });
  },

  async redeem() {
    const digits = document.querySelectorAll('.voucher-redeem__pin-digit');
    const pin = Array.from(digits).map(d => d.value).join('');
    const errorEl = document.getElementById('redeemError');
    const btn = document.getElementById('redeemBtn');
    const phone = this.getPhone();

    if (pin.length !== 4) return;

    errorEl.classList.remove('visible');
    btn.disabled = true;
    btn.textContent = 'Validation...';

    try {
      const res = await fetch(`/api/vouchers/${encodeURIComponent(this.code)}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });

      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Erreur de validation.';
        errorEl.classList.add('visible');
        // Clear PIN inputs
        digits.forEach(d => { d.value = ''; });
        digits[0].focus();
        btn.disabled = true;
        btn.textContent = 'Utiliser ce bon';
        return;
      }

      // Success → transition to used state
      this.showUsedState();
    } catch (err) {
      errorEl.textContent = 'Erreur de connexion. Reessayez.';
      errorEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Utiliser ce bon';
    }
  },

  getPhone() {
    return localStorage.getItem('marifah-customer-phone');
  },

  savePhone(phone) {
    localStorage.setItem('marifah-customer-phone', phone);
  }
};

VoucherPage.init();
