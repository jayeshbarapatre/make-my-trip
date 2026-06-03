import { useState, useEffect } from 'react';

const translations = {
  EN: {
    plan_title: "Plan your next ",
    unforgettable: "unforgettable",
    trip: " trip.",
    hero_sub: "Compare flights, stays, and experiences across 200+ destinations — all in one place.",
    search: "Search",
    my_trips: "My Trips",
    support: "Support",
    login_btn: "Login / Sign up",
    from: "From",
    to: "To",
    departure: "Departure",
    return: "Return",
    travellers: "Travellers & Class",
    passengers: "Passengers",
    special_fares: "Special fares (Extra savings):",
    recent_searches: "Recent Searches:",
    
    // Tab labels
    flights: "Flights",
    hotels: "Hotels",
    villas: "Homestays",
    holidays: "Holiday\nPackages",
    trains: "Trains",
    buses: "Buses",
    cabs: "Cabs",
    tours: "Tours & Activities",
    visa: "Visa",
    cruise: "Cruise",
    forex: "Forex Card",
    insurance: "Travel\nInsurance"
  },
  HI: {
    plan_title: "अपनी अगली ",
    unforgettable: "अविस्मरणीय",
    trip: " यात्रा की योजना बनाएं।",
    hero_sub: "एक ही स्थान पर 200+ गंतव्यों में उड़ानों, ठहरने और अनुभवों की तुलना करें।",
    search: "खोजें",
    my_trips: "मेरी यात्राएं",
    support: "सहायता",
    login_btn: "लॉगिन / साइन अप",
    from: "कहाँ से",
    to: "कहाँ तक",
    departure: "प्रस्थान",
    return: "वापसी",
    travellers: "यात्री और श्रेणी",
    passengers: "यात्री",
    special_fares: "विशेष किराए (अतिरिक्त बचत):",
    recent_searches: "हाल की खोजें:",
    
    // Tab labels
    flights: "उड़ानें",
    hotels: "होटल",
    villas: "होमस्टे",
    holidays: "छुट्टियों के\nपैकेज",
    trains: "ट्रेनें",
    buses: "बसें",
    cabs: "कैब",
    tours: "पर्यटन और गतिविधियाँ",
    visa: "वीज़ा",
    cruise: "क्रूज़",
    forex: "फॉरेक्स कार्ड",
    insurance: "यात्रा\nबीमा"
  },
  ES: {
    plan_title: "Planifica tu próximo viaje ",
    unforgettable: "inolvidable",
    trip: ".",
    hero_sub: "Compara vuelos, alojamientos y experiencias en más de 200 destinos, todo en un solo lugar.",
    search: "Buscar",
    my_trips: "Mis viajes",
    support: "Soporte",
    login_btn: "Iniciar sesión / Registrarse",
    from: "Desde",
    to: "A",
    departure: "Salida",
    return: "Regreso",
    travellers: "Viajeros y Clase",
    passengers: "Pasajeros",
    special_fares: "Tarifas especiales (Ahorro extra):",
    recent_searches: "Búsquedas recientes:",
    
    // Tab labels
    flights: "Vuelos",
    hotels: "Hoteles",
    villas: "Casas vacacionales",
    holidays: "Paquetes de\nVacaciones",
    trains: "Trenes",
    buses: "Autobuses",
    cabs: "Taxis",
    tours: "Tours y Actividades",
    visa: "Visado",
    cruise: "Cruceros",
    forex: "Tarjeta Forex",
    insurance: "Seguro de\nViaje"
  },
  DE: {
    plan_title: "Planen Sie Ihre nächste ",
    unforgettable: "unvergessliche",
    trip: " Reise.",
    hero_sub: "Vergleichen Sie Flüge, Unterkünfte und Erlebnisse an über 200 Zielen – alles an einem Ort.",
    search: "Suchen",
    my_trips: "Meine Reisen",
    support: "Support",
    login_btn: "Einloggen / Registrieren",
    from: "Von",
    to: "Nach",
    departure: "Hinflug",
    return: "Rückflug",
    travellers: "Reisende & Klasse",
    passengers: "Passagiere",
    special_fares: "Sondertarife (Zusätzliche Ersparnis):",
    recent_searches: "Letzte Suchen:",
    
    // Tab labels
    flights: "Flüge",
    hotels: "Hotels",
    villas: "Ferienunterkünfte",
    holidays: "Urlaubs\npakete",
    trains: "Züge",
    buses: "Busse",
    cabs: "Cabs",
    tours: "Touren & Aktivitäten",
    visa: "Visum",
    cruise: "Kreuzfahrten",
    forex: "Forex Karte",
    insurance: "Reise\nversicherung"
  }
};

export function useTranslation() {
  const [lang, setLang] = useState(() => localStorage.getItem('mmt-lang') || 'EN');

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('mmt-lang') || 'EN');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = (key) => {
    const dict = translations[lang] || translations.EN;
    return dict[key] || translations.EN[key] || key;
  };

  return { t, lang };
}
