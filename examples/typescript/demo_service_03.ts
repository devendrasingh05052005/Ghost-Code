// Built-in Demonstration TypeScript Service 03
export interface TransactionRecord_03 {
  accountId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  timestamp: number;
}

export class BankingServiceDemo_03 {
  private balance: number = 10000.00;
  public processTransaction(txn: TransactionRecord_03): boolean {
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
