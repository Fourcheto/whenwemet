// Teste la creation d'un compte jetable, avec et sans en-tete Referer,
// pour determiner si la cle API est restreinte aux appels navigateur.

import { readFile } from 'node:fs/promises';

const src = await readFile('./src/firebase.js', 'utf8');
const cle = src.match(/apiKey:\s*["']([^"']+)["']/)?.[1];

const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cle}`;
const corps = JSON.stringify({
  email: `diagnostic.${Date.now()}@whenwemet.local`,
  password: 'diagnostic123',
  returnSecureToken: true,
});

async function essai(nom, entetes){
  const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json', ...entetes}, body: corps });
  const d = await r.json();
  console.log(`\n[${nom}] statut ${r.status}`);
  if(r.ok) console.log('  SUCCES — compte jetable cree, pense a le supprimer dans la console');
  else console.log('  erreur :', JSON.stringify(d.error?.message || d));
}

await essai('sans Referer', {});
await essai('avec Referer localhost', { 'Referer': 'http://localhost:5173/' });
