// Built-in Demonstration TypeScript Service 07
export interface TransactionRecord_07 {
  accountId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  timestamp: number;
}

export class BankingServiceDemo_07 {
  private balance: number = 10000.00;
  public processTransaction(txn: TransactionRecord_07): boolean {
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
