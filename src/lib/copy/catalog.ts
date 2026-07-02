export const listingCopy = {
  allProductsTitle: "Tüm Ürünler",
  salesTitle: "İndirimler",
  salesDescription: "Şu anda indirimde olan tüm ürünler — kampanyalar otomatik güncellenir.",
  searchTitle: (q: string) => `"${q}" için sonuçlar`,
  tagDescription: (name: string) =>
    `${name} koleksiyonu — MofuTenshi atölyesinden el yapımı sanat ürünleri.`,
  searchEmptyQuery: "Arama",
  resultCount: (count: number) => `${count} ürün`,
  empty: "Aradığınız kriterlere uygun ürün bulunamadı.",
  emptyReset: "Filtreleri temizle",
  loadMore: "Daha fazla ürün",
  loading: "Yükleniyor…",
  nextPage: "Sonraki sayfa",
};

export const filterCopy = {
  sortLabel: "Sırala",
  sortNewest: "En yeni",
  sortPriceAsc: "Fiyat: artan",
  sortPriceDesc: "Fiyat: azalan",
  sortSaleFirst: "Önce indirimliler",
  minPrice: "En az ₺",
  maxPrice: "En çok ₺",
  onlyOnSale: "İndirimdekiler",
  onlyInStock: "Stoktakiler",
  apply: "Uygula",
  filtersLabel: "Filtreler",
  tagLabel: "Etiket",
  tagAll: "Tümü",
};

export const homeSectionCopy = {
  onSale: "İndirimdekiler",
  newArrivals: "Yeni Gelenler",
  bestSellers: "Çok Satanlar",
  featured: "Öne Çıkanlar",
  viewAll: "Tümünü gör",
};

export const productCopy = {
  saleBadge: "İndirim",
  inStock: "Stokta",
  outOfStock: "Tükendi",
  comboUnavailable: "Bu kombinasyon mevcut değil",
  addToCart: "Sepete Ekle",
  galleryImageLabel: (index: number) => `Görsel ${index + 1}`,
};

export const searchCopy = {
  placeholder: "Ürün ara…",
  submit: "Ara",
};
