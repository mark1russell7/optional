# Instructions for Claude

## Writing style

Write all prose of this repository in the style of ASD-STE100 Simplified Technical English (STE). The linter [`ste-lint`](https://github.com/mark1russell7/ste-lint) examines it.

- After a change to prose, start `pnpm lint:ste` and correct each finding.
- Do not use the modal verbs (`should`, `may`, `might`, `would`), semicolons or Latin abbreviations.
- Start each sentence of a doc comment with its subject: "This function gives the value".

## The package

- render and Vex use this package through a `github:` dependency. Thus `dist/` is in git: after a change to `src/`, start `pnpm build` and commit `dist/`.
- Keep the form `{ tag: "some", value } | { tag: "none" }`. A change of the form breaks render and Vex.
- Each export has a test. `map` and `flatMap` keep the functor laws and the monad laws.
