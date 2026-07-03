// Self-test for the require-expect-in-spec-test rule. bad.test.ts contains two
// specTest() calls: EX-AUTH-001 has no expect() (must be flagged) and
// EX-AUTH-002 has one (must not be). Exits 0 when the rule reports exactly
// that; run by the CI spec-test job.
import { Linter } from "eslint";
import { readFileSync } from "node:fs";
import { plugin } from "../dist/eslint-rule.js";

const linter = new Linter();
const code = readFileSync(new URL("./bad.test.ts", import.meta.url), "utf8");

const results = linter.verify(
  code,
  {
    files: ["**/*.ts"],
    plugins: { "spec-test": plugin },
    rules: { "spec-test/require-expect-in-spec-test": "error" },
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
  },
  { filename: "bad.test.ts" },
);

const errors = results.filter((r) => r.severity === 2);
const expected =
  errors.length === 1 &&
  errors[0].message.includes("EX-AUTH-001") &&
  !errors.some((r) => r.message.includes("EX-AUTH-002"));

if (expected) {
  console.log("rule self-test passed: EX-AUTH-001 flagged, EX-AUTH-002 clean");
  process.exit(0);
}

console.error(JSON.stringify(results, null, 2));
console.error(
  `rule self-test FAILED: expected exactly one error for EX-AUTH-001, got ${errors.length} error(s)`,
);
process.exit(1);
