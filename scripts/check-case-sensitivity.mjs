#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const findings = [];

function walk(dir, extensions, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'vendor') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relative = toPosix(path.relative(repoRoot, fullPath));

    if (entry.isDirectory()) {
      if (relative === 'public/build') {
        continue;
      }

      walk(fullPath, extensions, files);
      continue;
    }

    if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosix(targetPath) {
  return targetPath.split(path.sep).join('/');
}

function addFinding(kind, file, detail) {
  findings.push({
    kind,
    file: toPosix(path.relative(repoRoot, file)),
    detail,
  });
}

function inspectPathCase(absolutePath) {
  const relative = path.relative(repoRoot, absolutePath);
  const segments = relative.split(path.sep).filter(Boolean);
  const mismatches = [];
  let current = repoRoot;

  for (const segment of segments) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
      return { ok: false, mismatches };
    }

    const entries = fs.readdirSync(current);
    const exactMatch = entries.find((entry) => entry === segment);

    if (exactMatch) {
      current = path.join(current, exactMatch);
      continue;
    }

    const caseInsensitiveMatch = entries.find(
      (entry) => entry.toLowerCase() === segment.toLowerCase(),
    );

    if (!caseInsensitiveMatch) {
      return { ok: false, mismatches };
    }

    mismatches.push({
      expected: caseInsensitiveMatch,
      actual: segment,
      directory: toPosix(path.relative(repoRoot, current) || '.'),
    });
    current = path.join(current, caseInsensitiveMatch);
  }

  return { ok: true, mismatches };
}

function resolveImport(fromFile, specifier) {
  const fromDirectory = path.dirname(fromFile);
  const rawTarget = specifier.startsWith('@/')
    ? path.join(repoRoot, 'resources/js', specifier.slice(2))
    : path.resolve(fromDirectory, specifier);

  const candidates = [
    rawTarget,
    `${rawTarget}.ts`,
    `${rawTarget}.tsx`,
    `${rawTarget}.js`,
    `${rawTarget}.jsx`,
    `${rawTarget}.json`,
    path.join(rawTarget, 'index.ts'),
    path.join(rawTarget, 'index.tsx'),
    path.join(rawTarget, 'index.js'),
    path.join(rawTarget, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    const inspected = inspectPathCase(candidate);

    if (inspected.ok) {
      return inspected;
    }
  }

  return null;
}

function collectDeclaredClasses() {
  const mappings = [
    { prefix: 'App\\', directory: path.join(repoRoot, 'app') },
    { prefix: 'Database\\Factories\\', directory: path.join(repoRoot, 'database/factories') },
    { prefix: 'Database\\Seeders\\', directory: path.join(repoRoot, 'database/seeders') },
    { prefix: 'Tests\\', directory: path.join(repoRoot, 'tests') },
  ];

  const declaredClasses = new Map();

  for (const mapping of mappings) {
    for (const file of walk(mapping.directory, ['.php'])) {
      const source = fs.readFileSync(file, 'utf8');
      const namespaceMatch = source.match(/^\s*namespace\s+([^;]+);/m);
      const classMatch = source.match(
        /^\s*(?:final\s+|abstract\s+)?(?:class|interface|trait|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/m,
      );

      if (!namespaceMatch || !classMatch) {
        continue;
      }

      const fqcn = `${namespaceMatch[1]}\\${classMatch[1]}`;
      declaredClasses.set(fqcn.toLowerCase(), { fqcn, file });

      if (!fqcn.startsWith(mapping.prefix)) {
        continue;
      }

      const expectedRelativePath = `${fqcn.slice(mapping.prefix.length).replace(/\\/g, '/')}.php`;
      const actualRelativePath = toPosix(path.relative(mapping.directory, file));

      if (actualRelativePath !== expectedRelativePath) {
        addFinding(
          'psr4-path',
          file,
          `${fqcn} seharusnya berada di ${expectedRelativePath}`,
        );
      }
    }
  }

  return declaredClasses;
}

function auditJavascriptImports() {
  const files = walk(path.join(repoRoot, 'resources/js'), ['.ts', '.tsx', '.js', '.jsx']);
  const patterns = [
    /(?:import|export)\s+(?:[^'"`]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        const specifier = match[1];

        if (!specifier.startsWith('./') && !specifier.startsWith('../') && !specifier.startsWith('@/')) {
          continue;
        }

        const resolved = resolveImport(file, specifier);

        if (!resolved) {
          addFinding('js-import-missing', file, `Import ${specifier} tidak ditemukan.`);
          continue;
        }

        if (resolved.mismatches.length > 0) {
          const detail = resolved.mismatches
            .map(
              (mismatch) =>
                `${specifier}: ${mismatch.actual} harus ${mismatch.expected} di ${mismatch.directory}`,
            )
            .join('; ');

          addFinding('js-import-case', file, detail);
        }
      }
    }
  }
}

function auditInertiaPages() {
  const pageDirectory = path.join(repoRoot, 'resources/js/Pages');
  const availablePages = new Map(
    walk(pageDirectory, ['.tsx']).map((file) => {
      const relativePage = toPosix(path.relative(pageDirectory, file));
      return [relativePage.toLowerCase(), relativePage];
    }),
  );

  const phpFiles = [
    ...walk(path.join(repoRoot, 'app'), ['.php']),
    ...walk(path.join(repoRoot, 'routes'), ['.php']),
  ];

  const inertiaPattern = /(?:Inertia::render|inertia)\(\s*['"]([^'"]+)['"]/g;

  for (const file of phpFiles) {
    const source = fs.readFileSync(file, 'utf8');

    for (const match of source.matchAll(inertiaPattern)) {
      const expectedPage = `${match[1]}.tsx`;
      const actualPage = availablePages.get(expectedPage.toLowerCase());

      if (!actualPage) {
        addFinding(
          'inertia-page-missing',
          file,
          `Halaman Inertia ${match[1]} tidak ditemukan di resources/js/Pages/${expectedPage}`,
        );
        continue;
      }

      if (actualPage !== expectedPage) {
        addFinding(
          'inertia-page-case',
          file,
          `Halaman Inertia ${match[1]} memakai casing berbeda: ${actualPage}`,
        );
      }
    }
  }
}

function auditPhpReferences(declaredClasses) {
  const directories = ['app', 'routes', 'tests', 'database', 'config', 'bootstrap']
    .map((directory) => path.join(repoRoot, directory))
    .filter((directory) => fs.existsSync(directory));

  const usePattern = /^\s*use\s+([^;]+);/gm;
  const inlinePattern =
    /(?:\bnew\s+|::class\b|^\s*extends\s+|^\s*implements\s+|^\s*catch\s*\(|\binstanceof\s+)\\?(App|Database|Tests)\\[A-Za-z0-9_\\]+/gm;

  for (const directory of directories) {
    for (const file of walk(directory, ['.php'])) {
      const source = fs.readFileSync(file, 'utf8');

      for (const match of source.matchAll(usePattern)) {
        const reference = match[1].trim();

        if (!/^(App|Database|Tests)\\/.test(reference)) {
          continue;
        }

        const declared = declaredClasses.get(reference.toLowerCase());

        if (declared && declared.fqcn !== reference) {
          addFinding(
            'php-class-case',
            file,
            `${reference} seharusnya ditulis ${declared.fqcn}`,
          );
        }
      }

      for (const match of source.matchAll(inlinePattern)) {
        const cleaned = match[0]
          .replace(/^(new|extends|implements|instanceof)\s+/, '')
          .replace(/^catch\s*\(/, '')
          .replace(/^\\/, '')
          .replace(/::class$/, '')
          .trim();

        const reference = cleaned.replace(/[,{)\s].*$/, '');
        const declared = declaredClasses.get(reference.toLowerCase());

        if (declared && declared.fqcn !== reference) {
          addFinding(
            'php-class-case',
            file,
            `${reference} seharusnya ditulis ${declared.fqcn}`,
          );
        }
      }
    }
  }
}

const declaredClasses = collectDeclaredClasses();
auditJavascriptImports();
auditInertiaPages();
auditPhpReferences(declaredClasses);

if (findings.length === 0) {
  console.log('Case-sensitivity audit passed.');
  process.exit(0);
}

findings
  .sort((left, right) => left.file.localeCompare(right.file) || left.kind.localeCompare(right.kind))
  .forEach((finding) => {
    console.error(`[${finding.kind}] ${finding.file}: ${finding.detail}`);
  });

console.error(`\nTotal temuan: ${findings.length}`);
process.exit(1);
