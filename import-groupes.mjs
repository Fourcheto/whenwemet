// Importe groupes.json dans la branche /groupes de la base Firebase.
// N'écrit QUE sous /groupes — le reste de la base n'est jamais touché.

import { readFile } from 'node:fs/promises';

const BASE = 'https://whenwemet-4dbb0-default-rtdb.europe-west1.firebasedatabase.app';
const CHEMIN = '/groupes';

const donnees = JSON.parse(await readFile('./groupes.json', 'utf8'));

console.log(`Écriture vers ${BASE}${CHEMIN} ...`);

const reponse = await fetch(`${BASE}${CHEMIN}.json`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(donnees),
});

if (!reponse.ok) {
  console.error('ÉCHEC :', reponse.status, await reponse.text());
  process.exit(1);
}

console.log('OK — groupes importés :', Object.keys(donnees).join(', '));
