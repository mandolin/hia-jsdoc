# Release Checklist

- Run `npm run release:gate`.
- Regenerate fixture output with `npm run build:fixtures`.
- Confirm `npm pack --dry-run --json` output.
- Confirm generated fixture output does not contain local paths and no tarballs are committed.
- Confirm dependency and license review is up to date.
