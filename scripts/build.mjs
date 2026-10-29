import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const SITE_FILES = Object.freeze([
    'index.html',
    'assets/site.css',
    'assets/portrait.jpg',
    'assets/dongsung-huh-cv.pdf',
]);

export const REPOSITORY_FILES = Object.freeze([
    ...SITE_FILES,
    'README.md',
    '.github/workflows/pages.yml',
    'scripts/build.mjs',
    'scripts/build.test.mjs',
]);

function isWithin(parentDirectory, childPath) {
    const difference = relative(parentDirectory, childPath);
    return difference === '' || (!isAbsolute(difference) && difference !== '..' && !difference.startsWith(`..${sep}`));
}

function physicalPath(target) {
    const absolute = resolve(target);
    return existsSync(absolute) ? realpathSync(absolute) : join(physicalPath(dirname(absolute)), basename(absolute));
}

export function buildSite(destination, { sourceRoot = sourceDirectory, repository = false } = {}) {
    const root = realpathSync(sourceRoot);
    const files = repository ? REPOSITORY_FILES : SITE_FILES;

    for (const filePath of files) {
        const source = join(root, filePath);
        if (!lstatSync(source).isFile() || !isWithin(root, realpathSync(source))) {
            throw new Error(`Not a regular public file inside the source directory: ${filePath}`);
        }
    }

    const output = physicalPath(destination || mkdtempSync(join(tmpdir(), 'dongsung-pages-')));
    if (isWithin(root, output)) {
        throw new Error('Choose an output directory outside the source repository.');
    }
    if (existsSync(output) && (!lstatSync(output).isDirectory() || readdirSync(output).length > 0)) {
        throw new Error('The output directory must be empty. Existing files are never removed or overwritten.');
    }

    mkdirSync(output, { recursive: true });
    for (const filePath of files) {
        const target = join(output, filePath);
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(join(root, filePath), target);
    }
    writeFileSync(join(output, '.nojekyll'), '');
    return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const argumentsList = process.argv.slice(2);
        const repository = argumentsList[0] === '--repository';
        if (repository) argumentsList.shift();
        if (argumentsList.length > 1 || argumentsList.some(argument => argument.startsWith('-'))) {
            throw new Error('Usage: node scripts/build.mjs [--repository] [EMPTY_OUTPUT_DIRECTORY]');
        }
        const output = buildSite(argumentsList[0], { repository });
        console.log(`Prepared ${repository ? 'public repository files' : 'GitHub Pages artifact'} at ${output}`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
