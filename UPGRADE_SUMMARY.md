# Next.js 16 Upgrade Summary

**Project:** notes-nextjs-public  
**Upgrade:** Next.js 15.1.6 → 16.1.1

## Overview

Successfully upgraded the project to Next.js 16.1.1 with React 19.2.3. Encountered compatibility issues with Turbopack and markdown loaders, which were resolved by using Webpack for development.

---

## January 14, 2025 - Additional Fixes

### Turbopack Testing and Reversion

**Action:** Extensive testing of Turbopack was performed, but it was ultimately reverted back to Webpack.

**Why Turbopack Was Reverted:**

1. **Incomplete Loader Support:** Turbopack's loader system is still experimental and doesn't fully support Webpack loaders like `raw-loader`. The configuration syntax exists but doesn't properly handle the markdown file imports.

2. **Markdown File Requirements:** The application imports markdown files directly using `raw-loader` (e.g., `import WELCOME_NOTE from '../../application_constants/welcome_markdown.md'`). This pattern works seamlessly with Webpack but requires full loader support that Turbopack doesn't yet provide.

3. **Single Markdown File Shared Across Apps:** The markdown files are shared across multiple applications. Using Webpack ensures consistency and compatibility across the entire codebase until Turbopack matures.

**Result:** Reverted to Webpack for development by using the `--webpack` flag in the dev script. This ensures reliable markdown file loading while maintaining compatibility with the existing codebase.

### Image Sizing SSR Fix

**Issue:** Images were displaying too small in markdown notes during server-side rendering.

**Cause:** The `ImageRenderer` component was using `windowDimensions` values during SSR where dimensions are 0, causing images to render with fixed small sizes.

**Solution:** Added SSR-safe checks to detect when running on the server vs client:
- Check `typeof window !== 'undefined'` to detect client-side
- Check that `windowDimensions.width > 0` and `windowDimensions.viewnote_width` exist
- During SSR or when dimensions aren't ready, use responsive CSS styling
- After hydration with valid dimensions, apply calculated sizes

**Files Modified:**
- `components/note/viewnote_markdown.tsx` - Added SSR-safe dimension checks in `ImageRenderer`

**Result:** Images now render correctly during SSR using responsive CSS, then get properly sized after client-side hydration.

---

## January 13, 2025 - Initial Upgrade

## Package Updates

### Core Dependencies
- **Next.js:** `15.1.6` → `16.1.1`
- **React:** `19.0.0` → `19.2.3`
- **React DOM:** `19.0.0` → `19.2.3`
- **ESLint:** `8.39.0` → `9.39.2` (required for Next.js 16)
- **eslint-config-next:** Updated to `16.1.1`

### Dev Dependencies
- **TypeScript:** `5.0.4` → `5.9.3`
- **@types/node:** `18.16.1` → `25.0.7`

## Changes Made

### 1. Package Configuration (`package.json`)

**Dev Script Updated:**
```json
"dev": "next dev --webpack -p 3003"
```

**Reason:** Next.js 16 uses Turbopack by default, but it doesn't fully support `raw-loader` for markdown files yet. The `--webpack` flag forces Webpack usage for development.

### 2. Next.js Configuration (`next.config.js`)

**Webpack Configuration (Active):**
- Kept existing webpack config for `.md` files using `raw-loader`
- This is what's currently being used after testing and reverting Turbopack

**Note:** Turbopack was tested but reverted due to incomplete loader support. See "Turbopack Markdown Loader Issue" in Issues Encountered section for details.

### 3. Layout Component Fixes (`components/layout/layout.tsx`)

**Issues Fixed:**
- Side effects were running in component body (causing duplication issues)
- Event listeners weren't being cleaned up properly
- Screen height calculation timing issues

**Changes:**
- Moved `setScreenHeight()` call to `useEffect` hook
- Added proper event listener cleanup
- Added delayed call (100ms) to ensure header is rendered before calculating height
- Added null checks for header element

**Before:**
```javascript
// Called directly in component body - BAD
setScreenHeight();
window.addEventListener("resize", () => {
  setScreenHeight();
});
```

**After:**
```javascript
useEffect(() => {
  if (typeof window === "undefined") return;
  
  setScreenHeight();
  const timeoutId = setTimeout(() => {
    setScreenHeight();
  }, 100);
  
  const handleResize = () => {
    setScreenHeight();
  };
  
  window.addEventListener("resize", handleResize);
  
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

### 4. CSS Variables Fix (`styles/globals.css`)

**Added Default Values:**
```css
--jsvh: 100vh;
--jsheader-height: 0px;
```

**Reason:** These CSS variables are set by JavaScript, but need fallback values for initial render. Without defaults, height calculations fail and scrolling breaks.

### 5. Image Renderer SSR Fix (`components/note/viewnote_markdown.tsx`)

**Issue Fixed:** Images displaying too small during server-side rendering

**Cause:** The `ImageRenderer` component was using `windowDimensions` values during SSR, where `windowDimensions.width` and `windowDimensions.viewnote_width` are 0. This caused images to render with fixed small dimensions.

**Solution:** Added SSR-safe checks to detect when running on the server vs client:
- Check `typeof window !== 'undefined'` to detect client-side
- Check that `windowDimensions.width > 0` and `windowDimensions.viewnote_width` exist
- During SSR or when dimensions aren't ready, use responsive CSS styling
- After hydration with valid dimensions, apply calculated sizes

**Before:**
```typescript
let temp_width = windowDimensions.width; // 0 during SSR
if (windowDimensions && windowDimensions.viewnote_width && ...) {
  // Logic runs with width = 0
}
```

**After:**
```typescript
const isClient = typeof window !== 'undefined';
const hasValidDimensions = isClient && windowDimensions.width > 0 && windowDimensions.viewnote_width;

if (hasValidDimensions) {
  // Client-side logic with valid dimensions
} else {
  // SSR: use responsive CSS
  imageStyle = { width: '100%', maxWidth: '100%', height: 'auto' };
}
```

**Result:** Images now render correctly during SSR using responsive CSS, then get properly sized after client-side hydration.

## Issues Encountered

### 1. Turbopack Markdown Loader Issue

**Error:**
```
./application_constants/welcome_markdown.md
Unknown module type
This module doesn't have an associated type. Use a known file extension, or register a loader for it.
```

**Testing Attempted:** Extensive testing was performed to try to enable Turbopack. We attempted to configure Turbopack's loader rules in `next.config.js` using the `experimental.turbo.rules` configuration:

```javascript
experimental: {
  turbo: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.md",
      },
    },
  },
}
```

**Why Turbopack Was Reverted:**

1. **Incomplete Loader Support:** Turbopack's loader system is still experimental and doesn't fully support Webpack loaders like `raw-loader`. The configuration syntax exists but doesn't properly handle the markdown file imports.

2. **Markdown File Requirements:** The application imports markdown files directly using `raw-loader` (e.g., `import WELCOME_NOTE from '../../application_constants/welcome_markdown.md'`). This pattern works seamlessly with Webpack but requires full loader support that Turbopack doesn't yet provide.

3. **Single Markdown File Shared Across Apps:** The markdown files are shared across multiple applications. Using Webpack ensures consistency and compatibility across the entire codebase until Turbopack matures.

**Solution:** Reverted to Webpack for development by using the `--webpack` flag in the dev script. This ensures reliable markdown file loading while maintaining compatibility with the existing codebase.

**Future:** When Turbopack adds full support for Webpack loaders (especially `raw-loader`), we can re-evaluate migrating to Turbopack. Until then, Webpack provides the necessary stability and compatibility.

### 2. Page Duplication Issue

**Symptom:** Page content appearing duplicated on top of itself

**Cause:** Side effects running in component body instead of `useEffect`

**Solution:** Moved all side effects to proper `useEffect` hooks with cleanup

### 3. Scroll Disabled Issue

**Symptom:** Scrolling not working on note pages

**Cause:** CSS variables (`--jsvh`, `--jsheader-height`) not set before initial render

**Solution:** 
- Added default CSS variable values
- Improved timing of `setScreenHeight()` calls
- Added null checks for header element

### 4. Image Sizing SSR Issue

**Symptom:** Images displaying too small in markdown notes

**Cause:** `ImageRenderer` component was using `windowDimensions` values during SSR where dimensions are 0, causing images to render with fixed small sizes.

**Solution:** Added SSR-safe checks to use responsive CSS during server-side rendering, with proper sizing applied after client-side hydration.

**Files Modified:**
- `components/note/viewnote_markdown.tsx` - Added SSR-safe dimension checks in `ImageRenderer`

## Files Modified

1. `package.json` - Updated dependencies and dev script
2. `next.config.js` - Kept Webpack config (Turbopack config removed after testing)
3. `components/layout/layout.tsx` - Fixed side effects and scroll height calculation
4. `styles/globals.css` - Added default CSS variable values
5. `components/note/viewnote_markdown.tsx` - Fixed SSR image sizing issue

## Testing Recommendations

1. **Test scrolling** on note pages (`/notebook/[notebookId]/[noteId]`)
2. **Test markdown file loading** - ensure welcome note displays correctly
3. **Test split-screen mode** - verify edit/view panels work
4. **Test responsive behavior** - check mobile/desktop views
5. **Test scroll sync** - verify edit and view panels sync scrolling

## Known Limitations

1. **Turbopack:** Not currently used due to `raw-loader` incompatibility. After extensive testing, we confirmed that Turbopack's experimental loader system doesn't fully support Webpack loaders. The project uses Webpack for development to ensure reliable markdown file loading.
2. **React 19 + MUI v5:** Some peer dependency warnings (non-blocking)
3. **TypeScript Types:** Using React 18 types with React 19 (works but may show warnings)

## Future Improvements

1. **Enable Turbopack:** When it adds full support for Webpack loaders (especially `raw-loader`). The current experimental loader system is incomplete and doesn't properly handle markdown file imports. Monitor Turbopack's development for improved loader support.
2. **Update MUI:** Consider upgrading to MUI v6+ for better React 19 support
3. **Update React Types:** Upgrade `@types/react` when React 19 types are stable

## Migration Notes

- All changes are backward compatible
- No breaking changes to existing functionality
- Development server now uses Webpack instead of Turbopack
- Production builds unchanged (still use default Next.js bundler)

## Commands

**Start Development Server:**
```bash
npm run dev
```

**Build for Production:**
```bash
npm run build
```

**Start Production Server:**
```bash
npm start
```

## References

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Turbopack Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/turbo)
- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
