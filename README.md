# aircraft.fyi

**The repo root is the live site.** GitHub Pages serves it directly — index.html, the section
folders and assets/ are all deployables. Push to publish.

- **Do not hand-edit the HTML** — every page carries a GENERATED banner. The next build overwrites it.
- All content lives in `build/data/*.json`. All machinery lives in `build/`.
- Rebuild the whole site: `node build/build.js` (108 pages, ~1s, no dependencies).
- Full deploy + update guide: `build/DEPLOY.md`.
