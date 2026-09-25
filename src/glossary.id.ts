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
  /** The diagram's numbered pins, in order and in the same count as English. */
  steps?: string[]
}

export const ID_TERMS: Record<string, TermText> = {
  // --- Era 0 -----------------------------------------------------------------
  courier: {
    name: 'estafet kurir',
    aliases: ['kurir', 'pelari', 'utusan'],
    what: 'Pesan yang dibawa dengan berjalan kaki, dioper dari satu pembawa ke pembawa berikutnya di tempat yang sudah disepakati.',
    why: 'Ini satu-satunya jaringan yang jalan tanpa listrik, tanpa kabel, dan tanpa rasa percaya. Seluruh isi permainan ini adalah usaha mengalahkan kecepatan orang berjalan kaki.',
    real: 'Angarium Persia, sekitar 500 SM — penunggang kuda ditempatkan sejauh satu hari perjalanan, supaya pesannya tetap bergerak sementara pembawanya istirahat.',
    steps: [
      'Pesan dimulai di sini, diucapkan langsung ke orang yang bersedia berjalan membawanya.',
      'Orangnya berjalan. Pesan itu bergerak persis secepat sepasang kaki, tidak lebih.',
      'Sampai 2 hari kemudian. Balasannya 2 hari lagi, jadi 1 pertanyaan berharga 4 hari.',
    ],
  },
  'notice-board': {
    name: 'papan pengumuman',
    aliases: ['papan', 'papan pengumumannya'],
    what: 'Tempat tetap untuk meninggalkan pesan bagi siapa pun yang lewat berikutnya.',
    why: 'Papan ini mematahkan aturan bahwa kedua pihak harus sama-sama hadir. Pesannya menunggu di papan, bukan di tangan orang — versi paling awal dari gagasan yang tidak pernah ditinggalkan permainan ini: simpan pesannya, teruskan nanti.',
    real: 'Store and forward, prinsip yang dipakai setiap sistem pos dan setiap jaringan paket sejak itu.',
    steps: [
      'Pembawa pesan datang membawa pesan yang bukan untuk orang di tempat ini.',
      'Pesannya ditempel, lalu pembawanya pulang. Pesan itu menunggu di papan, bukan di tangan siapa pun.',
      'Siapa pun yang lewat berikutnya ke arah yang benar meneruskannya. Pesan itu bergerak tanpa ada yang membawanya.',
    ],
  },
  'signal-fire': {
    name: 'api isyarat',
    aliases: ['api', 'apinya', 'suar'],
    what: 'Api di dataran tinggi, terlihat dari bukit berikutnya. Nyala atau tidak nyala, tidak ada pilihan ketiga.',
    why: 'Satu bit informasi, menyeberangi 40 kilometer dengan kecepatan cahaya. Api itu tidak bisa bilang apa yang salah, cuma bilang ada yang salah — dan pada tahun 2030 itu masih lebih cepat daripada apa pun.',
    real: 'Rantai suar, dipakai sejak zaman kuno sampai perang Napoleon.',
    steps: [
      'Api dinyalakan di bukit di atas desa. Itu saja seluruh pesannya.',
      'Cahayanya menyeberangi 40 kilometer dalam waktu sekejap mata.',
      'Bukit berikutnya melihatnya dan tahu ada yang tidak beres — bukan apanya, bukan siapanya, bukan seberapa parahnya.',
    ],
  },
  semaphore: {
    name: 'semafor',
    aliases: ['isyarat bendera', 'telegraf optik'],
    what: 'Lengan, bendera, atau daun jendela dalam posisi yang sudah disepakati, dibaca lewat teropong dari menara berikutnya.',
    why: 'Sistem pertama yang bisa mengirim pesan apa saja, bukan cuma satu tanda bahaya — dan yang pertama membuktikan bahwa biaya sebenarnya bukan menaranya, melainkan orang-orang yang harus duduk di dalamnya.',
    real: 'Claude Chappe, Prancis, 1794 — Paris ke Lille, 230 km, dalam waktu sekitar setengah jam.',
    steps: [
      '2 lengan diatur ke posisi yang sudah disepakati. Tiap posisi berarti 1 huruf.',
      'Tidak ada yang berjalan selain cahaya, jadi hurufnya menyeberangi lembah seketika.',
      'Menara berikutnya membaca lengan itu lewat teropong.',
      'Menara itu mengatur lengannya sendiri sama persis, dan hurufnya maju 1 menara.',
    ],
  },
  'line-of-sight': {
    name: 'garis pandang',
    aliases: ['garis pandangnya', 'dataran tinggi'],
    what: 'Apakah 2 titik bisa saling melihat, setelah bukit, lengkung bumi, dan segala yang berdiri di antaranya ikut dihitung.',
    why: 'Ini yang menentukan api isyarat mana yang bisa saling menjawab, dan nanti menara mana yang bisa saling mendengar. Medan adalah satu-satunya batas yang tidak bisa dibantah pemain.',
    real: 'Cakrawala radio, kira-kira sepertujuh lebih jauh daripada cakrawala mata, karena atmosfer membelokkan pancarannya ke bawah.',
    steps: [
      'Menara, bukit, atau sepasang mata — apa pun yang harus bisa melihat ujung yang satunya.',
      'Tanah di antaranya menghalangi. Sebesar apa pun dayanya, bukit tidak bisa ditembus.',
      'Dan biarpun tidak ada penghalang, bumi ini melengkung: lewat cakrawala, garisnya memang tidak ada.',
    ],
  },

  // --- Era 1 -----------------------------------------------------------------
  'am-radio': {
    name: 'radio AM',
    aliases: ['radio', 'AM', 'modulasi amplitudo'],
    what: 'Suara yang dibawa dengan mengubah-ubah kekuatan gelombang radio.',
    why: 'Ini cara termudah mengirim suara yang pernah ditemukan. Penerimanya tidak butuh sumber listrik dan hampir tidak butuh komponen — dan itu sangat berarti kalau orang yang mau dihubungi tidak punya keduanya.',
    real: 'Reginald Fessenden, malam Natal 1906 — siaran suara pertama, didengar kapal-kapal di lepas pantai Massachusetts.',
    steps: [
      'Ada yang bicara. Mikrofonnya mengubah tekanan udara jadi arus kecil yang bergoyang.',
      'Goyangan itu dipakai untuk membuat gelombang cepat yang tetap jadi keras dan pelan — suaranya menumpang di gelombang pembawa.',
      'Penerimanya membuang gelombang pembawanya dan menyimpan bentuk yang tadi dibawa.',
      'Yang tersisa adalah goyangan tadi, dan pengeras suara mengubahnya kembali jadi udara.',
    ],
  },
  transmitter: {
    name: 'pemancar',
    aliases: ['pemancarnya', 'perangkatnya'],
    what: 'Mesin yang membuat gelombang radio dan menumpangkan suara di atasnya.',
    why: 'Separuh yang mahal dari sebuah sambungan radio. Sebuah kampung bisa diberi penerima; pemancar harus dibangun, diberi daya, dan dijaga oleh orang yang mengerti isinya.',
    steps: [
      'Osilator membuat 1 frekuensi tetap dan tidak pernah berhenti membuatnya.',
      'Modulator membengkokkan frekuensi itu mengikuti apa pun yang sedang diucapkan.',
      'Penguat membuat hasilnya cukup kuat untuk pantas dipancarkan.',
      'Antenanya mengubah arus jadi gelombang, lalu melepaskannya.',
    ],
  },
  antenna: {
    name: 'menara radio',
    aliases: ['antena', 'menara', 'menaranya', 'antenanya'],
    what: 'Penghantar yang dipotong sepanjang ukuran yang cocok dengan panjang gelombangnya, lalu dipasang setinggi mungkin.',
    why: 'Satu-satunya bagian radio yang tidak bisa diakali. Tinggi berarti jangkauan — itu sebabnya setiap relai dalam permainan ini berdiri di bukit, dan sebabnya menara selalu jadi barang pertama yang dicuri orang.',
    steps: [
      'Arusnya naik lewat logam lalu lepas dari ujungnya sebagai gelombang.',
      'Panjangnya harus cocok dengan gelombangnya. Menara setinggi seperempat panjang gelombang memancar; tiang asal-asalan cuma jadi panas.',
      'Kawat penopang menahannya dari angin, dan itulah yang sebenarnya menentukan menara ini masih berdiri musim depan atau tidak.',
      'Umpannya masuk dari bawah, dan tanah di bawahnya adalah separuh sisa antena itu.',
    ],
  },
  generator: {
    name: 'generator',
    aliases: ['genset', 'dinamo'],
    what: 'Mesin yang memutar kumparan di dalam magnet, lalu menghasilkan listrik.',
    why: 'Tidak ada satu pun barang di era ini yang jalan tanpa generator, dan generator melahap bahan bakar setiap jam ia hidup. Yang benar-benar membatasi berapa lama sebuah stasiun bisa mengudara adalah daya, bukan tembaga.',
    steps: [
      'Ada yang berputar: air, uap, diesel, atau orang yang mengayuh.',
      'Putarannya menyeret gulungan kawat melewati magnet.',
      'Kawat yang memotong medan magnet akan terdorong arus. Cuma itu isinya.',
      'Keluarlah arus bolak-balik, 1 siklus tiap 1 putaran.',
    ],
  },
  battery: {
    name: 'aki',
    aliases: ['baterai', 'akinya', 'aki truk'],
    what: 'Pelat timbal yang berdiri di dalam asam. Aki menyerap arus waktu ada lebihnya, lalu mengeluarkannya lagi di tegangan yang stabil.',
    why: 'Generator cuma hidup selama masih ada bahan bakar, sedangkan meja kerja harus tetap jalan di hari-hari yang bahan bakarnya habis. Semua pengukuran di era ini dilakukan pakai aki, begitu juga semua siaran yang tidak sanggup dibayar dengan menyalakan mesin.',
    real: 'Gaston Planté, 1859 — sel pertama yang bisa diisi ulang, bukan dibuang.',
  },
  propagation: {
    name: 'perambatan',
    aliases: ['jangkauan', 'gangguan sinyal', 'pantulan langit'],
    what: 'Seberapa jauh gelombang radio benar-benar sampai — yang berubah menurut tanah, cuaca, dan jam berapa saat itu.',
    why: 'AM gelombang menengah merayap di permukaan tanah pada siang hari dan memantul di ionosfer pada malam hari, jadi stasiun yang sama hanya terdengar sekampung waktu siang dan terdengar 4 provinsi jauhnya waktu tengah malam. Sambungan yang kemarin berhasil bisa gagal hari ini tanpa ada yang berbuat salah.',
    real: 'Lapisan Kennelly–Heaviside, diusulkan tahun 1902 dan dibuktikan tahun 1924.',
    steps: [
      'Menaranya memancar ke segala arah sekaligus, termasuk lurus ke atas.',
      'Bagian yang naik ke atas itu terbuang percuma, kalau tengah hari.',
      'Malam hari, ionosfer mengeras jadi cermin dan membelokkannya kembali ke bawah, ratusan kilometer jauhnya.',
      'Bagian yang merayap di tanah lebih jauh pada siang hari, dan mati di tanah basah dan perbukitan.',
    ],
  },

  // --- Era 2 -----------------------------------------------------------------
  telegraph: {
    name: 'telegraf',
    aliases: ['jalur telegraf', 'tiang telegraf', 'tiang'],
    what: 'Kawat antara 2 tempat, dan baterai yang cukup kuat untuk mendorong arus di sepanjang kawat itu.',
    why: 'Lebih murah per kilometer daripada radio dan jauh lebih sulit diganggu, tapi kawatnya harus benar-benar ada di sepanjang jalan — dan itu menjadikannya barang pertama milik proyek ini yang bisa didatangi orang lalu dipotong.',
    real: 'Cooke dan Wheatstone, 1837; jalur Morse dari Washington ke Baltimore, 1844.',
    steps: [
      'Baterai, duduk di 1 ujung, menunggu.',
      'Kunci telegraf itu sakelar. Ditekan, rangkaiannya tersambung.',
      'Arus mengalir di sepanjang kabel sekaligus — 10 kilometer atau 1000, sama saja.',
      'Di ujung sana arus itu lewat kumparan, dan kumparannya jadi magnet.',
      'Magnetnya menarik tuas besi sampai berbunyi klik. Ada orang yang menunggu bunyi klik itu.',
    ],
  },
  'telegraph-key': {
    name: 'kunci telegraf',
    aliases: ['kunci', 'kuncinya'],
    what: 'Tuas berpegas. Ditekan, rangkaiannya tersambung; dilepas, rangkaiannya putus.',
    why: 'Cuma ini seluruh antarmukanya. Satu bagian bergerak, tanpa elektronik, dan siapa pun bisa diajari memakainya dalam seminggu — persis itulah sebabnya sebuah kampung bisa dititipi satu lalu ditinggal jalan sendiri.',
    steps: [
      '1 kontak tersambung ke kabel dan ke ujung dunia sana.',
      'Ditekan, 2 kontaknya bersentuhan. Itu seluruh sinyalnya: bersentuhan atau tidak.',
      'Pegas mengangkatnya lagi begitu jari terangkat, supaya jedanya setajam ketukannya.',
      'Kontak satunya ke baterai. Kunci telegraf itu sakelar yang punya ketepatan waktu.',
    ],
  },
  'morse-code': {
    name: 'kode Morse',
    aliases: ['Morse', 'titik dan garis'],
    what: 'Huruf yang ditulis sebagai denyut pendek dan panjang, dengan huruf yang paling sering muncul diberi kode paling pendek.',
    why: 'Kode ini mengubah kawat yang cuma bisa hidup atau mati menjadi sesuatu yang sanggup membawa kalimat apa pun. Ini kali pertama proyek ini menyandikan bahasa ke dalam 2 keadaan — dan diulang lagi di Era 5, lalu sekali lagi di Era 6.',
    real: 'Alfred Vail dan Samuel Morse, 1838. Huruf E cuma satu titik karena E huruf paling sering dalam bahasa Inggris.',
    steps: [
      'Tekan pendek: 1 satuan arus. Titik.',
      'Tekan panjang: 3 satuan. Garis. Cuma ada 2 panjang, selamanya.',
      'Jeda di dalam 1 huruf panjangnya 1 satuan. Sunyinya sama pentingnya dengan bunyinya.',
      'Jeda 3 satuan mengakhiri huruf, 7 satuan mengakhiri kata — makanya 2 operator harus sepakat soal kecepatan.',
    ],
  },
  electromagnet: {
    name: 'elektromagnet',
    aliases: ['koil', 'kumparan', 'magnet listrik'],
    what: 'Kawat yang dililitkan pada besi. Ada arus, besinya jadi magnet; tidak ada arus, tidak ada magnet.',
    why: 'Semua isi era ini adalah benda yang sama dengan bentuk berbeda: pengetuk yang berbunyi, relai yang meneruskan, bel yang berdering. Paham sekali di sini, dan sentral di Era 3 berhenti terasa ajaib.',
    steps: [
      'Arus dari mana saja: baterai, dinamo, atau kabel sepanjang 100 kilometer.',
      'Arusnya berputar-putar di kumparan, dan tiap lilitan menambah lilitan sebelumnya.',
      'Kumparannya melempar medan magnet, kuat selama arusnya jalan dan hilang begitu arusnya berhenti.',
      'Besi di dalam medan itu tertarik. Listrik sudah berubah jadi sesuatu yang bergerak.',
    ],
  },
  'relay-station': {
    name: 'relai',
    aliases: ['stasiun relai', 'penguat ulang'],
    what: 'Sinyal lemah yang masuk menggerakkan elektromagnet, dan elektromagnet itu menyambung rangkaian baru dengan baterai yang masih penuh di belakangnya.',
    why: 'Inilah yang membuat jarak berhenti jadi masalah: jalur sepanjang apa pun boleh, asal setiap sekian kilometer ada satu benda ini. Diam-diam, ini juga mesin pertama dalam permainan yang mengambil keputusan.',
    steps: [
      'Sinyalnya datang lemah. Kabel sepanjang 100 kilometer sudah memakan sebagian besarnya.',
      'Sisanya masih cukup untuk menggerakkan magnet kecil, dan cuma itu yang diminta darinya.',
      'Magnetnya menutup sakelar ke baterai setempat yang masih segar dan penuh.',
      'Yang keluar adalah sinyal baru sekuat semula, berbentuk sama seperti yang lama. Ulangi terus.',
    ],
  },

  // --- Era 3 -----------------------------------------------------------------
  telephone: {
    name: 'telepon',
    aliases: ['telpon', 'panggilan'],
    what: 'Mikrofon dan pengeras di kawat yang sama, supaya 2 orang bisa langsung bicara.',
    why: 'Telepon menyingkirkan operator, dan bersamanya orang terakhir yang harus dilatih sebelum 2 kampung bisa saling bicara. Komunikasi berhenti menjadi pesan dan berubah menjadi percakapan.',
    real: 'Alexander Graham Bell, 1876 — dipatenkan beberapa jam sebelum Elisha Gray mendaftarkan hal yang hampir sama.',
    steps: [
      'Suara: udara, didorong bergelombang ke lembaran logam tipis.',
      'Lembaran itu menekan butiran karbon. Ditekan kuat, butirannya gampang menghantar arus; longgar, butirannya menahan arus.',
      'Baterai mendorong arus tetap lewat butiran itu, dan tekanannya membuat arusnya bergoyang mengikuti bentuk suaranya.',
      'Arus yang bergoyang itu turun ke kabel. Itu bukan suara lagi, itu bentuk dari suara.',
      'Di ujung sana arusnya melingkari kumparan, dan kumparannya menarik lembaran tipis kedua, kuat lalu lemah.',
      'Lembaran itu mendorong udara, dan udaranya jadi suara lagi. Tidak ada yang dikirim lewat kabel selain sebuah bentuk.',
    ],
  },
  switchboard: {
    name: 'switchboard',
    aliases: ['papan sambung', 'switchboard-nya'],
    what: 'Panel berisi lubang colokan dan kabel jumper. Operator mendengar siapa yang dituju, lalu menyambungkan 2 jalur dengan tangan.',
    why: 'Inilah yang membuat 100 jalur bisa saling menjangkau tanpa 10.000 kawat. Ini juga menempatkan satu orang di tengah setiap percakapan pribadi di provinsi ini — masalah politik yang menjadi inti seluruh era ini.',
    steps: [
      'Semua saluran di kota ini berakhir di lubang di papan ini. Lampunya menandakan siapa yang memanggil.',
      'Kabel dengan colokan di 2 ujungnya. Kedua ujungnya ditancapkan, dan 2 saluran jadi 1 saluran.',
      'Saluran yang dipanggil, yang sampai saat ini tidak ada hubungannya dengan si pemanggil.',
      'Seorang manusia, yang mendengar tiap kata dan hafal tiap nama. Perute pertama itu pekerjaan orang.',
    ],
  },
  exchange: {
    name: 'sentral',
    aliases: ['sentralnya', 'kantor sentral'],
    what: 'Bangunan tempat switchboard berada, dan segala hal yang menentukan jalur mana menjangkau jalur mana.',
    why: 'Siapa yang memegang sentral, dia memegang jaringan: antreannya, harganya, urutan siapa diberi tahu lebih dulu. Menyerahkan sentral adalah hal tersulit yang pernah dilakukan proyek ini dengan sengaja.',
    steps: [
      'Sambungkan semua orang ke semua orang: 5 orang butuh 10 kabel. 100 orang butuh 4950.',
      'Sambungkan semua orang ke 1 gedung saja: 100 orang cukup 100 kabel.',
      'Gedung itu yang memutuskan siapa tersambung ke siapa, tiap saat. Semua jaringan sesudahnya berbentuk begini.',
    ],
  },
  strowger: {
    name: 'sakelar langkah demi langkah',
    aliases: ['Strowger', 'sentral otomatis'],
    what: 'Lengan kontak berputar yang melangkah satu posisi untuk setiap denyut yang dikirim piringan nomor, lalu menyambungkan panggilan tanpa operator.',
    why: 'Mesin pertama yang mengeluarkan manusia dari tengah percakapan — dan penemunya seorang pengurus pemakaman yang yakin operator setempat mengalihkan pelanggannya ke saingannya.',
    real: 'Almon Strowger, 1891. Cerita soal pengurus pemakaman itu benar.',
    steps: [
      'Piringan putarnya tidak mengirim angka. Piringan itu mengirim sejumlah putusan arus.',
      'Tiap putusan adalah 1 pulsa. Putar 5, salurannya mati 5 kali, cepat.',
      'Magnet menaikkan tuas 1 takik tiap 1 pulsa.',
      'Tuasnya berhenti di kontak yang tadi diputar, dan sambungannya jadi. Tidak ada orang yang mendengarnya.',
    ],
  },
  standard: {
    name: 'standar',
    aliases: ['standarnya', 'baku'],
    what: 'Aturan tertulis yang diikuti peralatan semua orang, supaya peralatan yang dibuat tanpa koordinasi tetap bisa bekerja bersama.',
    why: 'Ini satu-satunya bentuk kendali yang bertahan setelah perangkat kerasnya diberikan. Proyek ini menyimpan standarnya dan menyerahkan sisanya — dan keputusan yang diambil di sini baru dicairkan di Era 7.',
    steps: [
      'Alat buatan 1 bengkel, di 1 kota, sesuai selera bengkel itu sendiri.',
      'Selembar kertas yang menyebutkan bentuk colokannya, berapa voltasenya, dan apa arti nadanya.',
      'Alat buatan orang yang belum pernah bertemu mereka, 200 kilometer jauhnya, yang langsung nyambung sekali coba.',
    ],
  },

  // --- Era 4 -----------------------------------------------------------------
  'vacuum-tube': {
    name: 'tabung hampa',
    aliases: ['tabung', 'tabungnya'],
    what: 'Kawat yang dipanaskan melontarkan elektron menyeberangi kaca hampa udara, dan elektrode ketiga di tengahnya mengatur berapa banyak yang boleh lewat.',
    why: 'Komponen pertama yang bisa menguatkan — mengubah sinyal kecil menjadi besar — dan yang pertama bisa menyakelar tanpa ada bagian yang bergerak. Semua penguat, osilator, dan gerbang logika di 2 era berikutnya dibangun dari benda ini.',
    real: 'Audion buatan Lee de Forest, 1906. Dia sendiri tidak sepenuhnya paham kenapa benda itu bekerja. IBM pernah bikin komputer utuh dari benda ini — seri 700 tahun 1950-an, ribuan tabung dipasang sebagai modul, satu ruangan penuh cuma buat kerjaan yang sekarang muat di satu chip.',
    steps: [
      'Pemanas, menyala. Tugasnya cuma membuat logam di sebelahnya panas.',
      'Logam panas itu melepaskan elektron dari permukaannya — tapi cuma bisa ke ruang hampa, itulah gunanya kaca itu.',
      'Anyaman kawat dipasang di jalur elektronnya. Tegangan sangat kecil di situ bisa meloloskan banyak elektron atau hampir tidak sama sekali.',
      'Elektron yang lolos mendarat di pelat.',
      'Jadi bisikan di anyaman kawat berubah jadi teriakan di pelat. Itulah penguatan, dan seluruh elektronika berawal di sini.',
    ],
  },
  glassblowing: {
    name: 'peniupan kaca',
    aliases: ['kaca', 'kacanya'],
    what: 'Membentuk kaca leleh dengan tiupan dan tangan, dengan ketelitian yang sama setiap kali.',
    why: 'Sebuah tabung adalah persoalan kaca sebelum menjadi persoalan listrik. Di sinilah proyek ini berhenti memulung dan mulai membuat — dan ternyata bagian tersulitnya bukan fisikanya.',
    steps: [
      'Tungku yang cukup panas untuk membuat pasir bersifat seperti madu.',
      'Orang yang bisa membentuknya dengan tiupan dan putaran, dan butuh 10 tahun untuk bisa begitu.',
      'Pompa mengeluarkan udaranya. Tabung yang masih ada udaranya cuma bohlam yang tidak menyala.',
      'Ditutup selagi masih lunak, dan ruang hampanya terkunci di dalam selama 40 tahun.',
    ],
  },
  'sulphuric-acid': {
    name: 'asam sulfat',
    aliases: ['asam', 'asamnya'],
    what: 'Bahan kimia industri yang paling banyak diproduksi di dunia, dan yang dibutuhkan hampir semua bahan lain.',
    why: 'Untuk aki, untuk membersihkan kaca, dan nanti untuk mengetsa silikon. Kemampuan sebuah negeri membuatnya hampir sama dengan ukuran apakah negeri itu punya industri — itu sebabnya di sini tidak ada yang membuatnya sesuai spesifikasi selama 18 tahun.',
    real: 'Proses bilik timbal, 1746; proses kontak, 1831.',
    steps: [
      'Pelat timbal.',
      'Pelat timbal dioksida. Syaratnya cuma 2 logam yang berbeda.',
      'Asam di antara keduanya. Asam itu menyerang keduanya, dan reaksinya menarik elektron dari 1 pelat ke pelat yang lain.',
      'Ketimpangan itulah tegangannya, dan tegangannya ada di situ, dipakai atau tidak.',
    ],
  },
  oscillator: {
    name: 'osilator',
    aliases: ['pembangkit gelombang', 'pembawa'],
    what: 'Rangkaian yang mengumpankan keluarannya kembali ke dirinya sendiri lalu mantap pada satu nada di satu frekuensi.',
    why: 'Ini denyut yang dipakai semua benda lain: gelombang pembawa yang ditumpangi radio, detak yang dihitung komputer, nada yang dipakai modem bicara. Setelah era ini tidak ada yang jalan tanpa sesuatu yang berdetak.',
    steps: [
      'Rangkaian yang berdenting di 1 frekuensi, seperti lonceng yang punya 1 nada.',
      'Penguat, yang membuat apa pun di masukannya jadi lebih besar di keluarannya.',
      'Keluarannya dikembalikan ke masukannya. Dentingannya memberi makan dirinya sendiri dan tidak pernah padam.',
      'Keluarlah nada tetap yang tidak perlu didorong terus-menerus. Semua pemancar butuh 1.',
    ],
  },
  amplifier: {
    name: 'penguat',
    aliases: ['amplifier', 'menguatkan'],
    what: 'Sinyal kecil yang mengendalikan sumber daya besar, sehingga bentuknya tetap dan kekuatannya bertambah.',
    why: 'Inilah yang membuat jarak jauh mungkin tanpa ada orang di tengah. Relai meneruskan pesan; penguat meneruskan suara, dan selisih itulah seluruh jaringan telepon.',
    steps: [
      'Sinyal lemah. Terlalu lemah untuk didengar, dikirim, atau dipakai apa pun.',
      'Catu daya, dan dari sinilah semua kerasnya sebenarnya berasal.',
      'Tabung di tengah, membiarkan sinyal lemah tadi menentukan seberapa banyak daya itu yang lewat.',
      'Keluarlah bentuk yang sama, jauh lebih besar. Tidak ada yang ditambahkan ke sinyalnya selain ukuran.',
    ],
  },

  // --- Era 5 -----------------------------------------------------------------
  'logic-gate': {
    name: 'gerbang logika',
    aliases: ['gerbang', 'logika', 'gerbang dan', 'gerbang atau'],
    what: 'Sakelar yang dirangkai sedemikian rupa sehingga arus yang sampai di ujung sana menjawab sebuah pertanyaan tentang sakelar-sakelar itu.',
    why: 'Inilah seluruh bahan penyusun komputer, dan jumlahnya cuma 3. Relai sudah menempel di setiap tiang telegraf di wilayah ini selama 14 tahun sebelum ada yang merangkai 2 di antaranya berderet lalu sadar bahwa yang baru saja dibuatnya adalah hitungan.',
    real: 'Mesin relai lebih dulu: Z3 buatan Zuse tahun 1941, dan Model V dari Bell Labs tahun 1946 — 9.000 relai yang diambil dari stok sentral telepon. Tabung mengerjakan tugas yang sama tanpa ada bagian yang bergerak, dan karena itulah ENIAC 1.000 kali lebih cepat.',
    steps: [
      '2 sakelar berderet. Lampunya menyala cuma kalau dua-duanya tertutup — itu "dan".',
      '2 sakelar yang sama, dipasang bersebelahan. Lampunya menyala kalau salah satunya tertutup — itu "atau".',
      '1 sakelar dirangkai supaya memutus arus ketika dialiri, bukan menyambung — itu "bukan".',
      'Tidak ada yang keempat. Setiap penjumlahan, perbandingan, dan keputusan yang pernah dibuat mesin adalah 3 hal itu, diulang-ulang.',
    ],
  },
  binary: {
    name: 'biner',
    aliases: ['bit', 'logika biner', 'satu dan nol'],
    what: 'Segala sesuatu ditulis dalam 2 keadaan, karena 2 keadaan itulah yang sanggup dipegang kawat, sakelar, atau magnet dengan andal.',
    why: 'Morse sudah melakukannya dengan titik dan garis. Mesin melakukannya dengan tegangan, dan satu-satunya perubahan nyata adalah tidak ada lagi yang perlu mendengarkan.',
    real: 'Leibniz menuliskannya tahun 1703; Shannon membuktikan tahun 1937 bahwa itu sama saja dengan logika.',
    steps: [
      'Ada tegangan. Sebut saja 1.',
      'Tidak ada tegangan. Sebut saja 0. Memang sengaja tidak ada pilihan ketiga.',
      'Kedua ujungnya sepakat berapa lama 1 bit berlangsung, supaya 3 angka 0 berturut-turut tidak disangka sunyi.',
      'Kelompokkan, dan itu jadi angka, huruf, atau perintah. Semua sesudah ini cuma pembukuan.',
    ],
  },
  // --- Era 6 -----------------------------------------------------------------
  'core-memory': {
    name: 'memori inti',
    aliases: ['memori', 'inti ferit', 'magnet yang ingat'],
    what: 'Kisi cincin besi kecil yang ditusuk kawat. Setiap cincin dimagnetkan ke satu arah atau arah sebaliknya, dan arahnya bertahan walau listriknya mati.',
    why: 'Memori yang selamat dari padamnya listrik — persis yang tidak dimiliki mesin-mesin hasil galian dari reruntuhan, dan sebabnya mesin itu kembali dalam keadaan kosong. Memori ini juga dianyam dengan tangan, cincin demi cincin, oleh orang yang dibayar untuk sabar.',
    real: 'Whirlwind di MIT, 1953. Apollo terbang memakai memori ini.',
    steps: [
      'Anyaman kawat, dengan cincin besi kecil terpasang di tiap persilangan. 1 cincin adalah 1 bit.',
      'Kirim setengah arus yang dibutuhkan 1 cincin lewat 1 kawat, dan setengahnya lagi lewat kawat yang menyilanginya.',
      'Cuma cincin di persilangannya yang dapat cukup arus untuk berbalik. Arah hadapnya itulah bitnya.',
      'Matikan listriknya, arahnya tetap begitu. Ini ingatan yang selamat dari mati lampu, dianyam dengan tangan.',
    ],
  },
  'punched-card': {
    name: 'kartu berlubang',
    aliases: ['kartu', 'kartunya', 'pita kertas'],
    what: 'Kartu kaku dengan lubang di posisi yang sudah disepakati. Ada lubang berarti satu, tidak ada lubang berarti nol, dan mesin membacanya dengan meraba cahaya.',
    why: 'Program yang bisa dipegang, dikoreksi pakai pensil, dikirim ke kota lain, dan masih terbaca 40 tahun kemudian. Di tempat yang tidak punya cakram dan tidak punya listrik yang bisa diandalkan, informasi di atas kertas bukan langkah mundur.',
    real: 'Herman Hollerith, untuk sensus Amerika 1890 — meminjam gagasan alat tenun Jacquard tahun 1804.',
    steps: [
      '1 sudutnya dipotong, supaya setumpuk kartu yang terjatuh bisa disusun lagi dengan arah yang benar.',
      'Lubang berarti 1. Kartu utuh di tempat yang bisa saja dilubangi berarti 0. Programnya bisa diterawang ke cahaya.',
      'Sikat, atau cahaya, membaca 1 kolom penuh sekaligus sewaktu kartunya ditarik lewat.',
      'Keluarlah sederet bit, dan mesinnya baru saja diberi tahu sesuatu oleh selembar kertas.',
    ],
  },
  'routing-table': {
    name: 'tabel perutean',
    aliases: ['tabel rute'],
    what: 'Daftar di dalam mesin berisi arah mana yang harus dipakai untuk setiap tujuan yang mungkin.',
    why: 'Saat inilah jaringan berhenti membutuhkan orang yang hafal petanya. Tahan pesannya, cari tujuannya, tentukan lompatan berikutnya — itu sudah Era 6, berjalan di atas perangkat keras Era 5.',
    steps: [
      'Pesan tiba di simpul yang sama sekali tidak tahu tujuannya ada di mana.',
      'Memang tidak perlu tahu. Simpul itu mencari alamatnya di tabel yang disimpannya sendiri.',
      'Tabelnya cuma menyebut 1 hal: saluran saya yang mana yang membuatnya lebih dekat.',
      'Kirim lewat situ lalu lupakan. Semua simpul yang cuma melakukan ini menghasilkan rute yang tidak direncanakan siapa pun.',
    ],
  },
  modem: {
    name: 'modem',
    aliases: ['modemnya'],
    what: 'Alat yang mengubah bit menjadi nada yang sanggup dibawa jalur telepon, lalu mengubahnya kembali di ujung sana.',
    why: 'Modem membuat jaringan yang sudah dibangun proyek ini — kawat yang dulu dipasang untuk suara — bisa membawa data tanpa satu pun tiang baru. Memakai ulang yang sudah ada adalah seluruh disiplin permainan ini.',
    real: 'Bell 103, 1962. 300 bit per detik, lewat sambungan telepon biasa.',
    steps: [
      'Bit keluar dari mesin: kotak, tajam, dan sama sekali tidak bisa lewat saluran suara.',
      'Jadi ubah saja jadi nada. 1 nada berarti 1, nada satunya berarti 0.',
      'Saluran telepon membawanya seolah ada yang menyanyikan 2 nada dengan sangat cepat, dan cuma itu yang bisa dilakukannya.',
      'Modem di seberang mendengarkan 2 nada yang sama.',
      'Lalu mengubahnya kembali jadi bit yang kotak dan tajam. Modulasi, demodulasi — itu saja asal namanya.',
    ],
  },
  microcomputer: {
    name: 'microcomputer',
    aliases: ['komputer papan tunggal'],
    what: 'Satu komputer utuh yang dibangun menurut rancangan terbitan yang cukup kecil untuk ditiru: prosesor pulungan, memori yang bisa dia simpan, satu papan tombol dan satu layar, di atas satu papan.',
    why: 'Saat sebuah chip pulungan yang telanjang berubah jadi mesin yang bisa dipakai orang dan bisa ditiru bengkel kedua. Dibangun dari rancangan yang dicetak dunia lama secara lengkap, dengan sengaja — dan itulah argumen yang dituntaskan Era 8 waktu ia menerbitkan segala yang diketahui proyek ini.',
    real: 'Radio-86RK, dicetak utuh di majalah Radio, 1986, supaya pembacanya bisa membangun sendiri. Prosesornya KR580VM80A — tiruan Soviet dari Intel 8080.',
  },

  // --- Era 7 -----------------------------------------------------------------
  'packet-switching': {
    name: 'penyakelaran paket',
    aliases: ['paket', 'paketnya'],
    what: 'Pesannya dipotong menjadi kepingan kecil berlabel, setiap keping dikirim sendiri-sendiri, lalu disusun ulang di ujung sana.',
    why: 'Jalur khusus untuk setiap pasang kota tidak bisa diperbesar dan tidak selamat dari satu kali potong. Paket berbagi semua jalur dan memutar mencari jalan lain — persis alasan gagasan ini dibiayai sejak awal.',
    real: 'Paul Baran dan Donald Davies sampai pada gagasan ini sendiri-sendiri, 1964–65.',
    steps: [
      'Sebuah pesan. Bisa 1 baris, bisa 1000.',
      'Potong jadi bagian-bagian kecil lalu beri nomor. Tiap bagian membawa alamatnya sendiri.',
      'Tiap bagian lewat jalan mana pun yang kosong saat itu, jadi tidak semuanya sampai lewat rute yang sama atau berurutan.',
      'Ujung sana mengurutkannya lagi berdasarkan nomor dan pesannya utuh kembali. Kabel putus menghilangkan 1 paket, bukan 1 percakapan.',
    ],
  },
  addressing: {
    name: 'pengalamatan',
    aliases: ['alamat', 'alamatnya'],
    what: 'Setiap tujuan punya nama yang disepakati mesin-mesinnya, dan nama itu ditulis di setiap paket.',
    why: 'Tanpa alamat, sebuah router tidak punya apa-apa untuk diputuskan. Kedengarannya cuma urusan pembukuan, dan justru itulah sebabnya sebuah pesan bisa sampai ke kota yang belum pernah didengar siapa pun di sepanjang jalannya.',
    steps: [
      'Tujuannya. Tiap simpul di sepanjang jalan cuma membaca bagian ini.',
      'Asalnya, supaya balasannya ada tujuannya dan keluhannya ada alamatnya.',
      'Bagian keberapa dari pesan ini, dan ada berapa bagian seluruhnya, supaya ujung sana tahu apa yang belum sampai.',
      'Isi pesannya sendiri, yang tidak pernah perlu dilihat simpul mana pun di tengah jalan.',
    ],
  },
  'error-correction': {
    name: 'koreksi galat',
    aliases: ['checksum', 'paritas'],
    what: 'Bit tambahan yang dikirim bersama pesannya, dipilih supaya penerima bisa tahu apakah sisanya sampai utuh — dan kadang bisa memperbaikinya.',
    why: 'Jalurnya hasil pulungan, cuacanya buruk, dan tidak akan ada yang membangunnya ulang. Anggap saja rusak, deteksi, lalu minta ulang. Itu lebih murah daripada kawat sempurna, dan selalu begitu.',
    real: 'Richard Hamming, 1950, setelah kehilangan satu akhir pekan waktu komputer gara-gara pembaca kartu.',
    steps: [
      'Bit yang memang mau dikirim.',
      'Ditambah beberapa bit lagi, dihitung dari bit yang tadi. Bit tambahan itu tidak membawa kabar; adanya cuma untuk diperiksa.',
      'Di suatu tempat di jalan, derau membalik 1 bit. Tidak ada yang memberi tahu. Memang tidak pernah ada.',
      'Hasil periksanya tidak cocok lagi, jadi ujung sana tahu bloknya salah dan meminta kirim ulang.',
    ],
  },
  'integrated-circuit': {
    name: 'sirkuit terpadu',
    aliases: ['chip', 'chip-nya', 'silikon', 'keping'],
    what: 'Satu rangkaian utuh — ribuan komponen beserta kawat penghubungnya — dibuat sekaligus di atas satu keping silikon.',
    why: 'Laci penuh benda inilah yang menghidupi jaringan, dan tidak ada lagi tambahannya. Kepingnya sendiri tahan dikubur puluhan tahun; yang mati justru semua yang ada di sekelilingnya.',
    real: 'Jack Kilby dan Robert Noyce, 1958–59.',
    steps: [
      'Cakram silikon, dipoles rata sampai 1 goresan pun setara gunung.',
      'Seluruh permukaannya dipolakan sekaligus, dalam 1 tindakan, bukan bagian demi bagian.',
      'Potong-potong, dan tiap kotaknya adalah rangkaian utuh — ribuan komponen, sudah tersambung satu sama lain.',
      'Pasangi kaki, dan jadilah 1 komponen. Membuat 10 000 hampir tidak lebih mahal daripada membuat 1.',
    ],
  },
  'electrolytic-capacitor': {
    name: 'kapasitor elektrolit',
    aliases: ['kapasitor', 'kapasitornya'],
    what: 'Kapasitor yang lapisan penyekatnya ditahan oleh pasta kimia basah.',
    why: 'Pastanya mengering entah bendanya dipakai atau tidak. Ini alasan paling umum kenapa elektronik sebelum perang tidak menyala, dan sebabnya "kami menemukan sebuah papan" tidak pernah sama artinya dengan "kami menemukan papan yang hidup".',
    steps: [
      'Sebuah kaleng, digulung rapat, berisi 2 lembar panjang foil yang digulung dengan kertas di antaranya.',
      'Kedua foilnya tidak pernah bersentuhan. Selaput yang lebih tipis dari 1 panjang gelombang cahaya memisahkannya.',
      'Muatan menumpuk di 1 foil dan berkurang di foil satunya. Ketimpangan itulah yang membuat catu daya jadi halus.',
      'Selaputnya ditumbuhkan oleh arusnya sendiri dan mengering seiring usia — jadi inilah komponen yang paling duluan rusak, di alat apa pun.',
    ],
  },

  // --- Era 8 -----------------------------------------------------------------
  protocol: {
    name: 'protokol',
    aliases: ['protokolnya', 'format bingkai'],
    what: 'Aturan yang disepakati tentang bentuk sebuah pesan dan apa yang harus dilakukan masing-masing pihak berikutnya.',
    why: 'Terobosan terakhir seluruh permainan ini bukan sebuah mesin. 2 jaringan yang tidak dibangun bersama-sama baru bisa saling membawa lalu lintas kalau, dan hanya kalau, keduanya sudah sepakat soal ini.',
    steps: [
      '1 ujung berkata: saya mau bicara, dan ini titik mulai saya.',
      'Ujung satunya menjawab: sudah terdengar, dan ini titik mulai saya.',
      'Ujung pertama membenarkan, dan baru sekarang ada isi yang benar-benar dikirim.',
      'Dan kedua pihak sudah sepakat lebih dulu apa yang dilakukan kalau jawabannya tidak pernah datang, dan justru separuh itulah yang membuatnya jalan.',
    ],
  },
  internetworking: {
    name: 'antarjaringan',
    aliases: ['internet', 'router', 'gerbang jaringan'],
    what: 'Jaringan-jaringan yang tidak tahu apa-apa tentang satu sama lain, disambungkan oleh mesin di tepinya yang menerjemahkan di antara keduanya.',
    why: 'Inilah yang membebaskan proyek ini dari keharusan memiliki segalanya. Setiap provinsi boleh membangun jaringannya sendiri, dengan jelek, dengan caranya sendiri — dan tetap tersambung.',
    real: 'Vint Cerf dan Bob Kahn, 1974. Makalahnya cuma 9 halaman.',
    steps: [
      '1 jaringan, dengan kabelnya sendiri, kecepatannya sendiri, dan aturannya sendiri.',
      'Gerbang, yang tidak diminta memahami sepenuhnya jaringan yang mana pun.',
      'Gerbang itu cuma perlu sepakat soal amplopnya: alamat di luarnya, dan tidak perlu tahu apa-apa soal isinya.',
      'Jaringan lain yang sama sekali tidak berbagi peralatan dengan jaringan pertama, sekarang tetap bisa dijangkau.',
    ],
  },
  photolithography: {
    name: 'fotolitografi',
    aliases: ['fab', 'wafer', 'tungku'],
    what: 'Mencetak rangkaian ke atas silikon dengan cahaya, lalu mengetsa habis bagian yang tidak dilindungi cahaya, berpuluh kali berulang.',
    why: 'Ini satu-satunya cara membuat chip alih-alih menemukannya, dan ia menuntut ruang bersih, air murni, gas, dan rantai pasok yang melintasi 9 provinsi. Proyek ini menghabiskan dasawarsa terakhirnya di sini karena jaringan yang hidup dari jatah rongsokan adalah milik siapa pun yang memegang jatahnya.',
    real: 'Jules Andrus di Bell Labs, 1955.',
    steps: [
      'Topeng: pola rangkaiannya, digambar sekali, sangat besar, lalu dikecilkan.',
      'Cahaya lewat topeng itu, jadi polanya mendarat di wafer sebagai terang dan bayangan.',
      'Wafernya dilapisi bahan peka cahaya yang berubah di tempat cahayanya mengenainya.',
      'Sisanya dicuci habis, dan gambarnya sekarang berdiri di atas silikon dalam bentuk bahan kimia.',
      'Dietsa, dan gambarnya masuk ke dalam silikonnya sendiri. Ulangi 30 kali dan jadilah 1 keping.',
    ],
  },
  'one-bit-machine': {
    name: 'mesin satu bit',
    aliases: ['satu bit dalam satu waktu', 'MC14500B', 'MC14500', '8051', 'Intel 8051'],
    what: 'Prosesor yang menangani satu bit dalam satu waktu — satu masukan, satu keluaran, segelintir instruksi.',
    why: 'Memalukan kalau disandingkan dengan apa pun isi laci itu, dan itu tidak jadi soal: ini yang pertama yang besok bisa mereka buat lagi. Cukup untuk menjalankan sebuah router, dan cuma itu yang dibutuhkan di batas jaringan.',
    real: 'MC14500B buatan Motorola, 1977 — unit kendali industri satu bit sungguhan dengan 16 instruksi. Intel 8051 tahun 1980 adalah leluhur yang satu lagi: satu komputer kecil utuh dalam satu chip, dan masih diproduksi sampai sekarang.',
    steps: [
      'Ingatan: daftar perintah, dan mesinnya membaca persis 1 di antaranya.',
      'Mesinnya mengambil 1 perintah itu. Tidak ada antrean, tidak ada yang berjalan bersamaan.',
      'Mesinnya mengerjakan 1 bit hitungan. Bukan 32, bukan 8. Satu.',
      'Jawabannya ditulis balik, lalu lanjut ke baris berikutnya. Lambat tidak sama dengan tidak mampu.',
    ],
  },
  'open-standard': {
    name: 'standar terbuka',
    aliases: ['diterbitkan', 'terbitkan'],
    what: 'Aturannya ditulis dan diberikan cuma-cuma, termasuk bagian yang gagal.',
    why: 'Tindakan terakhir proyek ini sekaligus satu-satunya pertahanannya yang awet. Jaringan yang tidak bisa menutup pintu bagi siapa pun tidak layak direbut, dan standar yang sudah dipakai semua orang tidak bisa ditarik kembali.',
    real: 'Seri RFC, sejak 1969 — diberi judul "Request for Comments" karena penulisnya sendiri tidak yakin mereka berhak menulisnya.',
    steps: [
      'Aturannya, ditulis lengkap: bentuk colokannya, arti bitnya, dan apa yang terjadi kalau ada yang salah.',
      'Disalin, dan diberikan gratis ke siapa pun yang meminta.',
      'Jadi siapa pun bisa membuat mesin yang ikut ke jaringan ini tanpa izin dari yang membangunnya duluan.',
      'Termasuk percobaan yang gagal, ikut ditulis juga — begitulah pembangun berikutnya tidak menghabiskan 3 tahun yang sama.',
    ],
  },
}
