// Etape 5c : copie l'identite de chaque groupe vers annuaire/{gid}.
// Ne supprime rien. La branche groupes/ reste intacte.
//
//   node migrer-5c.mjs            -> simulation, aucune ecriture
//   node migrer-5c.mjs --ecrire   -> applique la copie

import { readFile } from 'node:fs/promises';

const src = await readFile('./src/firebase.js', 'utf8');
const base = src.match(/databaseURL:\s*["']([^"']+)["']/)?.[1]?.replace(/\/$/, '');

if (!base) {
  console.log('ECHEC : databaseURL introuvable dans src/firebase.js.');
  process.exit(1);
}

const CHAMPS = ['nom', 'ordre', 'type', 'createdAt', 'membres'];
const ecrire = process.argv.includes('--ecrire');

const r = await fetch(`${base}/groupes.json`);
if (!r.ok) {
  console.log('ECHEC : lecture de groupes impossible, statut', r.status);
  process.exit(1);
}

const groupes = await r.json();
if (!groupes) {
  console.log('ECHEC : la branche groupes est vide.');
  process.exit(1);
}

const annuaire = {};
for (const [gid, g] of Object.entries(groupes)) {
  const entree = {};
  for (const champ of CHAMPS) {
    if (g?.[champ] !== undefined) entree[champ] = g[champ];
  }
  annuaire[gid] = entree;

  const nb = entree.membres ? Object.keys(entree.membres).length : 0;
  const repris = CHAMPS.filter((c) => entree[c] !== undefined).join(', ');
  console.log(`${gid.padEnd(12)} ${nb} membres  | champs repris : ${repris}`);
}

if (!ecrire) {
  console.log('');
  console.log('SIMULATION : rien n a ete ecrit dans la base.');
  console.log('Pour appliquer : node migrer-5c.mjs --ecrire');
  process.exit(0);
}

const w = await fetch(`${base}/annuaire.json`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(annuaire),
});

if (w.ok) {
  console.log('');
  console.log(`OK : ${Object.keys(annuaire).length} groupes copies dans annuaire/.`);
  console.log('La branche groupes/ n a pas ete modifiee.');
} else {
  console.log('');
  console.log('ECHEC : statut', w.status, await w.text());
}
