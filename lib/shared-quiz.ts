export type SharedQuizItem = {
  question: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
};

type RawQuizRow = { question: string; options: [string, string, string]; answer: string };

/** Preguntas originales (no repetir en UI mezclando con semilla). */
const RAW: RawQuizRow[] = [
  { question: "¿Quién construyó el arca?", options: ["Noé", "Moisés", "Abraham"], answer: "Noé" },
  { question: "¿Cuántos discípulos eligió Jesús como apóstoles principales?", options: ["12", "7", "40"], answer: "12" },
  { question: "¿En qué río fue bautizado Jesús?", options: ["Jordán", "Nilo", "Éufrates"], answer: "Jordán" },
  { question: "¿Quién traicionó a Jesús?", options: ["Judas Iscariote", "Pedro", "Tomás"], answer: "Judas Iscariote" },
  { question: "¿Qué día resucitó Jesús según los evangelios?", options: ["El tercer día", "El mismo viernes", "Después de 40 días"], answer: "El tercer día" },
  { question: "¿Quién venció a Goliat?", options: ["David", "Jonatán", "Saúl"], answer: "David" },
  { question: "¿Qué instrumento tocaba David ante Saúl?", options: ["Arpa", "Trompeta", "Pandereta"], answer: "Arpa" },
  { question: "¿Quién fue la madre de Samuel?", options: ["Ana", "Rut", "Rebeca"], answer: "Ana" },
  { question: "¿En qué ciudad nació Jesús?", options: ["Belén", "Nazaret", "Jerusalén"], answer: "Belén" },
  { question: "¿Quién bautizó a Jesús?", options: ["Juan el Bautista", "Pedro", "Pablo"], answer: "Juan el Bautista" },
  { question: "¿Cuál es el primer libro de la Biblia?", options: ["Génesis", "Éxodo", "Mateo"], answer: "Génesis" },
  { question: "¿Cuál es el último libro del Nuevo Testamento?", options: ["Apocalipsis", "Hechos", "Judas"], answer: "Apocalipsis" },
  { question: "¿Quién fue arrojado al foso de los leones?", options: ["Daniel", "Jonás", "Jeremías"], answer: "Daniel" },
  { question: "¿Quién fue tragado por un gran pez?", options: ["Jonás", "Pedro", "Elías"], answer: "Jonás" },
  { question: "¿Qué debemos buscar primero según Mateo 6:33?", options: ["El reino de Dios", "Las riquezas", "La fama"], answer: "El reino de Dios" },
  { question: "¿Quién recibió los Diez Mandamientos?", options: ["Moisés", "Aarón", "Josué"], answer: "Moisés" },
  { question: "¿En qué monte fue entregada la ley?", options: ["Sinaí", "Carmelo", "Tabor"], answer: "Sinaí" },
  { question: "¿Quién fue el primer hombre?", options: ["Adán", "Noé", "Enoc"], answer: "Adán" },
  { question: "¿Quién fue la primera mujer?", options: ["Eva", "Sara", "Rebeca"], answer: "Eva" },
  { question: "¿Cuántos años caminó Israel en el desierto (aprox.)?", options: ["40 años", "7 años", "430 días"], answer: "40 años" },
  { question: "¿Quién guió al pueblo tras Moisés?", options: ["Josué", "Caleb", "Gedeón"], answer: "Josué" },
  { question: "¿Qué fruto prohibió Dios en el Edén?", options: ["Árbol prohibido (no se nombra manzana en texto)", "Higos", "Uvas"], answer: "Árbol prohibido (no se nombra manzana en texto)" },
  { question: "¿Quién interpretó sueños en Egipto?", options: ["José", "Daniel", "Faraón"], answer: "José" },
  { question: "¿De qué tribu era David?", options: ["Judá", "Benjamín", "Leví"], answer: "Judá" },
  { question: "¿Quién sucedió a Elías en el ministerio profético?", options: ["Eliseo", "Isaías", "Jeremías"], answer: "Eliseo" },
  { question: "¿En qué libro está el salmo 23?", options: ["Salmos", "Proverbios", "Job"], answer: "Salmos" },
  { question: "¿Quién escribió la mayor parte de los Salmos?", options: ["David (en su mayoría)", "Salomón", "Moisés"], answer: "David (en su mayoría)" },
  { question: "¿Quién fue rey después de David?", options: ["Salomón", "Saúl", "Roboam"], answer: "Salomón" },
  { question: "¿Qué rey pidió sabiduría a Dios?", options: ["Salomón", "Ezequías", "Josías"], answer: "Salomón" },
  { question: "¿Quién fue convertido en el camino a Damasco?", options: ["Pablo", "Bernabé", "Apolos"], answer: "Pablo" },
  { question: "¿Cómo se llamaba antes Pablo?", options: ["Saulo", "Simón", "Esteban"], answer: "Saulo" },
  { question: "¿Quién negó a Jesús tres veces?", options: ["Pedro", "Juan", "Andrés"], answer: "Pedro" },
  { question: "¿Quién era el apóstol al que Jesús amaba según tradición de Juan?", options: ["Juan", "Santiago", "Felipe"], answer: "Juan" },
  { question: "¿Qué libro narra la historia de la iglesia primitiva?", options: ["Hechos", "Romanos", "Gálatas"], answer: "Hechos" },
  { question: "¿Quién fue el primer mártir cristiano registrado en Hechos?", options: ["Esteban", "Santiago", "Pedro"], answer: "Esteban" },
  { question: "¿A qué ciudad escribió Pablo la carta a los Romanos?", options: ["No estaba aún en Roma al escribir", "Corinto", "Éfeso"], answer: "No estaba aún en Roma al escribir" },
  { question: "¿Cuál es el mandamiento resume la ley según Jesús?", options: ["Amar a Dios y al prójimo", "No robar", "Guardar el sábado"], answer: "Amar a Dios y al prójimo" },
  { question: "¿Quién bajó del barco y caminó sobre el agua hacia Jesús?", options: ["Pedro", "Juan", "Andrés"], answer: "Pedro" },
  { question: "¿Cuántos panes y peces multiplicó Jesús en un relato famoso?", options: ["5 panes y 2 peces", "7 panes", "12 cestas"], answer: "5 panes y 2 peces" },
  { question: "¿Quién fue la mujer samaritana con la que habló Jesús en el pozo?", options: ["No se nombra en el texto", "María", "Marta"], answer: "No se nombra en el texto" },
  { question: "¿Quiénes fueron las hermanas de Lázaro?", options: ["Marta y María", "María y Salomé", "Elisabet y Ana"], answer: "Marta y María" },
  { question: "¿Quién profetizó sobre un niño llamado Emanuel?", options: ["Isaías", "Oseas", "Miqueas"], answer: "Isaías" },
  { question: "¿En qué valle derrotó David a Goliat?", options: ["Elá", "Jezreel", "Sidim"], answer: "Elá" },
  { question: "¿Quién fue la esposa de Abraham?", options: ["Sara", "Rebeca", "Raquel"], answer: "Sara" },
  { question: "¿Quién era el hermano de Jacob?", options: ["Esaú", "José", "Benjamín"], answer: "Esaú" },
  { question: "¿Cómo se llamaba Jacob después de luchar con Dios?", options: ["Israel", "Israelita", "Ismael"], answer: "Israel" },
  { question: "¿Cuántos hijos de Jacob formaron tribus en Israel?", options: ["12", "10", "7"], answer: "12" },
  { question: "¿Quién fue vendido por sus hermanos?", options: ["José", "Benjamín", "Rubén"], answer: "José" },
  { question: "¿En qué país sirvió José como gobernante?", options: ["Egipto", "Babilonia", "Asiria"], answer: "Egipto" },
  { question: "¿Quién llevó el arca del pacto alrededor de Jericó?", options: ["El pueblo de Israel", "Solo los sacerdotes", "Josué solo"], answer: "El pueblo de Israel" },
  { question: "¿Qué ciudad cayó tras marchar y tocar trompetas?", options: ["Jericó", "Ai", "Hebrón"], answer: "Jericó" },
  { question: "¿Quién era sumo sacerdote cuando nació Juan el Bautista?", options: ["Zacarías (padre de Juan, sacerdote)", "Caifás", "Anás"], answer: "Zacarías (padre de Juan, sacerdote)" },
  { question: "¿Dónde predicó Jonás?", options: ["Nínive", "Tiro", "Babilonia"], answer: "Nínive" },
  { question: "¿Qué libro dice: hay tiempo para todo?", options: ["Eclesiastés", "Job", "Cantares"], answer: "Eclesiastés" },
  { question: "¿Quién fue tragado por el mar Rojo al perseguir a Israel?", options: ["El ejército de Faraón", "Moisés", "Aarón"], answer: "El ejército de Faraón" },
  { question: "¿Qué ofrenda trajo Caín?", options: ["Fruto de la tierra", "Un cordero", "Incienso"], answer: "Fruto de la tierra" },
  { question: "¿Qué ofrenda agradó a Dios de Abel?", options: ["Primogénitos de su rebaño", "Trigo", "Uvas"], answer: "Primogénitos de su rebaño" },
  { question: "¿Quién fue rey ungido por Samuel como primer rey de Israel?", options: ["Saúl", "David", "Salomón"], answer: "Saúl" },
  { question: "¿Con qué gigante peleó Elhanán según 2 Samuel 21 (tradición bíblica)?", options: ["Lahmi (hermano de Goliat en algunos textos)", "Goliat otra vez", "Og"], answer: "Lahmi (hermano de Goliat en algunos textos)" },
  { question: "¿Quién cortó el cabello de Sansón?", options: ["Dalila", "Un filisteo", "Su madre"], answer: "Dalila" },
  { question: "¿De qué era fuerte Sansón?", options: ["Su cabello consagrado a Dios", "Su espada", "Su armadura"], answer: "Su cabello consagrado a Dios" },
  { question: "¿Quién pidió la cabeza de Juan el Bautista?", options: ["Herodías (a través de su hija)", "Pilato", "Caifás"], answer: "Herodías (a través de su hija)" },
  { question: "¿Quién gobernaba Judea al nacer Jesús?", options: ["Herodes el Grande", "Pilato", "Herodes Antipas"], answer: "Herodes el Grande" },
  { question: "¿A dónde huyeron José y María con el niño?", options: ["Egipto", "Grecia", "Asiria"], answer: "Egipto" },
  { question: "¿En qué fiesta encontró Jesús a los mercaderes en el templo?", options: ["Pascua", "Pentecostés", "Tabernáculos"], answer: "Pascua" },
  { question: "¿Quién ayudó a Jesús a cargar la cruz?", options: ["Simón de Cirene", "José de Arimatea", "Nicodemo"], answer: "Simón de Cirene" },
  { question: "¿Quién pidió el cuerpo de Jesús para sepultarlo?", options: ["José de Arimatea", "Pedro", "Juan"], answer: "José de Arimatea" },
  { question: "¿Quién fue el primer en ver a Jesús resucitado según Marcos?", options: ["María Magdalena", "Pedro", "Tomás"], answer: "María Magdalena" },
  { question: "¿Qué apóstol dudó hasta tocar las heridas de Jesús?", options: ["Tomás", "Felipe", "Mateo"], answer: "Tomás" },
  { question: "¿En qué isla recibió Juan el Apocalipsis?", options: ["Patmos", "Creta", "Chipre"], answer: "Patmos" },
  { question: "¿Cuántas plagias hubo en Egipto (relato del Éxodo)?", options: ["10", "7", "12"], answer: "10" },
  { question: "¿Qué insecto fue una de las plagias?", options: ["Langostas", "Abejas", "Arañas"], answer: "Langostas" },
  { question: "¿Quién abrió el mar para Israel?", options: ["Dios por medio de Moisés", "Josué", "Aarón"], answer: "Dios por medio de Moisés" },
  { question: "¿Qué metal hizo el pueblo adorar en el Sinaí?", options: ["Un becerro de oro", "Un ídolo de plata", "Una serpiente"], answer: "Un becerro de oro" },
  { question: "¿Quién habló con la zarza ardiente?", options: ["Moisés", "Elías", "Gedeón"], answer: "Moisés" },
  { question: "¿Quién fue la nuera de Noemí?", options: ["Rut", "Orfa (también nuera)", "Rut es la que se quedó"], answer: "Rut" },
  { question: "¿Qué libro es principalmente poesía y cánticos de amor?", options: ["Cantares", "Lamentaciones", "Eclesiastés"], answer: "Cantares" },
  { question: "¿Quién fue el hombre más manso de la tierra según Números 12:3?", options: ["Moisés", "David", "Job"], answer: "Moisés" },
  { question: "¿Qué profeta fue comido por un pez grande?", options: ["Jonás", "Oseas", "Joel"], answer: "Jonás" },
  { question: "¿Quién restauró los muros de Jerusalén con Esdras?", options: ["Nehemías", "Zorobabel", "Mardoqueo"], answer: "Nehemías" },
  { question: "¿Quién salvó a los judíos en Persia?", options: ["Ester", "Rut", "Débora"], answer: "Ester" },
  { question: "¿Quién era el enemigo de los judíos en el libro de Ester?", options: ["Amán", "Holoférnes", "Nabucodonosor"], answer: "Amán" },
  { question: "¿Qué rey tuvo un sueño de una estatua en Daniel?", options: ["Nabucodonosor", "Ciro", "Darío"], answer: "Nabucodonosor" },
  { question: "¿Quién fue arrojado al horno de fuego?", options: ["Sadrac, Mesac y Abed-negro", "Daniel", "Los profetas"], answer: "Sadrac, Mesac y Abed-negro" },
  { question: "¿Qué animal aparece como símbolo en Apocalipsis?", options: ["Varios: cordero, bestia, dragón…", "Solo un león", "Solo una paloma"], answer: "Varios: cordero, bestia, dragón…" },
  { question: "¿Cuántas puertas tiene la Jerusalén nueva en parte del relato apocalíptico?", options: ["12", "7", "4"], answer: "12" },
  { question: "¿Quién bautizó a los etíopes en Hechos?", options: ["Felipe", "Pedro", "Pablo"], answer: "Felipe" },
  { question: "¿Qué lengua hablaba Jesús principalmente?", options: ["Arameo/griego en contexto galileo", "Latín", "Solo griego"], answer: "Arameo/griego en contexto galileo" },
  { question: "¿En qué idioma estaba escrita mayormente el NT?", options: ["Griego koiné", "Hebreo", "Latín"], answer: "Griego koiné" },
  { question: "¿Quién fue llamado hijo del trueno?", options: ["Juan y Santiago", "Pedro y Andrés", "Felipe y Bartolomé"], answer: "Juan y Santiago" },
  { question: "¿Qué día guardaban los judíos como santo?", options: ["Sábado", "Domingo", "Lunes"], answer: "Sábado" },
  { question: "¿Qué significa Emmanuel?", options: ["Dios con nosotros", "Salvador", "Mesías"], answer: "Dios con nosotros" },
  { question: "¿Quién fue el padre de Isaac?", options: ["Abraham", "Nacor", "Harán"], answer: "Abraham" },
  { question: "¿Quién engañó a su padre con piel de cabrito?", options: ["Jacob", "Esaú", "Isaac"], answer: "Jacob" },
  { question: "¿Qué hijo de Jacob tuvo una túnica de colores?", options: ["José", "Benjamín", "Leví"], answer: "José" },
  { question: "¿Quién interpretó el sueño de las vacas gordas y flacas?", options: ["José", "Daniel", "Faraón"], answer: "José" },
  { question: "¿Cuál es el versículo más conocido del evangelio de Juan?", options: ["Juan 3:16", "Juan 1:1", "Juan 14:6"], answer: "Juan 3:16" },
  { question: "¿Quién dijo: yo soy el pan de vida?", options: ["Jesús", "Moisés", "Juan el Bautista"], answer: "Jesús" },
  { question: "¿Qué milagro en Caná fue el primero de Jesús en Juan?", options: ["Agua en vino", "Sanar ciego", "Caminar sobre el agua"], answer: "Agua en vino" },
  { question: "¿Quién lavó los pies a los discípulos?", options: ["Jesús", "Pedro", "Juan"], answer: "Jesús" },
  { question: "¿En qué huerto oró Jesús antes de ser preso?", options: ["Getsemaní", "Olivos", "Edén"], answer: "Getsemaní" },
  { question: "¿Quién besó a Jesús en la traición?", options: ["Judas", "Pedro", "Juan"], answer: "Judas" },
  { question: "¿Qué color de hilo salvó a Rahab?", options: ["Escarlata/cordón rojo", "Azul", "Blanco"], answer: "Escarlata/cordón rojo" },
  { question: "¿Quién fue la prostituta que ayudó a los espías en Jericó?", options: ["Rahab", "Rut", "Tamar"], answer: "Rahab" },
  { question: "¿Quién mató a Goliat con honda y piedra?", options: ["David", "Jonatán", "Samuel"], answer: "David" },
  { question: "¿Qué arma usó David contra Goliat?", options: ["Honda y piedra", "Espada", "Lanza"], answer: "Honda y piedra" },
  { question: "¿Cuántos días estuvo Jonás en el pez?", options: ["Tres días y tres noches", "Un día", "Siete días"], answer: "Tres días y tres noches" },
  { question: "¿Quién fue rey de Babilonia que vio escritura en la pared?", options: ["Belsasar", "Nabucodonosor", "Ciro"], answer: "Belsasar" },
  { question: "¿Quién interpretó la escritura en la pared?", options: ["Daniel", "Mardoqueo", "Esdras"], answer: "Daniel" },
  { question: "¿Qué significa MENE MENE TEKEL?", options: ["Dios pesó tu reino y lo halló falto", "Paz eterna", "Victoria"], answer: "Dios pesó tu reino y lo halló falto" },
  { question: "¿Quién fue el padre de Juan el Bautista?", options: ["Zacarías", "Elí", "Simón"], answer: "Zacarías" },
  { question: "¿Quién fue la madre de Juan el Bautista?", options: ["Elisabet", "María", "Ana"], answer: "Elisabet" },
  { question: "¿Quién anunció el nacimiento de Jesús a María?", options: ["El ángel Gabriel", "Miguel", "Rafael"], answer: "El ángel Gabriel" },
  { question: "¿Dónde predicó Jesús el sermón del monte?", options: ["Galilea (monte)", "Jerusalén", "Samaria"], answer: "Galilea (monte)" },
  { question: "¿Cuántos panes en la multiplicación que menciona Marcos 8?", options: ["Siete (en un relato)", "Cinco siempre", "Doce"], answer: "Siete (en un relato)" },
  { question: "¿Quién caminó sobre el agua hacia Jesús?", options: ["Pedro", "Juan", "Santiago"], answer: "Pedro" },
  { question: "¿Qué discípulo era recaudador de impuestos?", options: ["Mateo", "Simón el Zelote", "Judas"], answer: "Mateo" },
  { question: "¿Qué significa ‘Cristo’?", options: ["Ungido", "Rey", "Salvador"], answer: "Ungido" },
  { question: "¿En qué ciudad estaba la iglesia a la que Pablo escribió sobre el amor?", options: ["Corinto (1 Corintios 13)", "Roma", "Éfeso"], answer: "Corinto (1 Corintios 13)" },
  { question: "¿Quién plantó la iglesia en Corinto según Hechos?", options: ["Pablo", "Pedro", "Apolos"], answer: "Pablo" },
  { question: "¿Quién ayudó a entender Apolos mejor el camino?", options: ["Priscila y Aquila", "Bernabé", "Timoteo"], answer: "Priscila y Aquila" },
];

function toItem(row: RawQuizRow): SharedQuizItem {
  const idx = row.options.indexOf(row.answer) as 0 | 1 | 2;
  const correct = idx >= 0 ? idx : (0 as 0 | 1 | 2);
  return { question: row.question, options: row.options, correct };
}

export const SHARED_QUIZ_BANK: SharedQuizItem[] = RAW.map(toItem);

function hashSeed(str: string): number {
  let h = 1779033703;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleIndices(n: number, rand: () => number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Elige `count` preguntas distintas según semilla, baraja el orden de opciones en cada una
 * (la respuesta correcta cambia de posición).
 */
export function pickSharedQuiz(seedStr: string, count = 7): SharedQuizItem[] {
  const rand = mulberry32(hashSeed(seedStr));
  const bank = SHARED_QUIZ_BANK.map((q) => ({ ...q, options: [...q.options] as [string, string, string] }));
  const order = shuffleIndices(bank.length, rand);
  const picked: SharedQuizItem[] = [];
  for (let k = 0; k < order.length && picked.length < count; k += 1) {
    const base = bank[order[k]!]!;
    const perm = shuffleIndices(3, rand);
    const newOpts: [string, string, string] = [
      base.options[perm[0]!]!,
      base.options[perm[1]!]!,
      base.options[perm[2]!]!,
    ];
    const newCorrect = perm.indexOf(base.correct) as 0 | 1 | 2;
    picked.push({ question: base.question, options: newOpts, correct: newCorrect });
  }
  return picked;
}
