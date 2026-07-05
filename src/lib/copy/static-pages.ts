// Legal/contact texts are PRE-LAUNCH PLACEHOLDERS: the owner must replace
// them with reviewed copy (mesafeli satış, KVKK) and a real support email
// before going live (docs/STATUS.md reminder).

export type StaticPageCopy = {
  title: string;
  description: string;
  sections: { heading?: string; paragraphs: string[]; items?: string[]; email?: string }[];
};

export const aboutCopy: StaticPageCopy = {
  title: "Hakkımızda",
  description:
    "MofuTenshi; figürler, el yapımı ürünler, sanat baskıları ve çıkartmalar üreten bağımsız bir sanat atölyesidir.",
  sections: [
    {
      paragraphs: [
        "MofuTenshi, sanatı günlük hayatın bir parçası haline getirmek için kurulmuş bağımsız bir atölyedir. Figürlerden el yapımı ürünlere, sanat baskılarından çıkartmalara kadar her parça, atölyemizde özenle tasarlanır ve üretilir.",
        "Küçük partiler halinde üretiyoruz; böylece her ürün, seri üretimin ulaşamayacağı bir özen ve karakter taşır. Amacımız, evinize astığınız ya da rafınıza koyduğunuz her parçanın size gerçekten iyi hissettirmesi.",
        "Sorularınız veya özel istekleriniz için iletişim sayfamızdan bize ulaşabilirsiniz.",
      ],
    },
  ],
};

export const contactCopy: StaticPageCopy = {
  title: "İletişim",
  description:
    "MofuTenshi ile iletişime geçin: sipariş, ürün ve iş birliği sorularınız için bize yazın.",
  sections: [
    {
      paragraphs: [
        "Siparişleriniz, ürünlerimiz veya iş birlikleri hakkında her türlü sorunuz için bize e-posta ile ulaşabilirsiniz. Mesajlara genellikle 1-2 iş günü içinde dönüş yapıyoruz.",
      ],
      email: "destek@mofutenshi.com",
    },
  ],
};

export const termsCopy: StaticPageCopy = {
  title: "Kullanım Koşulları",
  description: "MofuTenshi web sitesinin kullanım koşulları ve satış şartları.",
  sections: [
    {
      heading: "Kapsam",
      paragraphs: [
        "Bu koşullar, mofutenshi.com üzerinden yapılan alışverişler ve sitenin kullanımı için geçerlidir. Sitede sipariş vererek bu koşulları kabul etmiş sayılırsınız.",
      ],
    },
    {
      heading: "Fiyatlar ve Ödeme",
      paragraphs: [
        "Sitede görüntülenen tüm fiyatlar Türk Lirası cinsindendir ve KDV dahildir. İndirimli fiyatlar, ilgili kampanya süresince geçerlidir. Ödemeler, güvenli ödeme altyapısı üzerinden gerçekleştirilir.",
      ],
    },
    {
      heading: "Sipariş ve Teslimat",
      paragraphs: [
        "Siparişiniz, ödemenin onaylanmasının ardından hazırlanır ve kargo sayfamızda belirtilen süreler içinde gönderilir. Stok kaynaklı bir sorun olması halinde sizinle iletişime geçilir ve talebiniz doğrultusunda ücret iadesi yapılır.",
      ],
    },
    {
      heading: "Fikri Mülkiyet",
      paragraphs: [
        "Sitedeki tüm tasarımlar, görseller ve içerikler MofuTenshi'ye aittir; izinsiz kopyalanamaz ve çoğaltılamaz.",
      ],
    },
    {
      heading: "Değişiklikler",
      paragraphs: [
        "MofuTenshi bu koşulları güncelleme hakkını saklı tutar. Güncel koşullar her zaman bu sayfada yayımlanır.",
      ],
    },
  ],
};

export const privacyCopy: StaticPageCopy = {
  title: "Gizlilik Politikası",
  description:
    "MofuTenshi'nin kişisel verilerinizi nasıl işlediğine dair gizlilik politikası ve KVKK aydınlatma metni.",
  sections: [
    {
      heading: "1. Veri Sorumlusu",
      paragraphs: [
        "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla [SATICI UNVANI — şirket kurulunca doldurulacak] ([İŞYERİ ADRESİ]) tarafından aşağıda açıklanan kapsamda işlenir.",
      ],
    },
    {
      heading: "2. İşlenen Kişisel Veriler",
      paragraphs: [],
      items: [
        "Kimlik bilgileri: ad, soyad",
        "İletişim bilgileri: e-posta adresi, telefon numarası, teslimat/fatura adresi",
        "Müşteri işlem bilgileri: sipariş içeriği, sipariş numarası, sipariş geçmişi",
        "İşlem güvenliği bilgileri: IP adresi, oturum ve log kayıtları, şifrelenmiş parola",
      ],
    },
    {
      heading: "3. İşleme Amaçları ve Hukuki Sebepler",
      paragraphs: [
        "Kişisel verileriniz; siparişlerin alınması, hazırlanması ve teslimi, üyelik hesabının oluşturulması ve yönetimi, ödeme süreçlerinin yürütülmesi, sizinle sipariş hakkında iletişim kurulması, yasal yükümlülüklerin yerine getirilmesi ve olası uyuşmazlıklarda hakların kullanılması amaçlarıyla işlenir.",
        "İşleme; KVKK m. 5/2-c (sözleşmenin kurulması ve ifası), m. 5/2-ç (hukuki yükümlülüğün yerine getirilmesi), m. 5/2-e (bir hakkın tesisi, kullanılması veya korunması) ve m. 5/2-f (meşru menfaat) hukuki sebeplerine dayanır. Pazarlama amaçlı işleme ve ticari elektronik ileti gönderimi yapılmamaktadır.",
      ],
    },
    {
      heading: "4. Verilerin Aktarılması",
      paragraphs: [
        "Kişisel verileriniz; teslimat için anlaşmalı kargo firmasına, ödemenin gerçekleştirilmesi için lisanslı ödeme kuruluşuna (kart bilgileri sistemlerimizde saklanmaz) ve yasal zorunluluk hâlinde yetkili kurum ve kuruluşlara aktarılabilir.",
        "Sitenin barındırma, içerik dağıtım (CDN), görsel depolama ve benzeri altyapı hizmetleri yurt dışında yerleşik hizmet sağlayıcılardan alınmaktadır; bu kapsamda veriler KVKK m. 9'daki şartlara ve Kurulca öngörülen uygun güvencelere tabi olarak yurt dışına aktarılabilir.",
      ],
    },
    {
      heading: "5. Toplama Yöntemi",
      paragraphs: [
        "Verileriniz; üyelik, sipariş ve iletişim formları aracılığıyla ile sitenin çalışması için zorunlu çerezler üzerinden, kısmen otomatik yollarla toplanır.",
      ],
    },
    {
      heading: "6. Çerezler",
      paragraphs: [
        "Sitemiz yalnızca zorunlu çerezler kullanır: sepetinizin hatırlanması ve oturumunuzun güvenli şekilde yürütülmesi için gerekli olan çerezler. Pazarlama veya profilleme amaçlı çerez kullanılmaz. Zorunlu çerezler için açık rıza gerekmez; tarayıcınızdan çerezleri silebilir veya engelleyebilirsiniz, ancak bu durumda sepet ve oturum işlevleri çalışmaz.",
      ],
    },
    {
      heading: "7. Saklama Süreleri",
      paragraphs: [
        "Üyelik verileri üyelik süresince; sipariş ve fatura kayıtları ile elektronik ticaret işlem kayıtları ilgili mevzuatta öngörülen yasal saklama süreleri boyunca saklanır ve sürenin sonunda silinir, yok edilir veya anonim hâle getirilir.",
      ],
    },
    {
      heading: "8. KVKK Kapsamındaki Haklarınız",
      paragraphs: ["KVKK m. 11 uyarınca; kişisel verilerinizin:"],
      items: [
        "işlenip işlenmediğini öğrenme ve buna ilişkin bilgi talep etme,",
        "işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
        "yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,",
        "eksik veya yanlış işlenmişse düzeltilmesini isteme,",
        "KVKK m. 7 çerçevesinde silinmesini veya yok edilmesini isteme,",
        "otomatik sistemlerce analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,",
        "kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.",
      ],
    },
    {
      heading: "9. Başvuru",
      paragraphs: [
        "Taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak destek@mofutenshi.com adresine veya [İŞYERİ ADRESİ] adresine yazılı olarak iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.",
      ],
    },
  ],
};

export const shippingReturnsCopy: StaticPageCopy = {
  title: "Kargo ve İade",
  description: "MofuTenshi kargo süreleri, ücretsiz kargo koşulları ve iade politikası.",
  sections: [
    {
      heading: "Kargo",
      paragraphs: [
        "Siparişleriniz, ödemenin onaylanmasının ardından 1-3 iş günü içinde kargoya verilir. Kargo ücreti sepet sayfasında ve ödeme adımında açıkça gösterilir; belirli bir sepet tutarının üzerindeki siparişlerde kargo ücretsizdir.",
      ],
    },
    {
      heading: "İade ve Cayma Hakkı",
      paragraphs: [
        "Ürünü teslim aldığınız tarihten itibaren 14 gün içinde, gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz. Cayma bildiriminizi sipariş numaranızla birlikte destek@mofutenshi.com adresine iletmeniz yeterlidir; ürünü bildirimden itibaren 10 gün içinde anlaşmalı kargo firmamız [KARGO FİRMASI] ile göndermeniz gerekir. İade kargo ücreti bize aittir — sizden iade masrafı alınmaz.",
        "İade edilen bedel (ödediğiniz kargo ücreti dahil), cayma bildiriminizin bize ulaşmasından itibaren en geç 14 gün içinde, ödeme yaptığınız yönteme iade edilir.",
        "Kişiye özel üretilen veya kişiselleştirilen ürünlerde cayma hakkı bulunmaz; bu durum ilgili ürünün sayfasında açıkça belirtilir. Ayrıntılar için Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu sayfalarına bakabilirsiniz.",
      ],
    },
    {
      heading: "Hasarlı veya Hatalı Ürün",
      paragraphs: [
        "Ürününüz hasarlı ulaştıysa veya siparişinizde bir hata varsa, teslimattan sonraki 48 saat içinde fotoğrafla birlikte bize bildirin; ücretsiz değişim veya iade sağlanır.",
      ],
    },
  ],
};
