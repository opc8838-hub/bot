import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * Config du script d'export par lot (`tools/`), lance a la main :
 *
 *     pnpm vitest run --config vitest.export.config.ts
 *
 * Elle existe parce que `vitest.config.ts` restreint `include` a
 * `src/**\/*.test.ts`, et que les arguments positionnels de la CLI ne sont qu'un
 * FILTRE sur ce que `include` a deja retenu : un fichier hors motif ne se lance
 * pas, meme nomme en toutes lettres. Sortir le script de `src/` est ce qui garantit
 * qu'un `pnpm test` ordinaire n'ecrive jamais 192 fichiers sur le disque.
 *
 * Les quelques lignes dupliquees de la config de base le sont volontairement :
 * `mergeConfig` CONCATENE les tableaux, donc fusionner les deux ferait aussi
 * tourner toute la suite dans ce passage-ci.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tools/**/*.test.ts'],
    // Le lot complet rend 192 x 90 images : sans commune mesure avec les 5 s par
    // defaut, qui couperaient le test en plein milieu.
    testTimeout: 3_600_000
  }
})
