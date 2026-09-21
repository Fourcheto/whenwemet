import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Remplace __BUILD__ dans dist/sw.js par la date et l'heure de construction.
// Chaque deploiement Vercel recoit ainsi une version de cache unique.
function versionServiceWorker() {
  let dossierSortie
  return {
    name: 'version-service-worker',
    apply: 'build',
    configResolved(config) {
      dossierSortie = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const fichier = resolve(dossierSortie, 'sw.js')
      if (!existsSync(fichier)) return
      const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      const contenu = readFileSync(fichier, 'utf8')
      if (!contenu.includes('__BUILD__')) {
        console.warn('[version-service-worker] repere __BUILD__ absent de sw.js')
        return
      }
      writeFileSync(fichier, contenu.replaceAll('__BUILD__', version))
      console.log(`[version-service-worker] cache : whenwemet-${version}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionServiceWorker()],
})
