# Contributing

## Setup

```bash
# Clone the repository
git clone https://github.com/snowcss/snowcss.git
cd snowcss

# Install dependencies (requires pnpm 10+)
pnpm install
```

## Development

```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter @snowcss/core build

# Build in watch mode
pnpm --filter @snowcss/core build:watch

# Run tests
pnpm --filter @snowcss/core test

# Run tests in watch mode
pnpm --filter @snowcss/core test:watch
```

## Code Style

Biome handles formatting and linting. It runs automatically on pre-commit via lefthook, but you can run it manually:

```bash
pnpm check:fix
```

## Pull Requests

### Commits

We use squash merge strategy, so you are free to use any commit message format in the PR, but it is still encouraged to make atomic commits with short and meaningful messages.

### PR Titles

PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Scopes:** `core`, `vite`, `lsp`, `vscode`

Examples:

- `feat(core): add support for oklch colors`
- `fix(vite): resolve hot reload issue`
- `docs(core): update token API documentation`

### Changesets

For changes that affect published packages, a changeset is required:

```bash
pnpm changeset
```

This will prompt you to select affected packages and describe the change. Changesets are used to generate changelogs and determine version bumps.

Skip changesets for changes that don't affect package consumers (CI, docs, internal refactors).

If you are not sure if your changes require a changeset, just skip adding it, maintainers will add it if necessary.
