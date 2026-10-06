      *> Financial Transaction Record Layout Copybook
       01 TRANSACTION-RECORD.
          05 TXN-ID                  PIC X(16).
          05 TXN-ACCT-NUMBER         PIC 9(10).
          05 TXN-TIMESTAMP           PIC 9(14).
          05 TXN-TYPE                PIC X(02).
             88 TXN-DEPOSIT          VALUE "DP".
             88 TXN-WITHDRAWAL       VALUE "WD".
             88 TXN-TRANSFER-OUT     VALUE "TO".
             88 TXN-TRANSFER-IN      VALUE "TI".
             88 TXN-INTEREST-CREDIT  VALUE "IC".
             88 TXN-FEE-ASSESSMENT   VALUE "FA".
          05 TXN-AMOUNT              PIC S9(11)V99 COMP-3.
          05 TXN-FEE-AMOUNT          PIC 9(05)V99  COMP-3.
          05 TXN-POSTING-STATUS      PIC X(01).
             88 TXN-STATUS-PENDING   VALUE "P".
             88 TXN-STATUS-POSTED    VALUE "C".
             88 TXN-STATUS-REJECTED  VALUE "R".
             88 TXN-STATUS-REVERSED  VALUE "V".
          05 TXN-REJECT-REASON       PIC X(30).
          05 TXN-MERCHANT-CATEGORY   PIC 9(04).
          05 TXN-TERMINAL-ID         PIC X(08).
          05 TXN-AUTH-CODE           PIC X(06).
