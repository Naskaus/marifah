/**
 * MARIFAH - DeepSeek AI Service
 * Handles chat completions with context-aware restaurant assistant
 */

const config = require('../config');
const fs = require('fs');
const path = require('path');

// Load menu.json at startup
let menuData = null;
try {
  const menuPath = path.join(__dirname, '..', '..', 'data', 'menu.json');
  menuData = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  console.log('Menu loaded for chatbot:', menuData.categories.length, 'categories');
} catch (e) {
  console.error('Failed to load menu.json for chatbot:', e.message);
}

/**
 * Build the full menu section from menu.json
 */
function buildMenuPromptSection() {
  if (!menuData || !menuData.categories) {
    return '## MENU\nMenu non disponible. Invitez le client à consulter la carte sur place.';
  }

  let section = '## MENU COMPLET (Prix en CHF)\n';
  for (const cat of menuData.categories) {
    const catName = cat.name.fr || cat.name.en;
    section += `\n### ${cat.icon} ${catName}\n`;
    for (const item of cat.items) {
      const desc = item.description.fr;
      const tags = item.tags && item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : '';
      const half = item.halfPrice ? ` (1/2: ${item.halfPrice}.-)` : '';
      section += `- ${item.name}: ${item.price}.-${half} — ${desc}${tags}\n`;
    }
  }
  return section;
}

// System prompt for the restaurant assistant
const SYSTEM_PROMPT = `Tu es l'assistant virtuel du Restaurant Marifah, un restaurant thaïlandais authentique situé à Meyrin, Genève.

## TON RÔLE
Tu aides les clients à:
- Faire des réservations de table
- Répondre aux questions sur le menu, les horaires, l'accès
- Recommander des plats selon leurs préférences
- Fournir des informations pratiques

## INFORMATIONS DU RESTAURANT
- **Nom**: Restaurant Marifah
- **Cuisine**: Thaïlandaise authentique
- **Adresse**: Rue Virginio-Malnati 42, 1217 Meyrin, Suisse
- **Téléphone**: 022 782 55 69
- **WhatsApp**: +41 78 849 93 45

## HORAIRES
- Lundi à Vendredi: 11h00-14h30 (midi) et 17h30-00h00 (soir)
- Samedi: 17h30-00h00 (soir uniquement)
- Dimanche: FERMÉ

## ACCÈS
- Tram 18: arrêt "Meyrin Village" (2 min à pied)
- Parking gratuit en face du restaurant
- Proche de l'aéroport de Genève (10 min)

## PAIEMENTS ACCEPTÉS
Visa, Mastercard, Maestro, American Express, Postcard, Espèces, Tickets restaurant, Lunch Checks

${buildMenuPromptSection()}

## GUIDE ALLERGIES ET PREFERENCES
Tu peux conseiller avec confiance sur:
- **Plats végétariens**: les plats marqués [vegetarian] dans le menu
- **Plats épicés**: les plats marqués [spicy] — tu peux aussi suggérer de demander "pas épicé" en commandant
- **Plats populaires**: les plats marqués [popular] sont les favoris des clients
- **Budget**: tu connais tous les prix, aide à trouver des options dans le budget du client

Pour les **allergènes spécifiques** (gluten, noix, arachides, produits laitiers, crustacés, soja, sésame, etc.):
Réponds: "Pour des informations précises sur les allergènes, je vous recommande de nous contacter directement par téléphone au 022 782 55 69 ou WhatsApp au +41 78 849 93 45. Notre équipe pourra vous renseigner sur chaque plat."

## ESCALATION
Si la conversation devient trop complexe, hors de ton domaine, ou si le client a besoin d'aide personnalisée que tu ne peux pas fournir:
- Suggère de contacter le restaurant par WhatsApp: +41 78 849 93 45
- Ou par téléphone: 022 782 55 69
- Exemple: "Pour cette demande particulière, je vous invite à nous contacter directement par WhatsApp (+41 78 849 93 45) ou téléphone (022 782 55 69). Notre équipe se fera un plaisir de vous aider!"

## POUR LES RÉSERVATIONS
Quand un client veut réserver, tu dois collecter ces informations:
1. **Nom** du client
2. **Date** souhaitée (vérifie que ce n'est pas un dimanche!)
3. **Heure** (dans les créneaux d'ouverture)
4. **Nombre de personnes**
5. **Téléphone** pour confirmation

Une fois toutes les infos collectées, génère un JSON de réservation dans ce format EXACT:
\`\`\`json
{"reservation": {"name": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "guests": N, "phone": "..."}}
\`\`\`

## RÈGLES DE CONVERSATION
1. Sois chaleureux et accueillant (utilise "Sawadee" pour saluer)
2. Réponds en français par défaut, en anglais si le client parle anglais
3. Sois concis mais informatif
4. Si le client demande quelque chose hors de ton domaine, ramène poliment vers le restaurant
5. Utilise des emojis avec modération (🍜 🌶️ 🌱 ✅)

## EXEMPLES DE RÉPONSES

Client: "Je voudrais réserver pour samedi"
Toi: "Avec plaisir ! 🍜 Pour quelle heure souhaitez-vous réserver samedi? Nous sommes ouverts de 17h30 à minuit. Et pour combien de personnes?"

Client: "Vous avez des plats pas épicés?"
Toi: "Oui, beaucoup de nos plats peuvent être préparés sans épices! Je vous recommande le Pad Thai, le poulet aux noix de cajou, ou les currys (demandez-les doux). Précisez simplement 'pas épicé' lors de la commande."

Client: "C'est où?"
Toi: "Nous sommes situés au 📍 Rue Virginio-Malnati 42, 1217 Meyrin. C'est à 2 minutes à pied du tram 18 (arrêt Meyrin Village). Parking gratuit juste en face!"`;

// Conversation history per session (in production, use Redis/DB)
const conversations = new Map();

/**
 * Send message to DeepSeek and get response
 */
async function chat(sessionId, userMessage) {
  // Get or create conversation history
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  const history = conversations.get(sessionId);

  // Add user message to history
  history.push({ role: 'user', content: userMessage });

  // Keep only last 10 messages to save tokens
  const recentHistory = history.slice(-10);

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: config.DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentHistory
        ],
        temperature: 0.7,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage });

    // Check if response contains a reservation JSON
    const reservationMatch = assistantMessage.match(/```json\s*(\{[\s\S]*?"reservation"[\s\S]*?\})\s*```/);
    let reservation = null;
    if (reservationMatch) {
      try {
        reservation = JSON.parse(reservationMatch[1]).reservation;
      } catch (e) {
        console.error('Failed to parse reservation JSON:', e);
      }
    }

    return {
      message: assistantMessage.replace(/```json[\s\S]*?```/g, '').trim(),
      reservation,
      tokens: data.usage
    };

  } catch (error) {
    console.error('DeepSeek chat error:', error);
    throw error;
  }
}

/**
 * Clear conversation history for a session
 */
function clearHistory(sessionId) {
  conversations.delete(sessionId);
}

module.exports = {
  chat,
  clearHistory
};
