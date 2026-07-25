#!/usr/bin/env bash
# Installs a pre-commit hook that blocks commits containing secrets.
cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks protect --staged --no-banner || exit 1
else
  echo "warning: gitleaks not installed (brew install gitleaks); skipping secret scan"
fi
HOOK
chmod +x .git/hooks/pre-commit
