export interface TestQuestion {
  id: number;
  question: string;
  /** 2 ose 3 alternativa */
  options: string[];
  /** Indeksi i përgjigjes së saktë (0-based) */
  correctIndex: number;
  /** URL e imazhit (opsionale) */
  imageUrl?: string;
  /** Pikët për pyetjen (default: 4) */
  points?: number;
}

/**
 * Pyetjet e testit zyrtar të auto-shkollës – Kategoria B
 *
 * Standardi zyrtar i Kosovës:
 *   • 30 pyetje për test
 *   • 4 pikë për pyetje (gjithsej 120 pikë)
 *   • Kufiri për kalim: 90% (≥108 pikë)
 *
 * 📌 Si të shtohen pyetje të reja nga foto:
 *   { id, question: "...", options: ["...", "..."], correctIndex: 0, imageUrl: "url ose path" }
 */
export const testQuestions: TestQuestion[] = [
  {
    id: 1,
    question: "Cila sjellje është e drejtë në këtë situatë?",
    options: [
      "Largoj këmbën nga pedalja e gazit (nuk i jap gaz).",
      "Duhet vazhdojë me të njëjtën shpejtësi.",
      "Nuk ndërrmarr asgjë, pasi që këmbësori është i moshuar.",
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    question: "Çfarë kujdesi do të keni në këtë situatë?",
    options: [
      "Do të ndalem për t'i dhënë përparësi kalimi veturës e cila vjen nga kahu i kundërt i lëvizjës.",
      "Ndalim trafiku në të dy kahe.",
      "Rruga ku trafiku zhvillohet në një kah.",
    ],
    correctIndex: 0,
  },
  {
    id: 3,
    question: "Cila sjellje (veprim) është e drejtë?",
    options: [
      "Largojë këmbën nga pedalja e gazit (nuk i jap gaz).",
      "Duhet vazhdojë me njëjtën shpejtësi.",
      "Nuk ndërrmarrë asgjë, këmbësorët duhet të lëvizin në trotuar.",
    ],
    correctIndex: 0,
  },
  {
    id: 4,
    question: "Çka duhet të keni parasysh në këtë situatë?",
    options: ["Vendparkimin për kamion.", "Kujdes të shtuar ndaj këmbësorëve.", "Vendndalje për autobusë."],
    correctIndex: 1,
  },
  {
    id: 5,
    question: "Sa është shpejtësia maksimale e lejuar brenda zonës urbane?",
    options: ["50 km/h", "70 km/h"],
    correctIndex: 0,
  },
  {
    id: 6,
    question: "Kur duhet të përdoret rripi i sigurisë?",
    options: ["Vetëm gjatë natës", "Gjithmonë gjatë vozitjes", "Vetëm nga shoferi"],
    correctIndex: 1,
  },
  {
    id: 7,
    question: "Çfarë ngjyre kanë shenjat e detyrueshme?",
    options: ["E kuqe", "E kaltër", "E verdhë"],
    correctIndex: 1,
  },
  {
    id: 8,
    question: "A lejohet vozitja pas konsumimit të alkoolit mbi kufirin ligjor?",
    options: ["Po, nëse je i përvojshëm", "Jo, asnjëherë"],
    correctIndex: 1,
  },
  {
    id: 9,
    question: "Çka duhet të bëni në një kryqëzim pa shenja?",
    options: ["I jep përparësi mjetit nga e djathta", "I jep përparësi mjetit nga e majta", "Kalon i pari"],
    correctIndex: 0,
  },
  {
    id: 10,
    question: "Kur ndizen dritat e kthesës?",
    options: ["Para çdo manovre kthese ose ndërrimi shiriti", "Vetëm në kryqëzime", "Gjatë frenimit"],
    correctIndex: 0,
  },
  {
    id: 11,
    question: "Çka tregon vija e ndërprerë në mes të rrugës?",
    options: ["Lejohet tejkalimi nëse është e sigurt", "Ndalim i tejkalimit", "Vetëm për autobusë"],
    correctIndex: 0,
  },
  {
    id: 12,
    question: "Sa duhet të jetë thellësia minimale e protektorit të gomës?",
    options: ["1.6 mm", "0.8 mm", "3.0 mm"],
    correctIndex: 0,
  },
  {
    id: 13,
    question: "Kur duhet të ndizni dritat e gjata?",
    options: ["Në qytet", "Në rrugë pa ndriçim, pa mjete përballë", "Gjithmonë natën"],
    correctIndex: 1,
  },
  {
    id: 14,
    question: "Cila është dokumentacioni i detyrueshëm gjatë vozitjes?",
    options: ["Vetëm patentë shoferi", "Patentë, leje qarkullimi, sigurim", "Vetëm sigurim"],
    correctIndex: 1,
  },
  {
    id: 15,
    question: "Çka tregon shenja trekëndësh me kufi të kuq?",
    options: ["Ndalim", "Paralajmërim për rrezik", "Detyrim"],
    correctIndex: 1,
  },
  {
    id: 16,
    question: "Sa është mosha minimale për patentën e kategorisë B?",
    options: ["17 vjeç", "18 vjeç"],
    correctIndex: 1,
  },
  {
    id: 17,
    question: "Çka duhet të bëni para se të hapni derën e veturës?",
    options: ["Hapeni shpejt", "Kontrolloni nëse vjen mjet apo këmbësor"],
    correctIndex: 1,
  },
  {
    id: 18,
    question: "Kur është e ndaluar parkimi?",
    options: ["Para hyrjeve, mbi vendkalim, kthesa", "Vetëm natën", "Vetëm në qendër"],
    correctIndex: 0,
  },
  {
    id: 19,
    question: "Çka duhet të bëni në rast aksidenti?",
    options: ["Largohuni menjëherë", "Ndaloni, ndihmoni, lajmëroni policinë", "Vazhdoni vozitjen"],
    correctIndex: 1,
  },
  {
    id: 20,
    question: "Si njihet semafori i prishur?",
    options: ["Drita e verdhë vezulluese", "Drita e kuqe fikse", "Drita e gjelbër"],
    correctIndex: 0,
  },
  {
    id: 21,
    question: "Kur kalon këmbësori në vendkalim?",
    options: ["Mjeti ka përparësi", "Këmbësori ka përparësi gjithmonë"],
    correctIndex: 1,
  },
  {
    id: 22,
    question: "Çka tregon shenja rrethore me kufi të kuq?",
    options: ["Ndalim", "Detyrim", "Paralajmërim"],
    correctIndex: 0,
  },
  {
    id: 23,
    question: "Sa është shpejtësia maksimale në autostradë?",
    options: ["100 km/h", "120 km/h", "130 km/h"],
    correctIndex: 1,
  },
  {
    id: 24,
    question: "Kur përdoret freni i dorës?",
    options: ["Gjatë vozitjes", "Kur parkoni mjetin"],
    correctIndex: 1,
  },
  {
    id: 25,
    question: "A lejohet përdorimi i celularit gjatë vozitjes?",
    options: ["Po, gjithmonë", "Vetëm me handsfree", "Jo, asnjëherë"],
    correctIndex: 1,
  },
  {
    id: 26,
    question: "Çka duhet të bëni kur dëgjoni sirenën e ambulancës?",
    options: ["Vazhdoni normalisht", "Lironi rrugën dhe ndaloni nëse duhet"],
    correctIndex: 1,
  },
  {
    id: 27,
    question: "Çka tregon shenja blu rrethore?",
    options: ["Ndalim", "Detyrim", "Informacion turistik"],
    correctIndex: 1,
  },
  {
    id: 28,
    question: "Çfarë do të thotë vija e plotë e bardhë?",
    options: ["Lejohet tejkalimi", "Ndalim i tejkalimit"],
    correctIndex: 1,
  },
  {
    id: 29,
    question: "Sa është numri minimal i pikëve për të kaluar testin teorik në Kosovë?",
    options: ["108 pikë (90%)", "85 pikë (70%)", "60 pikë (50%)"],
    correctIndex: 0,
  },
  {
    id: 30,
    question: "Çka duhet të bëni nëse iu prishet mjeti në autostradë?",
    options: [
      "Tërhiqeni në buzë, vendosni trekëndëshin dhe jelekun",
      "Lëreni në mes të rrugës",
      "Vazhdoni në këmbë",
    ],
    correctIndex: 0,
  },
];
