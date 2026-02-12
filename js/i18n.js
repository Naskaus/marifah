/**
 * MARIFAH - Internationalization (i18n)
 * Language switching for French / English
 */

// Translations object
const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.menu': 'Menu',
    'nav.reservation': 'Réservation',
    'nav.contact': 'Contact',
    'nav.book': 'Réserver',

    // Hero
    'hero.badge': 'Cuisine Thaï Authentique',
    'hero.titleHighlight': 'Saveurs',
    'hero.titleRest': 'de Thaïlande à Genève',
    'hero.subtitle': 'Cuisine Thaï Authentique • Meyrin, Genève',
    'hero.description': 'Découvrez les saveurs authentiques de la Thaïlande à deux pas de l\'aéroport de Genève. Nos plats sont préparés avec des ingrédients frais et des recettes traditionnelles.',
    'hero.cta.book': 'Réserver une table',
    'hero.cta.menu': 'Voir le menu',
    'hero.info.location': 'Localisation',
    'hero.info.access': 'Accès',
    'hero.info.accessValue': '2 min du tram',
    'hero.info.parking': 'Parking',
    'hero.info.parkingValue': 'Gratuit',

    // About
    'about.label': 'Notre Histoire',
    'about.title': 'Une passion pour la cuisine thaï',
    'about.text1': 'Depuis notre ouverture à Meyrin, nous nous engageons à vous faire découvrir les saveurs authentiques de la Thaïlande. Chaque plat est préparé avec soin, en utilisant des recettes traditionnelles transmises de génération en génération.',
    'about.text2': 'Situé à seulement 2 minutes de l\'arrêt de tram Meyrin Village, notre restaurant vous accueille dans une ambiance chaleureuse pour un voyage culinaire inoubliable.',
    'about.cta': 'Découvrir notre carte',

    // Featured
    'featured.label': 'Nos Spécialités',
    'featured.title': 'Plats les plus appréciés',
    'featured.subtitle': 'Découvrez les favoris de nos clients, préparés avec des ingrédients frais et des épices authentiques.',
    'featured.cta': 'Voir tout le menu',

    // Categories
    'category.starters': 'Entrées',
    'category.soups': 'Potages',
    'category.salads': 'Salades',
    'category.pork': 'Porc',
    'category.chicken': 'Poulet',
    'category.duck': 'Canard',
    'category.beef': 'Boeuf',
    'category.vegetarian': 'Végétarien',
    'category.desserts': 'Desserts',
    'category.icecream': 'Glaces',

    // Badges
    'badge.popular': 'Populaire',
    'badge.spicy': 'Épicé',
    'badge.vegetarian': 'Végétarien',
    'badge.new': 'Nouveau',

    // Buttons
    'btn.view': 'Voir',
    'btn.order': 'Commander',
    'btn.submit': 'Envoyer',
    'btn.cancel': 'Annuler',

    // Dishes
    'dish.ruammit': 'Assortiment d\'entrées thaï : rouleaux de printemps, satay, raviolis croustillants...',
    'dish.kayphad': 'Poulet sauté aux noix de cajou, légumes croquants et sauce savoureuse.',
    'dish.nuaphad': 'Boeuf sauté aux piments et basilic thaï, garni de coriandre fraîche.',

    // CTA
    'cta.title': 'Réservez votre table',
    'cta.text': 'Pour une soirée en famille, un repas d\'affaires ou une occasion spéciale, réservez votre table et laissez-nous vous faire découvrir la Thaïlande.',
    'cta.book': 'Réserver maintenant',

    // Info
    'info.hours.title': 'Horaires',
    'info.hours.weekdays': 'Lun - Ven:',
    'info.hours.saturday': 'Samedi:',
    'info.hours.sunday': 'Dimanche:',
    'info.hours.closed': 'Fermé',
    'info.location.title': 'Adresse',
    'info.location.directions': 'Itinéraire →',
    'info.payment.title': 'Paiement',
    'info.payment.methods': 'Visa, Mastercard, Maestro, American Express, Postcard, Cash, Tickets restaurant',

    // Footer
    'footer.description': 'Restaurant thaïlandais authentique à Meyrin, Genève. Savourez les meilleures spécialités thaï près de l\'aéroport de Genève.',
    'footer.quicklinks': 'Liens rapides',
    'footer.hours.weekdays': 'Lun-Ven: 11:00-14:30, 17:30-00:00',
    'footer.hours.saturday': 'Samedi: 17:30-00:00',
    'footer.hours.sunday': 'Dimanche: Fermé',
    'footer.rights': 'Tous droits réservés.',

    // Reservation
    'reservation.title': 'Réserver une table',
    'reservation.subtitle': 'Complétez le formulaire ci-dessous ou discutez avec notre assistant pour réserver.',
    'reservation.form.name': 'Nom complet',
    'reservation.form.email': 'Email',
    'reservation.form.phone': 'Téléphone',
    'reservation.form.date': 'Date',
    'reservation.form.time': 'Heure',
    'reservation.form.guests': 'Nombre de personnes',
    'reservation.form.message': 'Message (optionnel)',
    'reservation.form.submit': 'Confirmer la réservation',

    // Contact
    'contact.title': 'Contactez-nous',
    'contact.subtitle': 'Une question ? N\'hésitez pas à nous contacter.',

    // Menu page
    'menu.title': 'Notre Carte',
    'menu.subtitle': 'Découvrez nos spécialités thaïlandaises authentiques',
    'menu.filter.all': 'Tout',
    'menu.search': 'Rechercher un plat...',
    'menu.halfPortion': 'Demi-portion',

    // Reviews
    'reviews.label': 'Avis Clients',
    'reviews.title': 'Ce que disent nos clients',
    'reviews.review1.text': '"Probablement le meilleur pad thai que j\'ai jamais goûté. Salé et sucré, nouilles moelleuses avec juste assez de citron vert. De plus, c\'était un excellent rapport qualité-prix pour Genève ! Notre table a aussi pris le riz frit et le canard, les deux étaient également excellents."',
    'reviews.review2.text': '"Un vrai délice ! Les saveurs sont authentiques, le service est rapide et chaleureux. Le Tom Yum est parfaitement épicé et les rouleaux de printemps sont croustillants à souhait. Je recommande vivement !"',
    'reviews.review3.text': '"Notre restaurant thaï préféré à Genève ! Le curry vert est incroyablement parfumé et le Pad Thai généreux. L\'équipe est adorable. On y retourne chaque semaine !"',
    'reviews.seeMore': 'Voir tous les avis sur',

    // Promo
    'promo.badge': 'Offre Spéciale',
    'promo.title': 'Bienvenue chez Marifah',
    'promo.text': 'Pour votre première visite, profitez d\'une réduction exclusive sur votre addition.',
    'promo.codeLabel': 'Code promo:',
    'promo.cta': 'Réserver maintenant'
  },

  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.menu': 'Menu',
    'nav.reservation': 'Reservation',
    'nav.contact': 'Contact',
    'nav.book': 'Book',

    // Hero
    'hero.badge': 'Authentic Thai Cuisine',
    'hero.titleHighlight': 'Flavors',
    'hero.titleRest': 'of Thailand in Geneva',
    'hero.subtitle': 'Authentic Thai Cuisine • Meyrin, Geneva',
    'hero.description': 'Discover the authentic flavors of Thailand just steps from Geneva Airport. Our dishes are prepared with fresh ingredients and traditional recipes.',
    'hero.cta.book': 'Book a table',
    'hero.cta.menu': 'View menu',
    'hero.info.location': 'Location',
    'hero.info.access': 'Access',
    'hero.info.accessValue': '2 min from tram',
    'hero.info.parking': 'Parking',
    'hero.info.parkingValue': 'Free',

    // About
    'about.label': 'Our Story',
    'about.title': 'A passion for Thai cuisine',
    'about.text1': 'Since opening in Meyrin, we are committed to bringing you the authentic flavors of Thailand. Each dish is carefully prepared using traditional recipes passed down through generations.',
    'about.text2': 'Located just 2 minutes from the Meyrin Village tram stop, our restaurant welcomes you in a warm atmosphere for an unforgettable culinary journey.',
    'about.cta': 'Discover our menu',

    // Featured
    'featured.label': 'Our Specialties',
    'featured.title': 'Most Popular Dishes',
    'featured.subtitle': 'Discover our customers\' favorites, prepared with fresh ingredients and authentic spices.',
    'featured.cta': 'View full menu',

    // Categories
    'category.starters': 'Starters',
    'category.soups': 'Soups',
    'category.salads': 'Salads',
    'category.pork': 'Pork',
    'category.chicken': 'Chicken',
    'category.duck': 'Duck',
    'category.beef': 'Beef',
    'category.vegetarian': 'Vegetarian',
    'category.desserts': 'Desserts',
    'category.icecream': 'Ice Cream',

    // Badges
    'badge.popular': 'Popular',
    'badge.spicy': 'Spicy',
    'badge.vegetarian': 'Vegetarian',
    'badge.new': 'New',

    // Buttons
    'btn.view': 'View',
    'btn.order': 'Order',
    'btn.submit': 'Submit',
    'btn.cancel': 'Cancel',

    // Dishes
    'dish.ruammit': 'Thai starter assortment: spring rolls, satay, crispy dumplings...',
    'dish.kayphad': 'Stir-fried chicken with cashew nuts, crispy vegetables and savory sauce.',
    'dish.nuaphad': 'Stir-fried beef with chili and Thai basil, garnished with fresh coriander.',

    // CTA
    'cta.title': 'Book your table',
    'cta.text': 'For a family dinner, business meal or special occasion, book your table and let us take you on a journey to Thailand.',
    'cta.book': 'Book now',

    // Info
    'info.hours.title': 'Opening Hours',
    'info.hours.weekdays': 'Mon - Fri:',
    'info.hours.saturday': 'Saturday:',
    'info.hours.sunday': 'Sunday:',
    'info.hours.closed': 'Closed',
    'info.location.title': 'Address',
    'info.location.directions': 'Get directions →',
    'info.payment.title': 'Payment',
    'info.payment.methods': 'Visa, Mastercard, Maestro, American Express, Postcard, Cash, Meal vouchers',

    // Footer
    'footer.description': 'Authentic Thai restaurant in Meyrin, Geneva. Enjoy the best Thai specialties near Geneva Airport.',
    'footer.quicklinks': 'Quick Links',
    'footer.hours.weekdays': 'Mon-Fri: 11:00-14:30, 17:30-00:00',
    'footer.hours.saturday': 'Saturday: 17:30-00:00',
    'footer.hours.sunday': 'Sunday: Closed',
    'footer.rights': 'All rights reserved.',

    // Reservation
    'reservation.title': 'Book a Table',
    'reservation.subtitle': 'Fill out the form below or chat with our assistant to make a reservation.',
    'reservation.form.name': 'Full Name',
    'reservation.form.email': 'Email',
    'reservation.form.phone': 'Phone',
    'reservation.form.date': 'Date',
    'reservation.form.time': 'Time',
    'reservation.form.guests': 'Number of guests',
    'reservation.form.message': 'Message (optional)',
    'reservation.form.submit': 'Confirm Reservation',

    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Have a question? Feel free to reach out.',

    // Menu page
    'menu.title': 'Our Menu',
    'menu.subtitle': 'Discover our authentic Thai specialties',
    'menu.filter.all': 'All',
    'menu.search': 'Search for a dish...',
    'menu.halfPortion': 'Half portion',

    // Reviews
    'reviews.label': 'Customer Reviews',
    'reviews.title': 'What our customers say',
    'reviews.review1.text': '"Quite possibly the best pad thai I have ever tasted. Salty and sweet, chewy noodles with just enough lime. Plus it was great value for Geneva! Our table also got the fried rice and duck, both were also excellent."',
    'reviews.review2.text': '"A real delight! The flavors are authentic, the service is quick and warm. The Tom Yum is perfectly spiced and the spring rolls are wonderfully crispy. Highly recommend!"',
    'reviews.review3.text': '"Our favorite Thai restaurant in Geneva! The green curry is incredibly fragrant and the Pad Thai is generous. The team is lovely. We go back every week!"',
    'reviews.seeMore': 'See all reviews on',

    // Promo
    'promo.badge': 'Special Offer',
    'promo.title': 'Welcome to Marifah',
    'promo.text': 'For your first visit, enjoy an exclusive discount on your bill.',
    'promo.codeLabel': 'Promo code:',
    'promo.cta': 'Book now'
  }
};

// Current language
let currentLang = localStorage.getItem('marifah-lang') || 'fr';

/**
 * Initialize i18n
 */
document.addEventListener('DOMContentLoaded', () => {
  // Set initial language
  setLanguage(currentLang);

  // Setup language switcher buttons
  const langButtons = document.querySelectorAll('.lang-switcher__btn');
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
    });
  });
});

/**
 * Set language and update all translations
 */
function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language ${lang} not found`);
    return;
  }

  currentLang = lang;
  localStorage.setItem('marifah-lang', lang);

  // Update HTML lang attribute
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  // Update all translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translation = translations[lang][key];

    if (translation) {
      // Handle different element types
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  // Update active state on language buttons
  document.querySelectorAll('.lang-switcher__btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Dispatch event for other scripts
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

/**
 * Get translation by key
 */
function t(key, lang = currentLang) {
  return translations[lang]?.[key] || key;
}

/**
 * Get current language
 */
function getCurrentLang() {
  return currentLang;
}

// Export functions
window.i18n = {
  setLanguage,
  t,
  getCurrentLang,
  translations
};
