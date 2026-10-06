      *> Amortization Loan Record Copybook
       01 LOAN-SCHEDULE-RECORD.
          05 LOAN-ID                 PIC 9(10).
          05 LOAN-BORROWER-ID        PIC 9(09).
          05 LOAN-ORIGINAL-PRINCIPAL PIC 9(11)V99 COMP-3.
          05 LOAN-CURRENT-PRINCIPAL  PIC 9(11)V99 COMP-3.
          05 LOAN-ANNUAL-RATE        PIC 9(03)V9999 COMP-3.
          05 LOAN-TERM-MONTHS        PIC 9(04).
          05 LOAN-REMAINING-MONTHS   PIC 9(04).
          05 LOAN-MONTHLY-PAYMENT    PIC 9(09)V99 COMP-3.
          05 LOAN-TOTAL-INTEREST     PIC 9(11)V99 COMP-3.
          05 LOAN-ESCROW-MONTHLY     PIC 9(05)V99 COMP-3.
          05 LOAN-LATE-FEE           PIC 9(05)V99 COMP-3.
          05 LOAN-DELINQUENCY-DAYS   PIC 9(04).
          05 LOAN-STATUS             PIC X(01).
             88 LOAN-CURRENT         VALUE "C".
             88 LOAN-GRACE-PERIOD    VALUE "G".
             88 LOAN-DELINQUENT      VALUE "D".
             88 LOAN-DEFAULT         VALUE "F".
             88 LOAN-PAID-OFF        VALUE "P".
