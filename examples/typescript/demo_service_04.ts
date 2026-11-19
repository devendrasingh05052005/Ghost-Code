// Built-in Demonstration TypeScript Service 04
export interface TransactionRecord_04 {
  accountId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  timestamp: number;
}

export class BankingServiceDemo_04 {
  private balance: number = 10000.00;
  public processTransaction(txn: TransactionRecord_04): boolean {
    if (txn.amount <= 0) return false;
    if (txn.type === "DEBIT") {
      if (this.balance < txn.amount) return false;
      this.balance -= txn.amount;
    } else {
      this.balance += txn.amount;
    }
    return true;
  }
  public getBalance(): number {
    return this.balance;
  }
}
