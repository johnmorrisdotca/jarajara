# Contributing

Ideas, bug reports and pull requests are welcome in the
[issues](https://github.com/johnmorrisdotca/jarajara/issues).

## Working on it

```sh
pnpm install
pnpm check            # lint, types and tests
pnpm test:package     # pack it as npm does, install it in an empty project, import every entry, run the command line
pnpm test:cli         # build it and run the command line as a child process
pnpm test:demo        # build the demo and play it in a real browser
pnpm test:frameworks  # build a React, Vue, Svelte, Angular and plain page from the packed tarball, and play it in a browser
pnpm docs:make        # rewrite docs/strings-ja.md after changing a word of the tags or the command line
```

A change to the rules is tested beside it, and must leave every deal and table
game in `src/site.fixture.json` exactly as it was: people's kept games and
fastest times on itsutsu.com are on those deals, found by their seeds. A change
that alters one is a new version of the rules, never a fix. The same goes for the
first five layouts (`MAHJONG_LAYOUTS`), which never change.

## House rules, shared by every package of the family

- Open an issue first for anything bigger than a typo, so that we can agree on the shape before you spend time on it.
- No runtime dependencies. Every function that plays or checks a game is pure: it returns new values and never changes what it was given.
- Tests sit beside the code they test. A rule you change has a test that would have caught it.
- Words a player reads come in English and Japanese. If you cannot write the Japanese, say so in the pull request and someone will.
- Option values and names are kebab case.
- Art and sound are CC0 or public domain only, checked at the source, and credited in the README. No GPL or LGPL code.
- Needs Node 22 or later. A change a user would notice gets a line in `CHANGELOG.md`.

## Releasing

A version tag (`v1.2.3`, the same as `package.json`'s version) runs
`.github/workflows/release.yml`: it checks and builds the package, attaches the
tarball to a GitHub release, and publishes it to npm by trusted publishing,
with no token. Write the release in `CHANGELOG.md` first.
