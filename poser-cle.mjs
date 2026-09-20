// Remplace la cle d'API de src/firebase.js par celle contenue dans cle.txt.
// Fait une sauvegarde avant toute modification. N'affiche jamais la cle.

import { readFile, writeFile, copyFile } from 'node:fs/promises';

const chemin = './src/firebase.js';
const sauvegarde = './firebase.js.sauvegarde';

let nouvelle;
try {
  nouvelle = (await readFile('./cle.txt', 'utf8')).trim();
} catch {
  console.log('ECHEC : fichier cle.txt introuvable a la racine du projet.');
  process.exit(1);
}

if (nouvelle.length !== 39 || !nouvelle.startsWith('AIzaSy')) {
  console.log('ECHEC : cle.txt ne ressemble pas a une cle valide.');
  console.log('  longueur lue :', nouvelle.length, '(attendu 39)');
  console.log('  debut lu     :', nouvelle.slice(0, 6), '(attendu AIzaSy)');
  process.exit(1);
}

const src = await readFile(chemin, 'utf8');
const trouvee = src.match(/apiKey:\s*["']([^"']+)["']/);

if (!trouvee) {
  console.log('ECHEC : aucune ligne apiKey trouvee dans src/firebase.js.');
  process.exit(1);
}

if (trouvee[1] === nouvelle) {
  console.log('Rien a faire : src/firebase.js contient deja la cle de cle.txt.');
  process.exit(0);
}

await copyFile(chemin, sauvegarde);
await writeFile(chemin, src.replace(trouvee[0], `apiKey: "${nouvelle}"`), 'utf8');

console.log('OK : cle remplacee dans src/firebase.js.');
console.log('Sauvegarde de l ancienne version :', sauvegarde);
console.log('');
console.log('Etape suivante : node comparer-cles.mjs');
