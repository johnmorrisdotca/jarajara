**What this changes**

**How it was checked**

- [ ] `pnpm check` passes (lint, types, tests)
- [ ] `pnpm test:demo` passes, if the tags, the drawing or the demo changed
- [ ] `pnpm test:package` passes, if what is published changed, and `pnpm test:cli` if the command line did
- [ ] Every deal and table game in `src/site.fixture.json` still comes out as it was, or this is a new major version
- [ ] A line in `CHANGELOG.md`, if a user would notice
