import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import viteSvgToWebfont from 'vite-svg-2-webfont';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // Все собранные ресурсы — в dist/assets/
  build: {
    assets: 'assets',
  },
  vite: {
    plugins: [
      // Иконочный шрифт из src/assets/icons/font/*.svg.
      // CSS подключается виртуальным модулем 'virtual:vite-svg-2-webfont.css' (см. BaseLayout.astro).
      // Классы: .icon (базовый) + .icon-<имя-файла>.
      viteSvgToWebfont({
        context: fileURLToPath(new URL('./src/assets/icons/font', import.meta.url)),
        fontName: 'pechnik-icons',
        types: ['woff2', 'woff'],
        baseSelector: '.icon',
        classPrefix: 'icon-',
        normalize: true,
        centerHorizontally: true,
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          // Bootstrap 5.2 использует @import внутри node_modules —
          // глушим deprecation-предупреждения чужих файлов.
          quietDeps: true,
          silenceDeprecations: ['import'],
        },
      },
    },
    build: {
      // Единый CSS-файл без дробления по страницам.
      cssCodeSplit: false,
      // CSS не минифицируется на этапе Vite: style.min.css создаётся
      // постобработкой scripts/postbuild.mjs из собранного style.css.
      cssMinify: false,
      // Не инлайнить мелкие ресурсы в base64: файлы шрифтов и иконок
      // должны оставаться отдельными файлами для переноса в CMS.
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const names = assetInfo.names ?? [assetInfo.name ?? ''];
            if (names.some((n) => n.endsWith('.css'))) {
              return 'css/style[extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    },
  },
});
