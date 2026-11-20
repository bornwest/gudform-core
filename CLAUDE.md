# CLAUDE.md

Born West's fork of GudForm. Work happens on `bw-main`, which branches from upstream at `a44ca31`. Pushing to `bw-main` deploys to the server.

## Rules

- **Never commit.** Don't run `git commit` (including `--amend`) or anything else that creates commits: merge, rebase, cherry-pick, revert, or stash pop onto a new commit. Don't push either. This applies even when asked for a branch or PR. Leave the changes in the working tree, and say which files to commit and with what message.
- **Keep the README in step with the code.** When you finish a change that adds or changes a feature, add or update its entry in the "Born West changes" section of `README.md` in the same change, before handing it over to be committed. That way the README goes out with the push. Don't add PR numbers to new entries. Skip this for changes users won't notice (refactors, typo fixes).

## Working here

- Package manager: `pnpm`. Checks: `pnpm lint`, `pnpm test` (Vitest), `npx tsc --noEmit`.
