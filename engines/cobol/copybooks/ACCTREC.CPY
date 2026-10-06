      *> Standard Banking Master Account Copybook Layout
       01 ACCOUNT-RECORD.
          05 ACCT-NUMBER             PIC 9(10).
          05 ACCT-NAME               PIC X(35).
          05 ACCT-TYPE               PIC X(01).
             88 ACCT-CHECKING        VALUE "C".
             88 ACCT-SAVINGS         VALUE "S".
             88 ACCT-MONEY-MARKET    VALUE "M".
             88 ACCT-CERT-DEPOSIT    VALUE "D".
          05 ACCT-STATUS             PIC X(01).
             88 ACCT-ACTIVE          VALUE "A".
             88 ACCT-DORMANT         VALUE "D".
             88 ACCT-FROZEN          VALUE "F".
             88 ACCT-CLOSED          VALUE "C".
          05 ACCT-BALANCE            PIC S9(11)V99 COMP-3.
          05 ACCT-AVAILABLE-BAL      PIC S9(11)V99 COMP-3.
          05 ACCT-PENDING-HOLDS      PIC 9(09)V99  COMP-3.
          05 ACCT-OVERDRAFT-LIMIT    PIC 9(07)V99  COMP-3.
          05 ACCT-INTEREST-RATE      PIC 9(03)V9999 COMP-3.
          05 ACCT-ACCRUED-INTEREST   PIC 9(07)V99  COMP-3.
          05 ACCT-OPEN-DATE          PIC 9(08).
          05 ACCT-LAST-TXN-DATE      PIC 9(08).
          05 ACCT-BRANCH-ID          PIC 9(04).
          05 ACCT-CURRENCY-CODE      PIC X(03).
          05 ACCT-KYC-VERIFIED       PIC X(01).
             88 KYC-COMPLETE         VALUE "Y".
             88 KYC-PENDING          VALUE "N".
          05 ACCT-DAILY-WITHDRAW-LIMIT PIC 9(06)V99 COMP-3.
          05 ACCT-DAILY-WITHDRAW-TOTAL PIC 9(06)V99 COMP-3.
          05 ACCT-RISK-SCORE         PIC 9(03).
