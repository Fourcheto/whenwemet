// Compare la cle de src/firebase.js avec celle collee dans cle.txt,
// puis teste un appel Identity Toolkit avec chacune. N'affiche aucune cle.

import { readFile } from 'node:fs/promises';

const src = await readFile('./src/firebase.js', 'utf8');
const cleFichier = src.match(/apiKey:\s*["']([^"']+)["']/)?.[1] || '';
const cleConsole = (await readFile('./cle.txt', 'utf8')).trim();

console.log('cle de src/firebase.js : longueur', cleFichier.length);
console.log('cle de cle.txt         : longueur', cleConsole.length);
console.log('identiques             :', cleFichier === cleConsole ? 'OUI' : 'NON');

if(cleFichier !== cleConsole){
  let i = 0;
  while(i < Math.min(cleFichier.length, cleConsole.length) && cleFichier[i] === cleConsole[i]) i++;
  console.log('premiere difference au caractere', i + 1);
}

async function test(nom, cle){
  if(!cle){ console.log(`\n[${nom}] cle vide, ignore`); return; }
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cle}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email:`diag.${Date.now()}@whenwemet.local`, password:'diagnostic123', returnSecureToken:true }),
  });
  const d = await r.json();
  console.log(`\n[${nom}] statut ${r.status} :`, r.ok ? 'SUCCES' : JSON.stringify(d.error?.message || d));
}

await test('cle de src/firebase.js', cleFichier);
await test('cle de cle.txt', cleConsole);
