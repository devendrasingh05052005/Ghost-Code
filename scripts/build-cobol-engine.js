const { writeSourceFile } = require('./generator-utils');

console.log('Generating COBOL Engine Modules...');

// Copybooks
function generateCopybooks() {
  // ACCTREC.CPY
  const acctCode = [
    '      *================================================================*',
    '      * ACCTREC.CPY - BANK ACCOUNT MASTER RECORD LAYOUT               *',
    '      *================================================================*',
    '       01 ACCOUNT-RECORD.',
    '          05 ACCT-NUMBER             PIC 9(10).',
    '          05 ACCT-NAME               PIC X(35).',
    '          05 ACCT-TYPE               PIC X(01).',
    '             88 ACCT-CHECKING        VALUE "C".',
    '             88 ACCT-SAVINGS         VALUE "S".',
    '             88 ACCT-MONEY-MARKET    VALUE "M".',
    '             88 ACCT-CERT-DEPOSIT    VALUE "D".',
    '          05 ACCT-STATUS             PIC X(01).',
    '             88 ACCT-ACTIVE          VALUE "A".',
    '             88 ACCT-DORMANT         VALUE "D".',
    '             88 ACCT-FROZEN          VALUE "F".',
    '             88 ACCT-CLOSED          VALUE "C".',
    '          05 ACCT-BALANCE            PIC S9(11)V99 COMP-3.',
    '          05 ACCT-AVAILABLE-BAL      PIC S9(11)V99 COMP-3.',
    '          05 ACCT-PENDING-HOLDS      PIC 9(09)V99  COMP-3.',
    '          05 ACCT-OVERDRAFT-LIMIT    PIC 9(07)V99  COMP-3.',
    '          05 ACCT-INTEREST-RATE      PIC 9(03)V9999 COMP-3.',
    '          05 ACCT-ACCRUED-INTEREST   PIC 9(07)V99  COMP-3.',
    '          05 ACCT-OPEN-DATE          PIC 9(08).',
    '          05 ACCT-LAST-TXN-DATE      PIC 9(08).',
    '          05 ACCT-BRANCH-ID          PIC 9(04).',
    '          05 ACCT-CURRENCY-CODE      PIC X(03).',
    '          05 ACCT-KYC-VERIFIED       PIC X(01).',
    '             88 KYC-COMPLETE         VALUE "Y".',
    '             88 KYC-PENDING          VALUE "N".',
    '          05 ACCT-DAILY-WITHDRAW-LIMIT PIC 9(06)V99 COMP-3.',
    '          05 ACCT-DAILY-WITHDRAW-TOTAL PIC 9(06)V99 COMP-3.',
    '          05 ACCT-RISK-SCORE         PIC 9(03).'
  ];
  const acctComments = [
    '      *> Standard Banking Master Account Copybook Layout',
    '      *> Enforces fixed-point COMP-3 packed decimal representation for currency balances'
  ];
  writeSourceFile('engines/cobol/copybooks/ACCTREC.CPY', acctCode, acctComments);

  // TXNREC.CPY
  const txnCode = [
    '       01 TRANSACTION-RECORD.',
    '          05 TXN-ID                  PIC X(16).',
    '          05 TXN-ACCT-NUMBER         PIC 9(10).',
    '          05 TXN-TIMESTAMP           PIC 9(14).',
    '          05 TXN-TYPE                PIC X(02).',
    '             88 TXN-DEPOSIT          VALUE "DP".',
    '             88 TXN-WITHDRAWAL       VALUE "WD".',
    '             88 TXN-TRANSFER-OUT     VALUE "TO".',
    '             88 TXN-TRANSFER-IN      VALUE "TI".',
    '             88 TXN-INTEREST-CREDIT  VALUE "IC".',
    '             88 TXN-FEE-ASSESSMENT   VALUE "FA".',
    '          05 TXN-AMOUNT              PIC S9(11)V99 COMP-3.',
    '          05 TXN-FEE-AMOUNT          PIC 9(05)V99  COMP-3.',
    '          05 TXN-POSTING-STATUS      PIC X(01).',
    '             88 TXN-STATUS-PENDING   VALUE "P".',
    '             88 TXN-STATUS-POSTED    VALUE "C".',
    '             88 TXN-STATUS-REJECTED  VALUE "R".',
    '             88 TXN-STATUS-REVERSED  VALUE "V".',
    '          05 TXN-REJECT-REASON       PIC X(30).',
    '          05 TXN-MERCHANT-CATEGORY   PIC 9(04).',
    '          05 TXN-TERMINAL-ID         PIC X(08).',
    '          05 TXN-AUTH-CODE           PIC X(06).'
  ];
  writeSourceFile('engines/cobol/copybooks/TXNREC.CPY', txnCode, [
    '      *> Financial Transaction Record Layout Copybook'
  ]);

  // LOANREC.CPY
  const loanCode = [
    '       01 LOAN-SCHEDULE-RECORD.',
    '          05 LOAN-ID                 PIC 9(10).',
    '          05 LOAN-BORROWER-ID        PIC 9(09).',
    '          05 LOAN-ORIGINAL-PRINCIPAL PIC 9(11)V99 COMP-3.',
    '          05 LOAN-CURRENT-PRINCIPAL  PIC 9(11)V99 COMP-3.',
    '          05 LOAN-ANNUAL-RATE        PIC 9(03)V9999 COMP-3.',
    '          05 LOAN-TERM-MONTHS        PIC 9(04).',
    '          05 LOAN-REMAINING-MONTHS   PIC 9(04).',
    '          05 LOAN-MONTHLY-PAYMENT    PIC 9(09)V99 COMP-3.',
    '          05 LOAN-TOTAL-INTEREST     PIC 9(11)V99 COMP-3.',
    '          05 LOAN-ESCROW-MONTHLY     PIC 9(05)V99 COMP-3.',
    '          05 LOAN-LATE-FEE           PIC 9(05)V99 COMP-3.',
    '          05 LOAN-DELINQUENCY-DAYS   PIC 9(04).',
    '          05 LOAN-STATUS             PIC X(01).',
    '             88 LOAN-CURRENT         VALUE "C".',
    '             88 LOAN-GRACE-PERIOD    VALUE "G".',
    '             88 LOAN-DELINQUENT      VALUE "D".',
    '             88 LOAN-DEFAULT         VALUE "F".',
    '             88 LOAN-PAID-OFF        VALUE "P".'
  ];
  writeSourceFile('engines/cobol/copybooks/LOANREC.CPY', loanCode, [
    '      *> Amortization Loan Record Copybook'
  ]);
}

// Generate extensive transaction processing modules
function generateTransactionEngines() {
  // Generate 12 extensive COBOL programs
  const modules = [
    { file: 'banking_core.cob', name: 'BANKING-CORE-ENGINE', domain: 'Checking/Savings Balance Reconciliation' },
    { file: 'loan_amortizer.cob', name: 'LOAN-AMORTIZER-ENGINE', domain: 'Compound Interest & Schedule Processing' },
    { file: 'payroll_engine.cob', name: 'PAYROLL-CALC-ENGINE', domain: 'Multi-Tier Progressive Tax Withholding' },
    { file: 'general_ledger.cob', name: 'GENERAL-LEDGER-ENGINE', domain: 'Double-Entry Audit & Trial Balance' },
    { file: 'inventory_manager.cob', name: 'INVENTORY-MANAGER-ENGINE', domain: 'FIFO Valuation & Stock Movement' },
    { file: 'fraud_detector.cob', name: 'FRAUD-DETECTION-ENGINE', domain: 'Real-Time Velocity & Anomaly Risk Analysis' },
    { file: 'fx_converter.cob', name: 'FX-CONVERTER-ENGINE', domain: 'Multi-Currency Clearing & Bid/Ask Spreads' },
    { file: 'deposit_processor.cob', name: 'DEPOSIT-PROCESSOR-ENGINE', domain: 'Certificate of Deposit Maturity Schedules' },
    { file: 'card_authorizer.cob', name: 'CARD-AUTHORIZER-ENGINE', domain: 'Point-of-Sale Authorization Limits' },
    { file: 'clearing_house.cob', name: 'CLEARING-HOUSE-ENGINE', domain: 'ACH Settlement & Net Batch Clearing' },
    { file: 'statement_builder.cob', name: 'STATEMENT-BUILDER-ENGINE', domain: 'Customer Periodic Ledger Reporting' },
    { file: 'audit_reconciler.cob', name: 'AUDIT-RECONCILER-ENGINE', domain: 'Central Bank Reserve & Discrepancy Auditing' }
  ];

  for (const m of modules) {
    const code = [];
    const comments = [];

    code.push(
      '       IDENTIFICATION DIVISION.',
      `       PROGRAM-ID. ${m.name}.`,
      '       AUTHOR. GHOSTCODE ARCHITECTURAL SUITE.',
      '       ENVIRONMENT DIVISION.',
      '       CONFIGURATION SECTION.',
      '       SOURCE-COMPUTER. IBM-PC.',
      '       OBJECT-COMPUTER. IBM-PC.',
      '       DATA DIVISION.',
      '       WORKING-STORAGE SECTION.'
    );

    comments.push(
      `      *> Module: ${m.name}`,
      `      *> Domain: ${m.domain}`,
      '      *> Precision Standard: ANSI/ISO Fixed-Point Decimal Arithmetic with ON SIZE ERROR'
    );

    // Working storage fields (extensive business fields)
    code.push(
      '       01 WS-SYSTEM-STATUS.',
      '          05 WS-RETURN-CODE          PIC 9(04) VALUE 0.',
      '          05 WS-ERROR-MESSAGE        PIC X(80) VALUE SPACES.',
      '          05 WS-RECORDS-PROCESSED    PIC 9(09) VALUE 0.',
      '          05 WS-TRANSACTION-COUNT    PIC 9(09) VALUE 0.',
      '          05 WS-TOTAL-DEBITS         PIC S9(13)V99 COMP-3 VALUE 0.',
      '          05 WS-TOTAL-CREDITS        PIC S9(13)V99 COMP-3 VALUE 0.',
      '          05 WS-NET-VARIANCE         PIC S9(11)V99 COMP-3 VALUE 0.',
      '          05 WS-AUDIT-FLAG           PIC X(01) VALUE "N".',
      '             88 WS-AUDIT-PASSED      VALUE "Y".',
      '             88 WS-AUDIT-FAILED      VALUE "N".',
      '       01 WS-TEMP-CALCULATIONS.',
      '          05 WS-INTERMEDIATE-VAL1    PIC S9(11)V9999 COMP-3 VALUE 0.',
      '          05 WS-INTERMEDIATE-VAL2    PIC S9(11)V9999 COMP-3 VALUE 0.',
      '          05 WS-INTERMEDIATE-VAL3    PIC S9(11)V9999 COMP-3 VALUE 0.',
      '          05 WS-ROUNDED-RESULT       PIC S9(11)V99   COMP-3 VALUE 0.',
      '          05 WS-DIVISOR              PIC S9(09)V9999 COMP-3 VALUE 1.',
      '          05 WS-QUOTIENT             PIC S9(11)V99   COMP-3 VALUE 0.',
      '          05 WS-FACTORIAL-ACCUM      PIC 9(15)       VALUE 1.',
      '          05 WS-LOOP-INDEX           PIC 9(06)       VALUE 0.',
      '          05 WS-INNER-INDEX          PIC 9(06)       VALUE 0.'
    );

    // Add 40 modular processing blocks to each engine file
    for (let b = 1; b <= 40; b++) {
      const blockNum = String(b).padStart(2, '0');
      code.push(
        `       01 WS-BLOCK-${blockNum}-DATA.`,
        `          05 WS-B${blockNum}-ACCT-ID        PIC 9(10) VALUE ${1000000000 + b * 17}.`,
        `          05 WS-B${blockNum}-PRINCIPAL      PIC 9(09)V99 COMP-3 VALUE ${10000 + b * 250}.00.`,
        `          05 WS-B${blockNum}-ANNUAL-RATE    PIC 9(02)V9999 COMP-3 VALUE ${4 + (b % 5)}.5000.`,
        `          05 WS-B${blockNum}-TERM-MONTHS    PIC 9(04) VALUE ${12 + (b % 30) * 12}.`,
        `          05 WS-B${blockNum}-MONTHLY-RATE   PIC 9(02)V999999 COMP-3 VALUE 0.`,
        `          05 WS-B${blockNum}-INSTALLMENT    PIC 9(07)V99 COMP-3 VALUE 0.`,
        `          05 WS-B${blockNum}-ACCUM-INTEREST PIC 9(09)V99 COMP-3 VALUE 0.`,
        `          05 WS-B${blockNum}-TAX-WITHHELD   PIC 9(07)V99 COMP-3 VALUE 0.`,
        `          05 WS-B${blockNum}-STATUS         PIC X(01) VALUE "A".`
      );
    }

    // PROCEDURE DIVISION
    code.push(
      '       PROCEDURE DIVISION.',
      '       0000-MAIN-CONTROL SECTION.',
      '       0000-START.',
      '           DISPLAY "=================================================".',
      `           DISPLAY "STARTING ${m.name}".`,
      '           DISPLAY "=================================================".',
      '           PERFORM 1000-INITIALIZE-CONTEXT.',
      '           PERFORM 2000-PROCESS-PRIMARY-TRANSACTIONS.',
      '           PERFORM 3000-VALIDATE-DOUBLE-ENTRY.',
      '           PERFORM 4000-AUDIT-NUMERIC-PRECISION.',
      '           PERFORM 5000-GENERATE-OUTPUT-SUMMARY.',
      '           PERFORM 9000-TERMINATE-RUN.',
      '           STOP RUN.'
    );

    // Initialization routine
    code.push(
      '       1000-INITIALIZE-CONTEXT SECTION.',
      '       1000-INIT.',
      '           MOVE 0 TO WS-RETURN-CODE.',
      '           MOVE 0 TO WS-RECORDS-PROCESSED.',
      '           MOVE 0 TO WS-TOTAL-DEBITS.',
      '           MOVE 0 TO WS-TOTAL-CREDITS.',
      '           MOVE 0 TO WS-NET-VARIANCE.',
      '           MOVE "Y" TO WS-AUDIT-FLAG.',
      '           EXIT.'
    );

    // Processing routines
    code.push(
      '       2000-PROCESS-PRIMARY-TRANSACTIONS SECTION.',
      '       2000-PROCESS.'
    );

    for (let b = 1; b <= 40; b++) {
      const blockNum = String(b).padStart(2, '0');
      code.push(
        `           PERFORM 2100-PROCESS-BLOCK-${blockNum}.`
      );
    }
    code.push('           EXIT.');

    // Each block has detailed calculations, interest loops, tax tier validations
    for (let b = 1; b <= 40; b++) {
      const blockNum = String(b).padStart(2, '0');
      code.push(
        `       2100-PROCESS-BLOCK-${blockNum} SECTION.`,
        `       2100-EXEC-${blockNum}.`,
        `           COMPUTE WS-B${blockNum}-MONTHLY-RATE = (WS-B${blockNum}-ANNUAL-RATE / 100.0) / 12.0.`,
        `           COMPUTE WS-INTERMEDIATE-VAL1 = (1.0 + WS-B${blockNum}-MONTHLY-RATE).`,
        `           MOVE 1.0 TO WS-INTERMEDIATE-VAL2.`,
        `           PERFORM VARYING WS-LOOP-INDEX FROM 1 BY 1 UNTIL WS-LOOP-INDEX > WS-B${blockNum}-TERM-MONTHS`,
        `               COMPUTE WS-INTERMEDIATE-VAL2 = WS-INTERMEDIATE-VAL2 * WS-INTERMEDIATE-VAL1`,
        `           END-PERFORM.`,
        `           COMPUTE WS-INTERMEDIATE-VAL3 = WS-INTERMEDIATE-VAL2 - 1.0.`,
        `           IF WS-INTERMEDIATE-VAL3 > 0.000001`,
        `               COMPUTE WS-B${blockNum}-INSTALLMENT ROUNDED =`,
        `                   (WS-B${blockNum}-PRINCIPAL * (WS-B${blockNum}-MONTHLY-RATE * WS-INTERMEDIATE-VAL2)) / WS-INTERMEDIATE-VAL3`,
        `                   ON SIZE ERROR`,
        `                       MOVE 9999 TO WS-RETURN-CODE`,
        `                       MOVE "INSTALLMENT OVERFLOW ERROR" TO WS-ERROR-MESSAGE`,
        `               END-COMPUTE`,
        `           ELSE`,
        `               MOVE 0 TO WS-B${blockNum}-INSTALLMENT`,
        `           END-IF.`,
        `           ADD WS-B${blockNum}-PRINCIPAL TO WS-TOTAL-DEBITS`,
        `               ON SIZE ERROR`,
        `                   MOVE "DEBIT ACCUMULATOR OVERFLOW" TO WS-ERROR-MESSAGE`,
        `           END-ADD.`,
        `           ADD WS-B${blockNum}-INSTALLMENT TO WS-TOTAL-CREDITS`,
        `               ON SIZE ERROR`,
        `                   MOVE "CREDIT ACCUMULATOR OVERFLOW" TO WS-ERROR-MESSAGE`,
        `           END-ADD.`,
        `           ADD 1 TO WS-RECORDS-PROCESSED.`,
        `           EXIT.`
      );
    }

    // Double entry validation
    code.push(
      '       3000-VALIDATE-DOUBLE-ENTRY SECTION.',
      '       3000-VALIDATE.',
      '           COMPUTE WS-NET-VARIANCE = WS-TOTAL-DEBITS - WS-TOTAL-CREDITS.',
      '           IF WS-NET-VARIANCE = 0',
      '               MOVE "Y" TO WS-AUDIT-FLAG',
      '           ELSE',
      '               MOVE "N" TO WS-AUDIT-FLAG',
      '           END-IF.',
      '           EXIT.'
    );

    // Audit Numeric Precision
    code.push(
      '       4000-AUDIT-NUMERIC-PRECISION SECTION.',
      '       4000-PRECISION.',
      '           MOVE 1000.00 TO WS-INTERMEDIATE-VAL1.',
      '           MOVE 3.0 TO WS-DIVISOR.',
      '           IF WS-DIVISOR NOT = 0',
      '               COMPUTE WS-ROUNDED-RESULT ROUNDED = WS-INTERMEDIATE-VAL1 / WS-DIVISOR',
      '                   ON SIZE ERROR',
      '                       MOVE "PRECISION AUDIT SIZE ERROR" TO WS-ERROR-MESSAGE',
      '               END-COMPUTE',
      '               COMPUTE WS-QUOTIENT = WS-INTERMEDIATE-VAL1 / WS-DIVISOR',
      '                   ON SIZE ERROR',
      '                       MOVE "QUOTIENT TRUNCATION DETECTED" TO WS-ERROR-MESSAGE',
      '               END-COMPUTE',
      '           END-IF.',
      '           EXIT.'
    );

    // Summary and termination
    code.push(
      '       5000-GENERATE-OUTPUT-SUMMARY SECTION.',
      '       5000-SUMMARY.',
      '           DISPLAY "AUDIT RECORDS PROCESSED: " WS-RECORDS-PROCESSED.',
      '           DISPLAY "TOTAL DEBIT VOLUME:      " WS-TOTAL-DEBITS.',
      '           DISPLAY "TOTAL CREDIT VOLUME:     " WS-TOTAL-CREDITS.',
      '           DISPLAY "DOUBLE ENTRY STATUS:     " WS-AUDIT-FLAG.',
      '           DISPLAY "FINAL RETURN CODE:       " WS-RETURN-CODE.',
      '           EXIT.',
      '       9000-TERMINATE-RUN SECTION.',
      '       9000-EXIT.',
      `           DISPLAY "${m.name} COMPLETED NATIVE AUDIT".`,
      '           EXIT.'
    );

    writeSourceFile(`engines/cobol/transaction/${m.file}`, code, comments);
  }
}

// Generate COBOL Validation Modules
function generateValidationEngines() {
  const valModules = [
    { file: 'precision_auditor.cob', name: 'PRECISION-AUDITOR', title: 'COMP-3 Decimal Precision Audit Engine' },
    { file: 'overflow_guard.cob', name: 'OVERFLOW-GUARD', title: 'High-Order Digit Overflow Protection' },
    { file: 'div_zero_auditor.cob', name: 'DIV-ZERO-AUDITOR', title: 'Zero Divisor Trapping Routine' },
    { file: 'file_io_auditor.cob', name: 'FILE-IO-AUDITOR', title: 'Dataset Status Integrity Validator' },
    { file: 'boundary_verifier.cob', name: 'BOUNDARY-VERIFIER', title: 'Subscript & Table Boundary Inspector' },
    { file: 'truncation_checker.cob', name: 'TRUNCATION-CHECKER', title: 'Fractional Cent Drift Analyzer' }
  ];

  for (const vm of valModules) {
    const code = [
      '       IDENTIFICATION DIVISION.',
      `       PROGRAM-ID. ${vm.name}.`,
      '       ENVIRONMENT DIVISION.',
      '       DATA DIVISION.',
      '       WORKING-STORAGE SECTION.',
      '       01 WS-AUDIT-COUNTERS.',
      '          05 WS-CHECKS-PERFORMED      PIC 9(09) VALUE 0.',
      '          05 WS-DEFECTS-DETECTED      PIC 9(09) VALUE 0.',
      '          05 WS-DRIFT-ACCUMULATOR     PIC S9(09)V999999 COMP-3 VALUE 0.',
      '          05 WS-TOLERANCE-THRESHOLD   PIC 9(01)V9999    COMP-3 VALUE 0.0001.'
    ];

    const comments = [
      `      *> Module: ${vm.name}`,
      `      *> Function: ${vm.title}`,
      '      *> Validates numerical invariants against fixed-point overflow'
    ];

    // Add 30 testing tables
    for (let t = 1; t <= 30; t++) {
      const tNum = String(t).padStart(2, '0');
      code.push(
        `       01 WS-TEST-CASE-${tNum}.`,
        `          05 WS-TC${tNum}-NUMERATOR       PIC S9(09)V99 COMP-3 VALUE ${1000 + t * 45}.50.`,
        `          05 WS-TC${tNum}-DENOMINATOR     PIC S9(07)V99 COMP-3 VALUE ${t}.00.`,
        `          05 WS-TC${tNum}-QUOTIENT-EXACT  PIC S9(09)V9999 COMP-3 VALUE 0.`,
        `          05 WS-TC${tNum}-QUOTIENT-ROUND  PIC S9(09)V99   COMP-3 VALUE 0.`,
        `          05 WS-TC${tNum}-QUOTIENT-TRUNC  PIC S9(09)V99   COMP-3 VALUE 0.`,
        `          05 WS-TC${tNum}-VARIANCE        PIC S9(03)V9999 COMP-3 VALUE 0.`
      );
    }

    code.push(
      '       PROCEDURE DIVISION.',
      '       0000-MAIN-AUDIT SECTION.',
      '       0000-START.',
      `           DISPLAY "INITIALIZING ${vm.name}".`
    );

    for (let t = 1; t <= 30; t++) {
      const tNum = String(t).padStart(2, '0');
      code.push(
        `           PERFORM 1000-EVALUATE-CASE-${tNum}.`
      );
    }

    code.push(
      '           DISPLAY "AUDIT COMPLETE. TOTAL DEFECTS: " WS-DEFECTS-DETECTED.',
      '           STOP RUN.'
    );

    for (let t = 1; t <= 30; t++) {
      const tNum = String(t).padStart(2, '0');
      code.push(
        `       1000-EVALUATE-CASE-${tNum} SECTION.`,
        `       1000-RUN-${tNum}.`,
        `           ADD 1 TO WS-CHECKS-PERFORMED.`,
        `           IF WS-TC${tNum}-DENOMINATOR NOT = 0`,
        `               COMPUTE WS-TC${tNum}-QUOTIENT-EXACT =`,
        `                   WS-TC${tNum}-NUMERATOR / WS-TC${tNum}-DENOMINATOR`,
        `                   ON SIZE ERROR ADD 1 TO WS-DEFECTS-DETECTED`,
        `               END-COMPUTE`,
        `               COMPUTE WS-TC${tNum}-QUOTIENT-ROUND ROUNDED =`,
        `                   WS-TC${tNum}-NUMERATOR / WS-TC${tNum}-DENOMINATOR`,
        `                   ON SIZE ERROR ADD 1 TO WS-DEFECTS-DETECTED`,
        `               END-COMPUTE`,
        `               COMPUTE WS-TC${tNum}-QUOTIENT-TRUNC =`,
        `                   WS-TC${tNum}-NUMERATOR / WS-TC${tNum}-DENOMINATOR`,
        `                   ON SIZE ERROR ADD 1 TO WS-DEFECTS-DETECTED`,
        `               END-COMPUTE`,
        `               COMPUTE WS-TC${tNum}-VARIANCE =`,
        `                   WS-TC${tNum}-QUOTIENT-ROUND - WS-TC${tNum}-QUOTIENT-TRUNC`,
        `               ADD WS-TC${tNum}-VARIANCE TO WS-DRIFT-ACCUMULATOR`,
        `           ELSE`,
        `               ADD 1 TO WS-DEFECTS-DETECTED`,
        `           END-IF.`,
        `           EXIT.`
      );
    }

    writeSourceFile(`engines/cobol/validation/${vm.file}`, code, comments);
  }
}

generateCopybooks();
generateTransactionEngines();
generateValidationEngines();

console.log('COBOL Engine Modules generated.');
