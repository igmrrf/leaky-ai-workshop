#!/bin/sh
# The one-line audit from the talk, against a built client bundle.
#   npm run audit:bundle         -> builds with --mode vulnerable, expect a HIT (exit 1)
#   npm run audit:bundle:fixed   -> normal build, expect CLEAN (exit 0)
DIR="${1:-dist}"
PATTERN='sk-[a-zA-Z0-9_-]{16,}'

echo "\$ grep -rEo \"$PATTERN\" $DIR/"
if grep -rEo "$PATTERN" "$DIR/"; then
  echo ""
  echo "LEAK: a provider key is inlined in the client bundle ($DIR/). Every visitor can read it."
  echo "(It's FAKE here. Yours won't be.)"
  exit 1
fi
echo "clean: no provider-key-shaped strings in $DIR/"
