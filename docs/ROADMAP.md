# Roadmap

This file is the plan of optional. The Status page of the site reads it.

| ID | Item | Status | Summary |
| --- | --- | --- | --- |
| O1 | The conventions check in CI | in progress | CI starts `pnpm check:conventions` of `@mark1russell7/conventions` 0.22.0. A run of `main` then ends, and a newer push cancels only the run of a pull request. |
| O2 | No build output in git | not started | Git keeps `dist/`, because render and Vex install this package from git. When render and Vex install it from npm, `dist/` goes out of git. Until then, the rules `no-build-output` and `typed-scripts` keep an exception for `dist/`. |
