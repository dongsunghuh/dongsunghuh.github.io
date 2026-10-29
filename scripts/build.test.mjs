import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSite, REPOSITORY_FILES, SITE_FILES } from './build.mjs';

function fixture(context) {
    const root = mkdtempSync(join(tmpdir(), 'academic-site-test-'));
    context.after(() => rmSync(root, { recursive: true, force: true }));
    const source = join(root, 'source');
    const output = join(root, 'output');
    for (const filePath of REPOSITORY_FILES) {
        const target = join(source, filePath);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, `public:${filePath}\n`);
    }
    return { root, source, output };
}

function listFiles(directory, prefix = '') {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const filePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        return entry.isDirectory() ? listFiles(join(directory, entry.name), filePath) : [filePath];
    }).sort();
}

test('the Pages artifact contains only explicitly approved public files', context => {
    const { source, output } = fixture(context);
    writeFileSync(join(source, 'application-letter.tex'), 'private');
    writeFileSync(join(source, '.env'), 'private');
    writeFileSync(join(source, 'assets', 'private-note.txt'), 'private');
    buildSite(output, { sourceRoot: source });
    assert.deepEqual(listFiles(output), [...SITE_FILES, '.nojekyll'].sort());
    for (const filePath of SITE_FILES) {
        assert.deepEqual(readFileSync(join(output, filePath)), readFileSync(join(source, filePath)));
    }
});

test('the clean repository export includes deployment files but no private documents', context => {
    const { source, output } = fixture(context);
    writeFileSync(join(source, 'private-application.pdf'), 'private');
    buildSite(output, { sourceRoot: source, repository: true });
    assert.deepEqual(listFiles(output), [...REPOSITORY_FILES, '.nojekyll'].sort());
});

test('a missing public asset fails before creating the output directory', context => {
    const { source, output } = fixture(context);
    unlinkSync(join(source, 'assets', 'portrait.jpg'));
    assert.throws(() => buildSite(output, { sourceRoot: source }), { code: 'ENOENT' });
    assert.equal(existsSync(output), false);
});

test('public files cannot be symlinks to other documents', context => {
    const { root, source, output } = fixture(context);
    const privateFile = join(root, 'private.pdf');
    writeFileSync(privateFile, 'private');
    unlinkSync(join(source, 'assets', 'dongsung-huh-cv.pdf'));
    symlinkSync(privateFile, join(source, 'assets', 'dongsung-huh-cv.pdf'));
    assert.throws(() => buildSite(output, { sourceRoot: source }), /Not a regular public file/);
    assert.equal(existsSync(output), false);
});

test('an existing destination is not overwritten or included in the artifact', context => {
    const { source, output } = fixture(context);
    mkdirSync(output);
    writeFileSync(join(output, 'keep.txt'), 'existing work');
    assert.throws(() => buildSite(output, { sourceRoot: source }), /must be empty/);
    assert.equal(readFileSync(join(output, 'keep.txt'), 'utf8'), 'existing work');
});

test('the source repository cannot be used as the output directory', context => {
    const { source } = fixture(context);
    assert.throws(() => buildSite(source, { sourceRoot: source }), /outside the source repository/);
    assert.throws(() => buildSite(join(source, 'build'), { sourceRoot: source }), /outside the source repository/);
});

test('a symlinked destination cannot disguise output inside the source repository', context => {
    const { root, source } = fixture(context);
    const alias = join(root, 'source-alias');
    symlinkSync(source, alias, 'dir');
    assert.throws(() => buildSite(join(alias, 'nested', 'output'), { sourceRoot: source }), /outside the source repository/);
});

test('the actual public assets are a PDF and a JPEG', () => {
    const root = fileURLToPath(new URL('../', import.meta.url));
    assert.equal(readFileSync(join(root, 'assets', 'dongsung-huh-cv.pdf')).subarray(0, 5).toString(), '%PDF-');
    assert.equal(readFileSync(join(root, 'assets', 'portrait.jpg')).subarray(0, 3).toString('hex'), 'ffd8ff');
    for (const filePath of REPOSITORY_FILES) {
        assert.ok(readFileSync(join(root, filePath)).length > 0, `${filePath} must not be empty`);
    }
});

test('website text files have final newlines and no trailing whitespace', () => {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const textExtensions = ['.html', '.css', '.mjs', '.md', '.yml'];
    for (const filePath of REPOSITORY_FILES.filter(filePath => textExtensions.includes(extname(filePath)))) {
        const content = readFileSync(join(root, filePath), 'utf8');
        assert.ok(content.endsWith('\n'), `${filePath} needs a final newline`);
        assert.ok(!/[ \t]+$/m.test(content), `${filePath} has trailing whitespace`);
    }
});
