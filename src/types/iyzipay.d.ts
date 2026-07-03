// Minimal typings for the official iyzipay SDK (CJS, ships untyped) covering
// only the surface this project uses. The DefinitelyTyped package mistypes the
// checkout form API (demands paymentCard, omits paymentPageUrl), so we keep
// our own declaration verified against the SDK's own samples.
declare module "iyzipay" {
  namespace Iyzipay {
    interface CheckoutAddress {
      contactName: string;
      city: string;
      country: string;
      address: string;
      zipCode?: string;
    }

    interface CheckoutFormInitializeRequest {
      locale: string;
      conversationId: string;
      price: string;
      paidPrice: string;
      currency: string;
      basketId: string;
      paymentGroup: string;
      callbackUrl: string;
      buyer: {
        id: string;
        name: string;
        surname: string;
        gsmNumber?: string;
        email: string;
        identityNumber: string;
        registrationAddress: string;
        ip: string;
        city: string;
        country: string;
        zipCode?: string;
      };
      shippingAddress: CheckoutAddress;
      billingAddress: CheckoutAddress;
      basketItems: {
        id: string;
        name: string;
        category1: string;
        itemType: string;
        price: string;
      }[];
    }

    interface CheckoutFormInitializeResult {
      status: string;
      errorCode?: string;
      errorMessage?: string;
      token?: string;
      checkoutFormContent?: string;
      paymentPageUrl?: string;
    }

    interface CheckoutFormRetrieveResult {
      status: string;
      errorCode?: string;
      errorMessage?: string;
      token?: string;
      conversationId?: string;
      basketId?: string;
      paymentStatus?: string;
      paymentId?: string | number;
      paidPrice?: string | number;
    }
  }

  class Iyzipay {
    constructor(config: { apiKey: string; secretKey: string; uri: string });

    static readonly LOCALE: { TR: string; EN: string };
    static readonly CURRENCY: { TRY: string };
    static readonly PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static readonly BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };

    checkoutFormInitialize: {
      create(
        request: Iyzipay.CheckoutFormInitializeRequest,
        callback: (err: Error | null, result: Iyzipay.CheckoutFormInitializeResult) => void,
      ): void;
    };

    checkoutForm: {
      retrieve(
        request: { locale?: string; token: string },
        callback: (err: Error | null, result: Iyzipay.CheckoutFormRetrieveResult) => void,
      ): void;
    };
  }

  export = Iyzipay;
}
