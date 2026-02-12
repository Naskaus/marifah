/**
 * MARIFAH - Email Notification Service
 * Sends reservation notifications via email using nodemailer
 */

const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

/**
 * Get or create the nodemailer transporter
 */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(config.EMAIL.smtp);
  }
  return transporter;
}

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

  const subject = `Nouvelle Reservation - ${name} - ${formattedDate}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #22c55e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Restaurant Marifah</h1>
        <p style="margin: 5px 0 0 0;">Nouvelle Reservation</p>
      </div>

      <div style="padding: 20px; background: #f9fafb;">
        <p style="color: #6b7280; margin-bottom: 20px;">Recue via ${source}</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Nom</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Date</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Heure</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Personnes</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${guests}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Telephone</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <a href="tel:${phone}">${phone}</a>
            </td>
          </tr>
          ${email ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Email</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <a href="mailto:${email}">${email}</a>
            </td>
          </tr>
          ` : ''}
          ${message ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Message</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${message}</td>
          </tr>
          ` : ''}
        </table>

        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
          <p style="margin: 0 0 10px 0;"><strong>Repondre au client:</strong></p>
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
NOUVELLE RESERVATION - Restaurant Marifah
==========================================
Source: ${source}

Nom: ${name}
Date: ${formattedDate}
Heure: ${time}
Personnes: ${guests}
Telephone: ${phone}
${email ? `Email: ${email}` : ''}
${message ? `Message: ${message}` : ''}

------------------------------------------
Repondre: https://wa.me/41${phone.replace(/^0|\+41|[^0-9]/g, '')}
`;

  return { subject, html, text };
}

/**
 * Send email notification via SMTP
 */
async function sendReservationEmail(reservation, source = 'formulaire') {
  if (!config.EMAIL?.enabled) {
    console.log('Email notifications disabled');
    return { ok: false, error: 'Email disabled' };
  }

  const { user, pass } = config.EMAIL.smtp.auth || {};
  if (!user || !pass) {
    console.log('Email SMTP credentials not configured, skipping email');
    return { ok: false, error: 'SMTP credentials not configured' };
  }

  const emailData = formatReservationEmail(reservation, source);

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"Restaurant Marifah" <${user}>`,
      to: config.EMAIL.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    });
    console.log('Email notification sent:', emailData.subject);
    return { ok: true };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { ok: false, error: error.message };
  }
}

module.exports = {
  formatReservationEmail,
  sendReservationEmail
};
