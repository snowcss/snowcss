# Changesets

This folder is used by `@changesets/cli` to manage versioning and changelogs.

## Adding a changeset

```bash
pnpm changeset
```

This prompts you to select changed packages and the type of change (major, minor, patch).

## Releasing

Releases are automated via GitHub Actions. When changesets are merged to main, a "Version Packages" PR is created. Merging that PR publishes to npm.
