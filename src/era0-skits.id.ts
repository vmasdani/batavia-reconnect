/**
 * Era 0's skits, in Indonesian.
 *
 * Text only, keyed by skit id, in the same order as `era0-skits.ts`. The
 * structure — who speaks, and what has to be true before the scene is offered
 * — stays in the English file and is reused, exactly as `story.id.ts` does.
 *
 * All three of these people founded the project together, so they talk like
 * Jakartans who have known each other for years: `gua`, `lu`, and no ceremony.
 *
 * The register rules these lines are written to are in `language.txt` at the
 * repo root, because English survives a word-for-word translation and
 * Indonesian does not.
 */

import type { SkitText } from './skits'

export const ID_SURVEY_SKITS: Record<string, SkitText> = {
  'first-gate': {
    title: 'Gerbang pertama',
    lines: [
      'Mereka udah ngeliatin kita dari jauh, kira-kira 1 kilometer. Diem semua, ga ada yang gerak.',
      'Mereka takut ya?',
      'Engga. Mereka lagi mikir, mau ngelewatin kita apa engga. Beda sama takut. Lama-lama lu bisa bedain kok.',
      'Terus yang bikin mereka mau ngelewatin apa?',
      'Lu nunjukin buku catetan, tangan gua kosong dua-duanya. Udah, segitu doang.',
      'Ya udah, gua keluarin terus deh buku catetannya.',
      'Keluarin di tiap gerbang. Terus jalannya pelanin, sampe lu sendiri ngerasa kelewat pelan.',
      'Ngomong-ngomong, dari tadi gua perhatiin lu kayak ga tenang. Lagi mikirin apa sih?',
      'Gerbang yang udah kita lewatin. Cuma itu yang ga keliatan dari sini, jadi gua ga tau ada yang ngeliatin kita apa engga.',
    ],
  },
  'eight-seconds': {
    title: '8 detik',
    lines: [
      'Sebelum perang, gua nelpon ibu gua di Bandung tiap Minggu. Nyambungnya 8 detik. Lama-lama 8 detik itu udah ga kerasa lagi.',
      'Yang ga bisa gua maafin itu bukan perangnya. Tapi gua-nya, yang udah ga ngerasa apa-apa lagi.',
      'Gua juga gitu. Jembatan timbang, gua juga ga pernah merhatiin.',
      'Selama barangnya masih jalan, emang ga ada yang merhatiin. Giliran udah ilang, baru deh lu merhatiin seumur idup.',
    ],
  },
  'asked-the-price': {
    title: 'Gratis itu harga',
    lines: [
      'Mereka nanya ini bayarnya berapa. Gua bilang ga usah bayar. Eh mereka nanya lagi.',
      'Ya emang ga usah bayar kok.',
      'Bayu. Orang yang ngomong "gratis" itu biasanya ujung-ujungnya minta yang lebih gede.',
      'Bener kata Mel. Kata itu udah pernah mereka denger, dan ujung-ujungnya selalu ada maunya.',
      'Terus gua harus ngomong apa dong?',
      'Kasih harga aja. Bilang satu karung beras per musim, terus biarin mereka nawar sampe separo.',
      'Nah, abis itu kesepakatannya jadi punya mereka. Mereka yang megang.',
      '…Itungannya emang jadi lebih jelek. Tapi mereka jadi lebih percaya sih.',
    ],
  },
  'first-fire': {
    title: 'Satu bit',
    lines: [
      'Kayunya udah disusun. Kering, ketutup, terus ada orangnya yang ngerti buat jagain di sebelahnya.',
      'Tapi itu cuma bisa ngomong satu hal.',
      'Ngomong 2 hal dia. Nyala, atau ga nyala.',
      'Satu bit.',
      'Terserah lu mau nyebutnya apa. Yang jelas nyampe 20 kilometer sebelum lu sempet berdiri.',
      'Dunia yang dulu udah pernah punya beginian — namanya semafor. Lengan-lengan gede di puncak bukit, sekali kirim bisa satu kalimat penuh. Asal garis pandangnya ga keputus, terus ada orang yang melek di tiap posnya.',
      'Orang kita cuma 3. Ya sanggupnya cuma satu bit.',
      'Tapi itu juga ngasih tau semua orang di punggungan bukit kalo kita ada di sini.',
      'Iya. Itu yang dari tadi gua pikirin. Tapi gua tetep bilang nyalain aja.',
    ],
  },
  'the-eggs': {
    title: 'Telurnya',
    lines: [
      'Bayu nyatet berapa butir telur yang kita beli dari ibu-ibu di Depok. Jumlahnya. Harganya. Warna ayamnya.',
      'Berapa butir emangnya?',
      'Gua ga nanya. Takut dia beneran nunjukin catetannya.',
      'Lu pernah kerja bareng orang yang nyatet kayak gitu?',
      'Satu. Satu-satunya truk yang manifestnya ga pernah ilang. Semua orang benci sama dia, sampe ada audit.',
      'Terus abis audit gimana?',
      'Ada rute yang dikasih nama dia. Diem-diem, biar dia ga nyatet itu juga.',
    ],
  },
  'letter-waiting': {
    title: 'Udah bukan urusan kita',
    lines: [
      'Suratnya udah dibawa kurir Kemayoran tadi pagi.',
      'Kira-kira berapa lama sampenya?',
      'Tergantung gerbang-gerbang antara sini sama sana. Ga ada satu pun yang punya kita, jadi ga ada yang bisa kita tanyain.',
      'Duh, gua paling ga suka yang ga nentu kayak gini nih. Ga ada yang tau kalo suratnya bakal beneran sampe.',
      'Gua ngerti. Waktu perang, gua nganterin gaji sopir ke istrinya selama 8 bulan. Orangnya ga pernah balik. Istrinya ga pernah sekali pun nyuruh gua berhenti nganterin.',
      'Lama-lama lu belajar jadi yang nganterin doang, bukan yang dianterin. Itu jauh lebih gampang.',
      'Bagian ini kan lu yang bikin. Ya emang begini jadinya.',
      'Ini pertama kalinya kita ngirim sesuatu yang bukan orang. Sekarang mah udah ga bisa diapa-apain lagi.',
      '…Iya. Udah kejadian, mau gimana lagi.',
    ],
  },
  'two-fires': {
    title: 'Yang diceritain api',
    lines: [
      '2 api udah nyala. Sekarang semua orang di 2 punggungan itu tau kita tidur di mana.',
      'Lu mau matiin apinya ya.',
      'Engga. Gua cuma mau lu tau kita barusan ngapain. Udah 2 kali gua kena rampok pas lagi tidur, gara-gara ga nyangka. Sekarang engga lagi.',
      'Berarti mulai malem ini kita tidur gantian.',
      'Emang dari dulu kita bakal tidur gantian. Bedanya, sekarang ini pilihan kita sendiri.',
    ],
  },
}
