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
  async sendMessage() {
    const message = this.inputField.value.trim();
    if (!message || this.isTyping) return;

    // Add user message
    this.addMessage(message, 'user');
    this.inputField.value = '';

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
