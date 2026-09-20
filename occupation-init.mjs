// Construit la branche /occupation a partir des dispos et evenements deja en base.
// Ecrit uniquement sous /occupation. Relancable sans risque : il reconstruit tout.

const BASE = 'https://whenwemet-4dbb0-default-rtdb.europe-west1.firebasedatabase.app';

const r = await fetch(`${BASE}/groupes.json`);
if(!r.ok){ console.error('Lecture des groupes impossible :', r.status); process.exit(1); }
const groupes = await r.json() || {};

const occupation = {};
function poser(membre, date, slot, gid, valeur){
  const cle = `${date}_${slot}`;
  occupation[membre] ??= {};
  occupation[membre][cle] ??= {};
  occupation[membre][cle][gid] = valeur;
}

let nbDispo = 0, nbConfirme = 0;

for(const [gid, g] of Object.entries(groupes)){
  // 1. Les disponibilites declarees => statut "propose"
  for(const [date, jour] of Object.entries(g.availability || {})){
    for(const slot of ['midi','soir']){
      for(const membre of (jour?.[slot] || [])){
        poser(membre, date, slot, gid, { statut:'propose' });
        nbDispo++;
      }
    }
  }
  // 2. L'evenement valide => statut "confirme" (ecrase le "propose")
  const ev = g.validatedEvent;
  if(ev && ev.date){
    const creneaux = ev.slot === 'les-deux' ? ['midi','soir'] : [ev.slot];
    for(const membre of (ev.participants || [])){
      for(const cr of creneaux){
        poser(membre, ev.date, cr, gid, { statut:'confirme', titre: ev.title || '' });
        nbConfirme++;
      }
    }
  }
}

const w = await fetch(`${BASE}/occupation.json`, {
  method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(occupation),
});
if(!w.ok){ console.error('Ecriture refusee :', w.status, await w.text()); process.exit(1); }

console.log(`${Object.keys(occupation).length} membre(s) indexe(s)`);
console.log(`${nbDispo} disponibilite(s), ${nbConfirme} engagement(s) confirme(s)`);
