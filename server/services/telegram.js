/**
 * MARIFAH - Telegram Notification Service
 * Sends reservation notifications to restaurant owner
 */

const config = require('../config');

/**
 * Send a message to Telegram
 */
async function sendMessage(text, parseMode = 'HTML') {
  if (!config.TELEGRAM_BOT_TOKEN || config.TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.warn('Telegram not configured - skipping notification');
    return { ok: false, error: 'Telegram not configured' };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.TELEGRAM_CHAT_ID,
          text,
          parse_mode: parseMode
        })
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
    }

    return data;
  } catch (error) {
    console.error('Telegram send error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Send reservation notification
 */
async function sendReservationNotification(reservation, source = 'formulaire') {
  const { name, date, time, guests, phone, email, message } = reservation;

  // Format date nicely
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('fr-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

    // Clean phone number for WhatsApp link
  const cleanPhone = phone.replace(/^0|\+41|[^0-9]/g, '');
  const whatsappLink = `https://wa.me/41${cleanPhone}`;

  const text = `🍜 <b>Nouvelle Réservation</b> (via ${source})

👤 <b>Nom:</b> ${name}
📅 <b>Date:</b> ${formattedDate}
🕐 <b>Heure:</b> ${time}
👥 <b>Personnes:</b> ${guests}
📞 <b>Téléphone:</b> ${phone}
${email ? `📧 <b>Email:</b> ${email}\n` : ''}${message ? `💬 <b>Message:</b> ${message}\n` : ''}
━━━━━━━━━━━━━━━
📲 <b>Répondre via WhatsApp:</b>
${whatsappLink}

📞 <b>Appeler:</b> <code>+41${cleanPhone}</code>`;

  return sendMessage(text);
}

/**
 * Send confirmation to owner that system is working
 */
async function sendTestMessage() {
  return sendMessage('✅ Bot Marifah connecté et opérationnel!');
}

module.exports = {
  sendMessage,
  sendReservationNotification,
  sendTestMessage
};
