#!/bin/sh
# Slide: "My own secret scanner reported a clean tree."
# Runs the BUGGY pattern and the FIXED pattern over the same files, side by side.
# The planted FAKE secret in exercises/08-secret-scanner/fixtures/ is the test.
TARGETS="${*:-exercises/08-secret-scanner/fixtures src}"

BUGGY='sk-[a-zA-Z0-9]{16,}'    # no hyphen in the class: "sk-prod-..." stops at "prod"
FIXED='sk-[a-zA-Z0-9_-]{16,}'  # one character class, two extra characters

scan() {
  label="$1"; pattern="$2"
  echo "== $label: $pattern"
  # shellcheck disable=SC2086
  if grep -rEon "$pattern" $TARGETS; then
    echo "   -> secrets found"
    return 1
  fi
  echo "   -> ✅ No hardcoded secrets detected in source tree."
  return 0
}

scan "buggy scanner" "$BUGGY"
echo ""
scan "fixed scanner" "$FIXED"
status=$?
echo ""
echo "Same files. Same secret. One of these scanners is lying to you."
exit $status
