/**
 * The glossary, in Indonesian.
 *
 * Text only, keyed by term id, in the same order as `glossary.ts`. Which terms
 * exist and which era owns them stays in the English file and is reused — the
 * same rule `story.id.ts` follows.
 *
 * This is reference prose, not dialogue, so it stays in written Indonesian.
 * The register rules about `gua` and `lu` are about people talking to each
 * other; nobody is talking here.
 *
 * `aliases` are the words the Indonesian script actually uses, which are often
 * not translations of the English ones — the script says `switchboard` and
 * `tabung`, not `papan hubung` and `katup`.
 */

export interface TermText {
  name: string
  aliases?: string[]
  what: string
  why: string
  real?: string
}

export const ID_TERMS: Record<string, TermText> = {
  // --- Era 0 -----------------------------------------------------------------
  courier: {
    name: 'estafet kurir',
    aliases: ['kurir', 'pelari', 'utusan'],
    what: 'Pesan yang dibawa dengan berjalan kaki, dioper dari satu pembawa ke pembawa berikutnya di tempat yang sudah disepakati.',
    why: 'Ini satu-satunya jaringan yang jalan tanpa listrik, tanpa kabel, dan tanpa rasa percaya. Seluruh isi permainan ini adalah usaha mengalahkan kecepatan orang berjalan kaki.',
    real: 'Angarium Persia, sekitar 500 SM — penunggang kuda ditempatkan sejauh satu hari perjalanan, supaya pesannya tetap bergerak sementara pembawanya istirahat.',
  },
  'notice-board': {
    name: 'papan pengumuman',
    aliases: ['papan', 'papan pengumumannya'],
    what: 'Tempat tetap untuk meninggalkan pesan bagi siapa pun yang lewat berikutnya.',
    why: 'Papan ini mematahkan aturan bahwa kedua pihak harus sama-sama hadir. Pesannya menunggu di papan, bukan di tangan orang — versi paling awal dari gagasan yang tidak pernah ditinggalkan permainan ini: simpan pesannya, teruskan nanti.',
    real: 'Store and forward, prinsip yang dipakai setiap sistem pos dan setiap jaringan paket sejak itu.',
  },
  'signal-fire': {
    name: 'api isyarat',
    aliases: ['api', 'apinya', 'suar'],
    what: 'Api di dataran tinggi, terlihat dari bukit berikutnya. Nyala atau tidak nyala, tidak ada pilihan ketiga.',
    why: 'Satu bit informasi, menyeberangi 40 kilometer dengan kecepatan cahaya. Api itu tidak bisa bilang apa yang salah, cuma bilang ada yang salah — dan pada tahun 2030 itu masih lebih cepat daripada apa pun.',
    real: 'Rantai suar, dipakai sejak zaman kuno sampai perang Napoleon.',
  },
  semaphore: {
    name: 'semafor',
    aliases: ['isyarat bendera', 'telegraf optik'],
    what: 'Lengan, bendera, atau daun jendela dalam posisi yang sudah disepakati, dibaca lewat teropong dari menara berikutnya.',
    why: 'Sistem pertama yang bisa mengirim pesan apa saja, bukan cuma satu tanda bahaya — dan yang pertama membuktikan bahwa biaya sebenarnya bukan menaranya, melainkan orang-orang yang harus duduk di dalamnya.',
    real: 'Claude Chappe, Prancis, 1794 — Paris ke Lille, 230 km, dalam waktu sekitar setengah jam.',
  },
  'line-of-sight': {
    name: 'garis pandang',
    aliases: ['garis pandangnya', 'dataran tinggi'],
    what: 'Apakah 2 titik bisa saling melihat, setelah bukit, lengkung bumi, dan segala yang berdiri di antaranya ikut dihitung.',
    why: 'Ini yang menentukan api isyarat mana yang bisa saling menjawab, dan nanti menara mana yang bisa saling mendengar. Medan adalah satu-satunya batas yang tidak bisa dibantah pemain.',
    real: 'Cakrawala radio, kira-kira sepertujuh lebih jauh daripada cakrawala mata, karena atmosfer membelokkan pancarannya ke bawah.',
  },

  // --- Era 1 -----------------------------------------------------------------
  'am-radio': {
    name: 'radio AM',
    aliases: ['radio', 'AM', 'modulasi amplitudo'],
    what: 'Suara yang dibawa dengan mengubah-ubah kekuatan gelombang radio.',
    why: 'Ini cara termudah mengirim suara yang pernah ditemukan. Penerimanya tidak butuh sumber listrik dan hampir tidak butuh komponen — dan itu sangat berarti kalau orang yang mau dihubungi tidak punya keduanya.',
    real: 'Reginald Fessenden, malam Natal 1906 — siaran suara pertama, didengar kapal-kapal di lepas pantai Massachusetts.',
  },
  transmitter: {
    name: 'pemancar',
    aliases: ['pemancarnya', 'perangkatnya'],
    what: 'Mesin yang membuat gelombang radio dan menumpangkan suara di atasnya.',
    why: 'Separuh yang mahal dari sebuah sambungan radio. Sebuah kampung bisa diberi penerima; pemancar harus dibangun, diberi daya, dan dijaga oleh orang yang mengerti isinya.',
  },
  antenna: {
    name: 'antena',
    aliases: ['menara', 'menaranya', 'antenanya'],
    what: 'Penghantar yang dipotong sepanjang ukuran yang cocok dengan panjang gelombangnya, lalu dipasang setinggi mungkin.',
    why: 'Satu-satunya bagian radio yang tidak bisa diakali. Tinggi berarti jangkauan — itu sebabnya setiap relai dalam permainan ini berdiri di bukit, dan sebabnya menara selalu jadi barang pertama yang dicuri orang.',
  },
  generator: {
    name: 'generator',
    aliases: ['genset', 'dinamo'],
    what: 'Mesin yang memutar kumparan di dalam magnet, lalu menghasilkan listrik.',
    why: 'Tidak ada satu pun barang di era ini yang jalan tanpa generator, dan generator melahap bahan bakar setiap jam ia hidup. Yang benar-benar membatasi berapa lama sebuah stasiun bisa mengudara adalah daya, bukan tembaga.',
  },
  propagation: {
    name: 'perambatan',
    aliases: ['jangkauan', 'gangguan sinyal'],
    what: 'Seberapa jauh gelombang radio benar-benar sampai — yang berubah menurut tanah, cuaca, dan jam berapa saat itu.',
    why: 'AM gelombang menengah merayap di permukaan tanah pada siang hari dan memantul di ionosfer pada malam hari, jadi stasiun yang sama hanya terdengar sekampung waktu siang dan terdengar 4 provinsi jauhnya waktu tengah malam. Sambungan yang kemarin berhasil bisa gagal hari ini tanpa ada yang berbuat salah.',
    real: 'Lapisan Kennelly–Heaviside, diusulkan tahun 1902 dan dibuktikan tahun 1924.',
  },

  // --- Era 2 -----------------------------------------------------------------
  telegraph: {
    name: 'telegraf',
    aliases: ['jalur telegraf', 'tiang telegraf', 'tiang'],
    what: 'Kawat antara 2 tempat, dan baterai yang cukup kuat untuk mendorong arus di sepanjang kawat itu.',
    why: 'Lebih murah per kilometer daripada radio dan jauh lebih sulit diganggu, tapi kawatnya harus benar-benar ada di sepanjang jalan — dan itu menjadikannya barang pertama milik proyek ini yang bisa didatangi orang lalu dipotong.',
    real: 'Cooke dan Wheatstone, 1837; jalur Morse dari Washington ke Baltimore, 1844.',
  },
  'telegraph-key': {
    name: 'kunci telegraf',
    aliases: ['kunci', 'kuncinya'],
    what: 'Tuas berpegas. Ditekan, rangkaiannya tersambung; dilepas, rangkaiannya putus.',
    why: 'Cuma ini seluruh antarmukanya. Satu bagian bergerak, tanpa elektronik, dan siapa pun bisa diajari memakainya dalam seminggu — persis itulah sebabnya sebuah kampung bisa dititipi satu lalu ditinggal jalan sendiri.',
  },
  'morse-code': {
    name: 'kode Morse',
    aliases: ['Morse', 'titik dan garis'],
    what: 'Huruf yang ditulis sebagai denyut pendek dan panjang, dengan huruf yang paling sering muncul diberi kode paling pendek.',
    why: 'Kode ini mengubah kawat yang cuma bisa hidup atau mati menjadi sesuatu yang sanggup membawa kalimat apa pun. Ini kali pertama proyek ini menyandikan bahasa ke dalam 2 keadaan — dan diulang lagi di Era 5, lalu sekali lagi di Era 6.',
    real: 'Alfred Vail dan Samuel Morse, 1838. Huruf E cuma satu titik karena E huruf paling sering dalam bahasa Inggris.',
  },
  electromagnet: {
    name: 'elektromagnet',
    aliases: ['koil', 'kumparan', 'magnet listrik'],
    what: 'Kawat yang dililitkan pada besi. Ada arus, besinya jadi magnet; tidak ada arus, tidak ada magnet.',
    why: 'Semua isi era ini adalah benda yang sama dengan bentuk berbeda: pengetuk yang berbunyi, relai yang meneruskan, bel yang berdering. Paham sekali di sini, dan sentral di Era 3 berhenti terasa ajaib.',
  },
  'relay-station': {
    name: 'relai',
    aliases: ['stasiun relai', 'penguat ulang'],
    what: 'Sinyal lemah yang masuk menggerakkan elektromagnet, dan elektromagnet itu menyambung rangkaian baru dengan baterai yang masih penuh di belakangnya.',
    why: 'Inilah yang membuat jarak berhenti jadi masalah: jalur sepanjang apa pun boleh, asal setiap sekian kilometer ada satu benda ini. Diam-diam, ini juga mesin pertama dalam permainan yang mengambil keputusan.',
  },

  // --- Era 3 -----------------------------------------------------------------
  telephone: {
    name: 'telepon',
    aliases: ['telpon', 'panggilan'],
    what: 'Mikrofon dan pengeras di kawat yang sama, supaya 2 orang bisa langsung bicara.',
    why: 'Telepon menyingkirkan operator, dan bersamanya orang terakhir yang harus dilatih sebelum 2 kampung bisa saling bicara. Komunikasi berhenti menjadi pesan dan berubah menjadi percakapan.',
    real: 'Alexander Graham Bell, 1876 — dipatenkan beberapa jam sebelum Elisha Gray mendaftarkan hal yang hampir sama.',
  },
  switchboard: {
    name: 'switchboard',
    aliases: ['papan sambung', 'switchboard-nya'],
    what: 'Panel berisi lubang colokan dan kabel jumper. Operator mendengar siapa yang dituju, lalu menyambungkan 2 jalur dengan tangan.',
    why: 'Inilah yang membuat 100 jalur bisa saling menjangkau tanpa 10.000 kawat. Ini juga menempatkan satu orang di tengah setiap percakapan pribadi di provinsi ini — masalah politik yang menjadi inti seluruh era ini.',
  },
  exchange: {
    name: 'sentral',
    aliases: ['sentralnya', 'kantor sentral'],
    what: 'Bangunan tempat switchboard berada, dan segala hal yang menentukan jalur mana menjangkau jalur mana.',
    why: 'Siapa yang memegang sentral, dia memegang jaringan: antreannya, harganya, urutan siapa diberi tahu lebih dulu. Menyerahkan sentral adalah hal tersulit yang pernah dilakukan proyek ini dengan sengaja.',
  },
  strowger: {
    name: 'sakelar langkah demi langkah',
    aliases: ['Strowger', 'sentral otomatis'],
    what: 'Lengan kontak berputar yang melangkah satu posisi untuk setiap denyut yang dikirim piringan nomor, lalu menyambungkan panggilan tanpa operator.',
    why: 'Mesin pertama yang mengeluarkan manusia dari tengah percakapan — dan penemunya seorang pengurus pemakaman yang yakin operator setempat mengalihkan pelanggannya ke saingannya.',
    real: 'Almon Strowger, 1891. Cerita soal pengurus pemakaman itu benar.',
  },
  standard: {
    name: 'standar',
    aliases: ['standarnya', 'baku'],
    what: 'Aturan tertulis yang diikuti peralatan semua orang, supaya peralatan yang dibuat tanpa koordinasi tetap bisa bekerja bersama.',
    why: 'Ini satu-satunya bentuk kendali yang bertahan setelah perangkat kerasnya diberikan. Proyek ini menyimpan standarnya dan menyerahkan sisanya — dan keputusan yang diambil di sini baru dicairkan di Era 7.',
  },

  // --- Era 4 -----------------------------------------------------------------
  'vacuum-tube': {
    name: 'tabung hampa',
    aliases: ['tabung', 'tabungnya'],
    what: 'Kawat yang dipanaskan melontarkan elektron menyeberangi kaca hampa udara, dan elektrode ketiga di tengahnya mengatur berapa banyak yang boleh lewat.',
    why: 'Komponen pertama yang bisa menguatkan — mengubah sinyal kecil menjadi besar — dan yang pertama bisa menyakelar tanpa ada bagian yang bergerak. Semua penguat, osilator, dan gerbang logika di 2 era berikutnya dibangun dari benda ini.',
    real: 'Audion buatan Lee de Forest, 1906. Dia sendiri tidak sepenuhnya paham kenapa benda itu bekerja.',
  },
  glassblowing: {
    name: 'peniupan kaca',
    aliases: ['kaca', 'kacanya'],
    what: 'Membentuk kaca leleh dengan tiupan dan tangan, dengan ketelitian yang sama setiap kali.',
    why: 'Sebuah tabung adalah persoalan kaca sebelum menjadi persoalan listrik. Di sinilah proyek ini berhenti memulung dan mulai membuat — dan ternyata bagian tersulitnya bukan fisikanya.',
  },
  'sulphuric-acid': {
    name: 'asam sulfat',
    aliases: ['asam', 'asamnya'],
    what: 'Bahan kimia industri yang paling banyak diproduksi di dunia, dan yang dibutuhkan hampir semua bahan lain.',
    why: 'Untuk aki, untuk membersihkan kaca, dan nanti untuk mengetsa silikon. Kemampuan sebuah negeri membuatnya hampir sama dengan ukuran apakah negeri itu punya industri — itu sebabnya di sini tidak ada yang membuatnya sesuai spesifikasi selama 18 tahun.',
    real: 'Proses bilik timbal, 1746; proses kontak, 1831.',
  },
  oscillator: {
    name: 'osilator',
    aliases: ['pembangkit gelombang', 'pembawa'],
    what: 'Rangkaian yang mengumpankan keluarannya kembali ke dirinya sendiri lalu mantap pada satu nada di satu frekuensi.',
    why: 'Ini denyut yang dipakai semua benda lain: gelombang pembawa yang ditumpangi radio, detak yang dihitung komputer, nada yang dipakai modem bicara. Setelah era ini tidak ada yang jalan tanpa sesuatu yang berdetak.',
  },
  amplifier: {
    name: 'penguat',
    aliases: ['amplifier', 'menguatkan'],
    what: 'Sinyal kecil yang mengendalikan sumber daya besar, sehingga bentuknya tetap dan kekuatannya bertambah.',
    why: 'Inilah yang membuat jarak jauh mungkin tanpa ada orang di tengah. Relai meneruskan pesan; penguat meneruskan suara, dan selisih itulah seluruh jaringan telepon.',
  },

  // --- Era 5 -----------------------------------------------------------------
  'core-memory': {
    name: 'memori inti',
    aliases: ['memori', 'inti ferit', 'magnet yang ingat'],
    what: 'Kisi cincin besi kecil yang ditusuk kawat. Setiap cincin dimagnetkan ke satu arah atau arah sebaliknya, dan arahnya bertahan walau listriknya mati.',
    why: 'Memori yang selamat dari padamnya listrik — persis yang tidak dimiliki mesin-mesin hasil galian dari reruntuhan, dan sebabnya mesin itu kembali dalam keadaan kosong. Memori ini juga dianyam dengan tangan, cincin demi cincin, oleh orang yang dibayar untuk sabar.',
    real: 'Whirlwind di MIT, 1953. Apollo terbang memakai memori ini.',
  },
  'punched-card': {
    name: 'kartu berlubang',
    aliases: ['kartu', 'kartunya', 'pita kertas'],
    what: 'Kartu kaku dengan lubang di posisi yang sudah disepakati. Ada lubang berarti satu, tidak ada lubang berarti nol, dan mesin membacanya dengan meraba cahaya.',
    why: 'Program yang bisa dipegang, dikoreksi pakai pensil, dikirim ke kota lain, dan masih terbaca 40 tahun kemudian. Di tempat yang tidak punya cakram dan tidak punya listrik yang bisa diandalkan, informasi di atas kertas bukan langkah mundur.',
    real: 'Herman Hollerith, untuk sensus Amerika 1890 — meminjam gagasan alat tenun Jacquard tahun 1804.',
  },
  binary: {
    name: 'biner',
    aliases: ['bit', 'logika biner', 'satu dan nol'],
    what: 'Segala sesuatu ditulis dalam 2 keadaan, karena 2 keadaan itulah yang sanggup dipegang kawat, sakelar, atau magnet dengan andal.',
    why: 'Morse sudah melakukannya dengan titik dan garis. Mesin melakukannya dengan tegangan, dan satu-satunya perubahan nyata adalah tidak ada lagi yang perlu mendengarkan.',
    real: 'Leibniz menuliskannya tahun 1703; Shannon membuktikan tahun 1937 bahwa itu sama saja dengan logika.',
  },
  'routing-table': {
    name: 'tabel perutean',
    aliases: ['tabel rute'],
    what: 'Daftar di dalam mesin berisi arah mana yang harus dipakai untuk setiap tujuan yang mungkin.',
    why: 'Saat inilah jaringan berhenti membutuhkan orang yang hafal petanya. Tahan pesannya, cari tujuannya, tentukan lompatan berikutnya — itu sudah Era 6, berjalan di atas perangkat keras Era 5.',
  },
  modem: {
    name: 'modem',
    aliases: ['modemnya'],
    what: 'Alat yang mengubah bit menjadi nada yang sanggup dibawa jalur telepon, lalu mengubahnya kembali di ujung sana.',
    why: 'Modem membuat jaringan yang sudah dibangun proyek ini — kawat yang dulu dipasang untuk suara — bisa membawa data tanpa satu pun tiang baru. Memakai ulang yang sudah ada adalah seluruh disiplin permainan ini.',
    real: 'Bell 103, 1962. 300 bit per detik, lewat sambungan telepon biasa.',
  },

  // --- Era 6 -----------------------------------------------------------------
  'packet-switching': {
    name: 'penyakelaran paket',
    aliases: ['paket', 'paketnya'],
    what: 'Pesannya dipotong menjadi kepingan kecil berlabel, setiap keping dikirim sendiri-sendiri, lalu disusun ulang di ujung sana.',
    why: 'Jalur khusus untuk setiap pasang kota tidak bisa diperbesar dan tidak selamat dari satu kali potong. Paket berbagi semua jalur dan memutar mencari jalan lain — persis alasan gagasan ini dibiayai sejak awal.',
    real: 'Paul Baran dan Donald Davies sampai pada gagasan ini sendiri-sendiri, 1964–65.',
  },
  addressing: {
    name: 'pengalamatan',
    aliases: ['alamat', 'alamatnya'],
    what: 'Setiap tujuan punya nama yang disepakati mesin-mesinnya, dan nama itu ditulis di setiap paket.',
    why: 'Tanpa alamat, sebuah router tidak punya apa-apa untuk diputuskan. Kedengarannya cuma urusan pembukuan, dan justru itulah sebabnya sebuah pesan bisa sampai ke kota yang belum pernah didengar siapa pun di sepanjang jalannya.',
  },
  'error-correction': {
    name: 'koreksi galat',
    aliases: ['checksum', 'paritas'],
    what: 'Bit tambahan yang dikirim bersama pesannya, dipilih supaya penerima bisa tahu apakah sisanya sampai utuh — dan kadang bisa memperbaikinya.',
    why: 'Jalurnya hasil pulungan, cuacanya buruk, dan tidak akan ada yang membangunnya ulang. Anggap saja rusak, deteksi, lalu minta ulang. Itu lebih murah daripada kawat sempurna, dan selalu begitu.',
    real: 'Richard Hamming, 1950, setelah kehilangan satu akhir pekan waktu komputer gara-gara pembaca kartu.',
  },
  'integrated-circuit': {
    name: 'sirkuit terpadu',
    aliases: ['chip', 'chip-nya', 'silikon', 'keping'],
    what: 'Satu rangkaian utuh — ribuan komponen beserta kawat penghubungnya — dibuat sekaligus di atas satu keping silikon.',
    why: 'Laci penuh benda inilah yang menghidupi jaringan, dan tidak ada lagi tambahannya. Kepingnya sendiri tahan dikubur puluhan tahun; yang mati justru semua yang ada di sekelilingnya.',
    real: 'Jack Kilby dan Robert Noyce, 1958–59.',
  },
  'electrolytic-capacitor': {
    name: 'kapasitor elektrolit',
    aliases: ['kapasitor', 'kapasitornya'],
    what: 'Kapasitor yang lapisan penyekatnya ditahan oleh pasta kimia basah.',
    why: 'Pastanya mengering entah bendanya dipakai atau tidak. Ini alasan paling umum kenapa elektronik sebelum perang tidak menyala, dan sebabnya "kami menemukan sebuah papan" tidak pernah sama artinya dengan "kami menemukan papan yang hidup".',
  },

  // --- Era 7 -----------------------------------------------------------------
  protocol: {
    name: 'protokol',
    aliases: ['protokolnya', 'format bingkai'],
    what: 'Aturan yang disepakati tentang bentuk sebuah pesan dan apa yang harus dilakukan masing-masing pihak berikutnya.',
    why: 'Terobosan terakhir seluruh permainan ini bukan sebuah mesin. 2 jaringan yang tidak dibangun bersama-sama baru bisa saling membawa lalu lintas kalau, dan hanya kalau, keduanya sudah sepakat soal ini.',
  },
  internetworking: {
    name: 'antarjaringan',
    aliases: ['internet', 'router', 'gerbang jaringan'],
    what: 'Jaringan-jaringan yang tidak tahu apa-apa tentang satu sama lain, disambungkan oleh mesin di tepinya yang menerjemahkan di antara keduanya.',
    why: 'Inilah yang membebaskan proyek ini dari keharusan memiliki segalanya. Setiap provinsi boleh membangun jaringannya sendiri, dengan jelek, dengan caranya sendiri — dan tetap tersambung.',
    real: 'Vint Cerf dan Bob Kahn, 1974. Makalahnya cuma 9 halaman.',
  },
  photolithography: {
    name: 'fotolitografi',
    aliases: ['fab', 'wafer', 'tungku'],
    what: 'Mencetak rangkaian ke atas silikon dengan cahaya, lalu mengetsa habis bagian yang tidak dilindungi cahaya, berpuluh kali berulang.',
    why: 'Ini satu-satunya cara membuat chip alih-alih menemukannya, dan ia menuntut ruang bersih, air murni, gas, dan rantai pasok yang melintasi 9 provinsi. Proyek ini menghabiskan dasawarsa terakhirnya di sini karena jaringan yang hidup dari jatah rongsokan adalah milik siapa pun yang memegang jatahnya.',
    real: 'Jules Andrus di Bell Labs, 1955.',
  },
  'one-bit-machine': {
    name: 'mesin satu bit',
    aliases: ['satu bit dalam satu waktu', 'MC14500B', 'MC14500', '8051', 'Intel 8051'],
    what: 'Prosesor yang menangani satu bit dalam satu waktu — satu masukan, satu keluaran, segelintir instruksi.',
    why: 'Memalukan kalau disandingkan dengan apa pun isi laci itu, dan itu tidak jadi soal: ini yang pertama yang besok bisa mereka buat lagi. Cukup untuk menjalankan sebuah router, dan cuma itu yang dibutuhkan di batas jaringan.',
    real: 'MC14500B buatan Motorola, 1977 — unit kendali industri satu bit sungguhan dengan 16 instruksi. Intel 8051 tahun 1980 adalah leluhur yang satu lagi: satu komputer kecil utuh dalam satu chip, dan masih diproduksi sampai sekarang.',
  },
  'open-standard': {
    name: 'standar terbuka',
    aliases: ['diterbitkan', 'terbitkan'],
    what: 'Aturannya ditulis dan diberikan cuma-cuma, termasuk bagian yang gagal.',
    why: 'Tindakan terakhir proyek ini sekaligus satu-satunya pertahanannya yang awet. Jaringan yang tidak bisa menutup pintu bagi siapa pun tidak layak direbut, dan standar yang sudah dipakai semua orang tidak bisa ditarik kembali.',
    real: 'Seri RFC, sejak 1969 — diberi judul "Request for Comments" karena penulisnya sendiri tidak yakin mereka berhak menulisnya.',
  },
}
