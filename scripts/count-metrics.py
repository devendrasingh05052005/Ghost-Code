import os
import re
import sys

# Language configuration: Only TypeScript, COBOL, and Fortran
LANG_CONFIG = {
    'TypeScript': {
        'exts': {'.ts', '.tsx'},
        'comment_starts': ('//', '/*', '*'),
        'func_pattern': re.compile(
            r'(?:^\s*(?:export\s+)?(?:async\s+)?function\b|'
            r'^\s*(?:public|private|protected|static|async)*\s*[\w$]+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{|'
            r'^\s*(?:export\s+)?(?:const|let|var)\s+[\w$]+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)',
            re.MULTILINE
        ),
        'class_pattern': re.compile(
            r'^\s*(?:export\s+)?(?:abstract\s+)?(?:class|interface)\s+[\w$]+',
            re.MULTILINE
        )
    },
    'COBOL': {
        'exts': {'.cob', '.cbl'},
        'comment_starts': ('*', '*>'),
        'func_pattern': re.compile(
            r'^\s*[A-Z0-9\-]+\s+SECTION\.\s*$|^\s*[0-9]{4}-[A-Z0-9\-]+\.\s*$',
            re.IGNORECASE | re.MULTILINE
        ),
        'class_pattern': re.compile(
            r'^\s*(?:PROGRAM-ID|CLASS-ID|INTERFACE-ID|FACTORY|OBJECT)\.\s*([A-Z0-9\-]+)',
            re.IGNORECASE | re.MULTILINE
        )
    },
    'FORTRAN': {
        'exts': {'.f90', '.f'},
        'comment_starts': ('!', 'c', 'C', '*'),
        'func_pattern': re.compile(
            r'^\s*(?:(?:PURE|ELEMENTAL|RECURSIVE)\s+)?(?:SUBROUTINE|(?:REAL|INTEGER|LOGICAL|TYPE\([^)]+\))?\s*FUNCTION)\s+([A-Za-z0-9_]+)',
            re.IGNORECASE | re.MULTILINE
        ),
        'class_pattern': re.compile(
            r'^\s*(?:MODULE\s+(?!PROCEDURE\b)|TYPE(?:\s*,\s*(?:PUBLIC|PRIVATE|EXTENDS\([^)]+\)))*\s*::)\s*([A-Za-z0-9_]+)',
            re.IGNORECASE | re.MULTILINE
        )
    }
}

EXCLUDE_DIRS = {'node_modules', '.git', 'dist', 'build', 'tmp', '.pytest_cache'}

def get_target_lang(filename):
    ext = os.path.splitext(filename)[1].lower()
    for lang, conf in LANG_CONFIG.items():
        if ext in conf['exts']:
            return lang
    return None

def count_from_disk(root_dir='.'):
    stats = {lang: {'files': 0, 'loc': 0, 'funcs': 0, 'classes': 0, 'comments': 0} for lang in LANG_CONFIG}
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            lang = get_target_lang(f)
            if not lang:
                continue
            path = os.path.join(root, f)
            stats[lang]['files'] += 1
            conf = LANG_CONFIG[lang]
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                for line in content.splitlines():
                    s = line.strip()
                    if not s:
                        continue
                    if any(s.startswith(cs) for cs in conf['comment_starts']):
                        stats[lang]['comments'] += 1
                        continue
                    stats[lang]['loc'] += 1
                stats[lang]['funcs'] += len(conf['func_pattern'].findall(content))
                stats[lang]['classes'] += len(conf['class_pattern'].findall(content))
            except Exception:
                pass
    return stats

def main():
    root_dir = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else '.'
    stats = count_from_disk(root_dir)

    total_files = sum(s['files'] for s in stats.values())
    total_loc = sum(s['loc'] for s in stats.values())
    total_funcs = sum(s['funcs'] for s in stats.values())
    total_classes = sum(s['classes'] for s in stats.values())
    total_comments = sum(s['comments'] for s in stats.values())

    comment_density = (total_comments / max(1, total_loc + total_comments)) * 100

    print('=' * 82)
    print('   GHOSTCODE CODEBASE METRICS (ONLY TypeScript, COBOL & FORTRAN)   ')
    print('=' * 82)
    print(f' {"Language":<14} | {"Files":<8} | {"Tech LoC":<12} | {"Functions":<12} | {"Classes":<10} | {"Density":<8}')
    print('-' * 82)
    for lang, s in stats.items():
        density = (s['comments'] / max(1, s['loc'] + s['comments'])) * 100
        print(f' {lang:<14} | {s["files"]:<8} | {s["loc"]:<12,} | {s["funcs"]:<12,} | {s["classes"]:<10,} | {density:.2f}%')
    print('=' * 82)
    print(f' {"TOTAL":<14} | {total_files:<8} | {total_loc:<12,} | {total_funcs:<12,} | {total_classes:<10,} | {comment_density:.2f}%')
    print('=' * 82)

if __name__ == '__main__':
    main()
