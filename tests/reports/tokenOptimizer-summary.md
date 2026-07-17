# Token Optimizer — Unit Test Suite Summary

**File under test:** `server/utils/tokenOptimizer.js`  
**Test file:** `tests/unit/tokenOptimizer.test.js`  
**Branch:** `qa/feature-testing`  
**Run date:** 2026-07-17  
**Author:** QA Automation (Antigravity)

---

## Results

| Metric | Value |
|---|---|
| **Total Tests** | 55 |
| **Passed** | 55 |
| **Failed** | 0 |
| **Skipped** | 0 |
| **Test Suites** | 1 |
| **Execution Time** | ~0.75 s |

---

## Coverage (`server/utils/tokenOptimizer.js`)

| Metric | Coverage | Residual Uncovered Lines |
|---|---|---|
| **Statements** | 97.79 % | 248, 338 |
| **Branches** | 95.12 % | 248, 338 |
| **Functions** | 100.00 % | — |
| **Lines** | 98.75 % | 248, 338 |

> **Residual uncovered lines detail:**
>
> - **Line 248** — `if (backtickLen > 0)` guard inside `StreamingTokenExpander.processChunk()`.  
>   Hit only when a chunk ends with 1–2 trailing backtick characters *and* the word-separator search in the trimmed buffer yields no match. The surrounding test (double-backtick chunk) exercises the path but the exact sub-branch (`backtickLen = 1`) that would activate the trimmed-buffer search is deferred to a later chunk.  
>   **Not a bug — acceptable micro-gap.**
>
> - **Line 338** — `p?.text?.length || 0` optional-chaining guard inside `truncateContextToWindow`'s `getMsgLength` reduce callback.  
>   The null-parts test exercise the outer guard but Istanbul records the implicit `|| 0` fallback as an uncovered branch.  
>   **Not a bug — acceptable micro-gap.**

---

## Functions Tested

### `minifyPrompt()` — 12 tests

| Test | Status |
|---|---|
| `null` passthrough guard | ✅ |
| `undefined` passthrough guard | ✅ |
| Empty string → empty string | ✅ |
| Strip single-line HTML comment + collapse spaces | ✅ |
| Strip inline HTML comment (same-line) | ✅ |
| `[BUG]` Multiline HTML comment — documents known limitation | ✅ |
| Collapse multiple spaces/tabs → single space | ✅ |
| Collapse 3+ blank lines → at most 1 | ✅ |
| Trim leading/trailing whitespace | ✅ |
| Code block indentation preserved verbatim | ✅ |
| Multiple code blocks in one prompt | ✅ |
| Prompt is only a code block | ✅ |

### `expandOutgoingResponse()` — 17 tests

| Test | Status |
|---|---|
| `null` passthrough guard | ✅ |
| `undefined` passthrough guard | ✅ |
| Empty string | ✅ |
| Expand abbreviations outside code block; code block unchanged | ✅ |
| `w/o` → `without` | ✅ |
| `msgs` → `messages` | ✅ |
| `approx` → `approximately` | ✅ |
| `defn` → `definition` | ✅ |
| `ctx` → `context` | ✅ |
| `impl` → `implementation` | ✅ |
| `docs` → `documents` | ✅ |
| Uppercase multi-letter (`MSG` → `MESSAGE`) | ✅ |
| `W/O` → `WITHOUT` | ✅ |
| Title-case `Esp` → `Especially` | ✅ |
| Lowercase `esp` → `especially` | ✅ |
| Single-char uppercase `W/` → `With` (not `WITH`) | ✅ |
| JSON: expand string values, leave keys/numbers intact | ✅ |
| JSON array: expand string values | ✅ |

### `optimizeIncomingMessages()` — 7 tests

| Test | Status |
|---|---|
| Non-array input passthrough | ✅ |
| Minify `msg.content` string | ✅ |
| Minify `msg.text` string | ✅ |
| Minify text inside `msg.parts[].text` | ✅ |
| Leave non-text parts (e.g. image parts) unchanged | ✅ |
| Skip null/falsy messages without throwing | ✅ |
| Immutability — original array not mutated | ✅ |

### `injectSystemInstruction()` — 3 tests

| Test | Status |
|---|---|
| Append instruction to existing system prompt | ✅ |
| Return instruction only when prompt is empty string | ✅ |
| Return instruction only when called with no arguments | ✅ |

### `StreamingTokenExpander` — 6 tests

| Test | Status |
|---|---|
| Expand abbreviations across split chunks; protect code block | ✅ |
| Flush while `inCodeBlock === true` → verbatim passthrough | ✅ |
| Flush while outside code block → abbreviations expanded | ✅ |
| Chunk ending with ` `` ` (partial fence) — buffered correctly | ✅ |
| Empty-buffer flush → no empty token emitted | ✅ |
| >512-char buffer with no separator → force-process | ✅ |

### `truncateContextToWindow()` — 10 tests

| Test | Status |
|---|---|
| Under limit → returns original array reference (`===`) | ✅ |
| Single-element array → returned unchanged | ✅ |
| Non-array input → passthrough | ✅ |
| System prompt preserved first; final user turn last | ✅ |
| Truncation without system prompt | ✅ |
| `developer` role treated as system prompt | ✅ |
| Length measured via `msg.text` field | ✅ |
| Length measured via `msg.parts[].text` | ✅ |
| Null parts entries handled safely (0-length guard) | ✅ |

---

## Edge Cases Covered

- Null/undefined/empty inputs for every exported function
- Abbreviation expansion with exact case preservation (lowercase / Title-case / ALL-CAPS / single-char uppercase)
- Code block protection across all three surfaces: `minifyPrompt`, `expandOutgoingResponse`, `StreamingTokenExpander`
- JSON key vs value separation in `expandOutgoingResponse`
- JSON array value expansion
- `StreamingTokenExpander` mid-stream split across backtick sequences
- `StreamingTokenExpander` flush while inside vs outside a code block
- Long buffer (>512 chars) force-processing
- All three message-length schemas in `truncateContextToWindow`: `content`, `text`, `parts[]`
- Null/falsy message entries in `optimizeIncomingMessages` and `truncateContextToWindow`
- `developer` role as a valid system-prompt role
- Immutability: `optimizeIncomingMessages` does not mutate the original input
- Part objects without `.text` (e.g. image parts) left intact

---

## Known Bugs Discovered (No Production Code Changed)

### ⚠️ BUG-001 — `minifyPrompt`: Multiline HTML Comments Not Stripped

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Location** | `server/utils/tokenOptimizer.js` lines 143–144 |
| **Status** | Documented — awaiting approval before fix |

**Description:**  
The comment-stripping regex `/<!--[\s\S]*?-->/g` is applied **after** `prompt.split('\n')`, meaning each line is processed independently. When an HTML comment opens (`<!--`) on one line and closes (`-->`) on a different line, the per-line regex cannot match the full comment span.

**Reproduction:**
```js
minifyPrompt('Keep this. <!-- start\nmultiline\nend --> Keep this too.')
// Expected: "Keep this. Keep this too."
// Actual:   partial comment markers survive in output
```

**Recommended fix (one line — pending approval):**  
Apply the HTML-comment regex to the whole prompt string *before* splitting on newlines.

---

## QA Git Hygiene Verification

All files in this commit are QA-only. **Zero production source files were modified.**

| File | Type |
|---|---|
| `jest.config.js` | QA infrastructure — Jest configuration |
| `tests/unit/tokenOptimizer.test.js` | QA — unit test suite (55 tests) |
| `tests/reports/tokenOptimizer-summary.md` | QA — this report |
