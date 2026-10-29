# Dongsung Huh: Academic Homepage

A static research homepage for GitHub Pages. The page uses HTML and CSS, needs no JavaScript or package installation, and can be previewed by opening [index.html](index.html).

## Website Files

- [index.html](index.html): research introduction, selected publications, talks, biography, and mentoring.
- [assets/site.css](assets/site.css): typography, colors, responsive layout, and print styles.
- [assets/portrait.jpg](assets/portrait.jpg): local portrait, independent of Google Scholar image hosting.
- [assets/dongsung-huh-cv.pdf](assets/dongsung-huh-cv.pdf): public CV download.
- [.github/workflows/pages.yml](.github/workflows/pages.yml): tested GitHub Pages deployment.
- [scripts/build.mjs](scripts/build.mjs): explicit public-file export and deployment staging.
- [scripts/build.test.mjs](scripts/build.test.mjs): export isolation, asset, and overwrite-protection tests.

The public PDF is a snapshot, not an automatically synchronized copy of the CV source. Replace it after compiling an updated CV. Publication titles, dates, and statuses should agree with that CV.

## Preview and Validate

Open [index.html](index.html) directly in a browser. No development server is required. Google Fonts are optional network requests; local fallback fonts preserve the layout when offline.

With Node.js 22 or newer:

```sh
node --test scripts/build.test.mjs
node scripts/build.mjs
git diff --check
```

The build command prints the path to a fresh temporary directory containing only the public page, stylesheet, portrait, CV PDF, and a `.nojekyll` marker. It does not publish anything.

## Publish a Website-Only Repository

The intended host is the GitHub organization `dongsunghuh`, managed by the personal account `benhuh`. The public repository is `dongsunghuh/dongsunghuh.github.io`, giving the homepage address `https://dongsunghuh.github.io/`. Organization name availability must be confirmed on GitHub before publishing. The personal account does not need to be renamed.

Do not push a working directory containing private application materials to a public repository. An artifact allowlist protects the deployed site, not the contents of the Git repository itself. In particular, files already staged in an existing repository would be included in a commit even if a later `git add` names only website files.

1. From this source directory, export a clean public repository into a new sibling directory:

   ```sh
   node scripts/build.mjs --repository ../dongsunghuh.github.io
   ```

   This copies only the files listed above plus `.nojekyll`. It excludes Git history, application documents, original CV sources, and unrelated assets. The destination must be empty; the exporter never deletes or overwrites existing work. Choose a different destination name if this one already exists.

2. Sign in as `benhuh` and create a free organization named `dongsunghuh`, owned by your personal account. Confirm that GitHub accepts the organization name and complete any account verification yourself. Inside that organization, create an empty public repository named `dongsunghuh.github.io`. The owner must be `dongsunghuh`, not `benhuh`. Do not initialize it with a README, license, or gitignore.

3. From the clean exported directory, initialize and push the website repository:

   ```sh
   cd ../dongsunghuh.github.io
   node --test scripts/build.test.mjs
   git init -b main
   git add index.html assets README.md scripts .github .nojekyll
   git commit -m "Publish academic homepage"
   git remote add origin https://github.com/dongsunghuh/dongsunghuh.github.io.git
   git push -u origin main
   ```

4. In the GitHub repository, open **Settings > Pages** and set **Source** to **GitHub Actions**. Then open **Actions > Deploy GitHub Pages** and run the workflow on `main`, or rerun an initial attempt made before Pages was enabled. Later pushes to `main` deploy automatically.

5. After the deployment succeeds, the homepage is served at `https://dongsunghuh.github.io/`. Check the live page, portrait, CV download, and mobile layout before changing links in applications or on Google Sites.

A project repository also works, with a URL such as `https://OWNER.github.io/REPOSITORY/`. All local asset links are relative, so no path changes are required. No personal access token or other secret belongs in these files. Creating a repository named `dongsunghuh.github.io` under `benhuh` does not give it the organization site's address.

## Updates

After the clean repository is created, maintain the website there. Edit the HTML and stylesheet, replace the public PDF as needed, run the tests, and review `git diff --check` before committing and pushing. Do not copy private application materials into the public repository.

If adding a public asset, add its exact relative path to `SITE_FILES` in [scripts/build.mjs](scripts/build.mjs). Both the deploy artifact and clean repository export use that list. Unlisted assets are deliberately excluded.

The Google Sites page is separate from this deployment. Keep it until the new URL is live; then replace its embedded content with a link to the new homepage. Add a custom domain and canonical URL metadata only after the actual hosting address is chosen.
