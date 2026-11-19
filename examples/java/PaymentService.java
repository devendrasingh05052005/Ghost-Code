package com.ghostcode.demo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * GHOSTCODE Java Demonstration: Payment Gateway Transaction Processor
 * Contains intentional static defect candidates for autopsy:
 * - Unchecked null reference risk if currency is null
 * - Potential arithmetic exception if scale is omitted
 */
public class PaymentService {

    public static class Transaction {
        private final String id;
        private final BigDecimal amount;
        private final String currency;

        public Transaction(BigDecimal amount, String currency) {
            this.id = UUID.randomUUID().toString();
            this.amount = amount;
            this.currency = currency;
        }

        public String getId() { return id; }
        public BigDecimal getAmount() { return amount; }
        public String getCurrency() { return currency; }
    }

    public BigDecimal processFee(Transaction tx, BigDecimal feePercentage) {
        if (tx == null || tx.getAmount() == null) {
            throw new IllegalArgumentException("Transaction and amount cannot be null");
        }
        return tx.getAmount().multiply(feePercentage).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    public static void main(String[] args) {
        PaymentService service = new PaymentService();
        Transaction tx = new Transaction(new BigDecimal("1500.00"), "USD");
        BigDecimal fee = service.processFee(tx, new BigDecimal("2.5"));
        System.out.println("=== GHOSTCODE JAVA DEMO ===");
        System.out.println("Tx ID:  " + tx.getId());
        System.out.println("Amount: " + tx.getAmount() + " " + tx.getCurrency());
        System.out.println("Fee:    " + fee);
        System.out.println("=== JAVA DEMO COMPLETED ===");
    }
}
