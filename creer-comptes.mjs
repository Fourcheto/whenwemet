// Cree un compte Firebase Authentication par membre, a partir de comptes.json.
// Ecrit la correspondance identifiant -> prenom sous /uids, et /admins pour l'admin.
// Relancable : un compte deja existant est retrouve, pas recree.

import { readFile } from 'node:fs/promises';

const BASE = 'https://whenwemet-4dbb0-default-rtdb.europe-west1.firebasedatabase.app';
const DOMAINE = 'whenwemet.local';

// Meme transformation que dans l'application : prenom -> adresse interne.
export function emailDe(nom){
  const s = nom.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
               .toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'');
  return `${s}@${DOMAINE}`;
}

let cle = null, origine = '';
try{
  cle = (await readFile('./cle.txt','utf8')).trim();
  origine = 'cle.txt';
}catch{
  const src = await readFile('./src/firebase.js','utf8');
  cle = src.match(/apiKey:\s*["']([^"']+)["']/)?.[1];
  origine = 'src/firebase.js';
}
if(!cle){ console.error("Aucune cle d'API trouvee."); process.exit(1); }
console.log(`Cle lue depuis ${origine}\n`);

let comptes;
try{ comptes = JSON.parse(await readFile('./comptes.json','utf8')); }
catch(e){ console.error('comptes.json illisible :', e.message); process.exit(1); }

const ID = 'https://identitytoolkit.googleapis.com/v1/accounts';

async function creerOuRetrouver(email, motDePasse){
  let r = await fetch(`${ID}:signUp?key=${cle}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password: motDePasse, returnSecureToken:true }),
  });
  let d = await r.json();
  if(r.ok) return { uid: d.localId, nouveau: true };

  if(d.error?.message === 'EMAIL_EXISTS'){
    r = await fetch(`${ID}:signInWithPassword?key=${cle}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password: motDePasse, returnSecureToken:true }),
    });
    d = await r.json();
    if(r.ok) return { uid: d.localId, nouveau: false };
    throw new Error(`compte existant, mot de passe different (${d.error?.message})`);
  }
  throw new Error(d.error?.message || 'echec inconnu');
}

const uids = {};
const admins = {};
let creations = 0, existants = 0, echecs = 0;

for(const [nom, motDePasse] of Object.entries(comptes)){
  if(!motDePasse || motDePasse.length < 6){
    console.error(`- ${nom} : mot de passe absent ou trop court (6 minimum), ignore`);
    echecs++; continue;
  }
  const email = emailDe(nom);
  try{
    const { uid, nouveau } = await creerOuRetrouver(email, motDePasse);
    uids[uid] = nom;
    if(nom === 'admin') admins[uid] = true;
    console.log(`- ${nom.padEnd(14)} ${email.padEnd(32)} ${nouveau?'cree':'existait deja'}`);
    nouveau ? creations++ : existants++;
  }catch(e){
    console.error(`- ${nom.padEnd(14)} ECHEC : ${e.message}`);
    echecs++;
  }
}

async function fusionner(chemin, objet){
  if(!Object.keys(objet).length) return;
  const r = await fetch(`${BASE}/${chemin}.json`, {
    method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(objet),
  });
  if(!r.ok) throw new Error(`${chemin} : ${r.status} ${await r.text()}`);
}

await fusionner('uids', uids);
await fusionner('admins', admins);

console.log(`\n${creations} compte(s) cree(s), ${existants} deja present(s), ${echecs} echec(s).`);
console.log(`${Object.keys(uids).length} correspondance(s) enregistree(s) sous /uids.`);
