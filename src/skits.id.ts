/**
 * Era 1's skits, in Indonesian.
 *
 * Text only, keyed by skit id, in the same order as `skits.ts`. The structure —
 * who speaks, and what has to be true before the scene is offered — stays in
 * the English file and is reused, exactly as `era0-skits.id.ts` does.
 *
 * All four of these people founded the project together, so they talk like
 * Jakartans who have known each other for years: `gua`, `lu`, and no ceremony,
 * elder or not. Pakmin is thirty years older than Bayu and still says `lu`; the
 * distance shows up as him clipping Bayu's name, not as a pronoun.
 *
 * The register rules these lines are written to — what a contrast has to name,
 * which particles carry stance, where a verb keeps its object, and which
 * English images have to be replaced rather than translated — are in
 * `language.txt` at the repo root, with the examples they were learned from.
 */

import type { SkitText } from './skits'

export const ID_SKITS: Record<string, SkitText> = {
  'ration-tin': {
    title: 'Kaleng terakhir',
    lines: [
      'Sisa di gudang tinggal kaleng-kaleng yang dulu ga ada yang mau.',
      'Cukup buat berapa lama?',
      '3 hari kalo kita terus kerja. 6 hari kalo kita cuma diem nunggu di sini.',
      'Ya kita kerja lah.',
      'Gua tau. Gua cuma pengen lu yang nyebut angkanya, jangan cuma ngendep di kepala gua.',
      '…3 hari.',
      '3 hari. Nanti gua cariin sesuatu di jalan.',
    ],
  },
  'gambir-before': {
    title: 'Dulu dia kerja di situ',
    lines: [
      'Lu tau ga, gua dulu kerja di gedung itu. Lantai 2, sisi timur, 31 tahun lamanya.',
      'Gambir? Bapak ga pernah cerita.',
      'Ya ga ada yang nanya orang tua dulu kerja di mana. Yang ditanyain cuma pesawatnya nyala apa engga.',
      'Tiap rak di situ satu nama jalan. Kramat, Senen, Kwitang. Gua apal rak mana yang bunyi kliknya aneh.',
      'Terus tembaganya kita cabutin gitu aja.',
      'Ya bagus. Tembaga di menara radio lebih kepake daripada tembaga di tembok yang udah mati.',
      'Tapi rak-raknya tetep gua itungin pas keluar. Udah kebiasaan.',
    ],
  },
  'mel-roads': {
    title: 'Muter lewat jauh',
    lines: [
      'Lu lewat jalan pantai lagi. Itu 12 kilometer lebih jauh.',
      'Iya, 12 kilometer, tapi gua bisa liat bahaya duluan sebelum bahayanya liat gua.',
      'Ya sebaliknya juga bisa.',
      'Emang. Tapi gua sukanya bagian yang gua duluan yang mutusin.',
      'Gua nyupir kontainer dari Tanjung Priok 6 tahun, jadi jalanan ini gua apal. Jalannya sama. Cuma sekarang surat-suratnya lebih dikit.',
      'Terus sekarang ga ada yang nungguin di simpangan sambil bawa pipa besi.',
      'Ga ada. Yang ada cuma jembatan timbang. Gua lebih benci sama jembatan timbang.',
    ],
  },
  'tajuddin-watch': {
    title: 'Yang dia jagain',
    lines: [
      'Lu ketiduran sambil berdiri tuh.',
      'Gua lagi ngawasin jalan.',
      'Ngawasin jalan kok matanya merem.',
      'Yang gua dengerin anjingnya. Mereka tau duluan kalo ada perampok, jauh sebelum kita tau.',
      'Anak gua dulu juga gitu. Bangun sebelum azan, tiap hari, tanpa jam.',
      'Dulu.',
      'Iya. Dia udah meninggal. Makanya sekarang gua yang bangun.',
    ],
  },
  'laid-up': {
    title: 'Lagi ga bisa kerja',
    lines: [
      'Sari kena cedera pas angkutan itu. Catet di sebelah tembaganya.',
      'Ga ada kolomnya buat itu.',
      'Berarti bukunya boong. Lu kan yang bikin.',
      '…Ya udah, gua bikinin kolomnya.',
      'Bagus. Nama dia ditulis juga di situ. Angka mah ga bisa kena cedera.',
    ],
  },
  'why-not-farm': {
    title: 'Kenapa ga bertani aja',
    lines: [
      'Cirebon lagi nanem padi. Padi beneran. Di sana ga ada yang manjat menara radio pas ujan-ujanan.',
      'Di sana juga ga ada yang tau Serang lagi kehabisan air.',
      'Serang kehabisan air?',
      'Nah itu maksud gua. Kita juga ga tau. Kita cuma nebak-nebak, padahal jaraknya cuma 20 kilometer.',
      'Dulu sebelum semua ini, urusan gitu cukup sekali telpon. 8 detik.',
      'Gua bukan nyuruh berhenti kok. Cuma kadang paginya gua pengen kerjaan yang langsung ngasih makan.',
      'Gua juga pengen. Tapi padi ga bisa ngasih tau Serang kapan airnya udah aman.',
      'Ya udah, tanem aja menara radionya, Bay. Nanti itu juga ngasih makan orang. Cuma ga hari ini.',
    ],
  },
  'first-running': {
    title: 'Ada yang jawab',
    lines: [
      'Tekan tombol pancarnya lagi.',
      'Tadi udah dijawab kok, Pak. Sekali tekan doang.',
      'Tekan lagi tombol pancarnya.',
      'Dia pengen denger 2 kali, biar ketauan itu bukan kebetulan.',
      '31 tahun gua kerja di situ. Gua ga pernah percaya sama jalur yang baru sekali jawab.',
      '…Masih dijawab.',
      'Nah, berarti itu jalur beneran. Catet yang bener, sekalian tanggalnya.',
    ],
  },
  'first-operator': {
    title: 'Sekarang ada yang lain yang megang',
    lines: [
      'Dia kelar ngirim satu daftar absen penuh, tanpa nanya gua sama sekali.',
      'Terus itu bikin lu ga enak.',
      'Aneh aja rasanya. Udah lama banget cuma gua yang bisa ngelakuin itu.',
      'Dari dulu tujuannya emang bukan itu.',
      'Gua tau. Tapi gua emang seneng jadi orang yang dibutuhin.',
      'Ya udah, sekarang biasain jadi salah satu, bukan satu-satunya.',
    ],
  },
  'act-one': {
    title: '100 kilometer',
    lines: [
      '7 hari berturut-turut. Serang nyaut tiap senja, dan rasanya ya — udah ada aja gitu.',
      '100 kilometer. Itu baru namanya jalur.',
      'Ini cuma satu jalur. Jaringan yang dulu punya jutaan.',
      'Jaringan yang dulu juga ga ada yang berdiri di luarnya sambil bawa tombak.',
      'Terima aja menangnya, Bayu. Omongin keras-keras biar yang lain denger.',
      '…Kita udah nyambungin Serang lagi.',
      'Kurang keras.',
      'Kita udah nyambungin Serang lagi.',
      'Sekarang giliran Bandung. Kerjain sebelum encok gua kambuh.',
    ],
  },
}
