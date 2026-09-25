/**
 * Era 2's skits, in Indonesian.
 *
 * Text only, keyed by skit id, in the same order as `era2-skits.ts`. The
 * structure — who speaks, and the cast strip — stays in the English file and is
 * reused, exactly as the other two eras' translations do.
 *
 * Two registers share these scenes. Iwan and Sari joined the crew here and are
 * not founders, so they speak the later crew's Indonesian: `saya`, the founders
 * by title (`Pak`), ordinary polite speech with no slang. The founders keep
 * `gua` and `lu` with each other, elder or not. The one asymmetry the whole
 * script holds to is Bayu to Pak Min — `saya` and `Bapak`, never `lu` — and the
 * "whole-book" skit is where Era 2 shows it.
 *
 * The register rules — what a contrast has to name, which particles carry
 * stance, where a verb keeps its object, which English images get replaced — are
 * in `language.txt` at the repo root, with the examples they were learned from.
 */

import type { SkitText } from './skits'

export const ID_ERA2_SKITS: Record<string, SkitText> = {
  'iwan-engines': {
    title: 'Ada yang bisa dibenerin',
    lines: [
      '11 tahun, mesin yang mati itu jadi urusan saya seharian penuh. Didengerin, dicium baunya, dicari satu baut yang salah. Kawat ini tidak ngapa-ngapain. Dia cuma berdiri di situ, benar terus.',
      'Lu kangen sama rusaknya.',
      'Saya kangen dibutuhin jam 3 pagi. Genset itu tidak kenal jam kerja.',
      'Gua dulu bawa kontainer. Truk mah ngasih tau kalo dia sekarat — bunyinya berisik duluan.',
      'Kawat ini tidak bakal berisik. Satu pagi dia tinggal hilang, dipotong rapi.',
      'Berarti dia lebih mirip muatan daripada mesin. Muatan juga ga ngasih aba-aba. Lu itung, terus satu hari itungannya kurang.',
      '…Saya lebih milih mesin. Setidaknya mesinnya masih berusaha.',
    ],
  },
  'from-up-there': {
    title: 'Dari atas sana',
    lines: [
      'Dari pucuk tiang, kelihatan 3 punggung bukit, Pak. Kalo paginya cerah, 4.',
      'Ada apa di atas sana?',
      'Bekas kebakaran lama. Dulu ada yang nyalain api tanda bahaya di punggung-punggung bukit itu, bertahun-tahun lalu. Lingkaran hitamnya masih ada.',
      'Itu kita. Sebelum zaman kamu. Satu api artinya ada perampok di jalan, terus kita tidur gantian.',
      'Satu api, satu pesan. Sekarang saya masang kawat yang bisa bawa satu kalimat penuh, dan cuma saya yang masih ngeliat lingkaran-lingkaran itu.',
      'Kamu ga bakal jadi yang terakhir. Separuh anak di Kampung Sawah pengen manjat ngikutin kamu.',
      'Kalo gitu saya bakal ngajarin mereka kalo lingkaran-lingkaran itu layak diliat sebentar pas lagi naik.',
    ],
  },
  'what-the-room-was': {
    title: 'Ruangan itu',
    lines: [
      'Di sini semua pada ngomongin 2027 kayak seluruh negara ada di dalam ruangan itu. Waktu itu umur saya 14. Saya masih inget lampunya padam, terus ayah saya tidak tahu kenapa.',
      'Ga ada yang tau kenapa. Nah itu senjatanya. Kawat yang bisa dipotong, lu bisa liat siapa yang motong. Tahun itu ga ada yang bisa diliat sama sekali.',
      'Terus Bapak ngapain?',
      'Gua jaga semaleman gardu listrik yang udah mati seminggu. Jagain barang yang emang ga bakal nyala lagi. Tapi itu bikin gua ngerasa kepake.',
      'Terus sekarang Bapak jagain tembaga yang beneran diincer orang.',
      'Sekarang gua jaga barang yang layak dicuri. Lu ga kebayang itu jauh lebih enak. Perampok itu setidaknya sepaham sama lu soal apa yang berharga.',
      '…Saya tidak pernah kepikiran perampok bisa sepaham sama saya.',
    ],
  },
  'whole-book': {
    title: 'Seluruh bukunya',
    lines: [
      'Lu kasih tiap kampung satu buku kode. Satu angka buat beras, satu angka buat tepung. Lu tau kita udah pernah bikin gitu, dulu?',
      'Sebelum perang, Pak?',
      'Di sentral telepon. Tiap penelepon langganan punya kode 3 angka. Lu ga minta pasar ikan Muara Angke. Lu minta 118, dan 118 itu orang namanya Slamet yang baunya selalu kayak es.',
      'Berarti bukunya bukan saya yang nemuin dari nol.',
      'Ga ada yang lu bikin itu baru, Bay. Cuma lebih murah. Dulu gua simpen 400 kode di buku besar, 200 lagi di kepala.',
      'Terus pas Bapak berhenti?',
      'Buku besarnya gua kasih ke orang berikutnya. Yang 200 di kepala, ga ada yang nanya. Catet semua buku lu, jangan ada yang ketinggalan. Jangan jadi orang terakhir yang masih tau arti 118.',
    ],
  },
  'child-keys': {
    title: 'Dalam sebulan',
    lines: [
      'Ada anak perempuan di Cikampek, kira-kira umur 9. Dia ngetok kunci lebih cepet dari pamannya, terus dia benerin pamannya kenceng-kenceng.',
      'Padahal pamannya yang kita latih.',
      'Iya. Dia nanya ke saya, pelan sekali, apa kita bisa latih dia aja, terus pamannya dibiarin balik manggul tiang.',
      'Anak umur 9 tahun bisa megang satu jam kampung?',
      'Dia sudah megang, kok. Pamannya cuma berdiri di belakang biar keliatan pantes.',
      'Dalam sebulan dia belajar hal yang buat saya sendiri butuh sebulan cuma buat percaya itu mungkin.',
      'Kasih dia 5 tahun. Dia tidak bakal inget zaman waktu kawat itu belum jadi miliknya.',
    ],
  },
  'worth-lifting': {
    title: 'Layak diangkut',
    lines: [
      'Gua nemuin orang yang ngambil bentangan Serang. Bukan nangkep. Nemuin. Dia lagi 6 kilometer jauhnya, sendirian, ngegulungin kawatnya ke gerobak.',
      'Terus lu ngapain?',
      'Gua tanya dia sekarang tembaga sekilo berapa. Katanya cukup buat ngasih makan satu rumah semusim. Terus dia nanya gua mau mukul dia apa engga.',
      'Lu mukul?',
      'Pas perang gua ngangkut muatan ngelewatin orang yang lebih kurus dari dia, ga kedip sama sekali. Emang gitu kerjaannya. Ini bukan perang, dan gua udah capek sama kerjaan itu.',
      'Jadi lu lepasin dia.',
      'Gua biarin dia nyimpen 20 meter, sisanya dia balikin sendiri. Satu rumah kan mesti makan, terus jalurnya tetep berdiri. Jangan bilang Bayu gua ngitung-ngitung di tempat gelap.',
    ],
  },
  'named-section': {
    title: 'Ruas Haji Umar',
    lines: [
      'Kampung Sawah ngasih nama di 2 kilometer bagian mereka. Dicat di tiang pertama. Ruas Haji Umar.',
      'Haji Umar itu siapa?',
      'Orang yang udah meninggal sebelum kita nyampe sini. Orang mereka. Mereka ga nanya dulu ke kita boleh apa engga naro nama di kawat kita.',
      'Itu bukan kawat kita lagi. Emang itu intinya dari awal.',
      'Gua tau. Gua 30 tahun ngamanin barang dengan cara megangin erat-erat. Masih suka bikin gua kaget — barang itu paling aman justru pas lu udah ga bisa nyebut itu punya lu.',
      'Lu kedengeran hampir seneng.',
      'Jangan kelewatan. Tanya gua lagi abis musim ujan, pas sambungan mereka kuat apa engga.',
    ],
  },
}
