/**
 * The exchange at the gate, in Indonesian.
 *
 * Text only, at the same keys as the English pack in `parley.ts`, which owns
 * the structure — the same split the story, the skits and the glossary use.
 *
 * These are not the founders talking. They are villagers who have never met
 * this crew, so the register is ordinary polite speech rather than the slang
 * the four of them use with each other: no `gua`, no `lu`, and no ceremony
 * either. People being careful with strangers.
 */

import type { ParleyText } from './parley'

export const ID_PARLEY: ParleyText = {
  lead: 'Mereka keluar ke gerbang. Belum ada yang bilang tidak.',
  wants: {
    food: 'Tungku masak sudah mati padahal masih tengah hari. Sejak kemarin belum ada yang makan di sini.',
    word: 'Kabar apa pun baru sampai kalau kebetulan ada yang lewat, dan separuhnya datang setelah tidak ada gunanya lagi.',
    kin: 'Separuh kampung ini punya keluarga di kota lain, dan tidak ada cara mengirim kabar sepatah pun.',
    watched: 'Ada anak di punggung bukit yang sudah di sana sejak sebelum kalian sampai, mengawasi jalan.',
  },
  cards: {
    rations: { label: 'Ransum', note: 'Diambil dari lumbung, dibawa masuk, dan diserahkan.' },
    board: {
      label: 'Papan di gerbang',
      note: 'Tempat menitipkan pesan, supaya kabar tidak lagi menunggu pengantar yang tepat.',
    },
    fire: {
      label: 'Api di bukit',
      note: 'Kayu ditata dan kering. Hanya bisa bilang satu hal, dan bilangnya sebelum ada yang berjalan.',
    },
    letter: {
      label: 'Kabar kami bawakan',
      note: 'Apa pun yang mau disampaikan, sampai ke tempat yang tidak terjangkau.',
    },
  },
  replies: {
    rations: {
      good: 'Karungnya langsung lewat para tetua ke belakang kerumunan. Ada yang mulai menyalakan tungku.',
      bad: 'Diterima, lalu ditaruh persis di tempat penyerahan. Tidak ada yang menoleh lagi.',
    },
    board: {
      good: '"Ditaruhnya di tiang, atau di dalam?" Mereka sudah ribut soal tiangnya.',
      bad: 'Papan berisi kertas. Kertas sudah pernah mereka lihat.',
    },
    fire: {
      good: 'Anak di punggung bukit dipanggil turun dan ditanya kayunya harus kering berapa lama.',
      bad: 'Mereka menengok ke bukit, lalu saling pandang. Tidak ada yang menunggu apa pun di atas sana.',
    },
    letter: {
      good: 'Ada 3 orang bicara bersamaan, dan ketiganya menyebut kota yang sama.',
      bad: 'Tidak ada yang punya pesan untuk dikirim ke mana pun.',
    },
  },
  verdict: {
    talking: 'Mereka ikut. Kalian pulang membawa satu nama untuk ditanyakan dan bagian dari panen mereka.',
    wary: 'Belum kali ini. Mereka menanyakan harganya, dan tidak percaya jawabannya.',
  },
  handOver: 'Serahkan saja',
  handOverNote: 'Satu tawaran, dipilih tanpa mendengarkan.',
  done: 'Pamit',
  autoNote: 'Diserahkan. Tawarannya dibuat tanpa mendengarkan.',
}
