# Abu Bakar Mosque digital twin (Next.js + CesiumJS)

A Next.js (App Router, TypeScript) app that loads your Cesium ion 3D tileset as a
digital twin: dark control-room scene, cyan tint, floating sensor tags, a live
readings panel, an auto-orbit camera, and an options panel (opacity 0-100%,
tint, wireframe, camera, base map and more).

## Run it

1. Install Node.js 20 or newer.
2. In this folder:

   ```bash
   npm install
   cp .env.example .env.local
   ```

3. Open `.env.local` and set your values:

   ```
   NEXT_PUBLIC_CESIUM_ION_TOKEN=your-new-token
   NEXT_PUBLIC_ION_ASSET_ID=3581036
   ```

   Use `3617055` instead if that is the mosque asset you want.

4. Start it:

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000.

## Cesium ion token

- Create a **new** token at https://ion.cesium.com/tokens with the `assets:read` scope.
  The token that was pasted in chat earlier is public now, so do not reuse it.
- `NEXT_PUBLIC_` variables are readable in the browser. In Cesium ion, restrict the
  token to your asset IDs (the mosque asset and asset `1`, Cesium World Terrain, plus
  the default imagery) and to your site's URL before deploying.
- Never commit `.env.local` (it is already in `.gitignore`).

## Deploy on Vercel

1. Push the project to GitHub (without `.env.local`).
2. Import it in Vercel and add the two environment variables above.
3. Deploy. `npm run build` copies Cesium's static files automatically.
4. Add your Vercel URL to the token's allowed URLs in Cesium ion.

## How it is organized

```
scripts/copy-cesium.mjs      copies Cesium's Workers/Assets/Widgets into public/cesium
src/app/layout.tsx           loads Cesium's widget styles
src/app/page.tsx             renders the viewer
src/components/TwinViewer.tsx   creates the Cesium viewer, loads the tileset, applies options
src/components/OptionsPanel.tsx sliders and toggles
src/components/SensorPanel.tsx  live readings panel
src/lib/options.ts           option types and defaults
src/lib/sensors.ts           demo sensors and simulated readings
```

## Street view window

Turn on **Street view window** in the Scene options to show Google Street View of the
mosque inside the app.

1. In Google Cloud Console, enable the **Maps Embed API** and create an API key.
2. Restrict the key to your site's URL (HTTP referrers), including http://localhost:3000/* for testing.
3. Put it in `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`.

Without a key the window still shows an **Open in Google Maps** link. Street View shows the
nearest panorama Google has for the mosque's coordinates (in `src/lib/location.ts`), which may
not be the same photo you see on the Maps place page. Photos from the place page belong to
their contributors and cannot be copied into the app; use your own photos if you want a gallery.

## Using real sensor data

Readings are simulated in `src/lib/sensors.ts` (`nextValue`). To use real data, add a
route handler such as `src/app/api/sensors/route.ts` that returns your readings, then
fetch it in the interval inside `TwinViewer.tsx` instead of calling `nextValue`.
Move a tag by editing its `e`, `n` and `u` values (fractions of the model radius from
its center).

## Notes

- The model is positioned by the transform saved in Cesium ion (Adjust tileset location).
- While Auto orbit is on, the camera is locked to the orbit. Turn it off, or double-click
  the scene, to look around freely.
- Low opacity values (30-70%) can make walls show through each other. That is normal for
  translucent 3D meshes.
