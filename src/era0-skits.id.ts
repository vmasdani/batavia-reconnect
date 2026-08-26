/**
 * Era 0's skits, in Indonesian.
 *
 * Text only, keyed by skit id, in the same order as `era0-skits.ts`. The
 * structure — who speaks, and what has to be true before the scene is offered
 * — stays in the English file and is reused, exactly as `story.id.ts` does.
 *
 * All three of these people founded the project together, so they talk like
 * Jakartans who have known each other for years: `gua`, `lu`, and no ceremony.
 */

export interface SkitText {
  title: string
  lines: string[]
}

export const ID_SURVEY_SKITS: Record<string, SkitText> = {
  'first-gate': {
    title: 'Gerbang pertama',
    lines: [
      'Mereka udah ngeliatin kita dari jarak sekitar 1 kilometer. Ga ada yang gerak.',
      'Mereka takut?',
      'Engga. Mereka lagi mikir. Itu beda, dan lu bakal cepet belajar bedainnya.',
      'Terus apa yang bikin mereka mutusin?',
      'Lu megang buku catetan, tangan gua kosong dua-duanya. Udah, itu doang. Itu seluruh negosiasinya.',
      'Ya udah, buku catetannya gua keluarin terus.',
      'Keluarin di tiap gerbang. Terus jalannya pelanin, lebih pelan dari yang kerasa wajar.',
    ],
  },
  'asked-the-price': {
    title: 'Gratis itu harga',
    lines: [
      'Mereka nanya ini biayanya berapa. Gua bilang ga ada. Mereka nanya lagi.',
      'Emang beneran ga ada.',
      'Bayu. Semua orang yang pernah ngomong "gratis" ke mereka, ujung-ujungnya minta yang lebih gede.',
      'Bener kata dia. "Gratis" itu kata paling mahal yang bisa lu ucapin ke kampung yang udah ngelewatin 2030.',
      'Terus gua harus ngomong apa?',
      'Sebut harga. Bilang satu karung beras per musim, terus biarin mereka nawar sampe separo.',
      'Nah, abis itu kesepakatannya jadi punya mereka. Jadi milik mereka.',
      '…Itu hitungan yang lebih jelek tapi akalnya lebih bener.',
    ],
  },
  'first-fire': {
    title: 'Satu bit',
    lines: [
      'Kayunya udah disusun. Kering, ketutup, sama satu orang yang ngerti buat duduk di sebelahnya.',
      'Dan itu cuma bisa ngomong satu hal.',
      'Dia ngomong 2 hal. Nyala atau ga nyala.',
      'Satu bit.',
      'Terserah lu mau nyebut apa. Yang jelas itu nyampe 20 kilometer sebelum lu selesai make sepatu.',
      'Dunia yang dulu punya versi ini juga — semafor. Lengan-lengan besar di puncak bukit, sekali kirim bisa satu kalimat penuh, asal garis pandangnya ga keputus dan ada orang melek di tiap posnya.',
      'Orang kita 3. Ya dapetnya satu bit.',
      'Tapi itu juga ngasih tau semua orang di punggungan bukit kalo kita ada di sini.',
      'Iya. Itu yang dari tadi gua pikirin. Gua tetep bilang nyalain.',
    ],
  },
  'letter-waiting': {
    title: 'Udah bukan urusan kita',
    lines: [
      'Suratnya udah dibawa pelari Kemayoran tadi pagi.',
      'Berapa lama?',
      'Tergantung semua gerbang antara sini sama sana, dan ga ada satupun yang punya kita.',
      'Gua paling ga suka bagian ini.',
      'Bagian ini kan lu yang bikin. Ya emang begini bentuknya.',
      'Ini barang pertama yang kita kirim yang bukan orang. Apa pun yang balik nanti, kejadiannya udah lewat.',
      '…Iya. Udah lewat.',
    ],
  },
}
