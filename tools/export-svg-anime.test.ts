// @vitest-environment happy-dom
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { it } from 'vitest'
import { EXPRESSIONS } from '@/bot/expressions'
import { COLORS } from '@/bot/skins'
import zh from '@/i18n/locales/zh'
import { versSvgAnime } from '@/ui/capture'
import { ANIM_SECONDES, DEMI_CADRE } from '@/ui/export'

/**
 * Export par lot : toutes les couleurs x toutes les expressions, en SVG anime,
 * rangees dans un dossier par couleur.
 *
 *     pnpm vitest run --config vitest.export.config.ts
 *
 * Ce n'est pas un test, c'est un script — il n'asserte rien et ecrit sur le
 * disque. Il vit sous vitest parce que c'est le seul lanceur du depot qui sache
 * monter un DOM : `versSvgAnime` passe par `createApp` et `XMLSerializer`, donc
 * rien de tout cela ne tourne en `node` nu, et aucun navigateur sans interface
 * n'est installe ici. `capture.test.ts` ouvre deja la voie en happy-dom.
 *
 * `LIMITE=2` restreint le lot aux deux premiers fichiers : c'est le tir de
 * verification a faire avant de lancer les 192.
 */

/** Hors du depot, volontairement : 192 fichiers n'ont rien a faire dans git. */
const RACINE = 'E:/bloub-export'
const FORME = 'carte'
/** La taille de l'action « anime » du personnalisateur, reprise telle quelle. */
const TAILLE = DEMI_CADRE * 2

/**
 * Images cles par seconde. `IPS=30` rend le reglage du personnalisateur.
 *
 * `ANIM_CLES_PAR_SEC` vaut 30, et c'est trop peu — contrairement a ce qu'annonce
 * sa doc : « le navigateur interpole entre les cles, donc le mouvement est lisse
 * quel qu'en soit le nombre » confond lissage de l'AFFICHAGE et lissage du
 * MOUVEMENT. L'interpolation est `linear`, donc la courbe rendue est une ligne
 * brisee dont les sommets sont les cles, et c'est la ligne qu'on voit, pas la
 * cadence.
 *
 * Mesure sur le clignement de `carte` / `encre` / `neutre`, reference a 240 img/s :
 * la paupiere va de d=0,86 a d=0,07 en 167 ms, et 30 img/s n'y place qu'UNE cle
 * intermediaire — deux segments pour le mouvement le plus vif de l'animation. Le
 * creux lui-meme est rate, 30 img/s ne descendant qu'a 0,19. Erreur de
 * reconstruction, en part de l'amplitude du clignement :
 *
 *     30 img/s -> 18,4 %  (16,8 Ko)   le creux est manque
 *     60 img/s ->  9,4 %  (27,5 Ko)
 *    120 img/s ->  3,9 %  (48,9 Ko)   soit ~0,5 px sur un rendu de 250 px
 *
 * 120 et pas 240 : le cout par image ne depend pas du nombre de cles, le
 * navigateur choisissant un segment pour interpoler, donc seul le poids du fichier
 * augmente — et 0,5 px est sous le seuil visible.
 *
 * La duree capturee, elle, ne bouge pas : trois secondes contiennent toujours un
 * clignement.
 */
const IPS = Number(process.env.IPS ?? 120)
const IMAGES = Math.round(IPS * ANIM_SECONDES)
const PAS = 1 / IPS

/** Les noms de fichiers sont ceux que l'utilisateur lit a l'ecran, donc en chinois. */
const NOMS = zh

const LIMITE = Number(process.env.LIMITE ?? 0)

it('exporte chaque couleur et chaque expression en SVG anime', async () => {
  const debut = Date.now()
  let fait = 0

  for (const couleur of COLORS) {
    const nomCouleur = NOMS.colors[couleur.id]
    const dossier = join(RACINE, nomCouleur)
    await mkdir(dossier, { recursive: true })

    for (const expression of EXPRESSIONS) {
      if (LIMITE && fait >= LIMITE) return
      const nomExpression = NOMS.expressions[expression.id]
      const svg = await versSvgAnime(
        { shape: FORME, color: couleur.id, expression: expression.id },
        TAILLE,
        IMAGES,
        PAS
      )
      await writeFile(
        join(dossier, `扑克牌-${nomCouleur}-${nomExpression}.svg`),
        await svg.text(),
        'utf8'
      )
      fait++
    }
    console.log(`${nomCouleur} : ${EXPRESSIONS.length} fichiers`)
  }

  const secondes = (Date.now() - debut) / 1000
  console.log(`${fait} fichiers en ${secondes.toFixed(1)} s -> ${RACINE}`)
})
