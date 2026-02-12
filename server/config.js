/**
 * MARIFAH - Server Configuration
 * Fill in your API keys below
 */

module.exports = {
  // Server
  PORT: process.env.PORT || 4000,

  // Admin
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'marifah2024',

  // Voucher redemption PIN (staff enters this to mark voucher as used)
  VOUCHER_PIN: process.env.VOUCHER_PIN || '1217',

  // Database
  DATABASE_PATH: process.env.DATABASE_PATH || '',

  // DeepSeek API
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || 'sk-bbe127a2eafa46aab1103c9001f29dda',
  DEEPSEEK_MODEL: 'deepseek-chat', // V3.2 - cheapest for chat

  // Telegram Bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8285311528:AAF_5nNjYfAYtSIUZzPBe1K-VLM8XE2dJLw',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '410275983',

  // Notifications - active/désactive chaque canal
  NOTIFICATIONS: {
    telegram: true,
    email: true,
    whatsapp: false // WhatsApp Business API payant - on met un lien dans Telegram à la place
  },

  // Email (optionnel - nécessite SMTP)
  EMAIL: {
    enabled: true,
    to: 'thaideng62@gmail.com', // Email qui reçoit les réservations
    // SMTP Config (Gmail example)
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '', // ton email gmail
        pass: process.env.SMTP_PASS || ''  // mot de passe d'application Gmail
      }
    }
  },

  // Restaurant Info (used in chatbot context)
  RESTAURANT: {
    name: 'Marifah',
    type: 'Thai Restaurant',
    address: 'Rue Virginio-Malnati 42, 1217 Meyrin',
    phone: '022 782 55 69',
    whatsapp: '+41 78 849 93 45',
    email: 'thaideng62@gmail.com',
    hours: {
      weekdays: '11:00-14:30, 17:30-00:00',
      saturday: '17:30-00:00',
      sunday: 'Fermé'
    }
  }
};
