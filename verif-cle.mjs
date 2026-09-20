// Verifie ce que le script d'extraction recupere dans src/firebase.js.
// N'affiche jamais la cle en entier.

import { readFile } from 'node:fs/promises';

const s = await readFile('./src/firebase.js', 'utf8');
const k = s.match(/apiKey:\s*["']([^"']+)["']/)?.[1];

console.log('longueur :', k ? k.length : 'introuvable');
console.log('debut    :', k ? k.slice(0, 6) : '');
console.log('attendu  : longueur 39, debut AIzaSy');
