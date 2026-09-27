import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Use the project's compiler and aliases with Node's built-in test runner.
const root = new URL("../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const path = specifier.slice(2);
      return { url: new URL(path.endsWith(".json") ? path : `${path}.ts`, root).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root.href) && url.endsWith(".ts") && !url.includes("/node_modules/")) {
      const source = ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        fileName: url,
      }).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    if (url.startsWith(root.href) && url.endsWith(".json") && !url.includes("/node_modules/")) {
      return { format: "module", source: `export default ${readFileSync(new URL(url), "utf8")}`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
