/**
 * English and Indonesian, for the menu and story mode.
 *
 * The chapters exist once, in English, and a translation supplies only text:
 * `chaptersIn` rebuilds each chapter from the English structure so era numbers,
 * speakers and the break between the halves can never drift between languages.
 * A missing line falls back to English rather than rendering blank, and says so
 * loudly in dev, which is where a half-finished translation should be caught.
 *
 * The gameplay HUD is still English only. It is a much larger surface — orders,
 * resources, reports, skits — and nothing here assumes it will stay that way.
 */

import { CHAPTERS, type Chapter } from './story'
import { ID_CHAPTERS } from './story.id'

export type Lang = 'en' | 'id'

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'id', label: 'ID' },
]

export interface UiText {
  /** Menu. */
  tagline: string
  start: string
  startNote: string
  era0: string
  era0Note: string
  era1: string
  era1Note: string
  glossary: string
  /** Heading over the eras that are written but not built. */
  theRest: string
  glossaryNote: string
  /** Glossary panel. */
  inTheRealWorld: string
  close: string
  /** Story chrome. */
  mainMenu: string
  draft: string
  era: string
  theWork: string
  opening: string
  ending: string
  begin: string
  yearsLater: string
  back: string
  next: string
  show: string
  finish: string
  readAgain: string
  /** Leave an era's opening scene without reading it. */
  skip: string
  /** The optional scenes beside a chapter, and the line over the list of them. */
  skits: string
  skitsNote: string
  /** The briefing card between the opening scene and the map. */
  briefing: string
  /** The primer card that explains the era's communication. */
  primer: string
  primerLead: string
  butNot: string
  soWhat: string
  toTheWork: string
  objective: string
  toWin: string
  pushingBack: string
  howToPlay: string
  startEra: string
  endTitle: string
  endPremise: string
  /** The MC14500B simulator, which is a side room rather than part of the arc. */
  sim: string
  simNote: string
  simProgram: string
  simSource: string
  simLine: string
  simMachine: string
  simRegisters: string
  simPins: string
  simControls: string
  simInputs: string
  simClock: string
  simRun: string
  simStop: string
  simReset: string
  simSpeed: string
  simClocks: string
  simPasses: string
  simWrong: string
  simAside: string
  simRr: string
  simCarry: string
  simSkip: string
  simIen: string
  simOen: string
  simHalt: string
  simAdder: string
  simCounter: string
  simMc: string
  simMcNote: string
  simMove: string
  simMoveNote: string
  simWords: string
  sim8051: string
  sim8051Note: string
  simPorts: string
  simRace: string
  simInstructions: string
  /** The animation every chapter opens with: one message, the whole region. */
  relayErrand: string
  relayStartLine: string
  /** Eyebrow over the objective, centre-top of the relay card. */
  relayBuildLabel: string
  relayArrives: string
  relayUnitMs: string
  relayUnitSec: string
  relayUnitMin: string
  relayUnitHour: string
  relayUnitDay: string
  /** The routing screen: a message crossing the network, node by node. */
  route: string
  routeNote: string
  routeMessage: string
  routeFrom: string
  routeTo: string
  routeText: string
  routeTemplate: string
  routeTextKind: string
  routeStock: string
  routeWeather: string
  routePacked: string
  routeAsText: string
  routeMachine: string
  routeSend: string
  routeStop: string
  routeAgain: string
  routeStep: string
  routePlayback: string
  routeReal: string
  routeBytes: string
  routeBytesWord: string
  routeFrameNote: string
  routeNetwork: string
  routeSteps: string
  routeEncode: string
  routeDecode: string
  routeSendStep: string
  routeLookup: string
  routeNoRoute: string
  routeDelivered: string
  routeTable: string
  routeDest: string
  routeVia: string
  routeHops: string
  routeRace: string
  routeThink: string
  routeLine: string
  routeCircuits: string
  routeAside: string
}

export const UI: Record<Lang, UiText> = {
  en: {
    tagline: 'People die. Ideas do not. Being able to build the idea is what takes a lifetime.',
    start: 'Start',
    startNote: 'The whole arc, Era 0 to Era 7. Script only — no gameplay.',
    skits: 'Skits',
    skitsNote: 'Short scenes beside the chapter, in no particular order. Nothing in them is needed to follow the story.',
    era0: 'Era 0 — The Survey',
    era0Note: '40 villages, no radio, and 3 people who can walk.',
    era1: 'Era 1 — The First Voice',
    era1Note: 'AM radio across the Jakarta region.',
    glossary: 'Glossary',
  theRest: 'The rest of the arc — read the chapter, not play it',
    glossaryNote: 'Every technology the 9 eras rebuild, and who built it first.',
    inTheRealWorld: 'In the real world: ',
    close: 'Close',
    mainMenu: 'Main menu',
    draft: 'draft script',
    era: 'Era',
    theWork: 'the work',
    opening: 'opening',
    ending: 'ending',
    begin: 'Begin',
    yearsLater: 'Years later',
    back: 'back',
    next: 'Next',
    show: 'Show',
    finish: 'Finish',
    readAgain: 'Read again',
    skip: 'skip',
    briefing: 'the work',
    primer: 'how a message moves',
    primerLead: 'Where you are starting from',
    butNot: 'What it cannot do',
    soWhat: 'What it adds up to',
    toTheWork: 'The work',
    objective: 'The work',
    toWin: 'To finish the era',
    pushingBack: 'What pushes back',
    howToPlay: 'How it is played',
    startEra: 'Begin day 1',
    endTitle: 'The First Internet',
    endPremise: 'Forty-one years. The man who understood it best did not live to see the end of it.',
    sim: 'The workbench',
    simNote: 'One board, 3 processors: the Intel 8051 out of the drawer, Era 7’s MC14500B, and the MOVE machine the project has to build itself.',
    simProgram: 'Program',
    simSource: 'Assembly — edit it and the machine reloads',
    simLine: 'Line',
    simMachine: 'Machine',
    simRegisters: 'Shift registers',
    simPins: 'Memory — 1 bit per address',
    simControls: 'Clock',
    simInputs: 'Operands',
    simClock: 'Clock ▸',
    simRun: 'Run',
    simStop: 'Stop',
    simReset: 'Reset',
    simSpeed: 'Every',
    simClocks: 'clocks',
    simPasses: 'passes',
    simWrong: 'that is wrong — check the program',
    simAside:
      'On the bit machines one clock is one instruction, and a pass is one bit of work. On the 8051 an instruction is 1 or 2 machine cycles. The times are worked out from cycles and a stated clock rate, not from how fast anybody clicks.',
    simRr: 'The result register. One bit, and the only state the chip has.',
    simCarry: 'The carry, kept on the board between passes.',
    simSkip: 'The next instruction will be fetched and thrown away.',
    simIen: 'Inputs enabled. While off, every read comes back 0.',
    simOen: 'Outputs enabled. While off, every write is dropped.',
    simHalt: 'The program stopped the clock.',
    simAdder: 'Adder',
    simCounter: 'Counter',
    simMc: 'MC14500B',
    simMcNote:
      'A real chip, 1977: 16 instructions and 1 bit of state. It has no XOR, so every XOR in its programs is an XNOR whose complement gets stored.',
    simMove: 'MOVE machine',
    simMoveNote:
      'One instruction — move a bit from somewhere to somewhere. Operations are places: moving into XOR xors, moving a label into PC jumps. No chip needed; a counter, two decoders and a flip-flop.',
    simWords: 'Instruction set',
    sim8051: 'Intel 8051',
    sim8051Note:
      'The chip in the drawer, 1980: 8 bits wide, an adder built in, 8 registers. The addition the others spend a hundred clocks on is 4 instructions here — which is what Era 6 is losing.',
    simPorts: 'Ports — a whole register at once',
    simRace: 'Same job, 3 machines',
    simInstructions: 'instructions',
    relayErrand: 'One message, the whole region',
    relayStartLine: '%a has something to tell %b.',
    relayBuildLabel: "What you'll build in this era:",
    relayArrives: 'Arrives in',
    relayUnitMs: 'milliseconds',
    relayUnitSec: 'seconds',
    relayUnitMin: 'minutes',
    relayUnitHour: 'hours',
    relayUnitDay: 'days',
    route: 'The routing table',
    routeNote:
      'Send a message across the network and watch every node decide where it goes next — on the chip out of the drawer, or on the machine the project has to build itself.',
    routeMessage: 'The message',
    routeFrom: 'From',
    routeTo: 'To',
    routeText: 'Text',
    routeTemplate: 'What it says',
    routeTextKind: 'Free text',
    routeStock: 'Stock report',
    routeWeather: 'Weather',
    routePacked: 'bytes packed',
    routeAsText: 'if it were spelled out',
    routeMachine: 'Processor',
    routeSend: 'Send ▸',
    routeStop: 'Stop',
    routeAgain: 'Send again',
    routeStep: 'One step',
    routePlayback: 'Play at',
    routeReal: 'real time',
    routeBytes: 'On the wire',
    routeBytesWord: 'bytes',
    routeFrameNote:
      'Address, hops left, length, the payload, then a checksum. Every node on the way reads the first byte and the last one — only the two ends open the middle, and only they need the codebook that says byte 01 means rice.',
    routeNetwork: 'The network',
    routeSteps: 'What happens',
    routeEncode: 'Frame the message',
    routeDecode: 'Check the frame, read the text back out',
    routeSendStep: 'Down the line to',
    routeLookup: 'Look the destination up — hand it to',
    routeNoRoute: 'No route. Every path to there is cut.',
    routeDelivered: 'Delivered:',
    routeTable: 'Routing table',
    routeDest: 'to',
    routeVia: 'via',
    routeHops: 'hops',
    routeRace: 'Same message, 3 machines',
    routeThink: 'thinking',
    routeLine: 'line',
    routeCircuits: 'Circuits — click one to cut it',
    routeAside:
      'Cut a line and every table is worked out again: the packet finds another way round, or it does not go at all. The times come from a stated line rate and from each machine’s own adder — measured, not assumed.',
  },
  id: {
    tagline: 'Manusia mati. Gagasan tidak. Yang butuh seumur hidup adalah kemampuan membangunnya.',
    start: 'Mulai',
    startNote: 'Seluruh kisahnya, Era 0 sampai Era 7. Hanya naskah — tanpa permainan.',
    skits: 'Obrolan',
    skitsNote: 'Adegan pendek di samping bab ini, tanpa urutan tertentu. Tidak ada isinya yang wajib diikuti untuk mengerti ceritanya.',
    era0: 'Era 0 — Penjajakan',
    era0Note: '40 kampung, tanpa radio, dan 3 orang yang bisa berjalan kaki.',
    era1: 'Era 1 — Suara Pertama',
    era1Note: 'Radio AM di wilayah Jakarta.',
    glossary: 'Glosarium',
  theRest: 'Sisa ceritanya — dibaca babnya, bukan dimainkan',
    glossaryNote: 'Semua teknologi yang dibangun ulang di 9 era, dan siapa yang membuatnya lebih dulu.',
    inTheRealWorld: 'Di dunia nyata: ',
    close: 'Tutup',
    mainMenu: 'Menu utama',
    draft: 'naskah draf',
    era: 'Era',
    theWork: 'pekerjaannya',
    opening: 'pembuka',
    ending: 'penutup',
    begin: 'Mulai',
    yearsLater: 'Bertahun-tahun kemudian',
    back: 'kembali',
    next: 'Lanjut',
    show: 'Tampilkan',
    finish: 'Selesai',
    readAgain: 'Baca lagi',
    skip: 'lewati',
    briefing: 'pekerjaannya',
    primer: 'bagaimana pesan bergerak',
    primerLead: 'Titik berangkatnya',
    butNot: 'Yang tidak bisa dilakukannya',
    soWhat: 'Jadinya bagaimana',
    toTheWork: 'Pekerjaannya',
    objective: 'Pekerjaannya',
    toWin: 'Untuk menyelesaikan era ini',
    pushingBack: 'Yang melawan',
    howToPlay: 'Cara memainkannya',
    startEra: 'Mulai hari 1',
    endTitle: 'Internet Pertama',
    endPremise:
      'Empat puluh satu tahun. Orang yang paling paham soal itu tidak hidup sampai akhirnya.',
    sim: 'Meja kerja',
    simNote: 'Satu papan, 3 prosesor: Intel 8051 dari laci, MC14500B dari Era 7, dan mesin MOVE yang harus dibikin sendiri.',
    simProgram: 'Program',
    simSource: 'Assembly — begitu diubah, mesinnya dimuat ulang',
    simLine: 'Baris',
    simMachine: 'Mesin',
    simRegisters: 'Shift register',
    simPins: 'Memori — 1 bit per alamat',
    simControls: 'Clock',
    simInputs: 'Angkanya',
    simClock: 'Clock ▸',
    simRun: 'Jalan',
    simStop: 'Stop',
    simReset: 'Ulang',
    simSpeed: 'Tiap',
    simClocks: 'clock',
    simPasses: 'putaran',
    simWrong: 'itu salah — periksa programnya',
    simAside:
      'Di mesin bit, 1 clock sama dengan 1 instruksi, dan 1 putaran mengerjakan 1 bit. Di 8051, 1 instruksi butuh 1 atau 2 machine cycle. Waktunya dihitung dari cycle dan clock yang disebutkan, bukan dari secepat apa tombolnya ditekan.',
    simRr: 'Result register. Satu bit, dan itu satu-satunya keadaan yang dipunya chip ini.',
    simCarry: 'Simpanan, disimpan di papan di antara putaran.',
    simSkip: 'Instruksi berikutnya tetap diambil, tapi dibuang.',
    simIen: 'Input hidup. Selama mati, semua pembacaan jadi 0.',
    simOen: 'Output hidup. Selama mati, semua penulisan dibuang.',
    simHalt: 'Programnya menghentikan clock.',
    simAdder: 'Penjumlah',
    simCounter: 'Pencacah',
    simMc: 'MC14500B',
    simMcNote:
      'Chip sungguhan, 1977: 16 instruksi dan 1 bit keadaan. Chip ini tidak punya XOR, jadi setiap XOR di programnya dikerjakan pakai XNOR yang kebalikannya disimpan.',
    simMove: 'Mesin MOVE',
    simMoveNote:
      'Satu instruksi — pindahkan 1 bit dari suatu tempat ke tempat lain. Operasinya berupa tempat: memindahkan bit ke XOR berarti meng-XOR, memindahkan label ke PC berarti melompat. Tidak butuh chip; cukup pencacah, 2 dekoder, dan 1 flip-flop.',
    simWords: 'Kumpulan instruksi',
    sim8051: 'Intel 8051',
    sim8051Note:
      'Chip yang ada di laci, 1980: lebarnya 8 bit, penjumlahnya sudah di dalam, 8 register. Penjumlahan yang di mesin lain butuh ratusan clock di sini cuma 4 instruksi — dan itulah yang hilang di Era 6.',
    simPorts: 'Port — satu register sekaligus',
    simRace: 'Kerjaan sama, 3 mesin',
    simInstructions: 'instruksi',
    relayErrand: 'Satu pesan, satu wilayah',
    relayStartLine: '%a mau menyampaikan sesuatu ke %b.',
    relayBuildLabel: 'Yang akan kamu buat di era ini:',
    relayArrives: 'Sampai dalam',
    relayUnitMs: 'milidetik',
    relayUnitSec: 'detik',
    relayUnitMin: 'menit',
    relayUnitHour: 'jam',
    relayUnitDay: 'hari',
    route: 'Tabel perutean',
    routeNote:
      'Kirim pesan lewat jaringan, lihat tiap simpul memutuskan ke mana berikutnya — pakai cip dari laci, atau mesin yang harus dibikin sendiri.',
    routeMessage: 'Pesannya',
    routeFrom: 'Dari',
    routeTo: 'Ke',
    routeText: 'Teks',
    routeTemplate: 'Isinya',
    routeTextKind: 'Teks bebas',
    routeStock: 'Laporan stok',
    routeWeather: 'Cuaca',
    routePacked: 'byte terkemas',
    routeAsText: 'kalau ditulis panjang',
    routeMachine: 'Prosesor',
    routeSend: 'Kirim ▸',
    routeStop: 'Berhenti',
    routeAgain: 'Kirim lagi',
    routeStep: 'Satu langkah',
    routePlayback: 'Putar',
    routeReal: 'waktu nyata',
    routeBytes: 'Di kabel',
    routeBytesWord: 'byte',
    routeFrameNote:
      'Alamat, sisa lompatan, panjang, muatannya, lalu checksum. Tiap simpul di jalan cuma baca byte pertama dan terakhir — yang buka isinya cuma dua ujungnya, dan cuma mereka yang butuh buku kode yang bilang byte 01 artinya beras.',
    routeNetwork: 'Jaringannya',
    routeSteps: 'Yang terjadi',
    routeEncode: 'Bungkus pesannya',
    routeDecode: 'Periksa bungkusnya, baca lagi teksnya',
    routeSendStep: 'Lewat kabel ke',
    routeLookup: 'Cari tujuannya — diserahkan ke',
    routeNoRoute: 'Tidak ada jalur. Semua jalan ke sana putus.',
    routeDelivered: 'Sampai:',
    routeTable: 'Tabel perutean',
    routeDest: 'ke',
    routeVia: 'lewat',
    routeHops: 'lompatan',
    routeRace: 'Pesan sama, 3 mesin',
    routeThink: 'mikir',
    routeLine: 'kabel',
    routeCircuits: 'Sirkuit — klik untuk memutus',
    routeAside:
      'Putus satu kabel, semua tabel dihitung ulang: paketnya cari jalan lain, atau tidak jalan sama sekali. Waktunya dari laju kabel yang disebutkan dan dari penjumlah tiap mesin — diukur, bukan dikira-kira.',
  },
}

if (import.meta.env.DEV) {
  CHAPTERS.forEach((chapter, i) => {
    const text = ID_CHAPTERS[i]
    const wrong =
      !text ||
      text.opening.length !== chapter.opening.length ||
      text.closing.length !== chapter.closing.length
    if (wrong) {
      console.error(
        `story.id.ts is out of step with story.ts at era ${chapter.era}: expected ` +
          `${chapter.opening.length}/${chapter.closing.length} lines, got ` +
          `${text ? `${text.opening.length}/${text.closing.length}` : 'nothing'}.`,
      )
    }
  })
}

export function chaptersIn(lang: Lang): Chapter[] {
  if (lang === 'en') return CHAPTERS
  return CHAPTERS.map((chapter, i) => {
    const text = ID_CHAPTERS[i]
    if (!text) return chapter
    return {
      ...chapter,
      title: text.title,
      premise: text.premise,
      interlude: text.interlude,
      opening: chapter.opening.map((line, k) => ({ ...line, text: text.opening[k] ?? line.text })),
      closing: chapter.closing.map((line, k) => ({ ...line, text: text.closing[k] ?? line.text })),
    }
  })
}
