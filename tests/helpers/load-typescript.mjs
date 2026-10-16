import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Charge le vrai code TS ; seules les frontières fournies explicitement sont substituées.
export function loadTypeScript(entry, mocks = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const require = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith('.')) {
        const target = path.resolve(path.dirname(file), id);
        for (const [mockId, mock] of Object.entries(mocks)) {
          if (mockId.startsWith('.') && path.resolve(path.dirname(file), mockId) === target) return mock;
        }
        for (const suffix of ['', '.ts', '.tsx']) {
          if (fs.existsSync(target + suffix) && fs.statSync(target + suffix).isFile()) return load(target + suffix);
        }
      }
      return createRequire(file)(id);
    };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { console, process, ...globals }, { filename: file })(require, module, module.exports);
    return module.exports;
  }
  return load(entry);
}
