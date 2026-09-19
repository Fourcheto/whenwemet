import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, set, update, push, remove } from "firebase/database";

// ─── Thèmes ───────────────────────────────────────────────────────────────────
const THEMES = {
  cosmos:   { name:"🌌 Cosmos",   bg:"#0F1117", card:"#1C1E2A", border:"#2A2D3E", accent:"#6C63FF", accentLight:"#8B84FF", green:"#3DDC84", text:"#F0F0F5", muted:"#8888AA", danger:"#FF6B6B" },
  atlantis: { name:"🌊 Atlantis", bg:"#0A1628", card:"#142035", border:"#1C2E42", accent:"#C9A844", accentLight:"#D4B85A", green:"#00C9A7", text:"#F0F0F5", muted:"#7AA0C4", danger:"#FF6B6B" },
  ember:    { name:"🔥 Ember",    bg:"#1A0A0A", card:"#2A1010", border:"#3A1818", accent:"#FF6B2B", accentLight:"#FF8C5A", green:"#FFE66D", text:"#F0F0F5", muted:"#C47A7A", danger:"#FF4444" },
  nebula:   { name:"🪐 Nebula",   bg:"#130A1E", card:"#1E1030", border:"#2A1840", accent:"#E91E8C", accentLight:"#F472B6", green:"#00E5FF", text:"#F0F0F5", muted:"#C084FC", danger:"#FF6B6B" },
  obsidian: { name:"⚫ Obsidian", bg:"#080808", card:"#121212", border:"#1E1E1E", accent:"#CCCCCC", accentLight:"#E8E8E8", green:"#E8E8E8", text:"#F0F0F5", muted:"#888888", danger:"#FF6B6B" },
  sakura:   { name:"🌸 Sakura",   bg:"#1A1018", card:"#251520", border:"#332030", accent:"#EC4899", accentLight:"#F472B6", green:"#4ADE80", text:"#F0F0F5", muted:"#F9A8D4", danger:"#FF6B6B" },
  bamboo:   { name:"🌿 Bamboo",   bg:"#0A1A0F", card:"#102018", border:"#1A3020", accent:"#22C55E", accentLight:"#4ADE80", green:"#F59E0B", text:"#F0F0F5", muted:"#86EFAC", danger:"#FF6B6B" },
  arctic:   { name:"🏔 Arctic",   bg:"#0A0F1A", card:"#101828", border:"#1A2535", accent:"#38BDF8", accentLight:"#7DD3FC", green:"#E0F2FE", text:"#F0F0F5", muted:"#93C5FD", danger:"#FF6B6B" },
  autumn:   { name:"🍂 Autumn",   bg:"#1A0F08", card:"#2A1810", border:"#3A2015", accent:"#F97316", accentLight:"#FB923C", green:"#EAB308", text:"#F0F0F5", muted:"#FDBA74", danger:"#FF6B6B" },
};
const DEFAULT_THEME = THEMES.cosmos;
const C = () => window._theme || DEFAULT_THEME;
const fmtDate = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const getDays  = (y,m) => new Date(y,m+1,0).getDate();
const getFirst = (y,m) => new Date(y,m,1).getDay();
const MONTHS   = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR  = ["D","L","M","M","J","V","S"];
const AVATAR_COLORS = ["#6C63FF","#FF6B6B","#3DDC84","#FFD166","#00C9A7","#E91E8C","#3498DB","#F39C12","#9B59B6","#1ABC9C"];
const EMOJI_REACTIONS = ["👍","❤️","😂","😮","🎉","🙏"];

function heatColor(count,total,theme){
  if(!count)return"transparent";
  const r=count/total;
  if(r<=0.25)return theme.accent+"44";
  if(r<=0.5)return theme.accent+"88";
  if(r<=0.75)return theme.accent;
  return theme.green;
}
function getWeekNumber(date){
  const d=new Date(date);d.setHours(0,0,0,0);
  d.setDate(d.getDate()+4-(d.getDay()||7));
  const y=new Date(d.getFullYear(),0,1);
  return Math.ceil((((d-y)/86400000)+1)/7);
}
function formatFullDate(ts){
  return new Date(ts).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}

// ─── Firebase hook ────────────────────────────────────────────────────────────
async function hashPw(pw){
  const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function useFirebase(path,defaultVal){
  const[data,setData]=useState(defaultVal);
  useEffect(()=>{
    const r=ref(db,path);
    const unsub=onValue(r,snap=>{const val=snap.val();setData(val!==null&&val!==undefined?val:defaultVal);});
    return()=>unsub();
  },[path]);
  return data;
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GCSS=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
@keyframes blink-border{0%,100%{border-color:var(--accent,#6C63FF);box-shadow:0 0 12px var(--accent,#6C63FF)44}50%{border-color:transparent;box-shadow:none}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow-x:hidden}
button,input,textarea{font-family:inherit}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#2A2D3E;border-radius:2px}
.app-root{
  min-height:100vh;min-height:100dvh;width:100%;max-width:430px;margin:0 auto;
  display:flex;flex-direction:column;
  padding-top:env(safe-area-inset-top);
  padding-bottom:env(safe-area-inset-bottom);
  font-size:15px;
}
input,textarea,button{font-size:14px!important}
`;

// ─── PwInput ──────────────────────────────────────────────────────────────────
function PwInput({value,onChange,onEnter,placeholder="Mot de passe",error,t}){
  const[show,setShow]=useState(false);
  return(
    <div style={{position:"relative"}}>
      <input type={show?"text":"password"} value={value} onChange={onChange}
        onKeyDown={e=>e.key==="Enter"&&onEnter()} placeholder={placeholder}
        style={{width:"100%",padding:"13px 48px 13px 16px",borderRadius:14,fontSize:15,
          background:error?`${t.danger}11`:t.card,border:`1px solid ${error?t.danger:t.border}`,color:t.text,outline:"none"}}/>
      <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:t.muted,fontSize:16,padding:4}}>
        {show?"🙈":"👁"}
      </button>
    </div>
  );
}

// ─── Event Banner ─────────────────────────────────────────────────────────────
function EventBanner({t,currentUser,onNavigate}){
  const event=useFirebase("config/validatedEvent",null);
  const seenKey=currentUser?`seen_event_${currentUser}`:"";
  const[seen,setSeen]=useState(false);
  useEffect(()=>{if(seenKey&&event)setSeen(localStorage.getItem(seenKey)===(event.validatedAt?.toString()||""));},[event,seenKey]);
  if(!event||!event.date)return null;
  const eventDate=new Date(event.date+"T12:00:00");
  const now=new Date();
  const diff=Math.ceil((eventDate-now)/(1000*60*60*24));
  const past=diff<0;
  const isNew=currentUser&&!seen;
  function markSeen(){if(seenKey&&event){localStorage.setItem(seenKey,(event.validatedAt?.toString()||""));setSeen(true);}}
  return(
    <div onClick={()=>{markSeen();onNavigate&&onNavigate("events");}} style={{animation:"slideDown 0.4s ease",background:`linear-gradient(135deg,${t.accent},${t.green})`,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0,cursor:onNavigate?"pointer":"default"}}>
      <span style={{fontSize:20}}>{past?"✅":"🎉"}</span>
      <div style={{flex:1}}>
        <div style={{color:"#fff",fontWeight:700,fontSize:13}}>{event.title||"Événement confirmé !"}</div>
        <div style={{color:"#ffffff99",fontSize:11}}>
          {eventDate.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
          {!past&&` — dans ${diff} jour${diff>1?"s":""}`}
          {past&&" — événement passé"}
          {event.slot&&` · ${event.slot==="midi"?"🍽 Midi":event.slot==="soir"?"🌙 Soir":"🍽🌙 Les deux"}`}
        </div>
        {event.message&&<div style={{color:"#ffffffCC",fontSize:11,marginTop:2,fontStyle:"italic"}}>"{event.message}"</div>}
      </div>
      {isNew&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"pulse 1.5s infinite",flexShrink:0}}/>}
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({onEnter}){
  const[phase,setPhase]=useState("title");
  const[loginUser,setLoginUser]=useState(null);
  const[loginPw,setLoginPw]=useState("");
  const[loginErr,setLoginErr]=useState("");
  const[newName,setNewName]=useState("");
  const[newPw,setNewPw]=useState("");
  const[newPwC,setNewPwC]=useState("");
  const[newError,setNewError]=useState("");
  const[newColor,setNewColor]=useState(AVATAR_COLORS[0]);
  const[adminPw,setAdminPw]=useState("");
  const[adminErr,setAdminErr]=useState(false);
  const[fadeIn,setFadeIn]=useState(false);
  const appName=useFirebase("config/appName","WhenWeMeet");
  const appSub=useFirebase("config/appSubtitle","Trouvez la date parfaite ensemble");
  const adminPass=useFirebase("config/adminPassword","admin123");
  const usersObj=useFirebase("users",{});
  const passwords=useFirebase("passwords",{});
  const themeData=useFirebase("config/theme",DEFAULT_THEME);
  const profiles=useFirebase("profiles",{});
  useEffect(()=>{window._theme=themeData;},[themeData]);
  useEffect(()=>{setTimeout(()=>setFadeIn(true),80);},[]);
  const t=themeData||DEFAULT_THEME;
  const userList=Object.keys(usersObj||{});
  function openLogin(u){setLoginUser(u);setLoginPw("");setLoginErr("");setPhase("login");}
  async function tryLogin(){
    const stored=(passwords||{})[loginUser];
    if(!stored||stored===await hashPw(loginPw))onEnter("user",loginUser);
    else{setLoginErr("Mot de passe incorrect.");setLoginPw("");}
  }
  function tryAdmin(){
    if(adminPw===adminPass)onEnter("admin",null);
    else{setAdminErr(true);setAdminPw("");setTimeout(()=>setAdminErr(false),1200);}
  }
  async function createProfile(){
    const name=newName.trim();
    if(!name||name.length<2){setNewError("Saisis au moins 2 caractères.");return;}
    if(userList.includes(name)){setNewError("Ce nom existe déjà — connecte-toi !");return;}
    if(!newPw){setNewError("Choisis un mot de passe.");return;}
    if(newPw!==newPwC){setNewError("Les mots de passe ne correspondent pas.");return;}
    await set(ref(db,`users/${name}`),{name,createdAt:Date.now()});
    await set(ref(db,`passwords/${name}`),await hashPw(newPw));
    await set(ref(db,`profiles/${name}`),{color:newColor,theme:"cosmos"});
    onEnter("user",name);
  }
  const stars=Array.from({length:28},(_,i)=>({x:(i*37+11)%100,y:(i*53+7)%100,r:0.8+(i%3)*0.6,o:0.2+(i%4)*0.15}));
  const bigBtn={padding:"14px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${t.accent},${t.accentLight})`,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%"};
  const backBtn={background:"none",border:"none",color:t.muted,fontSize:13,cursor:"pointer",padding:"4px"};
  return(
    <div style={{minHeight:"100vh",minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 30%,#1a1640 0%,${t.bg} 70%)`,position:"relative",overflow:"hidden",opacity:fadeIn?1:0,transition:"opacity 0.6s ease",paddingTop:"env(safe-area-inset-top)"}}>
      <style>{GCSS}</style>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        {stars.map((s,i)=><circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o}/>)}
      </svg>
      <div style={{position:"absolute",top:"15%",left:"50%",transform:"translateX(-50%)",width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,${t.accent}22 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{textAlign:"center",zIndex:1,padding:"0 28px",maxWidth:400,width:"100%"}}>
        <div style={{animation:"float 4s ease-in-out infinite",marginBottom:8}}>
          <div style={{width:80,height:80,borderRadius:24,margin:"0 auto",background:`linear-gradient(135deg,${t.accent},${t.accentLight})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:`0 0 40px ${t.accent}55`}}>📅</div>
        </div>
        <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:32,letterSpacing:-1,marginBottom:4}}>
          {appName.split("").map((ch,i)=><span key={i} style={{color:i<Math.floor(appName.length/2)?t.text:t.accent}}>{ch}</span>)}
        </div>
        <div style={{color:t.muted,fontSize:14,marginBottom:28}}>{appSub}</div>

        {phase==="title"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{color:t.muted,fontSize:12,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Choisissez votre accès</div>
            <div style={{background:`${t.card}CC`,border:`1px solid ${t.border}`,borderRadius:18,padding:"4px",maxHeight:240,overflowY:"auto"}}>
              {userList.length===0&&<div style={{color:t.muted,fontSize:13,padding:"16px"}}>Aucun membre — crée ton profil !</div>}
              {userList.map((u,i)=>{
                const col=(profiles||{})[u]?.color||AVATAR_COLORS[0];
                return(
                  <button key={u} onClick={()=>openLogin(u)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"11px 14px",background:"none",border:"none",borderRadius:14,cursor:"pointer",borderBottom:i<userList.length-1?`1px solid ${t.border}44`:"none"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15}}>{u[0].toUpperCase()}</div>
                    <span style={{color:t.text,fontWeight:600,fontSize:15}}>{u}</span>
                    <span style={{marginLeft:"auto",color:t.muted,fontSize:18}}>›</span>
                  </button>
                );
              })}
            </div>
            <button onClick={()=>{setPhase("new-user");setNewName("");setNewPw("");setNewPwC("");setNewError("");setNewColor(AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)]);}} style={{padding:"13px 16px",borderRadius:14,background:`linear-gradient(135deg,${t.accent}18,${t.accent}08)`,border:`1px solid ${t.accent}55`,color:t.accent,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{fontSize:18}}>✨</span> Créer mon profil
            </button>
            <button onClick={()=>{setPhase("admin-pin");setAdminPw("");}} style={{padding:"11px",borderRadius:14,background:"none",border:`1px solid ${t.border}`,color:t.muted,fontSize:13,cursor:"pointer"}}>
              ⚙️  Accès administrateur
            </button>
          </div>
        )}

        {phase==="login"&&loginUser&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:(profiles||{})[loginUser]?.color||t.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:"#fff"}}>{loginUser[0].toUpperCase()}</div>
            </div>
            <div style={{color:t.text,fontWeight:700,fontSize:18,fontFamily:"Syne,sans-serif"}}>Bonjour, {loginUser} !</div>
            <PwInput value={loginPw} onChange={e=>{setLoginPw(e.target.value);setLoginErr("");}} onEnter={tryLogin} error={!!loginErr} t={t}/>
            {loginErr&&<div style={{color:t.danger,fontSize:13,animation:"shake 0.4s ease"}}>{loginErr}</div>}
            <button onClick={tryLogin} style={bigBtn}>Se connecter 🔓</button>
            <button onClick={()=>setPhase("title")} style={backBtn}>← Retour</button>
          </div>
        )}

        {phase==="new-user"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:newColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:"#fff",transition:"all 0.3s"}}>{newName.trim()?newName.trim()[0].toUpperCase():"?"}</div>
            </div>
            <div style={{color:t.text,fontWeight:700,fontSize:18,fontFamily:"Syne,sans-serif"}}>Créer mon profil</div>
            <input autoFocus value={newName} onChange={e=>{setNewName(e.target.value);setNewError("");}} placeholder="Ton prénom ou pseudo…" maxLength={20} style={{width:"100%",padding:"13px 16px",borderRadius:14,fontSize:15,background:t.card,border:`1px solid ${t.border}`,color:t.text,outline:"none"}}/>
            <div style={{color:t.muted,fontSize:12}}>Couleur de ton avatar</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
              {AVATAR_COLORS.map(col=><button key={col} onClick={()=>setNewColor(col)} style={{width:32,height:32,borderRadius:"50%",background:col,border:newColor===col?"3px solid #fff":"3px solid transparent",cursor:"pointer",transition:"transform 0.15s",transform:newColor===col?"scale(1.2)":"scale(1)"}}/>)}
            </div>
            <PwInput value={newPw} onChange={e=>{setNewPw(e.target.value);setNewError("");}} onEnter={createProfile} placeholder="Choisis un mot de passe" error={!!newError&&!!newName.trim()} t={t}/>
            <PwInput value={newPwC} onChange={e=>{setNewPwC(e.target.value);setNewError("");}} onEnter={createProfile} placeholder="Répète le mot de passe" error={!!newError&&newPw!==newPwC} t={t}/>
            {newError&&<div style={{color:t.danger,fontSize:13,animation:"shake 0.4s ease"}}>{newError}</div>}
            <button onClick={createProfile} style={{...bigBtn,opacity:newName.trim().length>=2&&newPw?1:0.5}}>Rejoindre le groupe 🎉</button>
            <button onClick={()=>setPhase("title")} style={backBtn}>← Retour</button>
          </div>
        )}

        {phase==="admin-pin"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{color:t.text,fontWeight:700,fontSize:17,fontFamily:"Syne,sans-serif"}}>Zone administrateur</div>
            <PwInput value={adminPw} onChange={e=>setAdminPw(e.target.value)} onEnter={tryAdmin} placeholder="Mot de passe admin" error={adminErr} t={t}/>
            {adminErr&&<div style={{color:t.danger,fontSize:13,animation:"shake 0.4s ease"}}>Mot de passe incorrect</div>}
            <button onClick={tryAdmin} style={bigBtn}>Entrer</button>
            <button onClick={()=>setPhase("title")} style={backBtn}>← Retour</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab({currentUser}){
  const now=new Date();
  const todayStr=fmtDate(now.getFullYear(),now.getMonth(),now.getDate());
  const[year,setYear]=useState(now.getFullYear());
  const[month,setMonth]=useState(now.getMonth());
  const[selected,setSel]=useState(null);
  const t=C();
  const usersObj=useFirebase("users",{});
  const avail=useFirebase("availability",{});
  const event=useFirebase("config/validatedEvent",null);
  const users=Object.keys(usersObj||{});
  const days=getDays(year,month);
  const first=getFirst(year,month);
  const maxYear=now.getMonth()>=9?now.getFullYear()+1:now.getFullYear();
  const maxMonth=(now.getMonth()+3)%12;
  function isAfterMax(y,m){return y>maxYear||(y===maxYear&&m>maxMonth);}
  function isBeforeNow(y,m){return y<now.getFullYear()||(y===now.getFullYear()&&m<now.getMonth());}
  function nextM(){const nm=(month+1)%12,ny=month===11?year+1:year;if(!isAfterMax(ny,nm)){setMonth(nm);if(month===11)setYear(y=>y+1);setSel(null);}}
  function prevM(){if(!isBeforeNow(year,month)){if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1);setSel(null);}}
  function isPast(d){return fmtDate(year,month,d)<todayStr;}
  function getSlots(ds){const a=(avail||{})[ds]||{};return{midi:Array.isArray(a.midi)?a.midi:[],soir:Array.isArray(a.soir)?a.soir:[]};}
  function countTotal(ds){const{midi,soir}=getSlots(ds);return new Set([...midi,...soir]).size;}
  async function toggleSlot(ds,slot){
    const{midi,soir}=getSlots(ds);
    const arr=slot==="midi"?midi:soir;
    const idx=arr.indexOf(currentUser);
    const updated=idx===-1?[...arr,currentUser]:arr.filter(x=>x!==currentUser);
    await set(ref(db,`availability/${ds}/${slot}`),updated);
  }
  let bestDate=null,bestCount=0;
  for(let d=1;d<=days;d++){const ds=fmtDate(year,month,d);if(ds<todayStr)continue;const c=countTotal(ds);if(c>bestCount){bestCount=c;bestDate=ds;}}
  const selSlots=selected?getSlots(selected):{midi:[],soir:[]};
  const isMidi=selSlots.midi.includes(currentUser);
  const isSoir=selSlots.soir.includes(currentUser);
  const perfectDates=[];
  for(let d=1;d<=days;d++){const ds=fmtDate(year,month,d);if(ds<todayStr)continue;const{midi,soir}=getSlots(ds);if(midi.length===users.length||soir.length===users.length)perfectDates.push(ds);}
  return(
    <div style={{padding:"0 0 16px",overflowX:"hidden"}}>
      {perfectDates.length>0&&(
        <div style={{margin:"10px 12px",padding:"12px 14px",background:`${t.green}15`,border:`1px solid ${t.green}55`,borderRadius:14,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>🎉</span>
          <div>
            <div style={{color:t.green,fontWeight:700,fontSize:13}}>Date parfaite trouvée !</div>
            <div style={{color:t.text,fontSize:12}}>Tout le monde est dispo le {new Date(perfectDates[0]+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</div>
          </div>
        </div>
      )}
      {bestDate&&bestCount>1&&!perfectDates.includes(bestDate)&&(
        <div style={{margin:"10px 12px",padding:"12px 14px",background:`${t.green}11`,border:`1px solid ${t.green}44`,borderRadius:14,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🏆</span>
          <div>
            <div style={{color:t.green,fontWeight:700,fontSize:12}}>Meilleure date ce mois</div>
            <div style={{color:t.text,fontSize:14,fontWeight:600}}>{new Date(bestDate+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
            <div style={{color:t.muted,fontSize:11}}>{bestCount} personne{bestCount>1?"s":""} disponible{bestCount>1?"s":""}</div>
          </div>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px 4px"}}>
        <button onClick={prevM} disabled={isBeforeNow(year,month)} style={{background:"none",border:"none",cursor:"pointer",color:isBeforeNow(year,month)?t.border:t.muted,fontSize:24,padding:"4px 10px"}}>‹</button>
        <span style={{color:t.text,fontWeight:700,fontSize:16,fontFamily:"Syne,sans-serif"}}>{MONTHS[month]} {year}</span>
        <button onClick={nextM} disabled={isAfterMax(month===11?year+1:year,(month+1)%12)} style={{background:"none",border:"none",cursor:"pointer",color:isAfterMax(month===11?year+1:year,(month+1)%12)?t.border:t.muted,fontSize:24,padding:"4px 10px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"6px 10px 2px",gap:2}}>
        {DAYS_FR.map((d,i)=><div key={i} style={{textAlign:"center",color:t.muted,fontSize:11,fontWeight:600}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 10px",gap:3}}>
        {Array(first).fill(null).map((_,i)=><div key={"e"+i}/>)}
        {Array.from({length:days},(_,i)=>i+1).map(d=>{
          const ds=fmtDate(year,month,d);
          const past=isPast(d);
          const{midi,soir}=getSlots(ds);
          const count=new Set([...midi,...soir]).size;
          const isMe=midi.includes(currentUser)||soir.includes(currentUser);
          const isSel=selected===ds;
          const isToday=ds===todayStr;
          const isPerfect=perfectDates.includes(ds);
          const isEvent=event&&event.date===ds;
          return(
            <button key={d} onClick={()=>{if(past)return;setSel(isSel?null:ds);}}
              style={{aspectRatio:"1",borderRadius:10,
                border:isPerfect?`2px solid ${t.green}`:isEvent?`2px solid ${t.accent}`:isSel?`2px solid ${t.accent}`:isToday?`2px solid ${t.accent}44`:"2px solid transparent",
                background:past?t.bg+"44":isPerfect?t.green+"33":heatColor(count,Math.max(users.length,1),t),
                cursor:past?"not-allowed":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                position:"relative",opacity:past?0.3:1,transition:"all 0.15s"}}>
              <span style={{color:past?t.muted:count>0?t.text:t.muted,fontSize:12,fontWeight:isToday?800:500}}>{d}</span>
              {count>0&&!past&&<span style={{fontSize:8,color:isPerfect?t.green:t.accentLight,fontWeight:700}}>{count}/{users.length}</span>}
              {isMe&&!past&&<span style={{position:"absolute",top:2,right:2,width:5,height:5,borderRadius:"50%",background:t.green}}/>}
              {midi.length>0&&soir.length>0&&!past&&<span style={{fontSize:7,position:"absolute",bottom:1}}>🌓</span>}
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",gap:8,padding:"10px 12px 4px",flexWrap:"wrap"}}>
        {[{c:t.accent+"44",l:"Peu"},{c:t.accent+"88",l:"Quelques"},{c:t.accent,l:"Beaucoup"},{c:t.green,l:"Tous !"}].map(({c,l})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:3,background:c}}/><span style={{color:t.muted,fontSize:10}}>{l}</span></div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:t.green}}/><span style={{color:t.muted,fontSize:10}}>Vous</span></div>
      </div>
      {selected&&!isPast(parseInt(selected.split("-")[2]))&&(
        <div style={{margin:"10px 12px 0",padding:"14px",background:t.card,borderRadius:14,border:`1px solid ${t.border}`}}>
          <div style={{color:t.text,fontWeight:700,marginBottom:12,fontSize:14}}>{new Date(selected+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <button onClick={()=>toggleSlot(selected,"midi")} style={{flex:1,padding:"10px",borderRadius:12,background:isMidi?`${t.accent}33`:t.bg,border:`2px solid ${isMidi?t.accent:t.border}`,color:isMidi?t.accent:t.muted,fontSize:13,fontWeight:700,cursor:"pointer"}}>🍽 Midi {isMidi&&"✓"}</button>
            <button onClick={()=>toggleSlot(selected,"soir")} style={{flex:1,padding:"10px",borderRadius:12,background:isSoir?`${t.green}22`:t.bg,border:`2px solid ${isSoir?t.green:t.border}`,color:isSoir?t.green:t.muted,fontSize:13,fontWeight:700,cursor:"pointer"}}>🌙 Soir {isSoir&&"✓"}</button>
          </div>
          {["midi","soir"].map(slot=>{
            const people=selSlots[slot];
            if(!people.length)return null;
            return(
              <div key={slot} style={{marginBottom:8}}>
                <div style={{color:t.muted,fontSize:11,fontWeight:600,marginBottom:4}}>{slot==="midi"?"🍽 Midi":"🌙 Soir"}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {people.map(p=><span key={p} style={{padding:"3px 9px",borderRadius:20,background:p===currentUser?`${t.green}22`:`${t.accent}22`,color:p===currentUser?t.green:t.accentLight,fontSize:11,fontWeight:600}}>{p}</span>)}
                </div>
              </div>
            );
          })}
          <div style={{color:t.muted,fontSize:11,marginTop:6}}>Appuie sur Midi ou Soir pour basculer ta dispo</div>
        </div>
      )}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab({currentUser}){
  const[input,setInput]=useState("");
  const bottomRef=useRef(null);
  const t=C();
  const msgsObj=useFirebase("messages",{});
  const profiles=useFirebase("profiles",{});
  const msgs=Object.entries(msgsObj||{}).map(([id,m])=>({id,...m})).sort((a,b)=>a.ts-b.ts);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs.length]);
  async function send(){
    const text=input.trim();if(!text)return;
    const now=new Date();
    const time=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    await push(ref(db,"messages"),{user:currentUser,text,time,ts:Date.now()});
    setInput("");
  }
  async function addReaction(msgId,emoji){
    const msg=msgsObj[msgId];
    const reactions=msg.reactions||{};
    const users=reactions[emoji]||[];
    const idx=users.indexOf(currentUser);
    const updated=idx===-1?[...users,currentUser]:users.filter(x=>x!==currentUser);
    if(!updated.length){const newR={...reactions};delete newR[emoji];await update(ref(db,`messages/${msgId}`),{reactions:newR});}
    else await update(ref(db,`messages/${msgId}`),{reactions:{...reactions,[emoji]:updated}});
  }
  function needsSep(idx){
    if(idx===0)return true;
    const prev=msgs[idx-1],curr=msgs[idx];
    return getWeekNumber(new Date(prev.ts))!==getWeekNumber(new Date(curr.ts))||new Date(prev.ts).getFullYear()!==new Date(curr.ts).getFullYear();
  }
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
        {msgs.map((m,idx)=>{
          const isMe=m.user===currentUser;
          const col=(profiles||{})[m.user]?.color||t.accent;
          const reactions=m.reactions||{};
          return(
            <div key={m.id}>
              {needsSep(idx)&&(
                <div style={{textAlign:"center",margin:"12px 0 8px"}}>
                  <span style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:20,padding:"4px 14px",color:t.muted,fontSize:11,fontWeight:600}}>{formatFullDate(m.ts)}</span>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
                {!isMe&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,marginLeft:4}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{m.user[0]}</div>
                  <span style={{color:t.muted,fontSize:11}}>{m.user}</span>
                </div>}
                <div style={{maxWidth:"80%",padding:"9px 13px",borderRadius:isMe?"16px 16px 4px 16px":"16px 16px 16px 4px",background:isMe?col:t.card,color:"#fff",fontSize:14,lineHeight:1.4,border:isMe?"none":`1px solid ${t.border}`}}>{m.text}</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3,justifyContent:isMe?"flex-end":"flex-start"}}>
                  {Object.entries(reactions).filter(([,u])=>u.length>0).map(([emoji,users])=>(
                    <button key={emoji} onClick={()=>addReaction(m.id,emoji)} style={{padding:"2px 7px",borderRadius:12,background:users.includes(currentUser)?`${t.accent}33`:t.card,border:`1px solid ${users.includes(currentUser)?t.accent:t.border}`,cursor:"pointer",fontSize:12,color:t.text}}>{emoji} {users.length}</button>
                  ))}
                  <button onClick={()=>{const el=document.getElementById(`r-${m.id}`);el.style.display=el.style.display==="none"?"flex":"none";}} style={{padding:"2px 6px",borderRadius:12,background:"none",border:`1px solid ${t.border}33`,cursor:"pointer",fontSize:11,color:t.muted}}>＋</button>
                </div>
                <div id={`r-${m.id}`} style={{display:"none",gap:4,marginTop:3,flexWrap:"wrap",justifyContent:isMe?"flex-end":"flex-start"}}>
                  {EMOJI_REACTIONS.map(e=><button key={e} onClick={()=>{addReaction(m.id,e);document.getElementById(`r-${m.id}`).style.display="none";}} style={{fontSize:16,padding:"2px 4px",background:"none",border:"none",cursor:"pointer"}}>{e}</button>)}
                </div>
                <span style={{color:t.muted,fontSize:10,marginTop:2,marginLeft:4,marginRight:4}}>{m.time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"8px 12px 12px",borderTop:`1px solid ${t.border}`,display:"flex",gap:8,background:t.bg,flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Message…" style={{flex:1,padding:"11px 14px",borderRadius:24,border:`1px solid ${t.border}`,background:t.card,color:t.text,fontSize:14,outline:"none",minWidth:0}}/>
        <button onClick={send} style={{width:44,height:44,borderRadius:"50%",background:t.accent,border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff"}}>↑</button>
      </div>
    </div>
  );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────
function FriendsTab({currentUser}){
  const t=C();
  const usersObj=useFirebase("users",{});
  const avail=useFirebase("availability",{});
  const profiles=useFirebase("profiles",{});
  const presence=useFirebase("presence",{});
  const sorties=useFirebase("sorties",{});
  const users=Object.keys(usersObj||{});
  const counts={};
  users.forEach(u=>{counts[u]={midi:0,soir:0};});
  Object.values(avail||{}).forEach(day=>{if(!day)return;(day.midi||[]).forEach(u=>{if(counts[u])counts[u].midi++;});(day.soir||[]).forEach(u=>{if(counts[u])counts[u].soir++;});});
  const todayForFriends=fmtDate(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());
  const shared=Object.entries(avail||{}).map(([date,day])=>{
    const midi=Array.isArray(day?.midi)?day.midi:[];
    const soir=Array.isArray(day?.soir)?day.soir:[];
    return{date,midi,soir,total:new Set([...midi,...soir]).size};
  }).filter(x=>x.total>1&&x.date>=todayForFriends).sort((a,b)=>b.total-a.total).slice(0,6);
  const sortieList=Object.entries(sorties||{}).map(([id,s])=>({id,...s})).sort((a,b)=>b.archivedAt-a.archivedAt);
  return(
    <div style={{padding:"10px 12px",overflowX:"hidden"}}>
      <div style={{color:t.text,fontWeight:700,fontSize:16,marginBottom:10,fontFamily:"Syne,sans-serif"}}>🔥 Top dates communes</div>
      {shared.length===0?<div style={{color:t.muted,fontSize:13,marginBottom:16}}>Pas encore de dates communes !</div>
        :shared.map(({date,midi,soir,total})=>(
          <div key={date} style={{padding:"11px 12px",marginBottom:7,background:t.card,borderRadius:14,border:`1px solid ${total===users.length?t.green+"66":t.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{color:t.text,fontWeight:600,fontSize:14}}>{new Date(date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}</span>
              <span style={{padding:"2px 9px",borderRadius:20,background:total===users.length?`${t.green}22`:`${t.accent}22`,color:total===users.length?t.green:t.accentLight,fontSize:11,fontWeight:700}}>{total}/{users.length}</span>
            </div>
            {midi.length>0&&<div style={{marginBottom:5}}><span style={{color:t.muted,fontSize:11,fontWeight:600}}>🍽 Midi : </span>{midi.map(p=><span key={p} style={{padding:"2px 7px",borderRadius:10,background:`${t.accent}15`,color:t.muted,fontSize:11,marginRight:3}}>{p}</span>)}</div>}
            {soir.length>0&&<div><span style={{color:t.muted,fontSize:11,fontWeight:600}}>🌙 Soir : </span>{soir.map(p=><span key={p} style={{padding:"2px 7px",borderRadius:10,background:`${t.green}15`,color:t.muted,fontSize:11,marginRight:3}}>{p}</span>)}</div>}
          </div>
        ))
      }
      <div style={{color:t.text,fontWeight:700,fontSize:16,margin:"18px 0 10px",fontFamily:"Syne,sans-serif"}}>👥 Membres du groupe</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
      {users.map(u=>{
        const col=(profiles||{})[u]?.color||t.accent;
        const online=(presence||{})[u]?.online||false;
        const total=(counts[u]?.midi||0)+(counts[u]?.soir||0);
        return(
          <div key={u} style={{padding:"10px",background:t.card,borderRadius:14,border:`1px solid ${u===currentUser?t.accent+"66":t.border}`,display:"flex",flexDirection:"column",alignItems:"center",gap:6,position:"relative"}}>
            <div style={{position:"relative"}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15}}>{u[0].toUpperCase()}</div>
              {online&&<div style={{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:t.green,border:`2px solid ${t.card}`}}/>}
            </div>
            <div style={{color:t.text,fontWeight:600,fontSize:13,textAlign:"center"}}>{u}{u===currentUser&&<span style={{color:t.accent,fontSize:10,display:"block"}}>(vous)</span>}</div>
            <div style={{display:"flex",gap:4}}>
              <span style={{padding:"2px 6px",borderRadius:8,background:`${t.accent}22`,color:t.accentLight,fontSize:10,fontWeight:600}}>🍽 {counts[u]?.midi||0}</span>
              <span style={{padding:"2px 6px",borderRadius:8,background:`${t.green}22`,color:t.green,fontSize:10,fontWeight:600}}>🌙 {counts[u]?.soir||0}</span>
            </div>
            <div style={{width:24,height:24,borderRadius:"50%",background:`${t.green}22`,display:"flex",alignItems:"center",justifyContent:"center",color:t.green,fontWeight:700,fontSize:11}}>{total}</div>
          </div>
        );
      })}
      </div>
      {sortieList.length>0&&<>
        <div style={{color:t.text,fontWeight:700,fontSize:16,margin:"18px 0 10px",fontFamily:"Syne,sans-serif"}}>📖 Nos sorties</div>
        {sortieList.map(s=>(
          <div key={s.id} style={{padding:"11px 12px",marginBottom:7,background:t.card,borderRadius:14,border:`1px solid ${t.border}`}}>
            <div style={{color:t.text,fontWeight:600,fontSize:14}}>{s.title}</div>
            <div style={{color:t.muted,fontSize:12,marginTop:3}}>{new Date(s.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}{s.slot&&` · ${s.slot==="midi"?"🍽 Midi":s.slot==="soir"?"🌙 Soir":"🍽🌙 Midi & Soir"}`}</div>
            {s.participants&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6}}>{s.participants.map(p=><span key={p} style={{padding:"2px 7px",borderRadius:10,background:`${t.accent}15`,color:t.muted,fontSize:11}}>{p}</span>)}</div>}
          </div>
        ))}
      </>}
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab({currentUser}){
  const t=C();
  const[subTab,setSubTab]=useState("prochain");
  const event=useFirebase("config/validatedEvent",null);
  const sorties=useFirebase("sorties",{});
  const sortieList=Object.entries(sorties||{}).map(([id,s])=>({id,...s})).sort((a,b)=>b.archivedAt-a.archivedAt);
  useEffect(()=>{
    if(currentUser&&event)localStorage.setItem(`seen_event_${currentUser}`,(event.validatedAt?.toString()||""));
  },[event,currentUser]);
  const hasEvent=event&&event.date;
  const eventDate=hasEvent?new Date(event.date+"T12:00:00"):null;
  const diff=(()=>{
    if(!eventDate)return null;
    const today=new Date();today.setHours(0,0,0,0);
    const ev=new Date(eventDate);ev.setHours(0,0,0,0);
    return Math.round((ev-today)/(1000*60*60*24));
  })();
  const past=diff!==null&&diff<0;
  return(
    <div style={{padding:"10px 12px",overflowX:"hidden"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"prochain",label:"⭐ Prochain"},{id:"historique",label:"📖 Historique"}].map(s=>(
          <button key={s.id} onClick={()=>setSubTab(s.id)} style={{flex:1,padding:"9px",borderRadius:12,background:subTab===s.id?t.accent:t.card,border:`1px solid ${subTab===s.id?t.accent:t.border}`,color:subTab===s.id?"#fff":t.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{s.label}</button>
        ))}
      </div>
      {subTab==="prochain"&&(
        !hasEvent?(
          <div style={{textAlign:"center",padding:"40px 20px",color:t.muted}}>
            <div style={{fontSize:48,marginBottom:12}}>📅</div>
            <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:6}}>Aucun événement prévu</div>
            <div style={{fontSize:13}}>L'administrateur n'a pas encore validé de date.</div>
          </div>
        ):(
          <div>
            <div style={{background:`linear-gradient(135deg,${t.accent}22,${t.green}11)`,border:`1px solid ${t.accent}44`,borderRadius:16,padding:"20px",marginBottom:14,textAlign:"center"}}>
              {!past?(
                <>
                  <div style={{color:t.muted,fontSize:12,marginBottom:4}}>Dans</div>
                  <div style={{color:t.accent,fontWeight:800,fontSize:48,fontFamily:"Syne,sans-serif",lineHeight:1}}>{diff}</div>
                  <div style={{color:t.muted,fontSize:14}}>jour{diff>1?"s":""}</div>
                </>
              ):<div style={{color:t.green,fontWeight:700,fontSize:18}}>✅ Événement passé</div>}
            </div>
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"16px"}}>
              <div style={{color:t.text,fontWeight:800,fontSize:18,fontFamily:"Syne,sans-serif",marginBottom:12}}>{event.title}</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>📅</span><span style={{color:t.text,fontSize:14}}>{eventDate.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span></div>
                {event.slot&&<div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>{event.slot==="midi"?"🍽":event.slot==="soir"?"🌙":"🍽🌙"}</span><span style={{color:t.text,fontSize:14}}>{event.slot==="midi"?"Repas du midi":event.slot==="soir"?"Repas du soir":"Midi et soir"}</span></div>}
                {event.address&&<div style={{display:"flex",alignItems:"flex-start",gap:10}}><span style={{fontSize:18,flexShrink:0}}>📍</span><span style={{color:t.text,fontSize:14,lineHeight:1.4}}>{event.address}</span></div>}
                {event.mapsUrl&&(
                  <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:`${t.accent}22`,border:`1px solid ${t.accent}44`,borderRadius:12,textDecoration:"none"}}>
                    <span style={{fontSize:18}}>🗺️</span>
                    <span style={{color:t.accent,fontSize:14,fontWeight:600}}>Voir l'itinéraire (Maps)</span>
                  </a>
                )}
                {event.message&&(
                  <div style={{background:`${t.green}11`,border:`1px solid ${t.green}33`,borderRadius:12,padding:"12px 14px"}}>
                    <div style={{color:t.muted,fontSize:11,fontWeight:600,marginBottom:4}}>💬 Message de l'organisateur</div>
                    <div style={{color:t.text,fontSize:14,lineHeight:1.5,fontStyle:"italic"}}>"{event.message}"</div>
                  </div>
                )}
                {event.participants&&event.participants.length>0&&(
                  <div>
                    <div style={{color:t.muted,fontSize:11,fontWeight:600,marginBottom:6}}>👥 Participants</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{event.participants.map(p=><span key={p} style={{padding:"3px 9px",borderRadius:20,background:`${t.accent}22`,color:t.accentLight,fontSize:12,fontWeight:600}}>{p}</span>)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
      {subTab==="historique"&&(
        sortieList.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px",color:t.muted}}>
            <div style={{fontSize:48,marginBottom:12}}>📖</div>
            <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:6}}>Aucune sortie archivée</div>
            <div style={{fontSize:13}}>L'historique apparaîtra ici.</div>
          </div>
        ):(
          sortieList.map(s=>(
            <div key={s.id} style={{padding:"14px",marginBottom:10,background:t.card,borderRadius:14,border:`1px solid ${t.border}`}}>
              <div style={{color:t.text,fontWeight:700,fontSize:15,marginBottom:5}}>{s.title}</div>
              <div style={{color:t.muted,fontSize:12,marginBottom:6}}>{new Date(s.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}{s.slot&&` · ${s.slot==="midi"?"🍽 Midi":s.slot==="soir"?"🌙 Soir":"🍽🌙 Midi & Soir"}`}</div>
              {s.participants&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{s.participants.map(p=><span key={p} style={{padding:"2px 7px",borderRadius:10,background:`${t.accent}15`,color:t.muted,fontSize:11}}>{p}</span>)}</div>}
            </div>
          ))
        )
      )}
    </div>
  );
}

// ─── Themes Tab ───────────────────────────────────────────────────────────────
function ThemesTab({currentUser}){
  const t=C();
  const profiles=useFirebase("profiles",{});
  const currentThemeKey=(profiles||{})[currentUser]?.theme||"cosmos";
  const[,rerender]=useState(0);
  async function selectTheme(key){
    const prof=(profiles||{})[currentUser]||{};
    await update(ref(db,`profiles/${currentUser}`),{...prof,theme:key});
    window._theme={...THEMES[key]};
    window.dispatchEvent(new Event("themechange"));
    rerender(n=>n+1);
  }
  return(
    <div style={{padding:"10px 12px"}}>
      <div style={{color:t.text,fontWeight:700,fontSize:16,marginBottom:4,fontFamily:"Syne,sans-serif"}}>Choisis ton thème</div>
      <div style={{color:t.muted,fontSize:12,marginBottom:14}}>Ton choix est personnel — il ne change pas l'affichage des autres membres.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {Object.entries(THEMES).map(([key,theme])=>{
          const isActive=currentThemeKey===key;
          return(
            <button key={key} onClick={()=>selectTheme(key)} style={{padding:"14px",borderRadius:16,background:theme.card,border:`2px solid ${isActive?theme.accent:theme.border}`,cursor:"pointer",textAlign:"left",position:"relative",transition:"all 0.2s"}}>
              {isActive&&<div style={{position:"absolute",top:8,right:8,width:20,height:20,borderRadius:"50%",background:theme.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>✓</div>}
              <div style={{fontWeight:700,fontSize:13,color:theme.text,marginBottom:8}}>{theme.name}</div>
              <div style={{display:"flex",gap:4,marginBottom:6}}>
                {[theme.border,theme.accent+"44",theme.accent+"88",theme.accent,theme.accent,theme.green].map((c,i)=>(
                  <div key={i} style={{width:14,height:14,borderRadius:4,background:c,flexShrink:0}}/>
                ))}
              </div>
              <div style={{display:"flex",gap:5}}>
                <div style={{padding:"2px 7px",borderRadius:10,background:`${theme.accent}33`,color:theme.accentLight,fontSize:10,fontWeight:600}}>🍽</div>
                <div style={{padding:"2px 7px",borderRadius:10,background:`${theme.green}33`,color:theme.green,fontSize:10,fontWeight:600}}>🌙</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ─── Vote Tab ─────────────────────────────────────────────────────────────────
function VoteTab({currentUser,isAdmin=false}){
  const t=C();
  const[showForm,setShowForm]=useState(false);
  const[category,setCategory]=useState("");
  const[description,setDescription]=useState("");
  const[saving,setSaving]=useState(false);
  const proposals=useFirebase("proposals",{});
  const usersObj=useFirebase("users",{});
  const profiles=useFirebase("profiles",{});
  const adminPass=useFirebase("config/adminPassword","admin123");


  const CATEGORIES=["🍽 Restaurant","🍺 Bar","🌳 Pique-nique","🎭 Autre"];
  const propList=Object.entries(proposals||{}).map(([id,p])=>({id,...p})).sort((a,b)=>{
    const votesA=Object.values(a.votes||{}).filter(v=>v==="pour").length;
    const votesB=Object.values(b.votes||{}).filter(v=>v==="pour").length;
    return votesB-votesA;
  });

  async function addProposal(){
    if(!category||!description.trim())return;
    setSaving(true);
    await push(ref(db,"proposals"),{
      category,description:description.trim(),
      author:currentUser,createdAt:Date.now(),votes:{}
    });
    setCategory("");setDescription("");setShowForm(false);setSaving(false);
  }
  async function vote(propId,val){
    const prop=(proposals||{})[propId];
    const votes=prop?.votes||{};
    if(votes[currentUser]===val){
      const newV={...votes};delete newV[currentUser];
      await set(ref(db,`proposals/${propId}/votes`),newV);
    } else {
      await update(ref(db,`proposals/${propId}/votes`),{[currentUser]:val});
    }
  }
  async function deleteProposal(propId){
    await remove(ref(db,`proposals/${propId}`));
  }

  return(
    <div style={{padding:"10px 12px",overflowX:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{color:t.text,fontWeight:700,fontSize:16,fontFamily:"Syne,sans-serif"}}>🗳️ Voter pour un lieu</div>
          <div style={{color:t.muted,fontSize:12}}>Propose et vote pour votre prochaine sortie !</div>
        </div>
        <button onClick={()=>setShowForm(s=>!s)} style={{padding:"8px 14px",borderRadius:12,background:showForm?t.card:t.accent,border:`1px solid ${showForm?t.border:t.accent}`,color:showForm?t.muted:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>
          {showForm?"Annuler":"+ Proposer"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm&&(
        <div style={{background:t.card,border:`1px solid ${t.accent}55`,borderRadius:16,padding:"14px",marginBottom:14}}>
          <div style={{color:t.muted,fontSize:12,fontWeight:600,marginBottom:8}}>Catégorie</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setCategory(c)} style={{padding:"6px 12px",borderRadius:20,background:category===c?t.accent:t.bg,border:`1px solid ${category===c?t.accent:t.border}`,color:category===c?"#fff":t.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {c}
              </button>
            ))}
          </div>
          {/* Champ libre si "Autre" ou pour compléter */}
          <div style={{color:t.muted,fontSize:12,fontWeight:600,marginBottom:6}}>Nom du lieu ou description</div>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Décris le lieu, l'ambiance, le budget..." style={{width:"100%",padding:"11px 14px",borderRadius:12,background:t.bg,border:`1px solid ${t.border}`,color:t.text,fontSize:13,outline:"none",resize:"vertical",minHeight:80}}/>
          <button onClick={addProposal} disabled={!category||!description.trim()||saving} style={{width:"100%",marginTop:10,padding:"12px",borderRadius:12,background:category&&description.trim()?t.accent:t.border,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:category&&description.trim()?"pointer":"not-allowed"}}>
            {saving?"Envoi...":"✅ Soumettre ma proposition"}
          </button>
        </div>
      )}

      {/* Liste des propositions */}
      {propList.length===0?(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:40,marginBottom:10}}>🗳️</div>
          <div style={{color:t.text,fontWeight:600,fontSize:15,marginBottom:6}}>Aucune proposition pour l'instant</div>
          <div style={{color:t.muted,fontSize:13}}>Sois le premier à proposer un lieu !</div>
        </div>
      ):(
        propList.map((p,idx)=>{
          const votes=p.votes||{};
          const pour=Object.values(votes).filter(v=>v==="pour").length;
          const contre=Object.values(votes).filter(v=>v==="contre").length;
          const myVote=votes[currentUser];
          const canDelete=p.author===currentUser||isAdmin;
          const prof=(profiles||{})[p.author]||{};
          const col=prof.color||t.accent;
          return(
            <div key={p.id} style={{background:t.card,border:`1px solid ${idx===0&&pour>0?t.green+"66":t.border}`,borderRadius:16,padding:"14px",marginBottom:10,position:"relative"}}>
              {idx===0&&pour>0&&<div style={{position:"absolute",top:-8,left:14,background:t.green,color:"#000",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:20}}>🏆 Favori</div>}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{color:t.accent,fontSize:12,fontWeight:700,marginBottom:3}}>{p.category}</div>
                  <div style={{color:t.text,fontSize:14,lineHeight:1.4}}>{p.description}</div>
                </div>
                {canDelete&&<button onClick={()=>deleteProposal(p.id)} style={{background:"none",border:`1px solid ${t.danger}44`,borderRadius:8,padding:"4px 8px",color:t.danger,fontSize:12,cursor:"pointer",flexShrink:0}}>✕</button>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{p.author[0]}</div>
                <span style={{color:t.muted,fontSize:11}}>par {p.author}</span>
              </div>
              {/* Votes boutons */}
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <button onClick={()=>vote(p.id,"pour")} style={{flex:1,padding:"9px",borderRadius:12,background:myVote==="pour"?`${t.green}33`:t.bg,border:`2px solid ${myVote==="pour"?t.green:t.border}`,color:myVote==="pour"?t.green:t.muted,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  👍 Pour <span style={{background:t.green+"33",borderRadius:10,padding:"1px 7px",color:t.green,fontSize:12}}>{pour}</span>
                </button>
                <button onClick={()=>vote(p.id,"contre")} style={{flex:1,padding:"9px",borderRadius:12,background:myVote==="contre"?`${t.danger}22`:t.bg,border:`2px solid ${myVote==="contre"?t.danger:t.border}`,color:myVote==="contre"?t.danger:t.muted,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  👎 Contre <span style={{background:t.danger+"22",borderRadius:10,padding:"1px 7px",color:t.danger,fontSize:12}}>{contre}</span>
                </button>
              </div>
              {/* Liste des votants */}
              {Object.entries(votes).length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {Object.entries(votes).map(([voter,v])=>(
                    <div key={voter} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:20,background:v==="pour"?`${t.green}22`:`${t.danger}22`,border:`1px solid ${v==="pour"?t.green+"44":t.danger+"44"}`}}>
                      <span style={{fontSize:11}}>{v==="pour"?"👍":"👎"}</span>
                      <span style={{color:v==="pour"?t.green:t.danger,fontSize:11,fontWeight:600}}>{voter}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Presence ─────────────────────────────────────────────────────────────────
function usePresence(u){
  useEffect(()=>{
    if(!u)return;
    const r=ref(db,`presence/${u}`);
    set(r,{online:true,lastSeen:Date.now()});
    const iv=setInterval(()=>set(r,{online:true,lastSeen:Date.now()}),30000);
    const bye=()=>set(r,{online:false,lastSeen:Date.now()});
    window.addEventListener("beforeunload",bye);
    return()=>{clearInterval(iv);bye();window.removeEventListener("beforeunload",bye);};
  },[u]);
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function MonMotDePasse({currentUser,t}){
  const passwords=useFirebase("passwords",{});
  const[ouvert,setOuvert]=useState(false);
  const[actuel,setActuel]=useState("");
  const[nouveau,setNouveau]=useState("");
  const[conf,setConf]=useState("");
  const[msg,setMsg]=useState(null);
  const stored=(passwords||{})[currentUser];
  const champ={width:"100%",padding:"10px 12px",borderRadius:10,background:t.bg,border:`1px solid ${t.border}`,color:t.text,fontSize:13,outline:"none",marginBottom:8};
  async function valider(){
    if(stored&&await hashPw(actuel)!==stored){setMsg({ok:false,text:"Mot de passe actuel incorrect."});return;}
    if(!nouveau){setMsg({ok:false,text:"Choisis un mot de passe."});return;}
    if(nouveau!==conf){setMsg({ok:false,text:"Les deux saisies ne correspondent pas."});return;}
    await set(ref(db,`passwords/${currentUser}`),await hashPw(nouveau));
    setMsg({ok:true,text:"Mot de passe enregistré !"});
    setActuel("");setNouveau("");setConf("");
    setTimeout(()=>{setOuvert(false);setMsg(null);},1800);
  }
  async function supprimer(){
    if(stored&&await hashPw(actuel)!==stored){setMsg({ok:false,text:"Mot de passe actuel incorrect."});return;}
    if(!window.confirm("Supprimer ton mot de passe ? Tu pourras te connecter sans."))return;
    await remove(ref(db,`passwords/${currentUser}`));
    setActuel("");setNouveau("");setConf("");
    setMsg({ok:true,text:"Mot de passe supprimé."});
    setTimeout(()=>{setOuvert(false);setMsg(null);},1800);
  }
  return(
    <div style={{background:t.card,borderRadius:16,border:`1px solid ${t.border}`,padding:"12px 14px"}}>
      <button onClick={()=>{setOuvert(o=>!o);setMsg(null);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"none",border:"none",cursor:"pointer",padding:0}}>
        <span style={{fontSize:20}}>🔑</span>
        <div style={{textAlign:"left",flex:1}}>
          <div style={{color:t.text,fontWeight:700,fontSize:13}}>Mon mot de passe</div>
          <div style={{color:stored?t.green:t.muted,fontSize:11}}>{stored?"Défini":"Aucun — connexion libre"}</div>
        </div>
        <span style={{color:t.muted,fontSize:16}}>{ouvert?"⌄":"›"}</span>
      </button>
      {ouvert&&(
        <div style={{marginTop:12}}>
          {stored&&<input type="password" value={actuel} onChange={e=>{setActuel(e.target.value);setMsg(null);}} placeholder="Mot de passe actuel" style={champ}/>}
          <input type="password" value={nouveau} onChange={e=>{setNouveau(e.target.value);setMsg(null);}} placeholder="Nouveau mot de passe" style={champ}/>
          <input type="password" value={conf} onChange={e=>{setConf(e.target.value);setMsg(null);}} placeholder="Confirmer" style={champ}/>
          {msg&&<div style={{padding:"7px 10px",borderRadius:8,marginBottom:8,fontSize:12,fontWeight:600,background:msg.ok?`${t.green}18`:`${t.danger}18`,color:msg.ok?t.green:t.danger}}>{msg.text}</div>}
          <div style={{display:"flex",gap:7}}>
            <button onClick={valider} style={{flex:1,padding:"9px",borderRadius:10,background:t.accent,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Enregistrer</button>
            {stored&&<button onClick={supprimer} style={{padding:"9px 12px",borderRadius:10,background:"none",border:`1px solid ${t.danger}55`,color:t.danger,fontSize:12,cursor:"pointer"}}>🗑</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function HomeTab({currentUser,onNavigate,onLogout,t,profiles,event}){
  const seenKey=`seen_event_${currentUser}`;
  const hasNewEvent=event&&event.validatedAt&&localStorage.getItem(seenKey)!==(event.validatedAt?.toString()||"");
  const col=(profiles||{})[currentUser]?.color||t.accent;
  const menus=[
    {id:"calendar",icon:"📅",label:"Calendrier"},
    {id:"chat",    icon:"💬",label:"Chat"},
    {id:"friends", icon:"👥",label:"Amis"},
    {id:"events",  icon:"🎉",label:"Événements",badge:hasNewEvent},
  ];
  const hasEvent=event&&event.date;
  const eventDate=hasEvent?new Date(event.date+"T12:00:00"):null;
  const diff=(()=>{
    if(!eventDate)return null;
    const today=new Date();today.setHours(0,0,0,0);
    const ev=new Date(eventDate);ev.setHours(0,0,0,0);
    return Math.round((ev-today)/(1000*60*60*24));
  })();
  const past=diff!==null&&diff<0;
  return(
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",padding:"14px 14px 14px",gap:12}}>
      {/* Chip membre */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:t.card,borderRadius:16,border:`1px solid ${t.border}`}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:20,flexShrink:0}}>{currentUser[0].toUpperCase()}</div>
        <div>
          <div style={{color:t.text,fontWeight:700,fontSize:16}}>Bonjour, {currentUser} !</div>
          <div style={{color:t.muted,fontSize:12}}>Que veux-tu faire ?</div>
        </div>
      </div>
      <MonMotDePasse currentUser={currentUser} t={t}/>
      {/* Grille 2x2 menus principaux */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {menus.map(m=>(
          <button key={m.id} onClick={()=>onNavigate(m.id)} style={{padding:"14px 10px",borderRadius:16,background:t.card,border:`1px solid ${m.badge?t.danger+"66":t.border}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7,position:"relative"}}>
            {m.badge&&<div style={{position:"absolute",top:10,right:10,width:9,height:9,borderRadius:"50%",background:t.danger,animation:"pulse 1.5s infinite"}}/>}
            <span style={{fontSize:26}}>{m.icon}</span>
            <span style={{color:t.text,fontWeight:700,fontSize:13}}>{m.label}</span>
          </button>
        ))}
      </div>
      {/* Ligne Thèmes + Voter */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <button onClick={()=>onNavigate("themes")} style={{padding:"12px",borderRadius:16,background:t.card,border:`1px solid ${t.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span style={{fontSize:22}}>🎨</span>
          <span style={{color:t.text,fontWeight:700,fontSize:13}}>Thèmes</span>
        </button>
        <button onClick={()=>onNavigate("vote")} style={{padding:"12px",borderRadius:16,background:`linear-gradient(135deg,${t.accent}44,${t.green}22)`,border:`2px solid ${t.accent}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span style={{fontSize:22}}>🗳️</span>
          <span style={{color:t.accent,fontWeight:800,fontSize:13}}>Voter !</span>
        </button>
      </div>
      {/* Bannière événement */}
      <div style={{marginTop:4}}>
        {hasEvent?(
          <div onClick={()=>onNavigate("events")} style={{cursor:"pointer",borderRadius:16,overflow:"hidden",border:`2px solid ${t.accent}`,animation:"blink-border 1.8s ease-in-out infinite",boxShadow:`0 0 18px ${t.accent}44`}}>
            {event.imageUrl&&<img src={event.imageUrl} alt="" style={{width:"100%",maxHeight:130,objectFit:"cover",display:"block"}}/>}
            <div style={{background:`linear-gradient(135deg,${t.accent}22,${t.green}11)`,padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:20}}>🎉</span>
                <div style={{color:t.accent,fontWeight:800,fontSize:18}}>{event.title}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}><span>📅</span><span style={{color:t.text,fontSize:14,fontWeight:600}}>{eventDate.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</span></div>
                {!past&&<div style={{display:"flex",alignItems:"center",gap:7}}><span>⏳</span><span style={{color:t.green,fontSize:15,fontWeight:700}}>Dans {diff} jour{diff>1?"s":""} !</span></div>}
                {past&&<div style={{color:t.danger,fontSize:12,fontWeight:600}}>✅ Événement passé</div>}
                {event.slot&&<div style={{display:"flex",alignItems:"center",gap:7}}><span>{event.slot==="midi"?"🍽":"🌙"}</span><span style={{color:t.muted,fontSize:12}}>{event.slot==="midi"?"Repas du midi":event.slot==="soir"?"Repas du soir":"Midi & soir"}</span></div>}
                {event.address&&<div style={{display:"flex",alignItems:"center",gap:7}}><span>📍</span><span style={{color:t.muted,fontSize:13}}>{event.address}</span></div>}
                {event.mapsUrl&&(
                  <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:`${t.accent}22`,border:`1px solid ${t.accent}44`,borderRadius:10,textDecoration:"none",marginTop:2}}>
                    <span style={{fontSize:16}}>🗺️</span>
                    <span style={{color:t.accent,fontSize:13,fontWeight:600}}>Voir l'itinéraire</span>
                  </a>
                )}
                {event.message&&<div style={{background:`${t.green}11`,borderRadius:8,padding:"8px 12px",marginTop:2}}><span style={{color:t.text,fontSize:13,fontStyle:"italic"}}>"{event.message}"</span></div>}
              </div>
            </div>
          </div>
        ):(
          <div style={{borderRadius:16,border:`2px dashed ${t.border}`,padding:"18px",textAlign:"center",background:t.card}}>
            <div style={{fontSize:34,marginBottom:6}}>😢 ⏳</div>
            <div style={{color:t.muted,fontSize:13,fontWeight:600}}>Aucun événement prévu</div>
            <div style={{color:t.muted,fontSize:11,marginTop:3}}>L'administrateur n'a pas encore validé de date...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User App ─────────────────────────────────────────────────────────────────
function UserApp({currentUser,onLogout}){
  const[tab,setTab]=useState("home");
  const[,rerender]=useState(0);
  const themeData=useFirebase("config/theme",DEFAULT_THEME);
  const profiles=useFirebase("profiles",{});
  const appName=useFirebase("config/appName","WhenWeMeet");
  const appSub=useFirebase("config/appSubtitle","Trouvez la date parfaite ensemble");
  const event=useFirebase("config/validatedEvent",null);
  usePresence(currentUser);

  useEffect(()=>{
    const prof=(profiles||{})[currentUser]||{};
    const key=prof.theme||"cosmos";
    window._theme={...THEMES[key]};
    rerender(n=>n+1);
  },[profiles,currentUser]);
  useEffect(()=>{
    const h=()=>rerender(n=>n+1);
    window.addEventListener("themechange",h);
    return()=>window.removeEventListener("themechange",h);
  },[]);

  const t=C();
  const seenKey=`seen_event_${currentUser}`;
  const hasNewEvent=event&&event.validatedAt&&localStorage.getItem(seenKey)!==(event.validatedAt?.toString()||"");

  const isHome=tab==="home";

  return(
    <div style={{minHeight:"100vh",minHeight:"100dvh",background:t.bg,fontFamily:"Inter,sans-serif",display:"flex",justifyContent:"center"}}>
      <style>{GCSS}</style>
      <div className="app-root">

        {/* Header */}
        <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:t.bg,position:"sticky",top:0,zIndex:10,flexShrink:0}}>
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:19,letterSpacing:-0.5}}>
              {appName.split("").map((ch,i)=><span key={i} style={{color:i<Math.floor(appName.length/2)?t.text:t.accent}}>{ch}</span>)}
            </div>
            <div style={{color:t.muted,fontSize:13}}>{appSub}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {!isHome&&(
              <button onClick={()=>setTab("home")} style={{padding:"7px 14px",background:t.card,border:`1px solid ${t.border}`,borderRadius:20,cursor:"pointer",color:t.text,fontSize:13,fontWeight:600}}>
                Accueil
              </button>
            )}
            <button onClick={onLogout} style={{padding:"7px 14px",background:t.card,border:`1px solid ${t.border}`,borderRadius:20,cursor:"pointer",color:t.text,fontSize:13,fontWeight:600}}>
              Quitter
            </button>
          </div>
        </div>
        {/* Contenu */}
        <div style={{flex:1,overflowY:tab==="chat"?"hidden":"auto",display:"flex",flexDirection:"column",minHeight:0}}>
          {tab==="home"    &&<HomeTab currentUser={currentUser} onNavigate={setTab} onLogout={onLogout} t={t} appName={appName} profiles={profiles} event={event} appSub={appSub}/>}
          {tab==="calendar"&&<CalendarTab currentUser={currentUser}/>}
          {tab==="chat"    &&<ChatTab currentUser={currentUser}/>}
          {tab==="friends" &&<FriendsTab currentUser={currentUser}/>}
          {tab==="events"  &&<EventsTab currentUser={currentUser}/>}
          {tab==="themes"  &&<ThemesTab currentUser={currentUser}/>}
          {tab==="vote"    &&<VoteTab currentUser={currentUser} isAdmin={false}/>}
        </div>
        {/* Barre de navigation (masquée sur home) */}
        {!isHome&&(
          <div style={{display:"flex",borderTop:`1px solid ${t.border}`,background:t.bg,flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
            {[
              {id:"calendar",icon:"📅",label:"Calendrier"},
              {id:"chat",    icon:"💬",label:"Chat"},
              {id:"friends", icon:"👥",label:"Amis"},
              {id:"events",  icon:"🎉",label:"Événements",badge:hasNewEvent},
              {id:"themes",  icon:"🎨",label:"Thèmes"},
            ].map(tb=>(
              <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,padding:"10px 0 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:tab===tb.id?`2px solid ${t.accent}`:"2px solid transparent",marginTop:-1,minWidth:0,position:"relative"}}>
                <span style={{fontSize:20}}>{tb.icon}</span>
                {tb.badge&&<div style={{position:"absolute",top:6,right:"calc(50% - 14px)",width:8,height:8,borderRadius:"50%",background:t.danger,animation:"pulse 1.5s infinite"}}/>}
                <span style={{fontSize:10,fontWeight:600,color:tab===tb.id?t.accentLight:t.muted,whiteSpace:"nowrap"}}>{tb.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({onExit}){
  const[section,setSection]=useState("home");
  const themeData=useFirebase("config/theme",DEFAULT_THEME);
  const appName=useFirebase("config/appName","WhenWeMeet");
  const appSub=useFirebase("config/appSubtitle","Trouvez la date parfaite ensemble");
  const t=themeData||DEFAULT_THEME;
  useEffect(()=>{window._theme=themeData;},[themeData]);
  const sections=[
    {id:"home",icon:"🏠",label:"Accueil"},
    {id:"identity",icon:"✏️",label:"Identité"},
    {id:"theme",icon:"🎨",label:"Couleurs"},
    {id:"users",icon:"👥",label:"Membres"},
    {id:"groupes",icon:"👪",label:"Groupes"},
    {id:"avail",icon:"📅",label:"Dispos"},
    {id:"event",icon:"🎯",label:"Événement"},
    {id:"sorties",icon:"📖",label:"Sorties"},
    {id:"security",icon:"🔐",label:"Sécurité"},
    {id:"votes",icon:"🗳️",label:"Votes"},
  ];
  return(
    <div style={{minHeight:"100vh",minHeight:"100dvh",width:"100%",background:t.bg,fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column",paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <style>{GCSS}</style>
      <div style={{padding:"14px 16px 11px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:t.bg,position:"sticky",top:0,zIndex:10,flexShrink:0}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:t.text}}>⚙️ {appName}</div>
          <div style={{color:t.muted,fontSize:13}}>{appSub}</div>
        </div>
        <button onClick={onExit} style={{padding:"8px 14px",borderRadius:20,background:t.card,border:`1px solid ${t.border}`,color:t.text,fontSize:13,cursor:"pointer"}}>Quitter</button>
      </div>
      {/* Menus admin sur 2 rangées de 4 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"12px 12px",borderBottom:`1px solid ${t.border}`,flexShrink:0}}>
        {sections.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} style={{padding:"14px 6px",borderRadius:14,background:section===s.id?t.accent:t.card,border:`1px solid ${section===s.id?t.accent:t.border}`,color:section===s.id?"#fff":t.muted,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,minHeight:80}}>
            <span style={{fontSize:16}}>{s.icon}</span>
            <span style={{fontSize:12,whiteSpace:"nowrap",textAlign:"center",lineHeight:1.2}}>{s.label}</span>
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {section==="home"     &&<AdminHome t={t} onNav={setSection}/>}
        {section==="identity" &&<AdminIdentity t={t}/>}
        {section==="theme"    &&<AdminTheme t={t}/>}
        {section==="users"    &&<AdminUsers t={t}/>}
        {section==="groupes"  &&<AdminGroupes t={t}/>}
        {section==="avail"    &&<AdminAvail t={t}/>}
        {section==="event"    &&<AdminEvent t={t}/>}
        {section==="sorties"  &&<AdminSorties t={t}/>}
        {section==="security" &&<AdminSecurity t={t}/>}
        {section==="votes"    &&<VoteTab currentUser="admin" isAdmin={true}/>}
      </div>
    </div>
  );
}

function ACard({children,t}){return<div style={{margin:"10px 12px",padding:"14px",background:t.card,borderRadius:16,border:`1px solid ${t.border}`}}>{children}</div>;}
function ALabel({children,t}){return<div style={{color:t.muted,fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>{children}</div>;}
function SaveBtn({onClick,t,label="Enregistrer",saved}){return<button onClick={onClick} style={{padding:"11px",borderRadius:12,marginTop:10,background:saved?t.green:t.accent,border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",width:"100%",transition:"background 0.3s"}}>{label}</button>;}
function AInput({value,onChange,t,placeholder=""}){return<input value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",padding:"13px 16px",borderRadius:12,background:t.bg,border:`1px solid ${t.border}`,color:t.text,fontSize:15,outline:"none"}}/>;}

function AdminHome({t,onNav}){
  const users=useFirebase("users",{});
  const avail=useFirebase("availability",{});
  const msgs=useFirebase("messages",{});
  const stats=[{label:"Membres",value:Object.keys(users||{}).length,icon:"👥"},{label:"Jours dispo",value:Object.keys(avail||{}).length,icon:"📅"},{label:"Messages",value:Object.keys(msgs||{}).length,icon:"💬"}];
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}><ALabel t={t}>Aperçu temps réel</ALabel>
        <div style={{display:"flex",gap:8}}>{stats.map(s=><div key={s.label} style={{flex:1,background:t.bg,borderRadius:12,padding:"10px",textAlign:"center"}}><div style={{fontSize:20}}>{s.icon}</div><div style={{color:t.text,fontWeight:700,fontSize:18}}>{s.value}</div><div style={{color:t.muted,fontSize:10}}>{s.label}</div></div>)}</div>
      </ACard>
      <ACard t={t}><ALabel t={t}>Accès rapide</ALabel>
        {[{id:"identity",icon:"✏️",label:"Nom de l'app"},{id:"theme",icon:"🎨",label:"Couleurs"},{id:"users",icon:"👥",label:"Membres"},{id:"event",icon:"🎯",label:"Valider un événement"},{id:"sorties",icon:"📖",label:"Archiver une sortie"}].map(item=>(
          <button key={item.id} onClick={()=>onNav(item.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px",marginBottom:5,background:t.bg,border:`1px solid ${t.border}`,borderRadius:12,cursor:"pointer",color:t.text,fontSize:13,fontWeight:500}}>
            <span style={{fontSize:16}}>{item.icon}</span>{item.label}<span style={{marginLeft:"auto",color:t.muted}}>›</span>
          </button>
        ))}
      </ACard>
    </div>
  );
}

function AdminIdentity({t}){
  const appName=useFirebase("config/appName","WhenWeMeet");
  const appSub=useFirebase("config/appSubtitle","Trouvez la date parfaite ensemble");
  const[name,setName]=useState("");
  const[sub,setSub]=useState("");
  const[saved,setSaved]=useState(false);
  useEffect(()=>{setName(appName);},[appName]);
  useEffect(()=>{setSub(appSub);},[appSub]);
  async function save(){await update(ref(db,"config"),{appName:name.trim()||"WhenWeMeet",appSubtitle:sub.trim()});setSaved(true);setTimeout(()=>setSaved(false),2000);}
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}><ALabel t={t}>Nom de l'application</ALabel><AInput value={name} onChange={e=>setName(e.target.value)} t={t}/></ACard>
      <ACard t={t}><ALabel t={t}>Sous-titre</ALabel><AInput value={sub} onChange={e=>setSub(e.target.value)} t={t}/></ACard>
      <div style={{padding:"0 12px"}}><SaveBtn onClick={save} t={t} label={saved?"✓ Enregistré !":"Enregistrer"} saved={saved}/></div>
    </div>
  );
}

function AdminTheme({t}){
  const themeData=useFirebase("config/theme",DEFAULT_THEME);
  const[accent,setAccent]=useState(t.accent);
  const[green,setGreen]=useState(t.green);
  const[bg,setBg]=useState(t.bg);
  const[card,setCard]=useState(t.card);
  const[saved,setSaved]=useState(false);
  useEffect(()=>{if(themeData){setAccent(themeData.accent);setGreen(themeData.green);setBg(themeData.bg);setCard(themeData.card);}},[themeData]);
  async function save(){
    const newTheme={...DEFAULT_THEME,accent,accentLight:accent,green,bg,card,border:"#"+Math.max(0,parseInt((card||"#1C1E2A").slice(1),16)+0x101010).toString(16).padStart(6,"0")};
    await set(ref(db,"config/theme"),newTheme);setSaved(true);setTimeout(()=>setSaved(false),2000);
  }
  const colorRow=(label,val,setFn)=>(
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
      <input type="color" value={val} onChange={e=>setFn(e.target.value)} style={{width:42,height:42,borderRadius:10,border:"none",cursor:"pointer"}}/>
      <div><div style={{color:t.text,fontSize:13,fontWeight:600}}>{label}</div><div style={{color:t.muted,fontSize:11}}>{val}</div></div>
    </div>
  );
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}><ALabel t={t}>Thèmes prédéfinis (thème global par défaut)</ALabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {Object.entries(THEMES).map(([key,theme])=>(
            <button key={key} onClick={()=>{setAccent(theme.accent);setGreen(theme.green);setBg(theme.bg);setCard(theme.card);}} style={{padding:"8px 10px",borderRadius:12,background:theme.card,border:`1px solid ${theme.accent}66`,color:theme.accent,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left"}}>
              {theme.name}
            </button>
          ))}
        </div>
      </ACard>
      <ACard t={t}><ALabel t={t}>Couleurs personnalisées</ALabel>
        {colorRow("Couleur principale",accent,setAccent)}
        {colorRow("Couleur succès",green,setGreen)}
        {colorRow("Fond",bg,setBg)}
        {colorRow("Cartes",card,setCard)}
      </ACard>
      <div style={{padding:"0 12px"}}><SaveBtn onClick={save} t={t} label={saved?"✓ Appliqué !":"Appliquer le thème global"} saved={saved}/></div>
    </div>
  );
}

function AdminUsers({t}){
  const usersObj=useFirebase("users",{});
  const passwords=useFirebase("passwords",{});
  const avail=useFirebase("availability",{});
  const[newName,setNewName]=useState("");
  const[resetTarget,setRT]=useState(null);
  const[resetPw,setRPw]=useState("");
  const[resetConf,setRC]=useState("");
  const[resetMsg,setRM]=useState(null);
  const[showReset,setSR]=useState(false);
  const userList=Object.keys(usersObj||{});
  async function addUser(){const n=newName.trim();if(!n||userList.includes(n))return;await set(ref(db,`users/${n}`),{name:n,createdAt:Date.now()});setNewName("");}
  async function removeUser(u){
    await remove(ref(db,`users/${u}`));await remove(ref(db,`passwords/${u}`));await remove(ref(db,`profiles/${u}`));
    const av=avail||{};
    for(const[date,day]of Object.entries(av)){const midi=(day?.midi||[]).filter(x=>x!==u);const soir=(day?.soir||[]).filter(x=>x!==u);await set(ref(db,`availability/${date}`),{midi,soir});}
    if(resetTarget===u){setRT(null);setSR(false);}
  }
  async function applyReset(){
    if(!resetPw){setRM({ok:false,text:"Saisis un mot de passe."});return;}
    if(resetPw!==resetConf){setRM({ok:false,text:"Les mots de passe ne correspondent pas."});return;}
    await set(ref(db,`passwords/${resetTarget}`),await hashPw(resetPw));
    setRM({ok:true,text:`Mot de passe de ${resetTarget} mis à jour !`});
    setRPw("");setRC("");setTimeout(()=>{setSR(false);setRT(null);setRM(null);},2000);
  }
  async function clearPw(u){await remove(ref(db,`passwords/${u}`));setRM({ok:true,text:"Mot de passe supprimé."});setTimeout(()=>setRM(null),2000);}
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}><ALabel t={t}>Ajouter un membre</ALabel>
        <div style={{display:"flex",gap:8}}><AInput value={newName} onChange={e=>setNewName(e.target.value)} t={t} placeholder="Prénom ou pseudo"/><button onClick={addUser} style={{padding:"11px 14px",borderRadius:12,background:t.accent,border:"none",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:18,flexShrink:0}}>+</button></div>
      </ACard>
      <ACard t={t}><ALabel t={t}>{userList.length} membre{userList.length>1?"s":""}</ALabel>
        {userList.map(u=>{
          const hasPw=!!(passwords||{})[u];
          return(
            <div key={u}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:`1px solid ${t.border}22`}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:`${t.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",color:t.text,fontWeight:700,fontSize:14,flexShrink:0}}>{u[0]}</div>
                <div style={{flex:1,minWidth:0}}><div style={{color:t.text,fontSize:13,fontWeight:600}}>{u}</div><div style={{fontSize:10,color:hasPw?t.green:t.muted}}>{hasPw?"🔒 Mot de passe défini":"🔓 Sans mot de passe"}</div></div>
                <button onClick={()=>resetTarget===u&&showReset?setSR(false):(setRT(u),setRPw(""),setRC(""),setRM(null),setSR(true))} style={{background:"none",border:`1px solid ${t.accent}55`,borderRadius:8,padding:"4px 8px",color:t.accent,fontSize:11,cursor:"pointer",fontWeight:600,flexShrink:0}}>🔑</button>
                <button onClick={()=>removeUser(u)} style={{background:"none",border:`1px solid ${t.danger}55`,borderRadius:8,padding:"4px 8px",color:t.danger,fontSize:12,cursor:"pointer",flexShrink:0}}>✕</button>
              </div>
              {showReset&&resetTarget===u&&(
                <div style={{margin:"8px 0 10px",padding:"12px",background:t.bg,borderRadius:12,border:`1px solid ${t.accent}33`}}>
                  <div style={{color:t.text,fontWeight:600,fontSize:12,marginBottom:8}}>Nouveau mot de passe pour <span style={{color:t.accent}}>{u}</span></div>
                  <input type="password" value={resetPw} onChange={e=>setRPw(e.target.value)} placeholder="Nouveau mot de passe" style={{width:"100%",padding:"10px 12px",borderRadius:10,background:t.card,border:`1px solid ${t.border}`,color:t.text,fontSize:13,outline:"none",marginBottom:8}}/>
                  <input type="password" value={resetConf} onChange={e=>setRC(e.target.value)} placeholder="Confirmer" style={{width:"100%",padding:"10px 12px",borderRadius:10,background:t.card,border:`1px solid ${t.border}`,color:t.text,fontSize:13,outline:"none",marginBottom:8}}/>
                  {resetMsg&&<div style={{padding:"7px 10px",borderRadius:8,marginBottom:8,fontSize:12,fontWeight:600,background:resetMsg.ok?`${t.green}18`:`${t.danger}18`,color:resetMsg.ok?t.green:t.danger}}>{resetMsg.text}</div>}
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={applyReset} style={{flex:1,padding:"9px",borderRadius:10,background:t.accent,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Appliquer</button>
                    {hasPw&&<button onClick={()=>clearPw(u)} style={{padding:"9px 10px",borderRadius:10,background:"none",border:`1px solid ${t.danger}55`,color:t.danger,fontSize:12,cursor:"pointer"}}>🗑</button>}
                    <button onClick={()=>{setSR(false);setRT(null);}} style={{padding:"9px 10px",borderRadius:10,background:"none",border:`1px solid ${t.border}`,color:t.muted,fontSize:12,cursor:"pointer"}}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </ACard>
    </div>
  );
}
function AdminGroupes({t}){
  const groupes=useFirebase("groupes",{});
  const usersObj=useFirebase("users",{});
  const[newNom,setNewNom]=useState("");
  const[open,setOpen]=useState(null);
  const[editNom,setEditNom]=useState("");
  const userList=Object.keys(usersObj||{});
  const liste=Object.entries(groupes||{}).sort((a,b)=>(a[1].ordre||99)-(b[1].ordre||99));
  const slug=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  async function addGroupe(){
    const nom=newNom.trim();if(!nom)return;
    const id=slug(nom);if(!id||(groupes||{})[id]){setNewNom("");return;}
    await set(ref(db,`groupes/${id}`),{nom,type:"permanent",ordre:liste.length+1,createdAt:Date.now()});
    setNewNom("");
  }
  async function delGroupe(id,nom){
    if(!window.confirm(`Supprimer définitivement le groupe « ${nom} » ?`))return;
    await remove(ref(db,`groupes/${id}`));if(open===id)setOpen(null);
  }
  async function resetGroupe(id,nom){
    if(!window.confirm(`Réinitialiser « ${nom} » ?\nMembres, dispos, messages et votes de ce groupe seront effacés.`))return;
    await update(ref(db,`groupes/${id}`),{membres:null,availability:null,messages:null,proposals:null,validatedEvent:null});
  }
  async function renameGroupe(id){const nom=editNom.trim();if(!nom)return;await set(ref(db,`groupes/${id}/nom`),nom);}
  async function toggleMembre(id,u,dedans){
    if(dedans)await remove(ref(db,`groupes/${id}/membres/${u}`));
    else await set(ref(db,`groupes/${id}/membres/${u}`),true);
  }
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}><ALabel t={t}>Créer un groupe</ALabel>
        <div style={{display:"flex",gap:8}}>
          <AInput value={newNom} onChange={e=>setNewNom(e.target.value)} t={t} placeholder="Nom du groupe"/>
          <button onClick={addGroupe} style={{padding:"11px 14px",borderRadius:12,background:t.accent,border:"none",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:18,flexShrink:0}}>+</button>
        </div>
      </ACard>
      <ACard t={t}><ALabel t={t}>{liste.length} groupe{liste.length>1?"s":""}</ALabel>
        {liste.map(([id,g])=>{
          const membres=g.membres||{};
          const nb=Object.keys(membres).length;
          const ouvert=open===id;
          return(
            <div key={id}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:`1px solid ${t.border}22`}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:`${t.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{g.type==="ephemere"?"⏳":"👪"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:t.text,fontSize:13,fontWeight:600}}>{g.nom}</div>
                  <div style={{fontSize:10,color:t.muted}}>{nb} membre{nb>1?"s":""}{g.type==="ephemere"?" · éphémère":""}</div>
                </div>
                <button onClick={()=>{setOpen(ouvert?null:id);setEditNom(g.nom||"");}} style={{background:"none",border:`1px solid ${t.accent}55`,borderRadius:8,padding:"4px 8px",color:t.accent,fontSize:11,cursor:"pointer",fontWeight:600,flexShrink:0}}>{ouvert?"Fermer":"Gérer"}</button>
                <button onClick={()=>delGroupe(id,g.nom)} style={{background:"none",border:`1px solid ${t.danger}55`,borderRadius:8,padding:"4px 8px",color:t.danger,fontSize:12,cursor:"pointer",flexShrink:0}}>✕</button>
              </div>
              {ouvert&&(
                <div style={{margin:"8px 0 10px",padding:"12px",background:t.bg,borderRadius:12,border:`1px solid ${t.accent}33`}}>
                  <div style={{color:t.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Nom du groupe</div>
                  <div style={{display:"flex",gap:7,marginBottom:12}}>
                    <input value={editNom} onChange={e=>setEditNom(e.target.value)} style={{flex:1,padding:"10px 12px",borderRadius:10,background:t.card,border:`1px solid ${t.border}`,color:t.text,fontSize:13,outline:"none"}}/>
                    <button onClick={()=>renameGroupe(id)} style={{padding:"9px 12px",borderRadius:10,background:t.accent,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓</button>
                  </div>
                  <div style={{color:t.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Membres du groupe</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {userList.map(u=>{
                      const dedans=!!membres[u];
                      return(
                        <button key={u} onClick={()=>toggleMembre(id,u,dedans)} style={{padding:"7px 11px",borderRadius:20,background:dedans?t.accent:t.card,border:`1px solid ${dedans?t.accent:t.border}`,color:dedans?"#fff":t.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                          {dedans?"✓ ":""}{u}
                        </button>
                      );
                    })}
                  </div>
                  {g.type==="ephemere"&&(
                    <button onClick={()=>resetGroupe(id,g.nom)} style={{marginTop:12,width:"100%",padding:"9px",borderRadius:10,background:"none",border:`1px solid ${t.danger}55`,color:t.danger,fontSize:12,fontWeight:600,cursor:"pointer"}}>♻️ Réinitialiser ce groupe</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </ACard>
    </div>
  );
}

function AdminAvail({t}){
  const now=new Date();
  const todayStr=fmtDate(now.getFullYear(),now.getMonth(),now.getDate());
  const[year,setYear]=useState(now.getFullYear());
  const[month,setMonth]=useState(now.getMonth());
  const[sel,setSel]=useState(null);
  const usersObj=useFirebase("users",{});
  const avail=useFirebase("availability",{});
  const users=Object.keys(usersObj||{});
  const days=getDays(year,month);
  const first=getFirst(year,month);
  function getSlots(ds){const a=(avail||{})[ds]||{};return{midi:Array.isArray(a.midi)?a.midi:[],soir:Array.isArray(a.soir)?a.soir:[]};}
  async function toggleUser(ds,slot,user){const{midi,soir}=getSlots(ds);const arr=slot==="midi"?midi:soir;const updated=arr.includes(user)?arr.filter(x=>x!==user):[...arr,user];await set(ref(db,`availability/${ds}/${slot}`),updated);}
  async function clearDay(ds){await set(ref(db,`availability/${ds}`),{midi:[],soir:[]});}
  function prevM(){if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1);setSel(null);}
  function nextM(){if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1);setSel(null);}
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}>
        <ALabel t={t}>Calendrier admin</ALabel>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <button onClick={prevM} style={{background:"none",border:"none",color:t.muted,fontSize:22,cursor:"pointer",padding:"2px 8px"}}>‹</button>
          <span style={{color:t.text,fontWeight:700,fontSize:14}}>{MONTHS[month]} {year}</span>
          <button onClick={nextM} style={{background:"none",border:"none",color:t.muted,fontSize:22,cursor:"pointer",padding:"2px 8px"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:3}}>{DAYS_FR.map((d,i)=><div key={i} style={{textAlign:"center",color:t.muted,fontSize:10,fontWeight:600}}>{d}</div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
          {Array(first).fill(null).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:days},(_,i)=>i+1).map(d=>{
            const ds=fmtDate(year,month,d);
            const{midi,soir}=getSlots(ds);
            const count=new Set([...midi,...soir]).size;
            const isSel=sel===ds;
            const past=ds<todayStr;
            return<button key={d} onClick={()=>setSel(isSel?null:ds)} style={{aspectRatio:"1",borderRadius:8,background:count>0?heatColor(count,Math.max(users.length,1),t):t.bg,border:isSel?`2px solid ${t.accent}`:`2px solid ${t.border}33`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:past?0.4:1}}>
              <span style={{color:t.text,fontSize:11}}>{d}</span>
              {count>0&&<span style={{fontSize:8,color:"#fff",fontWeight:700}}>{count}</span>}
            </button>;
          })}
        </div>
      </ACard>
      {sel&&(
        <ACard t={t}>
          <ALabel t={t}>{new Date(sel+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</ALabel>
          {["midi","soir"].map(slot=>(
            <div key={slot} style={{marginBottom:12}}>
              <div style={{color:t.muted,fontSize:12,fontWeight:600,marginBottom:6}}>{slot==="midi"?"🍽 Midi":"🌙 Soir"}</div>
              {users.map(u=>{
                const checked=getSlots(sel)[slot].includes(u);
                return<button key={u} onClick={()=>toggleUser(sel,slot,u)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:11,background:checked?`${t.green}18`:t.bg,border:`1px solid ${checked?t.green+"66":t.border}`,cursor:"pointer",width:"100%",marginBottom:5}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`${t.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",color:t.text,fontWeight:700,fontSize:12}}>{u[0]}</div>
                  <span style={{color:t.text,fontSize:13,flex:1}}>{u}</span>
                  <div style={{width:20,height:20,borderRadius:5,background:checked?t.green:t.bg,border:`2px solid ${checked?t.green:t.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{checked&&<span style={{color:"#000",fontSize:11,fontWeight:800}}>✓</span>}</div>
                </button>;
              })}
            </div>
          ))}
          <button onClick={()=>clearDay(sel)} style={{width:"100%",padding:"9px",borderRadius:11,background:"none",border:`1px solid ${t.danger}55`,color:t.danger,fontSize:12,cursor:"pointer"}}>🗑 Effacer toutes les dispos</button>
        </ACard>
      )}
    </div>
  );
}

function AdminEvent({t}){
  const avail=useFirebase("availability",{});
  const usersObj=useFirebase("users",{});
  const event=useFirebase("config/validatedEvent",null);
  const[title,setTitle]=useState("");
  const[selDate,setSelDate]=useState("");
  const[selSlot,setSelSlot]=useState("les-deux");
  const[message,setMessage]=useState("");
  const[address,setAddress]=useState("");
  const[mapsUrl,setMapsUrl]=useState("");
  const[imageUrl,setImageUrl]=useState("");
  const[saved,setSaved]=useState(false);
  const users=Object.keys(usersObj||{});
  const suggestions=Object.entries(avail||{}).map(([date,day])=>{
    const midi=Array.isArray(day?.midi)?day.midi:[];
    const soir=Array.isArray(day?.soir)?day.soir:[];
    return{date,midi,soir,total:new Set([...midi,...soir]).size};
  }).filter(x=>x.total>0&&x.date>=fmtDate(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())).sort((a,b)=>b.total-a.total).slice(0,5);
  async function validate(){
    if(!selDate||!title.trim())return;
    const day=(avail||{})[selDate]||{};
    const midi=Array.isArray(day.midi)?day.midi:[];
    const soir=Array.isArray(day.soir)?day.soir:[];
    const participants=[...new Set([...midi,...soir])];
    await set(ref(db,"config/validatedEvent"),{date:selDate,title:title.trim(),slot:selSlot,message:message.trim(),address:address.trim(),mapsUrl:mapsUrl.trim(),participants,validatedAt:Date.now()});
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  }
  async function clearEvent(){await remove(ref(db,"config/validatedEvent"));}
  const textareaStyle={width:"100%",padding:"11px 14px",borderRadius:12,background:t.bg,border:`1px solid ${t.border}`,color:t.text,fontSize:13,outline:"none",resize:"vertical",minHeight:80};
  return(
    <div style={{padding:"8px 0 20px"}}>
      {(()=>{
        if(!event||!event.date)return null;
        const evDate=new Date(event.date+"T12:00:00");
        const isPastEvent=evDate<new Date();
        return(
          <ACard t={t}>
            <ALabel t={t}>Événement {isPastEvent?"passé":"actuel"}</ALabel>
            <div style={{padding:"12px",background:isPastEvent?`${t.danger}11`:`${t.green}11`,borderRadius:12,border:`1px solid ${isPastEvent?t.danger+"33":t.green+"33"}`,marginBottom:10}}>
              <div style={{color:t.text,fontWeight:700,fontSize:15}}>{event.title}</div>
              <div style={{color:t.muted,fontSize:12,marginTop:4}}>{evDate.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
              {isPastEvent&&<div style={{color:t.danger,fontSize:12,marginTop:4,fontWeight:600}}>⚠️ Cet événement est passé — pensez à l'archiver !</div>}
              {event.message&&<div style={{color:t.muted,fontSize:12,marginTop:4,fontStyle:"italic"}}>"{event.message}"</div>}
              {event.address&&<div style={{color:t.muted,fontSize:12,marginTop:2}}>📍 {event.address}</div>}
            </div>
            <button onClick={clearEvent} style={{width:"100%",padding:"9px",borderRadius:11,background:"none",border:`1px solid ${t.danger}55`,color:t.danger,fontSize:13,cursor:"pointer"}}>🗑 Supprimer l'événement</button>
          </ACard>
        );
      })()}
      <ACard t={t}>
        <ALabel t={t}>Valider un nouvel événement</ALabel>
        <div style={{color:t.muted,fontSize:12,marginBottom:6}}>Titre *</div>
        <AInput value={title} onChange={e=>setTitle(e.target.value)} t={t} placeholder="Ex: Dîner de Noël 🎄"/>
        <div style={{color:t.muted,fontSize:12,margin:"10px 0 6px"}}>Meilleures dates disponibles</div>
        {suggestions.map(s=>(
          <button key={s.date} onClick={()=>setSelDate(s.date)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",marginBottom:5,background:selDate===s.date?`${t.accent}22`:t.bg,border:`1px solid ${selDate===s.date?t.accent:t.border}`,borderRadius:11,cursor:"pointer"}}>
            <span style={{color:t.text,fontSize:13,flex:1}}>{new Date(s.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}</span>
            <span style={{fontSize:11,color:t.muted}}>🍽{s.midi.length} 🌙{s.soir.length}</span>
            <span style={{padding:"2px 8px",borderRadius:10,background:`${t.accent}22`,color:t.accent,fontSize:11,fontWeight:700}}>{s.total}/{users.length}</span>
          </button>
        ))}
        <div style={{color:t.muted,fontSize:12,margin:"10px 0 6px"}}>Créneau</div>
        <div style={{display:"flex",gap:7,marginBottom:12}}>
          {[{id:"midi",label:"🍽 Midi"},{id:"soir",label:"🌙 Soir"},{id:"les-deux",label:"🍽🌙 Les deux"}].map(s=>(
            <button key={s.id} onClick={()=>setSelSlot(s.id)} style={{flex:1,padding:"8px 4px",borderRadius:10,background:selSlot===s.id?`${t.accent}22`:t.bg,border:`1px solid ${selSlot===s.id?t.accent:t.border}`,color:selSlot===s.id?t.accent:t.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>{s.label}</button>
          ))}
        </div>
        <div style={{color:t.muted,fontSize:12,marginBottom:6}}>💬 Message de bienvenue</div>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ex: On se retrouve à 20h, tenue décontractée !" style={textareaStyle}/>
        <div style={{color:t.muted,fontSize:12,margin:"10px 0 6px"}}>📍 Adresse du lieu</div>
        <AInput value={address} onChange={e=>setAddress(e.target.value)} t={t} placeholder="Ex: Restaurant Le Bistrot, 12 rue de la Paix, Paris"/>
        <div style={{color:t.muted,fontSize:12,margin:"10px 0 6px"}}>🗺️ Lien Google Maps</div>
        <AInput value={mapsUrl} onChange={e=>setMapsUrl(e.target.value)} t={t} placeholder="https://maps.google.com/..."/>
        <div style={{color:t.muted,fontSize:12,margin:"10px 0 6px"}}>🖼️ Image ou GIF (lien URL)</div>
        <AInput value={imageUrl} onChange={e=>setImageUrl(e.target.value)} t={t} placeholder="https://media.giphy.com/..."/>
        <SaveBtn onClick={validate} t={t} label={saved?"✓ Événement validé !":"🎯 Valider et notifier"} saved={saved}/>
      </ACard>
    </div>
  );
}

function AdminSorties({t}){
  const avail=useFirebase("availability",{});
  const sorties=useFirebase("sorties",{});
  const[title,setTitle]=useState("");
  const[selDate,setSelDate]=useState("");
  const[selSlot,setSelSlot]=useState("les-deux");
  const[saved,setSaved]=useState(false);
  const sortieList=Object.entries(sorties||{}).map(([id,s])=>({id,...s})).sort((a,b)=>b.archivedAt-a.archivedAt);
  const event2=useFirebase("config/validatedEvent",null);
  const now15=new Date();
  const today15=fmtDate(now15.getFullYear(),now15.getMonth(),now15.getDate());
  const limit15=new Date(now15);limit15.setDate(limit15.getDate()-15);
  const limit15str=fmtDate(limit15.getFullYear(),limit15.getMonth(),limit15.getDate());
  const suggestions=(()=>{
    if(!event2||!event2.date)return[];
    const evDate=event2.date;
    if(evDate>today15||evDate<limit15str)return[];
    const day=(avail||{})[evDate]||{};
    const midi=Array.isArray(day.midi)?day.midi:[];
    const soir=Array.isArray(day.soir)?day.soir:[];
    return[{date:evDate,midi,soir,total:new Set([...midi,...soir]).size}];
  })();
  async function archive(){
    if(!selDate||!title.trim())return;
    const day=(avail||{})[selDate]||{};
    const midi=Array.isArray(day.midi)?day.midi:[];
    const soir=Array.isArray(day.soir)?day.soir:[];
    const participants=[...new Set([...midi,...soir])];
    await push(ref(db,"sorties"),{date:selDate,title:title.trim(),slot:selSlot,participants,archivedAt:Date.now()});
    setSaved(true);setTitle("");setSelDate("");setTimeout(()=>setSaved(false),2000);
  }
  async function deleteSortie(id){await remove(ref(db,`sorties/${id}`));}
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}>
        <ALabel t={t}>Archiver une sortie</ALabel>
        <div style={{color:t.muted,fontSize:12,marginBottom:6}}>Titre</div>
        <AInput value={title} onChange={e=>setTitle(e.target.value)} t={t} placeholder="Ex: Soirée pizza 🍕"/>
        <div style={{color:t.muted,fontSize:12,margin:"10px 0 6px"}}>Date</div>
        {suggestions.map(s=>(
          <button key={s.date} onClick={()=>setSelDate(s.date)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 12px",marginBottom:4,background:selDate===s.date?`${t.accent}22`:t.bg,border:`1px solid ${selDate===s.date?t.accent:t.border}`,borderRadius:10,cursor:"pointer"}}>
            <span style={{color:t.text,fontSize:12,flex:1}}>{new Date(s.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</span>
            <span style={{fontSize:10,color:t.muted}}>{s.total} pers.</span>
          </button>
        ))}
        <div style={{color:t.muted,fontSize:12,margin:"10px 0 6px"}}>Créneau</div>
        <div style={{display:"flex",gap:7,marginBottom:4}}>
          {[{id:"midi",label:"🍽 Midi"},{id:"soir",label:"🌙 Soir"},{id:"les-deux",label:"🍽🌙 Les deux"}].map(s=>(
            <button key={s.id} onClick={()=>setSelSlot(s.id)} style={{flex:1,padding:"7px 4px",borderRadius:10,background:selSlot===s.id?`${t.accent}22`:t.bg,border:`1px solid ${selSlot===s.id?t.accent:t.border}`,color:selSlot===s.id?t.accent:t.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>{s.label}</button>
          ))}
        </div>
        <SaveBtn onClick={archive} t={t} label={saved?"✓ Archivé !":"📖 Archiver cette sortie"} saved={saved}/>
      </ACard>
      {sortieList.length>0&&(
        <ACard t={t}>
          <ALabel t={t}>{sortieList.length} sortie{sortieList.length>1?"s":""} archivée{sortieList.length>1?"s":""}</ALabel>
          {sortieList.map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:`1px solid ${t.border}22`}}>
              <div style={{flex:1}}><div style={{color:t.text,fontSize:13,fontWeight:600}}>{s.title}</div><div style={{color:t.muted,fontSize:11}}>{new Date(s.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div></div>
              <button onClick={()=>deleteSortie(s.id)} style={{background:"none",border:`1px solid ${t.danger}44`,borderRadius:8,padding:"4px 8px",color:t.danger,fontSize:12,cursor:"pointer"}}>✕</button>
            </div>
          ))}
        </ACard>
      )}
    </div>
  );
}

function AdminSecurity({t}){
  const adminPass=useFirebase("config/adminPassword","admin123");
  const[cur,setCur]=useState("");
  const[np,setNp]=useState("");
  const[conf,setConf]=useState("");
  const[msg,setMsg]=useState(null);
  async function save(){
    if(cur!==adminPass){setMsg({ok:false,text:"Mot de passe actuel incorrect"});return;}
    if(!np){setMsg({ok:false,text:"Le nouveau mot de passe est vide"});return;}
    if(np!==conf){setMsg({ok:false,text:"Les mots de passe ne correspondent pas"});return;}
    await set(ref(db,"config/adminPassword"),np);setCur("");setNp("");setConf("");
    setMsg({ok:true,text:"Mot de passe modifié !"});setTimeout(()=>setMsg(null),3000);
  }
  const pwRow=(label,val,setFn)=><div style={{marginBottom:10}}><div style={{color:t.muted,fontSize:12,marginBottom:5}}>{label}</div><input type="password" value={val} onChange={e=>setFn(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:11,background:t.bg,border:`1px solid ${t.border}`,color:t.text,fontSize:13,outline:"none"}}/></div>;
  return(
    <div style={{padding:"8px 0 20px"}}>
      <ACard t={t}><ALabel t={t}>Changer le mot de passe admin</ALabel>
        {pwRow("Mot de passe actuel",cur,setCur)}
        {pwRow("Nouveau mot de passe",np,setNp)}
        {pwRow("Confirmer",conf,setConf)}
        {msg&&<div style={{padding:"8px 12px",borderRadius:9,marginBottom:8,background:msg.ok?`${t.green}18`:`${t.danger}18`,color:msg.ok?t.green:t.danger,fontSize:12}}>{msg.text}</div>}
        <SaveBtn onClick={save} t={t} label="Changer le mot de passe"/>
      </ACard>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App(){
  const[screen,setScreen]=useState("splash");
  const[currentUser,setCurrentUser]=useState(null);
  function handleEnter(mode,user){
    if(mode==="admin"){setScreen("admin");setCurrentUser(null);}
    else{setCurrentUser(user);setScreen("user");}
  }
  if(screen==="splash")return<SplashScreen onEnter={handleEnter}/>;
  if(screen==="admin")return<AdminPanel onExit={()=>setScreen("splash")}/>;
  return<UserApp currentUser={currentUser} onLogout={()=>setScreen("splash")}/>;
}
