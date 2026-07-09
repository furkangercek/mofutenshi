// Invoice PDF copy (R15). The PDF is invoice-styled but is NOT a registered
// e-Arşiv fatura — the owner issues the legal fatura via GİB per sale; this
// document mirrors it. Bracketed [PLACEHOLDER] fields need the owner's
// company details before launch (same set as src/lib/copy/legal.ts).

export const invoiceSellerInfo = {
  name: "[SATICI UNVANI — şirket kurulunca doldurulacak]",
  addressLines: ["[İŞYERİ ADRESİ]"],
  email: "destek@mofutenshi.com",
  phone: "[TELEFON]",
  taxOffice: "[VERGİ DAİRESİ]",
  taxNumber: "[VERGİ NO]",
  mersisNo: "[VARSA MERSİS NO]",
};

export const invoiceCopy = {
  documentTitle: "FATURA",
  fileName: (orderNumber: string) => `fatura-${orderNumber}.pdf`,
  invoiceNumberLabel: "Fatura No",
  invoiceDateLabel: "Fatura Tarihi",
  orderNumberLabel: "Sipariş No",
  sellerHeading: "Satıcı",
  buyerHeading: "Alıcı",
  taxOfficeLabel: "Vergi Dairesi / No",
  mersisLabel: "MERSİS No",
  emailLabel: "E-posta",
  phoneLabel: "Telefon",
  columns: {
    item: "Mal / Hizmet",
    quantity: "Miktar",
    unitPrice: "Birim Fiyat",
    kdvRate: "KDV",
    lineTotal: "Tutar",
  },
  shippingItem: "Kargo ücreti",
  couponItem: (code: string) => `İskonto — kupon ${code}`,
  netTotalLabel: "Mal / Hizmet Toplam Tutarı",
  kdvTotalLabel: (ratePercent: number) => `Hesaplanan KDV (%${ratePercent})`,
  grossTotalLabel: "Vergiler Dahil Toplam Tutar",
  payableLabel: "Ödenecek Tutar",
  paymentMethodLabel: "Ödeme Şekli",
  paymentMethods: {
    card: "Kredi / Banka Kartı",
    manual: "Havale / EFT",
  } as Record<string, string>,
  legalNote:
    "Bu belge bilgilendirme amaçlı düzenlenmiş olup e-Arşiv fatura yerine geçmez. Tüm fiyatlara KDV dahildir.",
};
