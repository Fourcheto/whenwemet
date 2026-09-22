// Ajoute un membre a WhenWeMeet : compte Firebase, entree uids, entree users,
// et inscription dans des groupes (facultatif).
//
//   node ajouter-membre.mjs "Damien"
//   node ajouter-membre.mjs "Stéphanie L" amis afterwork
//   node ajouter-membre.mjs "Damien" --mdp MonMotDePasse
//
// Sans --mdp, un mot de passe est genere et affiche a la fin.
// Le script ne fait rien si le membre existe deja.

import { readFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const args = process.argv.slice(2);
const iMdp = args.indexOf('--mdp');
const mdpImpose = iMdp !== -1 ? args[iMdp + 1] : null;
if (iMdp !== -1) args.splice(iMdp, 2);

const nom = (args[0] || '').trim();
const groupes = args.slice(1);

if (!nom) {
  console.log('Usage : node ajouter-membre.mjs "Prenom" [groupe1 groupe2 ...] [--mdp motdepasse]');
  process.exit(1);
}

const emailDe = (n) =>
  `${n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}@whenwemet.local`;

function motDePasseAleatoire() {
  const lettres = 'abcdefghijkmnopqrstuvwxyz';
  const majuscules = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const chiffres = '23456789';
  const tout = lettres + majuscules + chiffres;
  const pioche = (s) => s[Math.floor(Math.random() * s.length)];
  let p = pioche(majuscules) + pioche(chiffres);
  for (let i = 0; i < 8; i++) p += pioche(tout);
  return p.split('').sort(() => Math.random() - 0.5).join('');
}

// Adresse de la base, lue dans src/firebase.js
const src = await readFile('./src/firebase.js', 'utf8');
const databaseURL = src.match(/databaseURL:\s*["']([^"']+)["']/)?.[1];
if (!databaseURL) {
  console.log('ECHEC : databaseURL introuvable dans src/firebase.js.');
  process.exit(1);
}

let compteService;
try {
  compteService = JSON.parse(await readFile('./service-account.json', 'utf8'));
} catch {
  console.log('ECHEC : service-account.json introuvable ou illisible a la racine.');
  process.exit(1);
}

initializeApp({ credential: cert(compteService), databaseURL });
const auth = getAuth();
const db = getDatabase();

const email = emailDe(nom);
const motDePasse = mdpImpose || motDePasseAleatoire();

console.log(`Membre   : ${nom}`);
console.log(`Adresse  : ${email}`);
console.log('');

// 1. Le membre existe-t-il deja ?
const dejaUsers = (await db.ref(`users/${nom}`).get()).exists();
let uid = null;
try {
  uid = (await auth.getUserByEmail(email)).uid;
} catch {
  /* pas de compte : normal pour un nouveau membre */
}

let compteCree = false;
if (uid) {
  console.log('Un compte existe deja pour cette adresse. Aucun compte cree.');
} else {
  const user = await auth.createUser({ email, password: motDePasse, displayName: nom });
  uid = user.uid;
  compteCree = true;
  console.log('OK : compte Firebase cree.');
}

// 2. Correspondance identifiant -> prenom
await db.ref(`uids/${uid}`).set(nom);
console.log('OK : entree uids enregistree.');

// 3. Liste des membres
if (dejaUsers) {
  console.log('Deja present dans users, entree inchangee.');
} else {
  await db.ref(`users/${nom}`).set(true);
  console.log('OK : ajoute a la liste des membres.');
}

// 4. Groupes (facultatif)
for (const gid of groupes) {
  const groupe = await db.ref(`annuaire/${gid}`).get();
  if (!groupe.exists()) {
    console.log(`ATTENTION : le groupe "${gid}" n existe pas, ignore.`);
    continue;
  }
  await db.ref(`annuaire/${gid}/membres/${nom}`).set(true);
  console.log(`OK : ajoute au groupe "${gid}" (${groupe.val().nom || gid}).`);
}

console.log('');
if (compteCree && !mdpImpose) {
  console.log('─────────────────────────────────────────────');
  console.log(`Mot de passe a transmettre : ${motDePasse}`);
  console.log('A changer par le membre depuis « Mon mot de passe ».');
  console.log('─────────────────────────────────────────────');
}
console.log('Termine.');
process.exit(0);
