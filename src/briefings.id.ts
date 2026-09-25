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
  how?: Array<{ what: string; note: string }>
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
  2: {
    primer: {
      problem:
        'Radio membawa suara, dan suara butuh 2 orang yang sama-sama bangun di jam yang sama, sama-sama sadar, sama-sama terlatih. Kawat tidak pernah tidur dan tidak perlu dilatih.',
      things: [
        {
          name: 'Kunci telegraf',
          plain: 'Sebuah sakelar. Ditekan, arus mengalir di tembaganya; dilepas, arusnya berhenti. Di ujung sana arus itu menggerakkan elektromagnet, dan magnetnya berbunyi klik mengikuti jarimu. Cuma itu seluruh mesinnya — sakelar di sini, klik di sana, dan kawat di antaranya.',
        },
        {
          name: 'Kode Morse',
          plain: 'Kawatnya cuma bisa nyala atau mati, jadi sebuah huruf harus dieja dengan nyala pendek dan nyala panjang. Ini persis yang bisa disampaikan api isyarat di Era 0 — satu bit — dengan satu perbedaan yang mengubah segalanya: kamu bisa mengirim ratusan bit per menit, jadi satu bit berubah menjadi kalimat apa pun yang kamu mau.',
        },
        {
          name: 'Relai setiap 30 kilometer',
          plain: 'Setelah kira-kira 30 kilometer, arus yang sampai terlalu lemah untuk menggerakkan magnet. Jadi dipasang magnet yang cukup lemah untuk digerakkan olehnya, dan magnet itu menutup sakelar pada aki yang masih penuh. Pesannya berangkat lagi dari tiap relai sekuat waktu dia mulai. Inilah alasan jarak berhenti jadi masalah.',
          catch: 'Setiap relai adalah gubuk berisi aki yang harus didatangi orang dengan berjalan kaki.',
        },
        {
          name: 'Tiang, dan apa yang tergantung di atasnya',
          plain: '400 kilometer kawat berarti 400 kilometer tembaga yang tergantung setinggi kepala melintasi tanah terbuka.',
          catch: 'Tembaga sekarang adalah uang. Jalur telegraf adalah bank yang ditebar tipis ke seluruh wilayah tanpa pintu, dan 1 orang warden tidak bisa menjaganya. Jalur itu hanya aman kalau orang-orang yang dilewatinya ingin dia tetap berdiri.',
        },
      ],
      upshot:
        'Per kata, telegraf lebih lambat daripada bicara. Per pesan, jauh lebih murah: tidak ada operator yang harus menunggu di jam yang disepakati, tidak ada bahan bakar, tidak ada suara. Dia jalan semalaman untuk siapa pun yang tidak ada — dan justru itulah yang harus dilakukan sebuah jaringan.',
    },
    objective:
      'Bentangkan 400 kilometer telegraf melintasi wilayah Jakarta, dan pertahankan tetap berdiri sementara orang menebanginya.',
    win: 'Jalur dari New Batavia ke Bekasi masih berdiri setelah satu musim, dengan setiap kampung yang dilewatinya menyusuri bagiannya sendiri.',
    pressure:
      'Pencurian. Jalur sepanjang itu tidak bisa dijaga — yang bisa dilakukan cuma membuatnya lebih berharga bagi orang di sekitarnya dalam keadaan berdiri daripada dalam keadaan tergulung di gerobak.',
  },
  3: {
    primer: {
      problem:
        'Telegraf jalan dan hampir tidak ada yang bisa memakainya: dia butuh operator terlatih di kedua ujung. Telepon membawa suaranya sendiri, jadi siapa pun bisa memakainya — tapi 2 orang yang mau bicara butuh kawat di antara mereka, dan di situlah semuanya rontok.',
      things: [
        {
          name: 'Telepon',
          plain: 'Mikrofon mengubah tekanan suaramu jadi arus yang bergoyang mengikuti bentuk yang sama; corong di ujung sana mengubahnya balik jadi tekanan. Tanpa kode, tanpa pelatihan. Ini mesin pertama dalam seluruh cerita ini yang bisa dipakai orang tanpa diajari.',
        },
        {
          name: 'Kenapa tidak bisa asal tarik kawat',
          plain: 'Kalau setiap pasang orang diberi kawatnya sendiri, jumlahnya tumbuh secara kuadrat. 9 kampung berarti 36 kawat. 100 kampung berarti 4.950. Tembaga sebanyak itu tidak pernah ada di dunia ini.',
        },
        {
          name: 'Sentral',
          plain: 'Jadi tarik 1 kawat dari setiap pelanggan ke 1 ruangan, dan di ruangan itu seorang operator menyambungkan 2 di antaranya dengan kabel jumper selama percakapannya berlangsung. 100 pelanggan sekarang butuh 100 kawat, bukan 4.950. Penyambunganlah penemuan sebenarnya, bukan kawatnya — dan setiap jaringan yang dibangun sesudah ini adalah perdebatan tentang cara menyambung.',
        },
        {
          name: 'Orang yang di tengah',
          plain: 'Harus ada orang yang duduk di papan itu dan menancapkan kabelnya.',
          catch: 'Dia mendengar satu detik pertama dari setiap panggilan di wilayah ini. Dia tahu siapa yang sakit, siapa yang suaminya tidak pulang, dan berapa harga beras di Bekasi sebelum Bekasi sendiri tahu. Tidak ada yang memutuskan dia harus tahu semua itu. Itu datang bersama kabelnya.',
        },
        {
          name: 'Saluran antarsentral',
          plain: 'Satu sentral melayani satu kota. Sambungkan sentral-sentral itu satu sama lain dengan beberapa saluran besar, dan seluruh wilayah bisa saling menghubungi — selama semua orang sepakat kabelnya ditancapkan di ruangan siapa.',
        },
      ],
      upshot:
        'Telegraf memindahkan pesan. Sentral memindahkan percakapan, dan menaruh satu ruangan di tengah segalanya. Sejak titik ini, pertanyaan sulit tentang jaringan berhenti bersifat teknis dan mulai soal siapa yang memiliki bagian tengahnya.',
    },
    objective:
      'Jalankan sentral untuk 9 kampung, dan rundingkan siapa pemilik tiap sentral secepat kamu bisa membangunnya.',
    win: 'Setiap kampung bisa menelepon kampung mana pun, dengan kesepakatan yang masih mereka terima tahun depan.',
    pressure:
      'Kepemilikan. Semua orang bergantung pada sentral itu dan tidak ada yang pernah memilihnya, dan kota yang menampungnya bisa menutupnya.',
  },
  4: {
    primer: {
      problem:
        'Setiap penguat di jaringan ini berjalan dengan tabung hampa, setiap tabung datang dari reruntuhan, dan di reruntuhan sudah tidak tersisa apa-apa. Perjalanan salvage terakhir membakar 3 hari bahan bakar untuk membawa pulang 3 hari suku cadang.',
      things: [
        {
          name: 'Tabung hampa itu apa',
          plain: 'Sebuah kawat di dalam bola kaca yang udaranya dikeluarkan. Panaskan, dan dia menguapkan elektron ke dalam ruang hampa, yang lalu melayang ke pelat di ujung sana. Pasang kisi kawat halus di antaranya, dan tegangan sangat kecil di kisi itu menentukan berapa banyak yang lewat. Sinyal kecil kini mengendalikan arus besar: itulah penguatan, dan itulah alasan sinyal radio yang lemah bisa dibuat keras.',
        },
        {
          name: 'Kuatkan 2 kali dan dia bernyanyi',
          plain: 'Umpankan sedikit keluaran sebuah tabung kembali ke masukannya sendiri, dan dia tidak butuh masukan lagi — dia menghasilkan sinyalnya sendiri, pada frekuensi yang kamu pilih. Itu osilator. Penguat dan osilator berdua adalah setiap radio, setiap pemancar, dan setiap penunjuk waktu dalam cerita ini.',
        },
        {
          name: 'Ruang hampanya yang sulit',
          plain: 'Udara yang tersisa 1 bagian dalam 1.000.000 pun merusak semuanya. Kacanya harus ditiup sampai sepersepuluh milimeter dengan cara yang sama setiap kali, disegel di sekeliling kawat yang memuai sepersis kacanya, dan sebuah getter dibakar di dalamnya untuk menelan gas yang masih tersisa.',
          catch: 'Botol memaafkan kesalahanmu. Ini tidak, dan 14 yang pertama tidak akan sanggup menahan hampanya semalam pun.',
        },
        {
          name: 'Dan di bawah kacanya, kimia',
          plain: 'Kacanya harus dibersihkan dengan asam sulfat. Asamnya harus dibuat dari bahan kimia yang harus dibuat lebih dulu, dari batuan yang harus digali lebih dulu.',
          catch: 'Sudah 18 tahun tidak ada orang di negara ini yang membuat asam sesuai spesifikasi yang benar. Setiap langkah di sini bertumpu pada langkah di bawahnya yang juga belum pernah dikerjakan siapa pun — dan itulah rantai pasok, dilihat dari dasarnya.',
        },
      ],
      upshot:
        'Semua era sebelum ini soal jarak. Era ini soal membuat, bukan mencari, dan ini pertama kalinya proyek ini harus membangun industri di bawah industrinya.',
    },
    objective:
      'Bangun pabrik kaca dan kimia di bawahnya, lalu buat tabung hampa yang lebih awet daripada yang sudah tidak bisa kamu temukan lagi.',
    win: 'Sebuah tabung buatan New Batavia yang bertahan lebih lama daripada tabung salvage, dibuat lagi minggu berikutnya, dan minggu sesudahnya.',
    pressure:
      'Hasil jadi. Hampir semua yang kamu buat salah, dan satu-satunya jalan menuju yang bagus adalah melewati sangat banyak yang jelek.',
  },
  5: {
    primer: {
      problem:
        'Setiap jadwal, setiap tarif, dan setiap antrean di jaringan masih dihitung dengan tangan. 15 sentral berarti 6 jam hitungan tiap malam, dan hasilnya sudah salah waktu pagi. Wilayah ini sudah bisa membuat tabung, dan belum ada yang memakainya sebagai sakelar.',
      things: [
        {
          name: 'Relai sejak dulu memang bahan komputer',
          plain: 'Relai telegraf adalah sakelar yang ditarik sakelar lain, dan sejak 2034 ada satu di tiap 30 kilometer. Pasang 2 berderet, arusnya sampai cuma kalau dua-duanya tertutup: itu "dan". Pasang bersebelahan, arusnya sampai kalau salah satunya tertutup: itu "atau". Pasang satu supaya memutus, bukan menyambung: itu "bukan". Tidak ada ide keempat, dan 200 relai dari rak suku cadang sudah cukup untuk menjumlahkan 2 bilangan.',
          catch: 'Relai menutup karena ada logam yang bergerak, dan logam yang bergerak itu lambat. Penjumlah relai tidak pernah salah, tetapi butuh 16 jam untuk hitungan semalam yang diselesaikan juru tulis dalam 6 jam.',
        },
        {
          name: 'Tabung mengerjakan hal yang sama tanpa bagian yang bergerak',
          plain: 'Kalau didorong cukup keras, tabung berhenti menguatkan dan cuma meneruskan semuanya atau tidak sama sekali. "Dan" yang sama, "atau" yang sama, tanpa logam — dan dia berganti keadaan 1.000.000 kali per detik, bukan 20 kali.',
        },
        {
          name: 'Jangan pernah dimatikan',
          plain: 'Tabung hampir selalu mati tepat saat dipanaskan dari dingin. 3.000 tabung yang dimatikan tiap malam berarti ada satu yang mati tiap 8 menit; 3.000 tabung yang dibiarkan menyala cuma kehilangan beberapa buah seminggu. Jadi pemanasnya menyala terus sepanjang malam, sepanjang hari libur, dan sepanjang musim hujan.',
          catch: 'Mesin yang tidak pernah dimatikan berarti genset yang tidak pernah dimatikan. Era ini dibayar dengan solar, dan pertengkaran soal bahan bakar itu lebih tua daripada mesinnya.',
        },
        {
          name: 'Mesin ini tidak bisa mengingat apa pun',
          plain: 'Tidak ada tempat untuk menyimpan apa yang kita perintahkan. Apa yang diketahui mesin ini ditentukan oleh posisi 300 colokan di 300 lubang. Mengubah pekerjaannya berarti setengah hari mengubah kabel, dan 1 colokan di lubang yang salah menghasilkan jawaban salah tanpa ada apa pun yang memberi tahu.',
          catch: 'Itulah masalah yang menjadi nama era berikutnya.',
        },
      ],
      upshot:
        'Mesin pertama dalam cerita ini yang memutuskan sesuatu tanpa orang. Dia mengerjakan pekerjaan 40 juru tulis, dia terbuat dari kaca, dan tiap pagi dia cuma sepandai kabel yang ditinggalkan orang di dalamnya.',
    },
    objective:
      'Rakit satu mesin dari tabung untuk mengerjakan hitungan yang menopang wilayah ini, lalu jaga 3.000 tabungnya tetap menyala sepanjang musim hujan.',
    win: 'Jadwal malam untuk 15 sentral, dihitung oleh mesin, benar, pada malam saat tidak ada yang mematikannya.',
    pressure:
      'Tabung dan bahan bakar. Ada satu yang mati di sela rak tiap beberapa jam, dan gensetnya tetap membakar solar baik saat mesin bekerja maupun saat menunggu.',
  },
  6: {
    primer: {
      problem:
        'Ruang hitung bisa memutuskan apa pun yang bisa kita rangkai ke dalamnya, dan melupakan semuanya begitu colokannya diubah. Mesin yang menahan pesan lalu mengarahkannya sendiri harus bisa mengingat — dan tidak ada satu pun buatan siapa pun yang mengingat apa-apa setelah listriknya mati.',
      things: [
        {
          name: 'Prosesor di dalam laci',
          plain: 'Satu komputer utuh dalam satu chip: penjumlah, register, dan seluruh logika untuk menjalankan program, semuanya, hasil pemulungan dan masih sempurna setelah 30 tahun. Sendirian dia tidak melakukan apa-apa — dia tidak bisa menahan satu angka pun begitu listriknya berkedip, tidak punya program untuk dijalankan, dan tidak punya cara untuk berhadapan dengan orang.',
        },
        {
          name: 'Memori inti',
          plain: 'Cincin ferit sebesar butir beras, ditusuk 3 kawat halus. Alirkan arus di kawatnya dan cincin itu termagnet ke satu arah; alirkan ke arah sebaliknya dan dia berbalik. Satu arah berarti 0, arah lain berarti 1. Cabut listriknya dan dia tetap persis seperti kamu tinggalkan, dalam gelap, sampai kapan pun. 4.096 bit menghabiskan 11 perempuan selama 4 bulan, dan tidak ada mesin yang bisa melakukannya — membuat mesin itu lebih sulit daripada memorinya sendiri.',
        },
        {
          name: 'Membacanya menghapusnya',
          plain: 'Satu-satunya cara mengetahui sebuah inti termagnet ke arah mana adalah mencoba membalikkannya dan melihat apakah dia menolak.',
          catch: 'Artinya setiap pembacaan merusak apa yang dibaca, dan mesinnya harus langsung menuliskannya kembali. Separuh kabelnya ada hanya untuk membereskan kerusakan akibat melihat.',
        },
        {
          name: 'Kartu berlubang',
          plain: 'Programnya masuk sebagai lubang di kertas kaku: berlubang berarti 1, tidak berlubang berarti 0. Kerja sehari muat di 2 tangan, salah ketik dibetulkan pakai pensil, dan kartunya bisa dikirim ke Bandung lalu dibaca lagi 40 tahun kemudian.',
        },
        {
          name: 'Rancangan yang bisa dibangun ulang',
          plain: 'Alih-alih menciptakan mesinnya, mereka meniru satu mesin yang dicetak dunia lama secara lengkap di majalah — setiap skema, diterbitkan dengan sengaja supaya bengkel mana pun bisa membuatnya ulang. Sebuah microcomputer: prosesor pulungan itu, memori rajutan tangan, satu papan tombol, dan satu layar. Taruh satu di tiap persimpangan dan dia menerima pesan, menahannya, mencari tujuannya, dan meneruskannya tanpa ada orang di ruangan itu.',
        },
      ],
      upshot:
        'Memori adalah yang mengubah chip telanjang menjadi mesin yang bisa memutuskan, dan rancangan yang diterbitkan adalah yang membuat bengkel kedua bisa membangun mesin yang sama. Dia juga mesin pertama dalam cerita ini yang hidup lebih lama daripada orang yang menyalakannya.',
    },
    objective:
      'Tusuk memori inti, bangun satu komputer utuh mengelilingi chip dari laci menurut rancangan yang diterbitkan, dan didik generasi yang lahir setelah perang.',
    win: 'Sebuah mesin yang menerima pesan pada satu jam dan meneruskannya pada jam lain, dengan benar, tanpa ada orang di ruangan itu — dan mesin kedua yang dibangun dari halaman cetak yang sama.',
    pressure:
      'Waktu, dan orang-orang yang kehabisan waktu. Yang masih ingat dunia lama adalah orang-orang yang masih harus ditanyai.',
  },
  7: {
    primer: {
      problem:
        'Salurannya sudah bertahun-tahun berhenti berupa kawat antara 2 kota. Yang jalan sekarang adalah jaringan paket — dan setiap router di dalamnya berjalan dengan chip yang ditemukan orang di dalam laci, yang jumlahnya 311, lalu 40, lalu 9.',
      things: [
        {
          name: 'Modem',
          plain: 'Jaringan telepon sudah menjangkau ke mana-mana dan dia cuma membawa bunyi. Jadi ubah bitnya jadi bunyi yang mau dia bawa — satu nada untuk 1, nada lain untuk 0 — lalu ubah balik di ujung sana. Tidak ada satu pun bagian jaringan teleponnya yang harus diubah, dan cuma itu alasan ini pernah terjangkau.',
        },
        {
          name: 'Paket',
          plain: 'Potong pesannya jadi kepingan kecil dan tulis alamat tujuan di setiap keping. Kepingan dari belasan percakapan berbeda lalu berbagi kawat yang sama, berselang-seling, dan tidak ada yang perlu memesan salurannya selama satu panggilan penuh. Kawat yang dulu membawa 1 percakapan sekarang membawa semuanya.',
        },
        {
          name: 'Checksum',
          plain: 'Sebagian keping sampai dalam keadaan rusak. Setiap keping membawa penjumlahan kecil atas isinya sendiri, jadi ujung sana bisa memeriksanya dan tinggal minta dikirim ulang yang gagal.',
          catch: 'Minta ulang lebih murah daripada kawat yang sempurna. Setiap jaringan sesudahnya dibangun di atas kebolehan untuk sesekali salah.',
        },
        {
          name: 'Router',
          plain: 'Di setiap persimpangan, sebuah komputer kecil yang membaca alamat di sebuah paket dan memutuskan dia keluar lewat saluran yang mana. Itu mesin Era 5, satu di tiap perempatan, dan itulah bagian yang berjalan dengan chip dari laci.',
        },
        {
          name: 'Chip tidak membusuk',
          plain: '30 tahun di dalam laci dan chipnya sendiri masih sempurna — keramik dan plastik lebih awet daripada hampir semua buatan manusia.',
          catch: 'Semua yang mengelilinginya mati. Kapasitornya mengering, akinya bocor, cakramnya macet. Dan memori tanpa listrik tidak menyimpan apa-apa, jadi papannya kembali dalam keadaan utuh dan kosong: 40 tahun hasil berpikir orang lain, dan yang selamat cuma mesinnya.',
        },
      ],
      upshot:
        'Paket membuat jaringan yang selamat dari kesalahannya sendiri. Chipnya membuat jaringan yang tidak selamat dari pasokannya sendiri. Era ini adalah 2 kenyataan itu yang saling tarik ke arah berlawanan.',
    },
    objective:
      'Regangkan sisa chip salvage terakhir ke 15 provinsi, sementara 9 di antaranya berdebat soal tungku di Cilegon.',
    win: 'Semua provinsi terjangkau, dan kesepakatan membangun tungkunya ditandatangani sebelum lacinya kosong.',
    pressure:
      'Angkanya. Dia turun setiap tahun, dan sehati-hati apa pun tidak membuatnya naik lagi.',
  },
  8: {
    primer: {
      problem:
        'Jaringan yang berjalan dengan rongsokan yang dijatah adalah milik siapa pun yang memegang jatahnya. Satu-satunya jalan keluar adalah membuat chipnya sendiri, dan membuat chip itu bukan bengkel — itu industri kimia yang harus disepakati 9 provinsi selama 10 tahun.',
      things: [
        {
          name: 'Fab itu apa',
          plain: 'Pasir dimurnikan jadi silikon yang lebih murni daripada apa pun buatan manusia, ditumbuhkan jadi satu kristal tunggal, diiris, lalu dicetaki: lapisan demi lapisan pola diletakkan lewat masker dan didorong masuk ke permukaannya dengan dopan yang mengubah cara dia menghantar. Lakukan itu 20 kali dengan penjajaran yang tepat, dan polanya menjadi sebuah rangkaian.',
        },
        {
          name: 'Debu',
          plain: 'Sebutir debu di atas wafer berarti satu rangkaian putus. Ruangannya harus lebih bersih daripada ruang operasi, dan itu terdengar seperti lelucon sampai dia memakan setahun waktumu.',
          catch: '3 chip bagus dari 400. Itu bukan kegagalan keterampilan; begitulah rupa tahun pertama di mana pun hal ini pernah dikerjakan.',
        },
        {
          name: 'Mesin satu bit',
          plain: 'Yang benar-benar bisa mereka buat sangat kecil: 16 instruksi, satu bit setiap kali, disalin dari MC14500B yang sudah mati dengan nomor seri masih tercetak di badannya. Di laci yang sama ada Intel 8051 yang merupakan satu komputer utuh dalam satu chip dan lebih baik menurut ukuran apa pun yang bisa diambil orang.',
          catch: 'Dan tidak ada satu pun isi laci itu yang bisa dibuat lagi besok. Kecepatan tidak pernah jadi intinya.',
        },
        {
          name: 'Protokol',
          plain: 'Jaringan yang dibangun orang-orang yang tidak pernah saling bertemu hanya bisa menyatu kalau mereka sepakat soal bentuk sebuah frame, cara menulis alamat, dan apa yang terjadi kalau 2 di antaranya berselisih. Kesepakatan itu lebih berharga daripada perangkat kerasnya: itulah yang membuat jaringan yang tidak kamu kendalikan bisa menjadi bagian dari jaringanmu.',
        },
        {
          name: 'Menerbitkannya',
          plain: 'Proses tungkunya, format frame-nya, pengalamatannya, dan 23 tahun kegagalan, ditulis dan dibagikan cuma-cuma.',
          catch: 'Dan itu mengakhiri proyeknya. Standar yang dimiliki semua orang adalah standar yang tidak lagi membutuhkanmu — dan memang itulah pekerjaannya sejak awal.',
        },
      ],
      upshot:
        'Busur ceritanya menutup di sini. Era 0 adalah 3 orang berjalan ke sebuah kampung untuk menanyakan apakah masih ada yang hidup. Ini perbuatan yang sama dalam skala satu negara: buat barangnya, lalu bagikan caranya, supaya tidak ada lagi yang harus meminta izin.',
    },
    objective:
      'Jalankan fab-nya sampai berhasil, terbitkan semua yang kamu pelajari, dan serahkan jaringannya kepada orang-orang yang tidak pernah meminta izinmu.',
    win: 'Sebuah chip buatan negara ini, dibuat lagi minggu berikutnya, dan sebuah standar di tangan semua orang yang menginginkannya.',
    pressure:
      'Semuanya sekaligus — kemurnian, kristal, masker, dopan, debu — dan tiap kegagalan menyebut satu persoalan yang harus dipecahkan seluruh wilayah sebelum percobaan berikutnya mungkin dilakukan.',
  },
}
