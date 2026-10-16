# Verdant Studio

A browser-only botanical QR workbench built with React, TypeScript, React Three Fiber, Three.js, node-qrcode, and jsQR.

## Run

```sh
npm install
npm run dev
npm test
npm run build
```

## Workbench

The header holds the URL, deterministic growth seed, presets, studio lighting, measured frame rate, and exports. The live QR mini-map remains available while sculpting. The inspector provides Sculpt, QR Craft, and Atmosphere tabs with visual pickers and scrubbable controls. On mobile, the inspector becomes an expandable drawer.

Four seeded forms and four seasons are available. Botanical Bloom uses a curved stem, three leaves, sepals, three cupped petal tiers, and a hemispherical Fibonacci core. Geometry, density, curvature, wind, lighting, particles, and plinth material are adjustable.

Click the sculpture or press **Space** to assemble the botanical QR mosaic. All instances remain physical pieces on the persistent tiled plinth. Dark module substrates support smaller seasonal caps; the limestone matrix includes a four-module quiet zone. Botanical, architectural relief, and connected-island styles support elevation and camera tilt controls. Projection compensation bounds the extrusions within their projected module footprints. Finder and timing regions are protected from wind.

**S** tests the exact encoded URL. In QR mode, verification decodes a crop of the actual WebGL render, with no SVG replacement. The indicator reports failure if that view does not decode; snap to zenith and retest. Deep relief, lighting, tilt, display resolution, and camera conditions affect real-world scanning. Print-ready PNG/SVG exports offer a clean alternative. No universal device scan guarantee is made.

**R** resets the camera. The orientation gizmo also offers zenith and tilted views. Export Studio provides PNG, SVG, and supersampled 2×/4× sculpture posters with a scannable QR badge. Shared configuration links restore the URL, seed, form, palette, and inspector settings.

## Verification

Tests independently decode QR matrices across L/M/Q/H error correction, check deterministic geometry across all sixteen form/season combinations, validate botanical structure, inspect every mosaic instance, verify palette contrast, decode projected relief silhouettes at multiple angles, and validate configuration restoration. The build runs TypeScript and creates split production bundles. Runtime FPS reflects the current device and browser rather than a fixed claim.

URL contents stay in the browser. No backend or analytics is used. Google Fonts has local fallbacks. WebGL is required for the 3D experience; a QR fallback is provided if rendering fails.

## Publish with GitHub Pages

The included GitHub Actions workflow tests and builds the site, then deploys `dist` whenever `main` is pushed. Vite uses relative asset paths so the site works under the repository path.

1. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the build source.
2. Push the commits with `git push origin main`.
3. Wait for **Deploy Verdant Studio to GitHub Pages** in the Actions tab to finish.

The project URL will be **https://abu166.github.io/3d_qr_code/**. The workflow can also be run manually from the Actions tab. GitHub Pages must be available for the repository's visibility and account plan.
