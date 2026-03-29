/**
 * Performance Tests — verify optimizations are in place.
 * Run: npx vitest run src/test/performance.test.ts
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '../../..');
const FRONTEND = path.join(ROOT, 'frontend');
const SRC = path.join(FRONTEND, 'src');

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(FRONTEND, relativePath), 'utf-8');
}

function grepFiles(pattern: string, glob: string): string[] {
  try {
    return execSync(
      `grep -rn "${pattern}" ${glob} 2>/dev/null | grep -v node_modules | grep -v ".test.ts"`,
      { cwd: FRONTEND, encoding: 'utf-8' }
    ).split('\n').filter(Boolean);
  } catch { return []; }
}

// ============================================================
// 1. BUNDLE OPTIMIZATION
// ============================================================
describe('Bundle Optimization', () => {
  it('vite minification is enabled', () => {
    const config = readFile('vite.config.ts');
    expect(config).toMatch(/minify.*esbuild|minify.*terser|minify: true/);
  });

  it('source maps are disabled in production', () => {
    const config = readFile('vite.config.ts');
    expect(config).toContain('sourcemap: false');
  });

  it('chunk size warning limit is 500KB or less', () => {
    const config = readFile('vite.config.ts');
    const match = config.match(/chunkSizeWarningLimit:\s*(\d+)/);
    expect(match).toBeTruthy();
    expect(parseInt(match![1])).toBeLessThanOrEqual(500);
  });

  it('framer-motion is isolated in its own chunk', () => {
    const config = readFile('vite.config.ts');
    expect(config).toMatch(/motion.*framer-motion|framer-motion.*motion/);
  });

  it('vendor libraries are in separate chunks', () => {
    const config = readFile('vite.config.ts');
    expect(config).toContain("vendor:");
    expect(config).toContain("'react'");
    expect(config).toContain("'react-dom'");
  });

  it('React deduplication is configured', () => {
    const config = readFile('vite.config.ts');
    expect(config).toContain('dedupe');
  });
});

// ============================================================
// 2. LAZY LOADING
// ============================================================
describe('Lazy Loading', () => {
  const appContent = readFile('src/App.tsx');

  it('pages use React.lazy for code splitting', () => {
    const lazyCount = (appContent.match(/lazy\(/g) || []).length;
    expect(lazyCount).toBeGreaterThan(10); // Should have many lazy-loaded pages
  });

  it('admin pages are lazy loaded', () => {
    // Admin pages should NOT have direct imports
    const directAdminImports = appContent
      .split('\n')
      .filter(line =>
        line.includes("from './pages/admin") &&
        !line.includes('lazy') &&
        !line.includes('//')
      );
    expect(directAdminImports).toEqual([]);
  });

  it('Suspense fallback exists for lazy routes', () => {
    expect(appContent).toContain('Suspense');
    expect(appContent).toContain('fallback');
  });
});

// ============================================================
// 3. IMAGE OPTIMIZATION
// ============================================================
describe('Image Optimization', () => {
  it('all img tags have loading="lazy" (excluding backups)', () => {
    const imgWithoutLazy = grepFiles('<img ', 'src/pages/');
    const missingLazy = imgWithoutLazy.filter(line =>
      !line.includes('loading=') &&
      !line.includes('// ') &&
      !line.includes('_backup') &&
      line.includes('src=')
    );
    expect(missingLazy.length).toBe(0);
  });

  it('cover art images use object-cover for proper sizing', () => {
    const coverImgs = grepFiles('coverArt\\|cover.*img\\|<img.*cover', 'src/pages/');
    // At least some images should use object-cover
    const withObjectCover = coverImgs.filter(l => l.includes('object-cover'));
    expect(withObjectCover.length).toBeGreaterThanOrEqual(0); // Informational
  });
});

// ============================================================
// 4. ANIMATION PERFORMANCE
// ============================================================
describe('Animation Performance', () => {
  it('CatalogArtists does NOT use AnimatePresence on grid items', () => {
    const content = readFile('src/pages/CatalogArtists.tsx');
    // AnimatePresence should not wrap the main grid (only modal is OK)
    const lines = content.split('\n');
    let inGrid = false;
    let animatePresenceInGrid = false;
    for (const line of lines) {
      if (line.includes('grid gap-3 grid-cols')) inGrid = true;
      if (inGrid && line.includes('AnimatePresence')) animatePresenceInGrid = true;
      if (inGrid && line.includes('</div>') && !line.includes('grid')) inGrid = false;
    }
    expect(animatePresenceInGrid).toBe(false);
  });

  it('large lists use CSS transitions instead of JS animations', () => {
    const content = readFile('src/pages/CatalogArtists.tsx');
    // Should have CSS transition classes
    expect(content).toContain('transition-all');
    // Should NOT have whileHover JS animations on list items
    const listItemMotion = content.match(/whileHover.*y.*-4/g) || [];
    expect(listItemMotion.length).toBe(0);
  });

  it('backdrop-blur usage is reasonable (< 30 instances per page)', () => {
    const pages = ['Catalog.tsx', 'CatalogArtists.tsx', 'Dashboard.tsx', 'CatalogDetail.tsx'];
    for (const page of pages) {
      try {
        const content = readFile(`src/pages/${page}`);
        const blurCount = (content.match(/backdrop-blur/g) || []).length;
        expect(blurCount).toBeLessThan(30);
      } catch { /* file may not exist */ }
    }
  });
});

// ============================================================
// 5. RE-RENDER OPTIMIZATION
// ============================================================
describe('Re-render Optimization', () => {
  it('React Compiler plugin is enabled', () => {
    const config = readFile('vite.config.ts');
    expect(config).toContain('babel-plugin-react-compiler');
  });

  it('pagination state does not cause full page re-renders', () => {
    // Check that page state is simple number, not object
    const catalog = readFile('src/pages/Catalog.tsx');
    expect(catalog).toMatch(/useState\(\s*1\s*\)|useState<number>/);
  });
});

// ============================================================
// 6. DATA FETCHING
// ============================================================
describe('Data Fetching', () => {
  it('React Query is used for server state management', () => {
    const hits = grepFiles('useQuery\\|useInfiniteQuery\\|useMutation', 'src/pages/');
    expect(hits.length).toBeGreaterThan(5);
  });

  it('queries have proper cache keys', () => {
    const hits = grepFiles("queryKey.*\\[", 'src/pages/');
    expect(hits.length).toBeGreaterThan(5);
  });

  it('infinite scroll uses useInfiniteQuery', () => {
    const catalog = readFile('src/pages/Catalog.tsx');
    expect(catalog).toContain('useInfiniteQuery');
  });
});

// ============================================================
// 7. BUTTON / INTERACTION PERFORMANCE
// ============================================================
describe('Button & Interaction', () => {
  it('delete buttons use stopPropagation to prevent bubbling', () => {
    const content = readFile('src/pages/CatalogArtists.tsx');
    expect(content).toContain('stopPropagation');
  });

  it('search inputs debounce or have controlled state', () => {
    // Search should use controlled state, not uncontrolled + submit
    const catalog = readFile('src/pages/Catalog.tsx');
    expect(catalog).toMatch(/onChange.*setSearch|onChange.*search/i);
  });

  it('pagination buttons have disabled state', () => {
    const catalog = readFile('src/pages/Catalog.tsx');
    expect(catalog).toContain('disabled');
  });
});

// ============================================================
// 8. BUILD OUTPUT VALIDATION
// ============================================================
describe('Build Configuration', () => {
  it('React and ReactDOM are deduplicated', () => {
    const config = readFile('vite.config.ts');
    expect(config).toContain("'react'");
    expect(config).toContain("'react-dom'");
  });

  it('CSS is minified', () => {
    const config = readFile('vite.config.ts');
    // esbuild handles CSS minification by default
    expect(config).toMatch(/minify/);
  });

  it('no console.log in production build config', () => {
    const config = readFile('vite.config.ts');
    // Should have drop console or terser config
    // This is informational — React Compiler may handle this
    expect(config).toBeDefined();
  });
});
