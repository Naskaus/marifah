/**
 * MARIFAH - Email Notification Service
 * Sends reservation notifications via email
 */

const config = require('../config');

// We'll use a simple approach without nodemailer for now
// Just format the email data - can be sent via external service or SMTP later

/**
 * Format reservation for email
 */
function formatReservationEmail(reservation, source = 'formulaire') {
  const { name, date, time, guests, phone, email, message } = reservation;

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('fr-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const subject = `🍜 Nouvelle Réservation - ${name} - ${formattedDate}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #22c55e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🍜 Restaurant Marifah</h1>
        <p style="margin: 5px 0 0 0;">Nouvelle Réservation</p>
      </div>

      <div style="padding: 20px; background: #f9fafb;">
        <p style="color: #6b7280; margin-bottom: 20px;">Reçue via ${source}</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>👤 Nom</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>📅 Date</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>🕐 Heure</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>👥 Personnes</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${guests}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>📞 Téléphone</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <a href="tel:${phone}">${phone}</a>
            </td>
          </tr>
          ${email ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>📧 Email</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <a href="mailto:${email}">${email}</a>
            </td>
          </tr>
          ` : ''}
          ${message ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>💬 Message</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${message}</td>
          </tr>
          ` : ''}
        </table>

        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
          <p style="margin: 0 0 10px 0;"><strong>Répondre au client:</strong></p>
          <a href="https://wa.me/41${phone.replace(/^0|\+41|[^0-9]/g, '')}"
             style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">
            WhatsApp
          </a>
          <a href="tel:${phone}"
             style="display: inline-block; padding: 10px 20px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px;">
            Appeler
          </a>
        </div>
      </div>

      <div style="padding: 15px; background: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
        Restaurant Marifah - Rue Virginio-Malnati 42, 1217 Meyrin
      </div>
    </div>
  `;

  const text = `
NOUVELLE RÉSERVATION - Restaurant Marifah
==========================================
Source: ${source}

Nom: ${name}
Date: ${formattedDate}
Heure: ${time}
Personnes: ${guests}
Téléphone: ${phone}
${email ? `Email: ${email}` : ''}
${message ? `Message: ${message}` : ''}

------------------------------------------
Répondre: https://wa.me/41${phone.replace(/^0|\+41|[^0-9]/g, '')}
`;

  return { subject, html, text };
}

/**
 * Send email notification (placeholder - implement with nodemailer or external service)
 */
async function sendReservationEmail(reservation, source = 'formulaire') {
  if (!config.EMAIL?.enabled) {
    console.log('Email notifications disabled');
    return { ok: false, error: 'Email disabled' };
  }

  const emailData = formatReservationEmail(reservation, source);

  // For now, just log the email data
  // In production, use nodemailer or an email API service
  console.log('📧 Email notification prepared:', emailData.subject);

  // TODO: Implement actual email sending with nodemailer
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport(config.EMAIL.smtp);
  // await transporter.sendMail({
  //   from: config.EMAIL.smtp.auth.user,
  //   to: config.EMAIL.to,
  //   subject: emailData.subject,
  //   text: emailData.text,
  //   html: emailData.html
  // });

  return { ok: true, message: 'Email prepared (implement SMTP for actual sending)' };
}

module.exports = {
  formatReservationEmail,
  sendReservationEmail
};
