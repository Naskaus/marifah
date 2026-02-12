/**
 * MARIFAH - Chatbot Controller
 * Handles chat UI and communicates with DeepSeek AI backend
 */

const chatbot = {
  messagesContainer: null,
  inputField: null,
  sendButton: null,
  isTyping: false,
  sessionId: null,
  apiUrl: '/api/chat',
  reservationMode: false,
  pickerShown: false,

  // Restaurant time slots config
  timeSlots: {
    lunch: ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00'],
    dinner: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00']
  },
  // Reservation keyword patterns
  reservationKeywords: /\b(r[eé]serv(?:er|ation|ieren)|book(?:ing)?|table)\b/i,

  // Fallback responses when API is unavailable
  fallbackResponses: {
    fr: "Désolé, je rencontre un problème technique. Vous pouvez nous appeler au 022 782 55 69 ou utiliser le formulaire de réservation à gauche.",
    en: "Sorry, I'm experiencing technical difficulties. You can call us at 022 782 55 69 or use the reservation form on the left."
  },

  /**
   * Initialize the chatbot
   */
  init() {
    this.messagesContainer = document.getElementById('chatMessages');
    this.inputField = document.getElementById('chatInput');
    this.sendButton = document.getElementById('chatSend');

    if (!this.messagesContainer || !this.inputField) return;

    // Generate session ID
    this.sessionId = this.getOrCreateSessionId();

    // Event listeners
    this.sendButton?.addEventListener('click', () => this.sendMessage());
    this.inputField?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick replies
    document.querySelectorAll('.quick-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const message = btn.dataset.message;
        // Intercept reservation quick-reply
        if (this.reservationKeywords.test(message) && !this.pickerShown) {
          this.showReservationPicker();
          return;
        }
        this.inputField.value = message;
        this.sendMessage();
      });
    });

    // Initialize form handler
    this.initFormHandler();

    // Welcome message
    this.showWelcomeMessage();
  },

  /**
   * Get or create session ID
   */
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('marifah-chat-session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('marifah-chat-session', sessionId);
    }
    return sessionId;
  },

  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    const lang = window.i18n?.getCurrentLang() || 'fr';
    const welcomeMessages = {
      fr: "Sawadee! 🙏 Je suis l'assistant du Restaurant Marifah. Je peux vous aider à réserver une table, consulter le menu, ou répondre à vos questions. Comment puis-je vous aider?",
      en: "Sawadee! 🙏 I'm the Marifah Restaurant assistant. I can help you book a table, check the menu, or answer your questions. How can I help you?"
    };

    // Only show if no messages exist
    if (this.messagesContainer.children.length === 0) {
      this.addMessage(welcomeMessages[lang] || welcomeMessages.fr, 'bot');
    }
  },

  /**
   * Send a message
   */
  async sendMessage(overrideMessage) {
    const message = overrideMessage || this.inputField.value.trim();
    if (!message || this.isTyping) return;

    // Add user message
    this.addMessage(message, 'user');
    if (!overrideMessage) this.inputField.value = '';

    // Detect reservation keywords from free-text (only if picker not already shown)
    if (!this.pickerShown && !this.reservationMode && this.reservationKeywords.test(message)) {
      this.showReservationPicker();
      return;
    }

    // Show typing indicator
    this.showTyping();

    try {
      // Call API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId
        })
      });

      const data = await response.json();

      this.hideTyping();

      if (data.error && data.fallback) {
        // API error with fallback message
        this.addMessage(data.message, 'bot');
      } else if (data.message) {
        // Success
        this.addMessage(data.message, 'bot');

        // If reservation was made via chat, show confirmation
        if (data.reservation) {
          setTimeout(() => {
            const lang = window.i18n?.getCurrentLang() || 'fr';
            const confirmMsg = lang === 'fr'
              ? "✅ Votre demande de réservation a été envoyée! Nous vous contacterons pour confirmer."
              : "✅ Your reservation request has been sent! We'll contact you to confirm.";
            this.addMessage(confirmMsg, 'bot');
          }, 1000);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      this.hideTyping();

      const lang = window.i18n?.getCurrentLang() || 'fr';
      this.addMessage(this.fallbackResponses[lang], 'bot');
    }
  },

  /**
   * Add a message to the chat
   */
  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${sender}`;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Parse markdown-style formatting
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
      <p class="chat-message__text">${formattedText}</p>
      <span class="chat-message__time">${time}</span>
    `;

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  },

  /**
   * Show typing indicator
   */
  showTyping() {
    this.isTyping = true;
    if (this.sendButton) this.sendButton.disabled = true;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';

    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  },

  /**
   * Hide typing indicator
   */
  hideTyping() {
    this.isTyping = false;
    if (this.sendButton) this.sendButton.disabled = false;
    document.getElementById('typingIndicator')?.remove();
  },

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  },

  /**
   * Show inline reservation picker in chat
   */
  showReservationPicker() {
    if (this.pickerShown) return;
    this.pickerShown = true;
    this.reservationMode = true;

    const lang = window.i18n?.getCurrentLang() || 'fr';
    const labels = {
      fr: {
        title: 'Choisissez votre créneau',
        date: 'Date',
        time: 'Heure',
        guests: 'Personnes',
        lunch: 'Midi',
        dinner: 'Soir',
        confirm: 'Confirmer',
        selectTime: 'Choisissez une heure',
        closed: 'Fermé',
        days: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        months: ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
      },
      en: {
        title: 'Choose your time slot',
        date: 'Date',
        time: 'Time',
        guests: 'Guests',
        lunch: 'Lunch',
        dinner: 'Evening',
        confirm: 'Confirm',
        selectTime: 'Select a time',
        closed: 'Closed',
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      }
    };
    const t = labels[lang] || labels.fr;

    const dates = this.getAvailableDates(14);
    const picker = document.createElement('div');
    picker.className = 'chat-reservation-picker';
    picker.innerHTML = this.buildPickerHTML(dates, t, lang);

    this.messagesContainer.appendChild(picker);
    this.scrollToBottom();

    // Select first date by default
    if (dates.length > 0) {
      this.renderTimeSlots(picker, dates[0].dateStr, t);
    }

    // Select 2 guests by default
    const defaultGuest = picker.querySelector('.picker-guest-btn[data-guests="2"]');
    if (defaultGuest) defaultGuest.classList.add('selected');

    this.initPickerEvents(picker, t, lang);
  },

  /**
   * Build the picker HTML
   */
  buildPickerHTML(dates, t, lang) {
    // Date buttons
    let datesHTML = '';
    dates.forEach((d, i) => {
      const cls = i === 0 ? 'picker-date-btn selected' : 'picker-date-btn';
      datesHTML += `<button class="${cls}" data-date="${d.dateStr}">
        <span class="picker-date-btn__day">${t.days[d.dayOfWeek]}</span>
        <span class="picker-date-btn__num">${d.dayNum}</span>
        <span class="picker-date-btn__month">${t.months[d.month]}</span>
      </button>`;
    });

    // Guest buttons
    let guestsHTML = '';
    for (let i = 1; i <= 8; i++) {
      guestsHTML += `<button class="picker-guest-btn" data-guests="${i}">${i}</button>`;
    }
    guestsHTML += `<button class="picker-guest-btn" data-guests="9+">9+</button>`;

    return `
      <div class="picker-section">
        <div class="picker-label">${t.date}</div>
        <div class="picker-dates-scroll">${datesHTML}</div>
      </div>
      <div class="picker-section">
        <div class="picker-label">${t.time}</div>
        <div class="picker-time-container" id="pickerTimeSlots">
          <div class="picker-time-placeholder">${t.selectTime}</div>
        </div>
      </div>
      <div class="picker-section">
        <div class="picker-label">${t.guests}</div>
        <div class="picker-guest-buttons">${guestsHTML}</div>
      </div>
      <button class="picker-confirm-btn" id="pickerConfirm" disabled>${t.confirm}</button>
    `;
  },

  /**
   * Get next N available dates (excluding Sundays)
   */
  getAvailableDates(count) {
    const dates = [];
    const now = new Date();
    let d = new Date(now);

    // If past last dinner slot today (23:00 + 30min buffer), start from tomorrow
    const todayLastSlot = new Date(now);
    todayLastSlot.setHours(23, 30, 0, 0);
    if (now >= todayLastSlot) {
      d.setDate(d.getDate() + 1);
    }

    while (dates.length < count) {
      if (d.getDay() !== 0) { // Skip Sunday
        dates.push({
          dateStr: d.toISOString().split('T')[0],
          dayOfWeek: d.getDay(),
          dayNum: d.getDate(),
          month: d.getMonth(),
          isSaturday: d.getDay() === 6
        });
      }
      d = new Date(d);
      d.setDate(d.getDate() + 1);
    }
    return dates;
  },

  /**
   * Get time slots for a given date
   */
  getTimeSlotsForDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const isSaturday = date.getDay() === 6;
    const now = new Date();
    const isToday = dateStr === now.toISOString().split('T')[0];

    let lunch = isSaturday ? [] : [...this.timeSlots.lunch];
    let dinner = [...this.timeSlots.dinner];

    // Filter past slots if today (with 30-min buffer)
    if (isToday) {
      const bufferMs = 30 * 60 * 1000;
      const cutoff = new Date(now.getTime() + bufferMs);
      const cutoffMinutes = cutoff.getHours() * 60 + cutoff.getMinutes();

      lunch = lunch.filter(t => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m > cutoffMinutes;
      });
      dinner = dinner.filter(t => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m > cutoffMinutes;
      });
    }

    return { lunch, dinner };
  },

  /**
   * Render time slots in the picker for a given date
   */
  renderTimeSlots(picker, dateStr, t) {
    const container = picker.querySelector('#pickerTimeSlots');
    const { lunch, dinner } = this.getTimeSlotsForDate(dateStr);

    if (lunch.length === 0 && dinner.length === 0) {
      container.innerHTML = `<div class="picker-time-placeholder">${t.closed}</div>`;
      return;
    }

    let html = '';
    if (lunch.length > 0) {
      html += `<div class="picker-time-group">
        <span class="picker-time-group__label">${t.lunch}</span>
        <div class="picker-time-buttons">
          ${lunch.map(s => `<button class="picker-time-btn" data-time="${s}">${s}</button>`).join('')}
        </div>
      </div>`;
    }
    if (dinner.length > 0) {
      html += `<div class="picker-time-group">
        <span class="picker-time-group__label">${t.dinner}</span>
        <div class="picker-time-buttons">
          ${dinner.map(s => `<button class="picker-time-btn" data-time="${s}">${s}</button>`).join('')}
        </div>
      </div>`;
    }
    container.innerHTML = html;
  },

  /**
   * Wire up picker events
   */
  initPickerEvents(picker, t, lang) {
    let selectedDate = picker.querySelector('.picker-date-btn.selected')?.dataset.date || null;
    let selectedTime = null;
    let selectedGuests = '2';
    const confirmBtn = picker.querySelector('#pickerConfirm');

    const updateConfirmState = () => {
      confirmBtn.disabled = !(selectedDate && selectedTime && selectedGuests);
    };

    // Date selection
    picker.querySelectorAll('.picker-date-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        picker.querySelectorAll('.picker-date-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDate = btn.dataset.date;
        selectedTime = null;
        this.renderTimeSlots(picker, selectedDate, t);
        updateConfirmState();
      });
    });

    // Time selection (delegated)
    picker.querySelector('#pickerTimeSlots').addEventListener('click', (e) => {
      const btn = e.target.closest('.picker-time-btn');
      if (!btn) return;
      picker.querySelectorAll('.picker-time-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTime = btn.dataset.time;
      updateConfirmState();
    });

    // Guest selection
    picker.querySelectorAll('.picker-guest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        picker.querySelectorAll('.picker-guest-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedGuests = btn.dataset.guests;
        updateConfirmState();
      });
    });

    // Confirm
    confirmBtn.addEventListener('click', () => {
      if (!selectedTime) {
        confirmBtn.classList.add('shake');
        setTimeout(() => confirmBtn.classList.remove('shake'), 500);
        return;
      }

      // Format the date nicely
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const dayNames = lang === 'en'
        ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        : ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const monthNames = lang === 'en'
        ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        : ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

      const dayName = dayNames[dateObj.getDay()];
      const dayNum = dateObj.getDate();
      const monthName = monthNames[dateObj.getMonth()];
      const timeFormatted = selectedTime.replace(':', 'h');

      let message;
      if (lang === 'en') {
        message = `I'd like to book a table for ${dayName} ${monthName} ${dayNum} at ${timeFormatted} for ${selectedGuests} ${selectedGuests === '1' ? 'person' : 'people'}`;
      } else {
        message = `Je voudrais réserver pour le ${dayName} ${dayNum} ${monthName} à ${timeFormatted} pour ${selectedGuests} personne${selectedGuests !== '1' ? 's' : ''}`;
      }

      // Remove the picker
      picker.remove();
      this.reservationMode = true;

      // Send as regular message
      this.sendMessage(message);
    });
  },

  /**
   * Initialize form handler
   */
  initFormHandler() {
    const form = document.getElementById('reservationForm');
    const successMessage = document.getElementById('successMessage');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Envoi en cours...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('/api/reservation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          form.style.display = 'none';
          if (successMessage) successMessage.classList.add('show');

          // Add chat message
          const lang = window.i18n?.getCurrentLang() || 'fr';
          const confirmationMsg = lang === 'fr'
            ? `Votre réservation a été envoyée! ✅\n\n📅 ${data.date} à ${data.time}\n👥 ${data.guests} personne(s)\n📞 ${data.phone}\n\nNous vous contacterons pour confirmer.`
            : `Your reservation has been sent! ✅\n\n📅 ${data.date} at ${data.time}\n👥 ${data.guests} guest(s)\n📞 ${data.phone}\n\nWe'll contact you to confirm.`;

          this.addMessage(confirmationMsg, 'bot');
        } else {
          // Show error
          alert(result.error || 'Erreur lors de l\'envoi. Veuillez réessayer.');
        }

      } catch (error) {
        console.error('Form submission error:', error);
        alert('Erreur de connexion. Veuillez nous appeler au 022 782 55 69.');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
};

// Reset form function (global)
function resetForm() {
  const form = document.getElementById('reservationForm');
  const successMessage = document.getElementById('successMessage');

  if (form) {
    form.reset();
    form.style.display = 'block';
  }
  if (successMessage) {
    successMessage.classList.remove('show');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  chatbot.init();

  // Set minimum date to today
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }
});
