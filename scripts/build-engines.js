const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const COBC = process.env.COBC_PATH || 'C:\\Users\\temp3\\tools\\bin\\cobc.exe';
const GFORTRAN = process.env.GFORTRAN_PATH || 'C:\\Strawberry\\c\\bin\\gfortran.exe';

const env = {
  ...process.env,
  COB_MAIN_DIR: 'C:\\Users\\temp3\\tools\\',
  COB_CONFIG_DIR: 'C:\\Users\\temp3\\tools\\config',
  COB_COPY_DIR: 'C:\\Users\\temp3\\tools\\copy;' + path.join(ROOT_DIR, 'engines', 'cobol', 'copybooks'),
  COB_CFLAGS: '-I"C:\\Users\\temp3\\tools\\include"',
  COB_LDFLAGS: '-L"C:\\Users\\temp3\\tools\\lib"',
  PATH: `C:\\Users\\temp3\\tools\\bin;C:\\Strawberry\\c\\bin;${process.env.PATH}`
};

function buildCobol() {
  console.log('=== COMPILING NATIVE COBOL ENGINES ===');
  const binDir = path.join(ROOT_DIR, 'bin', 'cobol');
  fs.mkdirSync(binDir, { recursive: true });

  const cobolPrograms = [
    { src: 'engines/cobol/transaction/banking_core.cob', out: 'banking_core.exe' },
    { src: 'engines/cobol/transaction/loan_amortizer.cob', out: 'loan_amortizer.exe' },
    { src: 'engines/cobol/transaction/payroll_engine.cob', out: 'payroll_engine.exe' },
    { src: 'engines/cobol/transaction/general_ledger.cob', out: 'general_ledger.exe' },
    { src: 'engines/cobol/validation/precision_auditor.cob', out: 'precision_auditor.exe' }
  ];

  for (const prog of cobolPrograms) {
    const srcPath = path.join(ROOT_DIR, prog.src);
    const outPath = path.join(binDir, prog.out);
    if (!fs.existsSync(srcPath)) continue;

    console.log(`Compiling ${prog.src} -> ${prog.out}...`);
    try {
      execSync(`"${COBC}" -free -x -I "${path.join(ROOT_DIR, 'engines', 'cobol', 'copybooks')}" -o "${outPath}" "${srcPath}"`, { env, stdio: 'inherit' });
      console.log(`✓ ${prog.out} built successfully.`);
    } catch (err) {
      console.error(`✗ Failed to compile ${prog.src}`);
    }
  }
}

function buildFortran() {
  console.log('\n=== COMPILING NATIVE FORTRAN ENGINES ===');
  const binDir = path.join(ROOT_DIR, 'bin', 'fortran');
  fs.mkdirSync(binDir, { recursive: true });

  const fortranPrograms = [
    { src: 'engines/fortran/numerical/linear_algebra.f90', out: 'linear_algebra.exe' },
    { src: 'engines/fortran/numerical/quadrature_ode.f90', out: 'quadrature_ode.exe' },
    { src: 'engines/fortran/precision/ulp_stability.f90', out: 'ulp_stability.exe' },
    { src: 'engines/fortran/precision/ieee_trap_handler.f90', out: 'ieee_trap_handler.exe' }
  ];

  for (const prog of fortranPrograms) {
    const srcPath = path.join(ROOT_DIR, prog.src);
    const outPath = path.join(binDir, prog.out);
    if (!fs.existsSync(srcPath)) continue;

    console.log(`Compiling ${prog.src} -> ${prog.out}...`);
    try {
      execSync(`"${GFORTRAN}" -O2 -o "${outPath}" "${srcPath}"`, { env, stdio: 'inherit' });
      console.log(`✓ ${prog.out} built successfully.`);
    } catch (err) {
      console.error(`✗ Failed to compile ${prog.src}`);
    }
  }
}

if (process.argv[2] === 'cobol') {
  buildCobol();
} else if (process.argv[2] === 'fortran') {
  buildFortran();
} else {
  buildCobol();
  buildFortran();
}
