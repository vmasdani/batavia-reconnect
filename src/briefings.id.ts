/**
 * The briefings, in Indonesian.
 *
 * Text only, keyed by era, in the same order as `briefings.ts`. Which eras have
 * one and how many points each carries stays in the English file and is reused,
 * the same rule `story.id.ts` follows.
 *
 * This is the game explaining its own rules, not a person talking, so it stays
 * in written Indonesian — the register rules about `gua` and `lu` do not apply
 * here any more than they do to the glossary.
 */

export interface BriefingText {
  primer: {
    problem: string
    things: Array<{ name: string; plain: string; catch?: string }>
    upshot: string
  }
  objective: string
  win: string
  pressure: string
  how: Array<{ what: string; note: string }>
}

export const ID_BRIEFINGS: Record<number, BriefingText> = {
  0: {
    primer: {
      problem:
        'Tidak ada telepon dan tidak ada radio. Kalau kamu mau menyampaikan sesuatu ke Bogor, harus ada orang yang berjalan ke Bogor dan mengatakannya langsung.',
      things: [
        {
          name: 'Kurir',
          plain: 'Ada orang yang membawa pesannya ke sana dengan berjalan kaki. Bogor 2 hari perjalanan, jadi bertanya ke Bogor lalu mendapat jawabannya makan 4 hari — 2 hari pergi, 2 hari pulang. Pada tahun 2030, cuma itu seluruh jaringannya.',
        },
        {
          name: 'Papan pengumuman',
          plain: 'Sebuah papan yang dipaku di gerbang kampung: kotak pos di pinggir jalan. Tanpa papan, kurir yang sampai di sana harus menunggu sampai ada orang lewat yang kebetulan searah, dan itu memakan sekitar 2 hari cuma untuk menunggu. Dengan papan, dia tinggal menempelkan pesannya lalu pulang, dan siapa pun yang lewat berikutnya meneruskannya. Pesannya tetap bergerak walaupun tidak ada yang membawanya.',
          catch: 'Papan cuma berguna di jalan yang memang dilewati orang. Papan di jalur yang tidak pernah dipakai adalah papan yang tidak pernah dibaca.',
        },
        {
          name: 'Api isyarat',
          plain: 'Tumpukan kayu kering di bukit di atas sebuah kampung, dengan satu orang yang mengerti untuk duduk menungguinya. Nyalakan, dan semua kampung yang bisa melihat bukit itu langsung tahu — seketika, secepat cahaya, bukan 2 hari.',
          catch: 'Api cuma bisa mengatakan satu hal: nyala, atau tidak nyala. Bukan apanya, bukan siapanya, bukan berapanya. Dan api hanya berguna antara 2 bukit yang benar-benar bisa saling melihat — sebagian besar wilayah ini datar, jadi sebagian besar bukitnya tidak melihat apa-apa, dan api di bukit seperti itu berarti 3 hari terbuang.',
        },
      ],
      upshot:
        'Jadi era ini adalah soal pertukaran. Kaki itu lambat tapi bisa menyampaikan apa saja. Api itu seketika tapi hampir tidak bisa menyampaikan apa-apa. Papan adalah yang membuat pesan tidak berhenti di tengah jalan. Gabungkan ketiganya, dan pertanyaan yang diajukan pagi ini bisa terjawab besok, bukan minggu depan.',
    },
    objective:
      'Jalan kaki ke setiap kampung di wilayah ini, cari tahu siapa yang masih hidup, dan ubah cukup banyak dari mereka menjadi orang yang mau menjawabmu.',
    win: 'Pertahankan 8 kampung tetap terhubung selama 7 hari berturut-turut, lalu kirim surat ke Tangerang yang jawabannya benar-benar kembali.',
    pressure:
      'Perbekalan. Tidak ada yang mati karena gudang kosong, tapi gudang kosong berarti satu hari penuh dipakai mencari makan — dan hari itu tidak dipakai berjalan.',
    how: [
      {
        what: 'Satu giliran adalah satu hari',
        note: 'Klik sebuah kampung, lalu kirim seseorang ke sana. Setiap perintah memakan hari, dan tidak ada yang bergerak sampai kamu mengakhiri harinya.',
      },
      {
        what: 'Datangi dulu, baru bicara',
        note: 'Berjalan ke sana hanya menemukan tempatnya. Perundingan yang membuat mereka mau, dan perundingan bisa gagal. Kampung yang sempat menanyakan harganya butuh sehari lebih lama dan lebih sulit percaya.',
      },
      {
        what: 'Papan pengumuman',
        note: '2 hari dan 4 perbekalan. Tanpa papan, sebuah pesan menunggu 2 hari di gerbang itu sampai ada pelari berikutnya yang searah.',
      },
      {
        what: 'Api isyarat',
        note: '3 hari dan 6 perbekalan, dan hanya berguna kalau dataran tingginya bisa melihat kampung lain. Di daftar, yang tidak melihat apa-apa ditandai ×.',
      },
      {
        what: 'Perbekalan adalah jamnya',
        note: '3 masuk setiap hari dari kebun. Setiap orang makan 1 di rumah dan 1,5 di jalan, dan setiap kampung yang sudah mau bicara mengirim balik 0,5.',
      },
      {
        what: 'Angka yang menentukan',
        note: 'Berapa hari sebuah pesan sampai ke Tangerang. Semua yang kamu bangun adalah usaha menurunkan angka itu.',
      },
    ],
  },
  1: {
    primer: {
      problem:
        'Masih tidak ada telepon. Tapi ada tembaga di reruntuhan dan satu orang tua yang paham cara kerja pemancar — dan radio bisa mengirim suara sejauh 100 kilometer dalam waktu selama mengucapkannya.',
      things: [
        {
          name: 'Radio itu sebenarnya apa',
          plain: 'Dorong listrik naik-turun di sebuah kawat dengan sangat cepat, dan kawat itu melemparkan gelombang yang tidak terlihat. Kawat lain yang jauh di sana ikut bergetar mengikuti gelombang tadi. Kawat, gelombang, kawat — cuma itu idenya, sisanya soal ketelitian dan kesabaran.',
        },
        {
          name: 'AM',
          plain: 'Cara paling kasar untuk menumpangkan suara: buat gelombangnya menguat dan melemah mengikuti bentuk suaranya. Justru kasar itu intinya. Penerima AM bisa dirakit dari nyaris tidak ada apa-apa, dan nyaris tidak ada apa-apa itulah yang dipunyai kampung-kampung ini.',
        },
        {
          name: 'Menaranya',
          plain: 'Kawatnya harus tinggi. Dekat permukaan tanah, gelombangnya merambat kurang lebih lurus, jadi sejauh apa jangkauannya ditentukan oleh setinggi apa antena di kedua ujungnya. Itu sebabnya setiap lokasi di era ini berupa menara di atas bukit.',
          catch: 'Menara itu juga barang paling berharga dalam radius 40 kilometer, berdiri di tempat terbuka, dengan lampu di puncaknya.',
        },
        {
          name: 'Kenapa malam hari beda',
          plain: 'Setelah gelap, bagian atas atmosfer berubah jadi cermin dan gelombangnya memantul di situ. Stasiun yang siang hari sampai Tangerang saja susah bisa terdengar 4 provinsi jauhnya waktu tengah malam.',
          catch: 'Bukan ada yang berubah dari yang kamu bangun — mataharinya yang berubah. Sambungan yang tadi malam jalan bisa mati waktu sarapan.',
        },
        {
          name: 'Biaya mempertahankannya',
          plain: 'Generator melahap bahan bakar setiap jam perangkatnya menyala, semua yang beroperasi aus sedikit demi sedikit setiap hari, dan harus ada orang di ujung sana pada jam yang disepakati — kalau tidak, tidak ada yang mendengarmu.',
        },
      ],
      upshot:
        'Dibandingkan Era 0, ini pesan dalam hitungan detik, bukan 2 hari. Bedanya, semua ini cuma ada selama mesinnya menyala, dan menjaga mesin tetap menyala itulah seluruh isi era ini.',
    },
    objective:
      'Dirikan menara, generator, dan pemancar di atas New Batavia, lalu pertahankan satu jalur tetap terbuka melintasi wilayah ini sepanjang satu musim hujan.',
    win: '7 hari kontak tanpa putus dengan Serang, lewat relai Tangerang yang sudah diperkuat. Sambungan yang hanya jalan selama tidak ada masalah bukan sambungan.',
    pressure:
      'Keausan, cuaca, dan rayap besi. Semua yang menyala sedang aus, dan semua yang layak dimiliki juga layak dicuri.',
    how: [
      {
        what: 'Satu giliran adalah satu hari',
        note: 'Beri pekerjaan kepada 4 orang kru, lalu jalankan harinya. Kebanyakan pekerjaan makan beberapa hari, dan tiap pekerjaan hanya boleh dipegang kelas tertentu.',
      },
      {
        what: '4 tahap untuk setiap lokasi',
        note: 'Disurvei, dipasang, menyala, diperkuat. Sebuah lokasi belum membawa apa-apa sebelum menyala, dan belum selamat dari apa pun sebelum diperkuat.',
      },
      {
        what: 'Rakit dulu, baru pasang',
        note: 'Menara, pemancar, aki, genset, dan saluran dibuat di meja kerja dari tembaga, baja, sel, dan suku cadang. Semuanya digali dari reruntuhan.',
      },
      {
        what: 'Jangkauan itu soal tinggi, dan jam berapa',
        note: 'Sejauh apa sebuah sambungan menjangkau ditentukan menara di kedua ujungnya. Setelah gelap, sinyalnya memantul di ionosfer dan sampai jauh lebih jauh.',
      },
      {
        what: 'Semuanya aus',
        note: 'Lokasi yang menyala kehilangan 3% per hari, setengahnya kalau sudah diperkuat. Perampokan mengambil yang tidak terjaga. Jagai, perkuat, atau bersihkan sarang asal perampoknya.',
      },
      {
        what: 'Siaran senja',
        note: 'Pilih apa yang disiarkan tiap sore — cuaca, panggilan dagang, pelatihan, atau kabar jalan. Dari sanalah perbekalan, suku cadang, dan operator berikutnya datang.',
      },
    ],
  },
}
