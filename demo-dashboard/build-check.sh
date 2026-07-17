#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════"
echo "  KIROAWARE BUILD CHECKS"
echo "═══════════════════════════════════════════════════"

cd "$(dirname "$0")"

# Gate 1: TypeScript strict check
echo ""
echo "[1/4] TypeScript strict mode check..."
npx tsc --noEmit
echo "  ✅ TypeScript strict: zero errors"

# Gate 2: ESLint
echo ""
echo "[2/4] ESLint..."
npx eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
echo "  ✅ ESLint: zero errors, zero warnings"

# Gate 3: Build
echo ""
echo "[3/4] Production build..."
npx vite build
echo "  ✅ Build: zero errors"

# Gate 4: Dead code check
echo ""
echo "[4/4] Dead code scan..."
EXPORTED=$(grep -rh "^export " src/ --include="*.ts" --include="*.tsx" | grep -v "export type" | grep -v "export interface" | grep -v "export default" | wc -l)
echo "  📊 Exported symbols: $EXPORTED"
echo "  ⚠️  Manual review required for dead code"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ ALL GATES PASSED"
echo "═══════════════════════════════════════════════════"
