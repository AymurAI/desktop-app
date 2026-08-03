# AymurAI desktop-app — baseline lint debt cleanup

> **Replace or extend this file with your product features before using it for
> feature work.** This batch is deliberately seeded with the *measured* lint
> debt found while making the gates green during orq-lite setup, because
> `guide.md` §2c prescribes queueing exactly this cleanup as an early factory
> batch: mechanical, verifiable work the loop is good at. It is a safe first run
> that exercises the whole governed flow against real code.

**Stack (fixed):** Electron 42 + React 19 + TypeScript, renderer under
`src/renderer/src`. Panda CSS for styling, Radix-backed primitives mostly from
`@aymurai/ui` (only what it lacks is wrapped in `components/ui/`), TanStack
Router (file-based routes) + TanStack Query,
i18next for Spanish UI strings. Package manager is **pnpm** (Node pinned to 22
via `.nvmrc`). Hard rules live in `CONVENTIONS.md` and are binding.

**Gates:** `pnpm validate` (biome + `tsc --noEmit` on the node and web
projects) and `pnpm test` (vitest) must both exit 0 after
every feature. At the start of this batch both exit 0 with **13 biome
warnings**; the goal of the batch is zero.

**Cross-feature rules:**

- No behavior changes. Every feature here is a refactor: the existing tests must
  still pass, and no test may be deleted, skipped, or weakened to land a change.
- Do not silence a finding with `// biome-ignore` or by downgrading a rule in
  `biome.json`. Fix the code. (The one pre-existing `noExplicitAny` ignore in
  `utils/logger.ts` is out of scope — leave it.)
- Verify with `pnpm lint 2>&1 | grep -c "lint/<rule>"` before claiming a rule is
  clear.

## Retire console.log from the renderer

`lint/suspicious/noConsoleLog`, 4 occurrences. `console.log` is also blocked by
the lefthook pre-commit grep, so these are live violations.

- `src/renderer/src/utils/logger.ts:8` — `logger.info` wraps `console.log`
  behind an `import.meta.env.PROD` guard. Switch that call to `console.info`,
  preserving the guard and the function's signature and export shape.
- `src/renderer/src/services/aymurai/useRunLocalServer.ts:36`, `:43`, `:45` —
  replace each `console.log` with `logger.info` (import the default export from
  `@/utils/logger`). Keep the messages byte-identical.
- Acceptance: `pnpm lint` reports **0** `lint/suspicious/noConsoleLog`
  diagnostics, and `grep -rn "console\.log" src/` returns no matches.

## Remove the non-null assertions

`lint/style/noNonNullAssertion`, 5 occurrences.

- `src/renderer/src/main.tsx:9` — `document.getElementById("root")!`. Replace
  with an explicit lookup that throws a named error when the node is absent
  (e.g. `const root = document.getElementById("root"); if (!root) throw new
  Error("Root element #root not found");`) and pass `root` to
  `ReactDOM.createRoot`.
- `src/renderer/src/routes/app.$feature/validation.tsx:48` — replace the
  assertion with a real narrowing guard. If the value can legitimately be
  absent, handle that path visibly rather than asserting it away.
- `src/renderer/src/services/aymurai/__tests__/validation.test.ts:170`, `:171`,
  `:172` — narrow in the test instead of asserting. The assertions must still
  fail if the values become undefined; do not replace them with optional
  chaining that makes the test vacuous.
- Acceptance: `pnpm lint` reports **0** `lint/style/noNonNullAssertion`
  diagnostics; `pnpm test` still reports every test passing.

## Clear the performance rule violations

`lint/performance/noAccumulatingSpread` (2) and `lint/performance/noDelete` (1).

- `src/renderer/src/utils/predictions/suggestions/index.ts:39` and `:133` —
  each spreads an accumulator inside a reduce/loop, making the build quadratic.
  Rewrite to mutate a single accumulator (or push into an array and build once).
  The returned value must be deeply equal to the current output.
- `src/renderer/src/utils/file/flatValidation.ts:31` — replace the `delete`
  operator with an approach that does not deoptimize the object (build a new
  object without the key, or set it to `undefined` if callers only check
  truthiness — whichever preserves current behavior for existing callers).
- Add a colocated vitest test for each of the two modules that pins the current
  output shape for a representative input, so the refactor is proven
  behavior-preserving rather than asserted to be. Each test must fail if the
  transformation's output changes.
- Acceptance: `pnpm lint` reports **0** `lint/performance/*` diagnostics; the
  new tests exist and pass; total test count increases.

## Repair the useRunLocalServer effect dependencies

`lint/correctness/useExhaustiveDependencies`, 1 occurrence — the only
*correctness* warning in the tree, so it is the highest-risk item here.

- `src/renderer/src/services/aymurai/useRunLocalServer.ts:34` — the effect's
  dependency array is missing a value it closes over. Determine whether the
  missing dependency is genuinely needed: either add it (and stabilise the
  referenced function with `useCallback`/a ref so the effect does not re-run on
  every render), or restructure so the effect no longer closes over it.
- Do not suppress the rule. Do not add a dependency that introduces a re-run
  loop — state explicitly in the result why the chosen fix cannot re-trigger the
  server-start effect repeatedly.
- Acceptance: `pnpm lint` reports **0**
  `lint/correctness/useExhaustiveDependencies` diagnostics, and the reasoning
  about re-run safety is recorded in the ticket result.

## Promote the cleaned biome rules to error

Locks in the batch so the debt cannot silently return. Depends on all four
features above being complete.

- In `biome.json`, change `suspicious.noConsoleLog`,
  `style.noNonNullAssertion`, `performance.noAccumulatingSpread`,
  `performance.noDelete`, and `correctness.useExhaustiveDependencies` from
  `"warn"` to `"error"`.
- Do not add any new entry to `files.ignore` and do not add any
  `// biome-ignore` comment as part of this feature.
- Acceptance: `pnpm validate` exits 0 with **0 errors and 0 warnings**;
  `pnpm test` reports all tests passing; `biome.json` shows the five rules at
  `"error"`.
