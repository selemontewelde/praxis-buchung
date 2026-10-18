# Branch protection on `main`

`main` is protected so that changes can only land via a pull request whose CI is
green. This documents the rules and how to (re)apply them.

## Rules

| Rule | Value | Why |
| ---- | ----- | --- |
| Require a pull request before merging | yes, **0** required approvals | No direct pushes to `main`. Zero approvals because a solo maintainer cannot approve their own PR. |
| Require status checks to pass | **`Lint, typecheck, test, build`** | A PR can only merge when the CI pipeline (see `.github/workflows/ci.yml`) is green. |
| Require branches to be up to date (strict) | yes | The PR branch must include the latest `main` before merging, so two PRs can't break `main` after the fact. |
| Include administrators (`enforce_admins`) | yes | The rules apply to the owner too — no bypass button. |
| Allow force pushes / deletions | no | `main` history cannot be rewritten or the branch deleted. |
| Require linear history | yes | Matches the squash-merge workflow. |

## Apply / update

Run with the GitHub CLI (requires admin on the repo):

```bash
gh api -X PUT repos/selemontewelde/praxis-buchung/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, typecheck, test, build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true
}
JSON
```

The status-check context must match the CI job name exactly. Verify the current
name with:

```bash
gh api repos/selemontewelde/praxis-buchung/commits/main/check-runs -q '.check_runs[].name'
```

## Inspect or temporarily relax

```bash
# Show the current protection
gh api repos/selemontewelde/praxis-buchung/branches/main/protection

# Temporarily allow admin bypass (e.g. if a CI infra outage blocks all merges)
gh api -X PATCH repos/selemontewelde/praxis-buchung/branches/main/protection/enforce_admins
# Re-enable afterwards
gh api -X POST  repos/selemontewelde/praxis-buchung/branches/main/protection/enforce_admins
```
