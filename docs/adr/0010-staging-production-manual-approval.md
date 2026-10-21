# Separate staging and production, with a manual approval gate

ADR-0009 shipped a single deploy target: a merge to `main` published images and
(once `DEPLOY_ENABLED` was set) deployed straight to one server. For a real
practice that is too blunt — there is nowhere to verify a release before patients
hit it, and nothing stops an accidental merge from going live. This records how the
pipeline grew a staging step and a human gate before production, and why it was
built the way it was. It builds on ADR-0009; the image/registry/SSH/Compose
decisions there are unchanged.

## Decisions

**1. Two GitHub Environments: `staging` then `production`.** After `publish`, CI
deploys to `staging` automatically, and to `production` only after `staging`
succeeds. Modelling them as GitHub *Environments* (not just two jobs) is what buys
the three things we want: per-environment **secrets** (each `SSH_*`/`DEPLOY_PATH`
points at its own server), a **deployment record** per environment, and a place to
hang **protection rules**.

**2. The approval gate is an environment protection rule, not workflow code.** The
manual approval is `production`'s **Required reviewers** rule, configured in repo
settings. The workflow only declares `environment: production`; GitHub then pauses
the job until a reviewer approves in the Actions UI. Keeping the gate in settings
means the policy (who may approve, whether it's required at all) can change without
touching YAML, and the YAML can't accidentally bypass it.

**3. One reusable workflow, called per environment.** The deploy steps live once in
`deploy.yml` (`workflow_call`, `environment` input); `ci.yml` calls it twice.
A reusable workflow — not a composite action — because the two things that vary are
**job-level**: `environment:` and its approval gate attach to a job, which a
composite action (a step-level unit) cannot carry. This removes the duplication a
two-job copy in `ci.yml` would have created.

The Rollback workflow (decision 4) deliberately keeps its *own* copy of the scp +
SSH steps rather than calling `deploy.yml`: routing rollback through the reusable
workflow would bind it to the `production` environment and so drag the approval
gate onto an emergency rollback — the opposite of what we want. So staging and
production share one definition; rollback stays a separate, ungated path, at the
cost of that one duplicated deploy script.

**4. Production serialises with rollback; rollback stays ungated.** The production
deploy shares the `production-deploy` concurrency group with the manual Rollback
workflow, so the two can never mutate the server at once; staging uses its own
group. Rollback deliberately does **not** go through the approval gate — an
emergency rollback must be fast, and forcing a reviewer onto it would add friction
exactly when speed matters.

## Consequences

- A release is verified on a staging server before a human promotes it; an
  accidental merge reaches staging at most, never production unattended.
- Setup cost moves partly into GitHub settings: the environments, their reviewers
  and their scoped secrets must exist, and `DEPLOY_ENABLED` must be `true`. Until
  then the whole chain is dormant and `main` stays green (same posture as ADR-0009).
- Two servers (or two isolated targets) to provision and pay for, not one — the
  price of a real staging tier, acceptable boundary to revisit if it ever grows.
- `production` and the rollback path can still collide in intent (rollback is
  ungated, deploy is gated); the shared concurrency group keeps them serialised,
  but an operator must still not fire both expecting different outcomes.
