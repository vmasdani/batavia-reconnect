/**
 * The chapter-opening errand, in Indonesian.
 *
 * Text only, keyed by era, in the same order as `relay.ts`. The numbers, the
 * chain of places and which era is quicker than which all stay in the English
 * file and are reused, the same rule `story.id.ts` and `briefings.id.ts`
 * follow.
 *
 * The hand-off line is the one place a person is speaking, so it is spoken
 * Indonesian. The rest is the game narrating, and stays written.
 */

export interface RelayText {
  carrier: string
  /** `%s` is the next place; it is substituted, not translated. */
  handoff: string
  upshot: string
}

export const ID_RELAYS: Record<number, RelayText> = {
  0: {
    carrier: 'Jalan kaki',
    handoff: 'Nunggu di gerbang, cari orang yang mau ke %s',
    upshot: 'Tanya sesuatu ke Bogor hari ini, jawabannya datang bulan depan.',
  },
  1: {
    carrier: 'Diucapkan lewat radio AM',
    handoff: '“Tolong terusin ke %s.”',
    upshot: 'Sembilan hari jadi enam menit, dan enam menit itu isinya orang ngomong.',
  },
  2: {
    carrier: 'Diketuk dengan Morse lewat kawat',
    handoff: 'Diketuk ulang untuk %s',
    upshot: 'Per kata lebih lambat dari suara, tapi tembus cuaca yang tidak bisa dilewati suara.',
  },
  3: {
    carrier: 'Disambung lewat papan sambung',
    handoff: 'Operator di %s dicolokkan',
    upshot: 'Tidak ada lagi yang membaca ulang. Salurannya tersambung ujung ke ujung.',
  },
  4: {
    carrier: 'Dibawa penguat tabung',
    handoff: 'Dikuatkan, diteruskan ke %s',
    upshot: 'Era pertama saat pesan melewati satu tempat tanpa ada yang menyadarinya.',
  },
  5: {
    carrier: 'Diteruskan lewat jadwal yang disusun mesin',
    handoff: 'Jam untuk saluran ke %s sudah dipesan sejak semalam',
    upshot: 'Salurannya tidak bertambah cepat. Yang berkurang waktu menunggunya, karena tidak ada lagi yang harus menghitung giliran.',
  },
  6: {
    carrier: 'Disimpan dan diteruskan mesin',
    handoff: 'Ditahan di drum sampai saluran ke %s kosong',
    upshot: 'Sekarang mesin yang menunggu, bukan orang, dan mesin tidak pulang saat magrib.',
  },
  7: {
    carrier: 'Paket, beralamat dan disakelar',
    handoff: 'Dicari di tabel: keluar lewat saluran ke %s',
    upshot: 'Tidak ada yang di jalan tahu isinya, dan tidak ada yang perlu ditanya.',
  },
  8: {
    carrier: 'Paket melintasi jaringan yang tersambung',
    handoff: 'Diserahkan ke jaringan berikutnya di %s',
    upshot: 'Urusan yang sama seperti 2030, dan wilayah ini sekarang lebih kecil dari satu detak jantung.',
  },
}
