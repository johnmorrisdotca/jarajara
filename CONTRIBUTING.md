# Contributing

Ideas, bug reports and pull requests are welcome in the
[issues](https://github.com/johnmorrisdotca/jarajara/issues).

## Working on it

```sh
pnpm install
pnpm check          # lint, types and tests
pnpm test:package   # pack it as npm does, install it in an empty project, import every entry
```

A change to the rules is tested beside it, and must leave every deal and table
game in `src/site.fixture.json` exactly as it was: people's kept games and
fastest times on itsutsu.com are on those deals, found by their seeds. A change
that alters one is a new version of the rules, never a fix.

## Releasing

A version tag (`v1.2.3`, the same as `package.json`'s version) runs
`.github/workflows/release.yml`: it checks and builds the package, attaches the
tarball to a GitHub release, and publishes it to npm by trusted publishing,
with no token. Write the release in `CHANGELOG.md` first.
