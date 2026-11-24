/**
 * Tipe minimal untuk paket resmi `midtrans-client` (paket ini tidak menyertakan tipe sendiri).
 * Hanya bagian yang dipakai Boothify: Snap, createTransaction, dan Get Status.
 */
declare module "midtrans-client" {
  export type SnapConfig = {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  };

  export type SnapTransaction = {
    token: string;
    redirect_url: string;
  };

  /** Respons Get Status API / isi notifikasi HTTP Midtrans. Semua nilainya string dari Midtrans. */
  export type MidtransStatusResponse = {
    status_code?: string;
    status_message?: string;
    transaction_id?: string;
    order_id?: string;
    gross_amount?: string;
    payment_type?: string;
    transaction_time?: string;
    transaction_status?: string;
    fraud_status?: string;
    signature_key?: string;
    [key: string]: unknown;
  };

  export class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: Record<string, unknown>): Promise<SnapTransaction>;
    transaction: {
      status(orderIdOrTransactionId: string): Promise<MidtransStatusResponse>;
    };
  }

  const midtransClient: {
    Snap: typeof Snap;
  };
  export default midtransClient;
}
