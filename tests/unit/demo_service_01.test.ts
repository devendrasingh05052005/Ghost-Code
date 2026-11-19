// Unit Test Verification Suite for Demo Service 01
import { BankingServiceDemo_01 } from '../../examples/typescript/demo_service_01';

describe("BankingServiceDemo_01 Verification Suite", () => {
  it("should process valid credit deposits", () => {
    const service = new BankingServiceDemo_01();
    const success = service.processTransaction({ accountId: "101", amount: 500, type: "CREDIT", timestamp: Date.now() });
    expect(success).toBe(true);
    expect(service.getBalance()).toBe(10500);
  });
  it("should reject overdraft debits exceeding balance", () => {
    const service = new BankingServiceDemo_01();
    const success = service.processTransaction({ accountId: "101", amount: 50000, type: "DEBIT", timestamp: Date.now() });
    expect(success).toBe(false);
    expect(service.getBalance()).toBe(10000);
  });
});
