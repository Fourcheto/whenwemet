// Supprime un membre de WhenWeMeet et toutes ses traces.
//
//   node supprimer-membre.mjs "Test Zebre"              -> simulation, rien n'est efface
//   node supprimer-membre.mjs "Test Zebre" --supprimer  -> suppression reelle
//
// Sont retires : le compte Firebase, l'entree uids, l'entree users,
// le profil, la presence, l'occupation, l'appartenance aux groupes,
// ses messages, ses propositions, ses votes, et son nom dans les
// disponibilites, l'evenement valide et les sorties archivees.

import { readFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const args = process.argv.slice(2);
const supprimer = args.includes('--supprimer');
const nom = (args.find((a) => a !== '--supprimer') || '').trim();

if (!nom) {
  console.log('Usage : node supprimer-membre.mjs "Prenom" [--supprimer]');
  process.exit(1);
}

const emailDe = (n) =>
  `${n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}@whenwemet.local`;

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
const actions = []; // { texte, appliquer }

// 1. Compte Firebase
let uid = null;
try {
  uid = (await auth.getUserByEmail(email)).uid;
  actions.push({ texte: `compte Firebase (${email})`, appliquer: () => auth.deleteUser(uid) });
  actions.push({ texte: `entree uids`, appliquer: () => db.ref(`uids/${uid}`).remove() });
} catch {
  console.log(`Aucun compte Firebase pour ${email}.`);
}

// 2. Entrees simples
for (const chemin of [`users/${nom}`, `profiles/${nom}`, `presence/${nom}`, `occupation/${nom}`]) {
  if ((await db.ref(chemin).get()).exists()) {
    actions.push({ texte: chemin, appliquer: () => db.ref(chemin).remove() });
  }
}

// 3. Parcours des groupes
const annuaire = (await db.ref('annuaire').get()).val() || {};
const contenu = (await db.ref('groupes').get()).val() || {};

for (const gid of Object.keys(annuaire)) {
  if (annuaire[gid]?.membres?.[nom]) {
    actions.push({ texte: `appartenance au groupe ${gid}`, appliquer: () => db.ref(`annuaire/${gid}/membres/${nom}`).remove() });
  }

  const g = contenu[gid] || {};

  // messages ecrits par le membre
  for (const [mid, m] of Object.entries(g.messages || {})) {
    if (m?.user === nom) {
      actions.push({ texte: `message dans ${gid}`, appliquer: () => db.ref(`groupes/${gid}/messages/${mid}`).remove() });
    }
  }

  // propositions : les siennes sont supprimees, ses votes ailleurs sont retires
  for (const [pid, p] of Object.entries(g.proposals || {})) {
    if (p?.author === nom) {
      actions.push({ texte: `proposition dans ${gid}`, appliquer: () => db.ref(`groupes/${gid}/proposals/${pid}`).remove() });
    } else if (p?.votes && p.votes[nom] !== undefined) {
      actions.push({ texte: `vote dans ${gid}`, appliquer: () => db.ref(`groupes/${gid}/proposals/${pid}/votes/${nom}`).remove() });
    }
  }

  // disponibilites
  for (const [date, jour] of Object.entries(g.availability || {})) {
    for (const creneau of ['midi', 'soir']) {
      const liste = jour?.[creneau];
      if (Array.isArray(liste) && liste.includes(nom)) {
        const filtree = liste.filter((x) => x !== nom);
        actions.push({ texte: `dispo ${date} ${creneau} dans ${gid}`, appliquer: () => db.ref(`groupes/${gid}/availability/${date}/${creneau}`).set(filtree) });
      }
    }
  }

  // evenement valide
  const parts = g.validatedEvent?.participants;
  if (Array.isArray(parts) && parts.includes(nom)) {
    const filtree = parts.filter((x) => x !== nom);
    actions.push({ texte: `participants de l evenement valide de ${gid}`, appliquer: () => db.ref(`groupes/${gid}/validatedEvent/participants`).set(filtree) });
  }

  // sorties archivees
  for (const [sid, s] of Object.entries(g.sorties || {})) {
    if (Array.isArray(s?.participants) && s.participants.includes(nom)) {
      const filtree = s.participants.filter((x) => x !== nom);
      actions.push({ texte: `participants d une sortie de ${gid}`, appliquer: () => db.ref(`groupes/${gid}/sorties/${sid}/participants`).set(filtree) });
    }
  }
}

console.log(`Membre : ${nom}`);
console.log('');

if (actions.length === 0) {
  console.log('Aucune trace trouvee. Rien a faire.');
  process.exit(0);
}

const compte = {};
for (const a of actions) {
  const cle = a.texte.replace(/ [^ ]+ (dans|de) /, ' $1 ');
  compte[cle] = (compte[cle] || 0) + 1;
}
for (const [texte, n] of Object.entries(compte)) {
  console.log(` - ${texte}${n > 1 ? ` (x${n})` : ''}`);
}
console.log('');
console.log(`${actions.length} element(s) concerne(s).`);

if (!supprimer) {
  console.log('');
  console.log('SIMULATION : rien n a ete efface.');
  console.log(`Pour appliquer : node supprimer-membre.mjs "${nom}" --supprimer`);
  process.exit(0);
}

for (const a of actions) await a.appliquer();

console.log('');
console.log('OK : suppression terminee.');
process.exit(0);
