import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const ROOT_DIR = fileURLToPath(new URL('../', import.meta.url));
const SRC_DIR = join(ROOT_DIR, 'src');
const REQUIRED_TAGS = ['@file', '@author', '@date', '@role'];
const MAX_LINES = 200;

/**
 * Liste récursivement les fichiers .js d'un dossier.
 * @param {string} dir Dossier de départ.
 * @returns {Promise<string[]>} Chemins absolus des fichiers .js trouvés.
 */
async function collectJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Normalise un chemin absolu en chemin relatif à la racine du projet, séparateurs POSIX.
 * @param {string} filePath Chemin absolu du fichier.
 * @returns {string} Chemin relatif lisible (ex. `src/core/scene.js`).
 */
function toRelativePath(filePath) {
  return relative(ROOT_DIR, filePath).split(sep).join('/');
}

/**
 * Vérifie l'en-tête obligatoire et la limite de lignes d'un fichier source.
 * @param {string} content Contenu complet du fichier.
 * @returns {{ problems: string[], lineCount: number }} Anomalies détectées et nombre de lignes.
 */
function checkFile(content) {
  const problems = [];
  const lineCount = content.trimEnd().split(/\r?\n/).length;

  if (!content.trimStart().startsWith('/**')) {
    problems.push('en-tête /** absent en début de fichier');
  }

  for (const tag of REQUIRED_TAGS) {
    if (!content.includes(tag)) {
      problems.push(`balise ${tag} manquante`);
    }
  }

  if (lineCount > MAX_LINES) {
    problems.push(`${lineCount} lignes (limite ${MAX_LINES})`);
  }

  return { problems, lineCount };
}

/**
 * Parcourt `src/`, vérifie chaque fichier .js et imprime un rapport PASS/FAIL.
 * @returns {Promise<void>} Se termine après avoir fixé le code de sortie du processus.
 */
async function main() {
  let files;
  try {
    files = await collectJsFiles(SRC_DIR);
  } catch (error) {
    console.error(`FAIL  dossier src introuvable : ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (files.length === 0) {
    console.log('FAIL  aucun fichier .js trouvé dans src/');
    process.exitCode = 1;
    return;
  }

  files.sort();
  let failures = 0;

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const { problems, lineCount } = checkFile(content);
    const name = toRelativePath(file);

    if (problems.length === 0) {
      console.log(`PASS  ${name} (${lineCount} lignes)`);
    } else {
      failures += 1;
      console.log(`FAIL  ${name} (${lineCount} lignes) — ${problems.join(' ; ')}`);
    }
  }

  console.log(`\n${files.length - failures}/${files.length} fichier(s) conforme(s).`);
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
