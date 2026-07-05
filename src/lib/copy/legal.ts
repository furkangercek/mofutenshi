import type { StaticPageCopy } from "@/lib/copy/static-pages";

// Distance-sales legal documents drafted 2026-07-05 against 6502 sayılı
// TKHK + Mesafeli Sözleşmeler Yönetmeliği (incl. the 2025 amendment in
// force since 2026-01-01: return shipping is borne by the SELLER).
// Bracketed [PLACEHOLDER] fields need the owner's company details; the
// whole set needs a lawyer's review before launch (docs/STATUS.md).

const sellerInfoItems = [
  "Unvan: [SATICI UNVANI — şirket kurulunca doldurulacak]",
  "Adres: [İŞYERİ ADRESİ]",
  "E-posta: destek@mofutenshi.com",
  "Telefon: [TELEFON]",
  "Vergi Dairesi / No: [VERGİ DAİRESİ] / [VERGİ NO]",
  "MERSİS No: [VARSA MERSİS NO]",
];

export const onBilgilendirmeCopy: StaticPageCopy = {
  title: "Ön Bilgilendirme Formu",
  description:
    "6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca sipariş öncesi ön bilgilendirme formu.",
  sections: [
    {
      heading: "1. Konu",
      paragraphs: [
        "İşbu Ön Bilgilendirme Formu, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, mofutenshi.com internet sitesi üzerinden verilecek siparişlere ilişkin olarak tüketicinin sipariş vermeden önce bilgilendirilmesi amacıyla hazırlanmıştır.",
      ],
    },
    {
      heading: "2. Satıcı Bilgileri",
      paragraphs: [],
      items: sellerInfoItems,
    },
    {
      heading: "3. Ürün ve Fiyat Bilgileri",
      paragraphs: [
        "Sözleşme konusu ürünlerin temel nitelikleri ilgili ürün sayfasında yer alır. Sipariş özetinde; seçilen ürünler, adetleri ve tüm vergiler (KDV) dahil Türk Lirası satış fiyatları, uygulanmış indirimler ile birlikte açıkça gösterilir.",
        "Kargo ücreti sipariş özetinde ve ödeme adımında ayrıca gösterilir; belirtilen sepet tutarının üzerindeki siparişlerde kargo ücreti alınmaz. Ürün bedeli ve kargo ücreti dışında tüketiciden ek bir masraf talep edilmez.",
      ],
    },
    {
      heading: "4. Ödeme Yöntemleri",
      paragraphs: [
        "Ödeme, lisanslı ödeme kuruluşunun güvenli ödeme altyapısı üzerinden kredi kartı / banka kartı ile veya (aktif olduğu dönemlerde) banka havalesi/EFT ile yapılabilir. Kart bilgileri Satıcı tarafından görüntülenmez ve saklanmaz.",
        "Havale/EFT ile ödemede sipariş, ödemenin Satıcı hesabına geçtiğinin teyidiyle işleme alınır.",
      ],
    },
    {
      heading: "5. Teslimat",
      paragraphs: [
        "Ürünler, tüketicinin sipariş formunda belirttiği teslimat adresine [KARGO FİRMASI] aracılığıyla gönderilir. Siparişler, ödemenin onaylanmasından itibaren hedef olarak 1-3 iş günü içinde kargoya verilir; teslim süresi her hâlükârda sipariş tarihinden itibaren 30 (otuz) günü aşamaz.",
        "Ürünün süresinde teslim edilememesi hâlinde tüketici sözleşmeyi feshedebilir; bu durumda ödenen tüm bedeller gecikmeksizin iade edilir.",
      ],
    },
    {
      heading: "6. Cayma Hakkı",
      paragraphs: [
        "Tüketici, ürünün kendisine veya gösterdiği adresteki üçüncü kişiye teslim edildiği tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Birden fazla parçadan oluşan siparişlerde süre, son parçanın teslim tarihinden itibaren başlar. Tüketici, cayma süresi içinde malı işleyişine, teknik özelliklerine ve kullanım talimatlarına uygun şekilde kullandığı takdirde meydana gelen değişiklik ve bozulmalardan sorumlu değildir.",
        "Cayma bildirimi, süre dolmadan destek@mofutenshi.com adresine açık bir beyanla (ad, soyad, sipariş numarası belirtilerek) gönderilebilir.",
        "Tüketici, cayma bildirimini yönelttiği tarihten itibaren 10 (on) gün içinde ürünü Satıcıya geri göndermekle yükümlüdür. İade kargosunun Satıcının anlaşmalı taşıyıcısı [KARGO FİRMASI] ile yapılması hâlinde iade masrafı Satıcıya aittir; tüketiciden iade masrafı talep edilmez.",
        "Satıcı, cayma bildiriminin kendisine ulaştığı tarihten itibaren 14 (on dört) gün içinde, teslim masrafları da dahil olmak üzere tahsil edilen tüm ödemeleri, tüketicinin satın alırken kullandığı ödeme aracına uygun şekilde ve tüketiciye herhangi bir masraf yüklemeksizin iade eder.",
      ],
    },
    {
      heading: "7. Cayma Hakkının Kullanılamayacağı Hâller",
      paragraphs: [
        "Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca aşağıdaki hâllerde cayma hakkı kullanılamaz:",
      ],
      items: [
        "Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan (kişiye özel üretilen, isme/siparişe özel kişiselleştirilen) ürünler — ürün sayfasında bu nitelik açıkça belirtilir,",
        "Ambalajı tüketici tarafından açıldıktan sonra iadesi sağlık ve hijyen açısından uygun olmayan ürünler,",
        "Teslimden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan ürünler,",
        "Yönetmeliğin 15. maddesinde sayılan diğer hâller.",
      ],
    },
    {
      heading: "8. Şikâyet ve Uyuşmazlık",
      paragraphs: [
        "Tüketici, şikâyet ve taleplerini öncelikle destek@mofutenshi.com adresine iletebilir. Ayrıca tüketici; yerleşim yerinin bulunduğu veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetine (güncel parasal sınırlar dahilinde) veya Tüketici Mahkemesine başvurma hakkına sahiptir.",
      ],
    },
    {
      heading: "9. Geçerlilik",
      paragraphs: [
        "Tüketici, siparişi onaylamakla işbu formu okuduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder. İşbu form ve Mesafeli Satış Sözleşmesi, Satıcı tarafından elektronik ortamda saklanır ve tüketici talep ettiğinde kendisine iletilir.",
      ],
    },
  ],
};

export const mesafeliSatisCopy: StaticPageCopy = {
  title: "Mesafeli Satış Sözleşmesi",
  description:
    "mofutenshi.com üzerinden verilen siparişlere uygulanan mesafeli satış sözleşmesi (6502 sayılı Kanun).",
  sections: [
    {
      heading: "Madde 1 — Taraflar",
      paragraphs: [
        "SATICI:",
        "ALICI: Siparişi elektronik ortamda oluşturan; ad, soyad, teslimat adresi ve iletişim bilgileri sipariş formunda yer alan tüketici. Sipariş formu ve sipariş özeti işbu sözleşmenin ayrılmaz parçasıdır.",
      ],
      items: sellerInfoItems,
    },
    {
      heading: "Madde 2 — Konu",
      paragraphs: [
        "İşbu sözleşmenin konusu, ALICI'nın mofutenshi.com internet sitesinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.",
      ],
    },
    {
      heading: "Madde 3 — Sözleşme Konusu Ürün ve Bedel",
      paragraphs: [
        "Ürünlerin cinsi, türü, adedi ve tüm vergiler dahil Türk Lirası satış bedeli, sipariş özetinde ve sipariş onayında belirtildiği gibidir. Kargo ücreti, sipariş sırasında ayrıca gösterilir ve toplam bedele eklenir; belirtilen sepet tutarını aşan siparişlerde kargo ücreti alınmaz.",
      ],
    },
    {
      heading: "Madde 4 — Teslimat",
      paragraphs: [
        "Ürün, ALICI'nın sipariş formunda belirttiği adrese [KARGO FİRMASI] aracılığıyla teslim edilir. Teslim süresi her hâlükârda sipariş tarihinden itibaren 30 (otuz) günü aşamaz. Bu süre içinde teslim edilmeyen siparişlerde ALICI sözleşmeyi feshedebilir; ödenen bedeller gecikmeksizin iade edilir.",
        "Teslim anında ALICI'nın adresinde bulunmaması hâlinde dahi Satıcı edimini tam ve eksiksiz yerine getirmiş kabul edilir; teslim alınmayan ürünün kargo firmasında beklemesinden doğan giderler ALICI'ya aittir.",
      ],
    },
    {
      heading: "Madde 5 — Ödeme",
      paragraphs: [
        "Ödeme, lisanslı ödeme kuruluşunun güvenli altyapısı üzerinden kart ile veya (aktifse) havale/EFT ile yapılır. Kart bilgileri SATICI tarafından görüntülenmez ve saklanmaz. Ödemesi doğrulanmayan siparişler hazırlanmaz ve kargoya verilmez.",
      ],
    },
    {
      heading: "Madde 6 — Genel Hükümler",
      paragraphs: [
        "ALICI, sipariş öncesinde Ön Bilgilendirme Formu'nu okuyup elektronik ortamda teyit ettiğini kabul eder.",
        "ALICI, ürünü teslim aldığı anda kontrol etmekle; kargodan kaynaklanan hasar gördüğünde ürünü teslim almayarak kargo yetkilisine tutanak tutturmakla yükümlüdür. Aksi hâlde ürünün hasarsız ve sağlam teslim edildiği kabul edilir. Teslimden sonraki 48 saat içinde fotoğraf ile birlikte destek@mofutenshi.com adresine yapılan hasar bildirimleri değerlendirmeye alınır.",
        "ALICI'nın sipariş formunda yanlış veya eksik bilgi vermesinden doğan zararlardan ALICI sorumludur.",
      ],
    },
    {
      heading: "Madde 7 — Cayma Hakkı",
      paragraphs: [
        "ALICI, ürünün kendisine veya gösterdiği adresteki üçüncü kişiye teslim edildiği tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Birden fazla parçadan oluşan siparişlerde süre, son parçanın tesliminden itibaren işler.",
        "Cayma bildirimi, süresi içinde destek@mofutenshi.com adresine açık bir beyanla yöneltilir. ALICI, cayma bildirimini yönelttiği tarihten itibaren 10 (on) gün içinde ürünü; faturası, kutusu, ambalajı ve varsa standart aksesuarları ile birlikte SATICI'ya geri gönderir.",
        "İadenin SATICI'nın anlaşmalı taşıyıcısı [KARGO FİRMASI] ile yapılması hâlinde iade kargo masrafı SATICI'ya aittir. SATICI, cayma bildiriminin ulaştığı tarihten itibaren 14 (on dört) gün içinde, teslim masrafları dahil tahsil edilen tüm ödemeleri, ALICI'nın satın alırken kullandığı ödeme aracına uygun şekilde ve ALICI'ya masraf yüklemeksizin iade eder.",
        "ALICI, cayma süresi içinde ürünü işleyişine, teknik özelliklerine ve kullanım talimatlarına uygun şekilde kullandığı takdirde meydana gelen değişiklik ve bozulmalardan sorumlu değildir; olağan kontrol amaçlı kullanım dışındaki kullanımdan kaynaklanan değer kaybından sorumludur.",
      ],
    },
    {
      heading: "Madde 8 — Cayma Hakkının İstisnaları",
      paragraphs: [
        "Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca; ALICI'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan (kişiye özel üretilen veya kişiselleştirilen) ürünlerde, ambalajı açıldıktan sonra iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde ve maddede sayılan diğer hâllerde cayma hakkı kullanılamaz. Bir ürünün kişiye özel üretim olduğu, ilgili ürün sayfasında açıkça belirtilir.",
      ],
    },
    {
      heading: "Madde 9 — Mücbir Sebep",
      paragraphs: [
        "Tarafların kontrolü dışında gelişen, öngörülemeyen ve sözleşme yükümlülüklerinin yerine getirilmesini imkânsız kılan hâller (doğal afet, yangın, salgın, mevzuat değişikliği, genel ağ/altyapı kesintileri vb.) mücbir sebep sayılır. Mücbir sebep süresince yükümlülükler askıya alınır; hâlin 30 günü aşması durumunda taraflardan her biri sözleşmeyi tazminatsız feshedebilir.",
      ],
    },
    {
      heading: "Madde 10 — Uyuşmazlıkların Çözümü ve Yürürlük",
      paragraphs: [
        "İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dahilinde ALICI'nın yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri; sınırları aşan uyuşmazlıklarda Tüketici Mahkemeleri görevlidir.",
        "ALICI, siparişi onaylamakla işbu sözleşmenin tüm koşullarını kabul etmiş sayılır. Sözleşme, sipariş onayı ile elektronik ortamda kurulur ve SATICI tarafından saklanır.",
      ],
    },
  ],
};
