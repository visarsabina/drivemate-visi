export interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // 0-based
  imageUrl?: string;
}

/**
 * Pyetjet e testit të auto-shkollës.
 *
 * 📌 Si të zëvendësosh me pyetjet e tua:
 * 1. Eksporto pyetjet në format JSON me strukturën e mësipërme (TestQuestion).
 * 2. Zëvendëso array-in më poshtë, ose importo nga skedari JSON:
 *    import questionsJson from "./questions.json";
 *    export const testQuestions: TestQuestion[] = questionsJson;
 *
 * Sistemi do të zgjedhë automatikisht 30 pyetje për test.
 */
export const testQuestions: TestQuestion[] = [
  {
    id: 1,
    question: "Çka tregon shenja e ndalimit (STOP)?",
    options: ["Ndal vetëm nëse ka mjete tjera", "Ndal patjetër dhe lëviz vetëm kur është e sigurt", "Ngadalëso por mos ndal", "Ka përparësi kalimi"],
    correctIndex: 1,
  },
  {
    id: 2,
    question: "Sa është shpejtësia maksimale e lejuar brenda zonës urbane?",
    options: ["30 km/h", "50 km/h", "70 km/h", "80 km/h"],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "Kur duhet të përdoret rripi i sigurisë?",
    options: ["Vetëm në autostradë", "Vetëm gjatë natës", "Gjithmonë gjatë vozitjes", "Vetëm nga shoferi"],
    correctIndex: 2,
  },
  {
    id: 4,
    question: "Çfarë ngjyre kanë shenjat e detyrueshme?",
    options: ["E kuqe", "E verdhë", "E gjelbër", "E kaltër"],
    correctIndex: 3,
  },
  {
    id: 5,
    question: "Sa është distanca minimale e sigurisë në autostradë?",
    options: ["1 sekond", "2 sekonda", "3 sekonda", "5 sekonda"],
    correctIndex: 1,
  },
  {
    id: 6,
    question: "A lejohet vozitja pas konsumimit të alkoolit?",
    options: ["Po, deri në 0.5‰", "Po, vetëm pas një gote", "Jo, asnjëherë mbi kufirin ligjor", "Po, nëse je i përvojshëm"],
    correctIndex: 2,
  },
  {
    id: 7,
    question: "Çka duhet të bëni në një kryqëzim pa shenja?",
    options: ["Kalon i pari", "I jep përparësi mjetit nga e djathta", "I jep përparësi mjetit nga e majta", "Kalon vetëm këmbësori"],
    correctIndex: 1,
  },
  {
    id: 8,
    question: "Kur ndizen dritat e kthesës?",
    options: ["Gjatë frenimit", "Para çdo manovre kthese ose ndërrimi shiriti", "Vetëm në kryqëzime", "Asnjëherë"],
    correctIndex: 1,
  },
  {
    id: 9,
    question: "Çka tregon vija e ndërprerë në mes të rrugës?",
    options: ["Ndalim i tejkalimit", "Lejohet tejkalimi nëse është e sigurt", "Vetëm për autobusë", "Stacion i autobusit"],
    correctIndex: 1,
  },
  {
    id: 10,
    question: "Sa duhet të jetë thellësia minimale e protektorit të gomës?",
    options: ["0.8 mm", "1.6 mm", "3.0 mm", "5.0 mm"],
    correctIndex: 1,
  },
  {
    id: 11,
    question: "Kur duhet të ndizni dritat e gjata?",
    options: ["Në qytet", "Në rrugë pa ndriçim, pa mjete përballë", "Gjithmonë natën", "Vetëm në shi"],
    correctIndex: 1,
  },
  {
    id: 12,
    question: "Çka duhet të bëni nëse iu pikon vaji në motor?",
    options: ["Vazhdoni vozitjen", "Ndalni dhe kontrolloni motorin", "Shtoni gaz", "S'ka rëndësi"],
    correctIndex: 1,
  },
  {
    id: 13,
    question: "Cila është dokumentacioni i detyrueshëm gjatë vozitjes?",
    options: ["Vetëm patentë shoferi", "Patentë, leje qarkullimi, sigurim", "Vetëm sigurim", "Asgjë"],
    correctIndex: 1,
  },
  {
    id: 14,
    question: "Çka tregon shenja trekëndësh me kufi të kuq?",
    options: ["Detyrim", "Paralajmërim për rrezik", "Ndalim", "Informacion"],
    correctIndex: 1,
  },
  {
    id: 15,
    question: "Sa është mosha minimale për patentën e kategorisë B?",
    options: ["16 vjeç", "17 vjeç", "18 vjeç", "21 vjeç"],
    correctIndex: 2,
  },
  {
    id: 16,
    question: "Çka duhet të bëni para se të hapni derën e veturës?",
    options: ["Hapeni shpejt", "Kontrolloni nëse vjen mjet apo këmbësor", "S'ka rëndësi", "Vetëm bini bori"],
    correctIndex: 1,
  },
  {
    id: 17,
    question: "Kur është e ndaluar parkimi?",
    options: ["Para hyrjeve, mbi vendkalim, kthesa", "Vetëm natën", "Vetëm në qendër", "Gjithmonë"],
    correctIndex: 0,
  },
  {
    id: 18,
    question: "Çka duhet të bëni në rast aksidenti?",
    options: ["Largohuni menjëherë", "Ndaloni, ndihmoni, lajmëroni policinë", "Vazhdoni vozitjen", "Telefononi familjen"],
    correctIndex: 1,
  },
  {
    id: 19,
    question: "Si njihet semafori i prishur?",
    options: ["Drita e verdhë vezulluese", "Drita e kuqe fikse", "Drita e gjelbër", "Asgjë"],
    correctIndex: 0,
  },
  {
    id: 20,
    question: "Kur kalon këmbësori në vendkalim?",
    options: ["Mjeti ka përparësi", "Këmbësori ka përparësi gjithmonë", "Vetëm natën", "S'ka rregull"],
    correctIndex: 1,
  },
  {
    id: 21,
    question: "Çka tregon shenja rrethore me kufi të kuq?",
    options: ["Detyrim", "Ndalim", "Paralajmërim", "Informacion"],
    correctIndex: 1,
  },
  {
    id: 22,
    question: "Sa është shpejtësia maksimale në autostradë?",
    options: ["100 km/h", "120 km/h", "130 km/h", "150 km/h"],
    correctIndex: 1,
  },
  {
    id: 23,
    question: "Kur përdoret freni i dorës?",
    options: ["Gjatë vozitjes", "Kur parkoni mjetin", "Në kryqëzime", "Asnjëherë"],
    correctIndex: 1,
  },
  {
    id: 24,
    question: "A lejohet përdorimi i celularit gjatë vozitjes?",
    options: ["Po, gjithmonë", "Vetëm me handsfree", "Jo, asnjëherë", "Vetëm në qytet"],
    correctIndex: 1,
  },
  {
    id: 25,
    question: "Çka duhet të bëni kur dëgjoni sirenën e ambulancës?",
    options: ["Vazhdoni normalisht", "Lironi rrugën dhe ndaloni nëse duhet", "Ndizni dritat", "Bini bori"],
    correctIndex: 1,
  },
  {
    id: 26,
    question: "Çka tregon shenja blu rrethore?",
    options: ["Ndalim", "Paralajmërim", "Detyrim", "Informacion turistik"],
    correctIndex: 2,
  },
  {
    id: 27,
    question: "Kur duhet të ndërroni gomat me dimërore?",
    options: ["Asnjëherë", "Sipas rregullores, zakonisht 15 nëntor – 15 mars", "Vetëm kur ka borë", "Vetëm në mal"],
    correctIndex: 1,
  },
  {
    id: 28,
    question: "Çfarë do të thotë vija e plotë e bardhë?",
    options: ["Lejohet tejkalimi", "Ndalim i tejkalimit", "Stacion autobusi", "Parkim"],
    correctIndex: 1,
  },
  {
    id: 29,
    question: "Sa është numri minimal i pikëve për të kaluar testin teorik (në Kosovë)?",
    options: ["50%", "70%", "85%", "100%"],
    correctIndex: 2,
  },
  {
    id: 30,
    question: "Çka duhet të bëni nëse iu prishet mjeti në autostradë?",
    options: ["Lëreni në mes të rrugës", "Tërhiqeni në buzë, vendosni trekëndëshin dhe jelekun", "Vazhdoni në këmbë", "Lajmëroni vetëm familjen"],
    correctIndex: 1,
  },
];
