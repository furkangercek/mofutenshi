// Legal/contact texts are PRE-LAUNCH PLACEHOLDERS: the owner must replace
// them with reviewed copy (mesafeli satış, KVKK) and a real support email
// before going live (docs/STATUS.md reminder).

export type StaticPageCopy = {
  title: string;
  description: string;
  sections: { heading?: string; paragraphs: string[]; email?: string }[];
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
      heading: "Topladığımız Veriler",
      paragraphs: [
        "Sipariş verirken paylaştığınız ad, e-posta, telefon ve teslimat adresi bilgileri ile hesap oluşturduğunuzda kaydettiğiniz bilgiler, siparişinizin işlenmesi ve size ulaştırılması amacıyla saklanır.",
      ],
    },
    {
      heading: "Verilerin Kullanımı",
      paragraphs: [
        "Verileriniz yalnızca siparişlerinizin yerine getirilmesi, hesabınızın yönetilmesi ve yasal yükümlülüklerimizin karşılanması için kullanılır. Verileriniz üçüncü taraflara pazarlama amacıyla aktarılmaz.",
      ],
    },
    {
      heading: "Üçüncü Taraflar",
      paragraphs: [
        "Ödeme işlemleri, lisanslı ödeme kuruluşları aracılığıyla gerçekleştirilir; kart bilgileriniz sistemlerimizde saklanmaz. Teslimat için gerekli bilgiler yalnızca anlaşmalı kargo firmasıyla paylaşılır.",
      ],
    },
    {
      heading: "Çerezler",
      paragraphs: [
        "Sitemiz, sepetinizin hatırlanması ve oturumunuzun yönetilmesi gibi temel işlevler için zorunlu çerezler kullanır.",
      ],
    },
    {
      heading: "Haklarınız",
      paragraphs: [
        "6698 sayılı KVKK kapsamında verilerinize erişme, düzeltme ve silme talep etme hakkına sahipsiniz. Talepleriniz için iletişim sayfamızdan bize ulaşabilirsiniz.",
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
        "Mesafeli satış sözleşmeleri kapsamında, ürünü teslim aldığınız tarihten itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. İade etmek istediğiniz ürünün kullanılmamış ve yeniden satılabilir durumda olması gerekir.",
        "İade talebiniz için iletişim sayfamızdan bize ulaşmanız yeterlidir; süreci birlikte yürütürüz. İade onaylandığında ücret, ödeme yaptığınız yönteme iade edilir.",
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
