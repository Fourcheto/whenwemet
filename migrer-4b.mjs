// Deplace les donnees existantes sous groupes/amis/ puis supprime les branches d'origine.
// Refuse de s'executer si la destination contient deja quelque chose.

const BASE = 'https://whenwemet-4dbb0-default-rtdb.europe-west1.firebasedatabase.app';
const GID = 'amis';
const NOM = 'Groupe Collègues de travail';

const DEPLACEMENTS = [
  ['availability',           `groupes/${GID}/availability`],
  ['messages',               `groupes/${GID}/messages`],
  ['proposals',              `groupes/${GID}/proposals`],
  ['sorties',                `groupes/${GID}/sorties`],
  ['config/validatedEvent',  `groupes/${GID}/validatedEvent`],
];

async function lire(chemin){
  const r = await fetch(`${BASE}/${chemin}.json`);
  if(!r.ok) throw new Error(`lecture ${chemin} : ${r.status}`);
  return r.json();
}
async function ecrire(chemin, valeur){
  const r = await fetch(`${BASE}/${chemin}.json`, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(valeur),
  });
  if(!r.ok) throw new Error(`ecriture ${chemin} : ${r.status} ${await r.text()}`);
}

const groupe = await lire(`groupes/${GID}`);
if(!groupe){
  console.error(`ARRET : le groupe "${GID}" n'existe pas. Rien n'a ete modifie.`);
  process.exit(1);
}
console.log(`Groupe cible : ${GID} ("${groupe.nom}")\n`);

// 1. Verification prealable : aucune destination ne doit etre occupee.
for(const [source, dest] of DEPLACEMENTS){
  const dejaLa = await lire(dest);
  if(dejaLa !== null){
    console.error(`ARRET : ${dest} contient deja des donnees. Rien n'a ete modifie.`);
    process.exit(1);
  }
}

// 2. Copie.
const copies = [];
for(const [source, dest] of DEPLACEMENTS){
  const donnees = await lire(source);
  if(donnees === null){ console.log(`- ${source} : vide, rien a deplacer`); continue; }
  await ecrire(dest, donnees);
  const nb = typeof donnees === 'object' ? Object.keys(donnees).length : 1;
  console.log(`- ${source} -> ${dest}  (${nb} entree(s))`);
  copies.push(source);
}

// 3. Renommage du groupe.
await ecrire(`groupes/${GID}/nom`, NOM);
console.log(`- groupes/${GID}/nom -> "${NOM}"`);

// 4. Suppression des branches d'origine, une fois les copies confirmees.
for(const source of copies){
  const dest = DEPLACEMENTS.find(d => d[0] === source)[1];
  const verif = await lire(dest);
  if(verif === null){ console.error(`ANOMALIE : ${dest} est vide, ${source} est conserve.`); continue; }
  await fetch(`${BASE}/${source}.json`, { method:'DELETE' });
  console.log(`- ${source} supprime`);
}

console.log('\nMigration terminee.');
