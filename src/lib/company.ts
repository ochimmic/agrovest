// Official AgroVest settlement accounts shown to users at checkout.

export type BankAccount = {
  available: boolean;
  currency: "NGN" | "USD";
  bankName: string;
  accountName: string;
  accountNumber: string;
  swift?: string;
};

export const NGN_ACCOUNT: BankAccount = {
  available: true,
  currency: "NGN",
  bankName: "Fidelity Bank",
  accountName: "Doxapearl Global Ltd",
  accountNumber: "5601407167",
};

export const USD_ACCOUNT: BankAccount = {
  available: false,
  currency: "USD",
  bankName: "Domiciliary account — coming soon",
  accountName: "Doxapearl Global Ltd",
  accountNumber: "",
};

export const SUPPORT_PHONE = "+2348000000000";
