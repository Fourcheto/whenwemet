import { useState, useEffect, useRef } from "react";

// ─── Global shared state ──────────────────────────────────────────────────────
if (!window._wmm) {
  window._wmm = {
    appName: "WhenWeMeet",
    appSubtitle: "Trouvez la date parfaite ensemble",
    adminPassword: "admin123",
    theme: {
      bg: "#0F1117",
      card: "#1C1E2A",
      border: "#2A2D3E",
      accent: "#6C63FF",
      accentLight: "#8B84FF",
      green: "#3DDC84",
      text: "#F0F0F5",
      muted: "#8888AA",
      danger: "#FF6B6B",
    },
    users: ["Alice", "Bob", "Clara", "Maxime", "Thomas"],
    availability: {
      "2026-07-05": ["Alice", "Bob", "Clara"],
      "2026-07-06": ["Alice", "Maxime"],
      "2026-07-12": ["Bob", "Clara", "Maxime"],
      "2026-07-13": ["Alice", "Bob", "Clara", "Maxime"],
      "2026-07-19": ["Alice", "Clara"],
      "2026-07-20": ["Bob", "Maxime"],
      "2026-07-26": ["Alice", "Bob", "Clara", "Maxime"],
      "2026-07-27": ["Alice", "Bob"],
    },
    messages: [
      { id: 1, user: "Alice", text: "Salut tout le monde ! 🎉", time: "10:02" },
      { id: 2, user: "Bob", text: "J'ai marqué mes dispos sur juillet", time: "10:05" },
      { id: 3, user: "Clara", text: "Pareil ! Vivement qu'on trouve la date !", time: "10:08" },
    ],
    nextMsgId: 4,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const C = () => window._wmm.theme;
const fmtDate = (y, m, d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const getDays = (y, m) => new Date(y, m+1, 0).getDate();
const getFirst = (y, m) => new Date(y, m, 1).getDay();
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR = ["D","L","M","M","J","V","S"];

function heatColor(count, total, theme) {
  if (count === 0) return "transparent";
  const r = count / total;
  if (r <= 0.25) return theme.accent + "44";
  if (r <= 0.5)  return theme.accent + "88";
  if (r <= 0.75) return theme.accent;
  return theme.green;
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
// user passwords stored as window._wmm.passwords = { "Alice": "xxx", ... }
if (!window._wmm.passwords) window._wmm.passwords = {};

function PwInput({ value, onChange, onEnter, placeholder = "Mot de passe", error, t }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        onKeyDown={e => e.key === "Enter" && onEnter()}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "13px 48px 13px 16px", borderRadius: 14, fontSize: 15,
          background: error ? `${t.danger}11` : t.card,
          border: `1px solid ${error ? t.danger : t.border}`,
          color: t.text, outline: "none",
        }}
      />
      <button onClick={() => setShow(s => !s)} style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", cursor: "pointer",
        color: t.muted, fontSize: 16, padding: 4,
      }}>{show ? "🙈" : "👁"}</button>
    </div>
  );
}

function SplashScreen({ onEnter }) {
  const [phase, setPhase] = useState("title"); // title | login | new-user | admin-pin
  const [loginUser, setLoginUser] = useState(null);
  const [loginPw, setLoginPw] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [newName, setNewName] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [newError, setNewError] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [adminErr, setAdminErr] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const t = C();

  useEffect(() => { setTimeout(() => setFadeIn(true), 80); }, []);

  function openLogin(user) {
    setLoginUser(user);
    setLoginPw("");
    setLoginErr("");
    setPhase("login");
  }

  function tryLogin() {
    const stored = window._wmm.passwords[loginUser];
    // If no password was ever set for this user (legacy / pre-password), let them in
    if (!stored || stored === loginPw) {
      onEnter("user", loginUser);
    } else {
      setLoginErr("Mot de passe incorrect.");
      setLoginPw("");
    }
  }

  function tryAdmin() {
    if (adminPw === window._wmm.adminPassword) {
      onEnter("admin", null);
    } else {
      setAdminErr(true);
      setAdminPw("");
      setTimeout(() => setAdminErr(false), 1200);
    }
  }

  function createProfile() {
    const name = newName.trim();
    if (!name || name.length < 2) { setNewError("Saisis au moins 2 caractères."); return; }
    if (window._wmm.users.includes(name)) { setNewError("Ce nom existe déjà — connecte-toi !"); return; }
    if (!newPw) { setNewError("Choisis un mot de passe."); return; }
    if (newPw !== newPwConfirm) { setNewError("Les mots de passe ne correspondent pas."); return; }
    window._wmm.users.push(name);
    window._wmm.passwords[name] = newPw;
    onEnter("user", name);
  }

  const stars = Array.from({length: 28}, (_, i) => ({
    x: (i * 37 + 11) % 100, y: (i * 53 + 7) % 100,
    r: 0.8 + (i % 3) * 0.6, o: 0.2 + (i % 4) * 0.15,
  }));

  const inputStyle = (err) => ({
    width: "100%", padding: "13px 16px", borderRadius: 14, fontSize: 15,
    background: err ? `${t.danger}11` : t.card,
    border: `1px solid ${err ? t.danger : t.border}`,
    color: t.text, outline: "none",
  });

  const bigBtn = (accent) => ({
    padding: "14px", borderRadius: 14, border: "none",
    background: `linear-gradient(135deg, ${accent || t.accent}, ${t.accentLight})`,
    color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
    boxShadow: `0 4px 20px ${t.accent}44`,
  });

  const backBtn = {
    background: "none", border: "none", color: t.muted,
    fontSize: 13, cursor: "pointer", padding: "4px",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 30%, #1a1640 0%, ${t.bg} 70%)`,
      position: "relative", overflow: "hidden",
      opacity: fadeIn ? 1 : 0, transition: "opacity 0.6s ease",
    }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {stars.map((s, i) => <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />)}
      </svg>
      <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle, ${t.accent}22 0%, transparent 70%)`, pointerEvents: "none" }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button,input { font-family:inherit; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2A2D3E;border-radius:2px}
      `}</style>

      <div style={{ textAlign: "center", zIndex: 1, padding: "0 32px", maxWidth: 380, width: "100%" }}>

        {/* Logo + title (always visible) */}
        <div style={{ animation: "float 4s ease-in-out infinite", marginBottom: 8 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, margin: "0 auto", background: `linear-gradient(135deg, ${t.accent}, ${t.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: `0 0 40px ${t.accent}55` }}>📅</div>
        </div>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 34, letterSpacing: -1, marginBottom: 4 }}>
          {window._wmm.appName.split("").map((ch, i) => (
            <span key={i} style={{ color: i < Math.floor(window._wmm.appName.length / 2) ? t.text : t.accent }}>{ch}</span>
          ))}
        </div>
        <div style={{ color: t.muted, fontSize: 14, marginBottom: 32, letterSpacing: 0.3 }}>{window._wmm.appSubtitle}</div>

        {/* ── TITLE ── */}
        {phase === "title" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: t.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Choisissez votre accès</div>
            <div style={{ background: `${t.card}CC`, border: `1px solid ${t.border}`, borderRadius: 18, padding: "4px", backdropFilter: "blur(12px)", maxHeight: 252, overflowY: "auto" }}>
              {window._wmm.users.map((u, i) => (
                <button key={u} onClick={() => openLogin(u)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "11px 14px",
                  background: "none", border: "none", borderRadius: 14, cursor: "pointer",
                  borderBottom: i < window._wmm.users.length - 1 ? `1px solid ${t.border}44` : "none",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${t.accent}88, ${t.accentLight}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontWeight: 700, fontSize: 15 }}>{u[0]}</div>
                  <span style={{ color: t.text, fontWeight: 600, fontSize: 15 }}>{u}</span>
                  <span style={{ marginLeft: "auto", color: t.muted, fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setPhase("new-user"); setNewName(""); setNewPw(""); setNewPwConfirm(""); setNewError(""); }} style={{ padding: "13px 16px", borderRadius: 14, background: `linear-gradient(135deg, ${t.accent}18, ${t.accent}08)`, border: `1px solid ${t.accent}55`, color: t.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>✨</span> Créer mon profil
            </button>
            <button onClick={() => { setPhase("admin-pin"); setAdminPw(""); }} style={{ padding: "11px", borderRadius: 14, background: "none", border: `1px solid ${t.border}`, color: t.muted, fontSize: 13, cursor: "pointer" }}>
              ⚙️ &nbsp;Accès administrateur
            </button>
          </div>
        )}

        {/* ── LOGIN ── */}
        {phase === "login" && loginUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accent}, ${t.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", boxShadow: `0 0 28px ${t.accent}44` }}>
                {loginUser[0].toUpperCase()}
              </div>
            </div>
            <div style={{ color: t.text, fontWeight: 700, fontSize: 18, fontFamily: "Syne, sans-serif" }}>Bonjour, {loginUser} !</div>
            <div style={{ color: t.muted, fontSize: 13, marginBottom: 4 }}>Saisis ton mot de passe pour continuer.</div>
            <PwInput
              value={loginPw}
              onChange={e => { setLoginPw(e.target.value); setLoginErr(""); }}
              onEnter={tryLogin}
              error={!!loginErr}
              t={t}
            />
            {loginErr && <div style={{ color: t.danger, fontSize: 13, animation: "shake 0.4s ease" }}>{loginErr}</div>}
            <button onClick={tryLogin} style={{ ...bigBtn(), width: "100%" }}>Se connecter 🔓</button>
            <button onClick={() => setPhase("title")} style={backBtn}>← Retour</button>
          </div>
        )}

        {/* ── NEW USER ── */}
        {phase === "new-user" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accent}, ${t.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", boxShadow: `0 0 28px ${t.accent}44`, transition: "all 0.2s" }}>
                {newName.trim() ? newName.trim()[0].toUpperCase() : "?"}
              </div>
            </div>
            <div style={{ color: t.text, fontWeight: 700, fontSize: 18, fontFamily: "Syne, sans-serif" }}>Créer mon profil</div>
            <div style={{ color: t.muted, fontSize: 12, marginBottom: 2 }}>Prénom ou pseudo</div>
            <input
              autoFocus
              value={newName}
              onChange={e => { setNewName(e.target.value); setNewError(""); }}
              onKeyDown={e => e.key === "Enter" && createProfile()}
              placeholder="Ton prénom ou pseudo…"
              maxLength={20}
              style={inputStyle(newError && !newPw)}
            />
            <div style={{ color: t.muted, fontSize: 12, marginBottom: 2, marginTop: 4 }}>Mot de passe</div>
            <PwInput
              value={newPw}
              onChange={e => { setNewPw(e.target.value); setNewError(""); }}
              onEnter={createProfile}
              placeholder="Choisis un mot de passe"
              error={!!newError && !!newName.trim()}
              t={t}
            />
            <div style={{ color: t.muted, fontSize: 12, marginBottom: 2 }}>Confirmer le mot de passe</div>
            <PwInput
              value={newPwConfirm}
              onChange={e => { setNewPwConfirm(e.target.value); setNewError(""); }}
              onEnter={createProfile}
              placeholder="Répète le mot de passe"
              error={!!newError && newPw !== newPwConfirm}
              t={t}
            />
            {newError && <div style={{ color: t.danger, fontSize: 13, animation: "shake 0.4s ease" }}>{newError}</div>}
            <button onClick={createProfile} style={{ ...bigBtn(), width: "100%", marginTop: 4, opacity: newName.trim().length >= 2 && newPw ? 1 : 0.5 }}>
              Rejoindre le groupe 🎉
            </button>
            <button onClick={() => setPhase("title")} style={backBtn}>← Retour</button>
          </div>
        )}

        {/* ── ADMIN PIN ── */}
        {phase === "admin-pin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: t.text, fontWeight: 700, fontSize: 17, fontFamily: "Syne, sans-serif" }}>Zone administrateur</div>
            <div style={{ color: t.muted, fontSize: 13, marginBottom: 4 }}>Saisissez le mot de passe</div>
            <PwInput
              value={adminPw}
              onChange={e => setAdminPw(e.target.value)}
              onEnter={tryAdmin}
              placeholder="Mot de passe admin"
              error={adminErr}
              t={t}
            />
            {adminErr && <div style={{ color: t.danger, fontSize: 13, animation: "shake 0.4s ease" }}>Mot de passe incorrect</div>}
            <button onClick={tryAdmin} style={{ ...bigBtn(), width: "100%" }}>Entrer</button>
            <button onClick={() => setPhase("title")} style={backBtn}>← Retour</button>
          </div>
        )}

      </div>

      {phase === "title" && (
        <div style={{ position: "absolute", bottom: 32, color: t.muted, fontSize: 11, textAlign: "center", animation: "shimmer 3s ease-in-out infinite", letterSpacing: 0.5 }}>
          Mot de passe admin par défaut : <strong style={{ color: t.accent }}>admin123</strong>
        </div>
      )}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ onExit, forceRefresh }) {
  const [section, setSection] = useState("home");
  const [, rerender] = useState(0);
  const refresh = () => { rerender(n=>n+1); forceRefresh(); };

  const t = C();

  const sections = [
    { id: "home",     icon: "🏠", label: "Accueil" },
    { id: "identity", icon: "✏️",  label: "Identité" },
    { id: "theme",    icon: "🎨", label: "Couleurs" },
    { id: "users",    icon: "👥", label: "Membres" },
    { id: "avail",    icon: "📅", label: "Disponibilités" },
    { id: "security", icon: "🔐", label: "Sécurité" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:t.bg, fontFamily:"Inter,sans-serif", display:"flex", flexDirection:"column", maxWidth:430, margin:"0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}button,input{font-family:inherit}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2A2D3E;border-radius:2px}`}</style>

      {/* Admin header */}
      <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:t.bg, position:"sticky", top:0, zIndex:10 }}>
        <div>
          <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, color:t.text }}>
            ⚙️ Admin
          </div>
          <div style={{ color:t.muted, fontSize:11 }}>{window._wmm.appName}</div>
        </div>
        <button onClick={onExit} style={{ padding:"8px 14px", borderRadius:20, background:t.card, border:`1px solid ${t.border}`, color:t.text, fontSize:13, cursor:"pointer" }}>
          Quitter
        </button>
      </div>

      {/* Section nav */}
      <div style={{ display:"flex", overflowX:"auto", gap:8, padding:"12px 16px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding:"7px 13px", borderRadius:20, whiteSpace:"nowrap",
            background: section===s.id ? t.accent : t.card,
            border: `1px solid ${section===s.id ? t.accent : t.border}`,
            color: section===s.id ? "#fff" : t.muted,
            fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0,
          }}>{s.icon} {s.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto" }}>
        {section === "home"     && <AdminHome t={t} onNav={setSection} />}
        {section === "identity" && <AdminIdentity t={t} refresh={refresh} />}
        {section === "theme"    && <AdminTheme t={t} refresh={refresh} />}
        {section === "users"    && <AdminUsers t={t} refresh={refresh} />}
        {section === "avail"    && <AdminAvail t={t} refresh={refresh} />}
        {section === "security" && <AdminSecurity t={t} refresh={refresh} />}
      </div>
    </div>
  );
}

function AdminCard({ children, t }) {
  return (
    <div style={{ margin:"12px 16px", padding:"16px", background:t.card, borderRadius:16, border:`1px solid ${t.border}` }}>
      {children}
    </div>
  );
}
function AdminLabel({ children, t }) {
  return <div style={{ color:t.muted, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{children}</div>;
}
function AdminInput({ value, onChange, t, type="text", placeholder="" }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
      width:"100%", padding:"11px 14px", borderRadius:12,
      background:t.bg, border:`1px solid ${t.border}`,
      color:t.text, fontSize:14, outline:"none",
    }} />
  );
}
function SaveBtn({ onClick, t, label="Enregistrer" }) {
  return (
    <button onClick={onClick} style={{
      padding:"11px 20px", borderRadius:12, marginTop:12,
      background:t.accent, border:"none", color:"#fff",
      fontWeight:700, fontSize:14, cursor:"pointer", width:"100%",
    }}>{label}</button>
  );
}

function AdminHome({ t, onNav }) {
  const stats = [
    { label:"Membres", value: window._wmm.users.length, icon:"👥" },
    { label:"Jours dispo", value: Object.keys(window._wmm.availability).length, icon:"📅" },
    { label:"Messages", value: window._wmm.messages.length, icon:"💬" },
  ];
  return (
    <div style={{ padding:"8px 0 20px" }}>
      <AdminCard t={t}>
        <AdminLabel t={t}>Aperçu</AdminLabel>
        <div style={{ display:"flex", gap:10 }}>
          {stats.map(s => (
            <div key={s.label} style={{ flex:1, background:t.bg, borderRadius:12, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:22 }}>{s.icon}</div>
              <div style={{ color:t.text, fontWeight:700, fontSize:20 }}>{s.value}</div>
              <div style={{ color:t.muted, fontSize:11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </AdminCard>
      <AdminCard t={t}>
        <AdminLabel t={t}>Accès rapide</AdminLabel>
        {[
          { id:"identity", icon:"✏️", label:"Modifier le nom de l'app" },
          { id:"theme",    icon:"🎨", label:"Changer les couleurs" },
          { id:"users",    icon:"👥", label:"Gérer les membres" },
          { id:"avail",    icon:"📅", label:"Modifier les disponibilités" },
        ].map(item => (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            display:"flex", alignItems:"center", gap:12,
            width:"100%", padding:"12px", marginBottom:6,
            background:t.bg, border:`1px solid ${t.border}`,
            borderRadius:12, cursor:"pointer", color:t.text,
            fontSize:14, fontWeight:500,
          }}>
            <span style={{fontSize:18}}>{item.icon}</span> {item.label}
            <span style={{marginLeft:"auto", color:t.muted}}>›</span>
          </button>
        ))}
      </AdminCard>
    </div>
  );
}

function AdminIdentity({ t, refresh }) {
  const [name, setName] = useState(window._wmm.appName);
  const [sub, setSub] = useState(window._wmm.appSubtitle);
  const [saved, setSaved] = useState(false);
  function save() {
    window._wmm.appName = name.trim() || "WhenWeMeet";
    window._wmm.appSubtitle = sub.trim();
    setSaved(true); refresh();
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div style={{ padding:"8px 0 20px" }}>
      <AdminCard t={t}>
        <AdminLabel t={t}>Nom de l'application</AdminLabel>
        <AdminInput value={name} onChange={e => setName(e.target.value)} t={t} placeholder="WhenWeMeet" />
      </AdminCard>
      <AdminCard t={t}>
        <AdminLabel t={t}>Sous-titre / description</AdminLabel>
        <AdminInput value={sub} onChange={e => setSub(e.target.value)} t={t} placeholder="Trouvez la date parfaite" />
      </AdminCard>
      <div style={{ padding:"0 16px" }}>
        <SaveBtn onClick={save} t={t} label={saved ? "✓ Enregistré !" : "Enregistrer"} />
      </div>
    </div>
  );
}

const PRESETS = [
  { name:"Cosmos", accent:"#6C63FF", green:"#3DDC84", bg:"#0F1117", card:"#1C1E2A" },
  { name:"Aurora", accent:"#00C9A7", green:"#FFD166", bg:"#0A1628", card:"#142035" },
  { name:"Sunset", accent:"#FF6B6B", green:"#FFE66D", bg:"#1A0A0A", card:"#2A1010" },
  { name:"Forest", accent:"#2ECC71", green:"#F39C12", bg:"#0A1A0F", card:"#102018" },
  { name:"Ocean",  accent:"#3498DB", green:"#1ABC9C", bg:"#0A0F1A", card:"#101828" },
  { name:"Rose",   accent:"#E91E8C", green:"#00E5FF", bg:"#1A0A14", card:"#28101E" },
];

function AdminTheme({ t, refresh }) {
  const th = window._wmm.theme;
  const [accent, setAccent] = useState(th.accent);
  const [green, setGreen]   = useState(th.green);
  const [bg, setBg]         = useState(th.bg);
  const [card, setCard]     = useState(th.card);
  const [saved, setSaved]   = useState(false);

  function applyPreset(p) { setAccent(p.accent); setGreen(p.green); setBg(p.bg); setCard(p.card); }
  function save() {
    Object.assign(window._wmm.theme, {
      accent, accentLight: accent + "CC",
      green, bg, card,
      border: card + "FF",
    });
    window._wmm.theme.accentLight = accent;
    window._wmm.theme.border = "#" + (parseInt(card.slice(1), 16) + 0x101010).toString(16).padStart(6,"0");
    setSaved(true); refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const colorRow = (label, val, set) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
      <input type="color" value={val} onChange={e => set(e.target.value)} style={{ width:44, height:44, borderRadius:10, border:"none", cursor:"pointer", background:"none" }} />
      <div>
        <div style={{ color:t.text, fontSize:13, fontWeight:600 }}>{label}</div>
        <div style={{ color:t.muted, fontSize:11 }}>{val}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"8px 0 20px" }}>
      <AdminCard t={t}>
        <AdminLabel t={t}>Thèmes prédéfinis</AdminLabel>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)} style={{
              padding:"8px 14px", borderRadius:20,
              background:p.accent + "22", border:`1px solid ${p.accent}66`,
              color:p.accent, fontSize:12, fontWeight:700, cursor:"pointer",
            }}>{p.name}</button>
          ))}
        </div>
      </AdminCard>
      <AdminCard t={t}>
        <AdminLabel t={t}>Couleurs personnalisées</AdminLabel>
        {colorRow("Couleur principale (accent)", accent, setAccent)}
        {colorRow("Couleur succès / meilleure date", green, setGreen)}
        {colorRow("Fond de l'application", bg, setBg)}
        {colorRow("Fond des cartes", card, setCard)}
      </AdminCard>
      <div style={{ padding:"0 16px" }}>
        <SaveBtn onClick={save} t={t} label={saved ? "✓ Appliqué !" : "Appliquer le thème"} />
      </div>
    </div>
  );
}

function AdminUsers({ t, refresh }) {
  const [newName, setNewName]     = useState("");
  const [resetTarget, setResetTarget] = useState(null); // user being reset
  const [resetPw, setResetPw]     = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetMsg, setResetMsg]   = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [, rerender] = useState(0);
  const re = () => { rerender(n=>n+1); refresh(); };

  function addUser() {
    const n = newName.trim();
    if (!n || window._wmm.users.includes(n)) return;
    window._wmm.users.push(n);
    setNewName(""); re();
  }

  function removeUser(u) {
    window._wmm.users = window._wmm.users.filter(x => x !== u);
    delete window._wmm.passwords[u];
    Object.keys(window._wmm.availability).forEach(d => {
      window._wmm.availability[d] = window._wmm.availability[d].filter(x => x !== u);
    });
    if (resetTarget === u) { setResetTarget(null); setShowReset(false); }
    re();
  }

  function openReset(u) {
    setResetTarget(u);
    setResetPw(""); setResetConfirm(""); setResetMsg(null);
    setShowReset(true);
  }

  function applyReset() {
    if (!resetPw) { setResetMsg({ ok: false, text: "Saisis un nouveau mot de passe." }); return; }
    if (resetPw !== resetConfirm) { setResetMsg({ ok: false, text: "Les mots de passe ne correspondent pas." }); return; }
    window._wmm.passwords[resetTarget] = resetPw;
    setResetMsg({ ok: true, text: `Mot de passe de ${resetTarget} mis à jour !` });
    setResetPw(""); setResetConfirm("");
    setTimeout(() => { setShowReset(false); setResetTarget(null); setResetMsg(null); }, 2000);
  }

  function clearPassword(u) {
    delete window._wmm.passwords[u];
    setResetMsg({ ok: true, text: `Mot de passe de ${u} supprimé.` });
    setTimeout(() => setResetMsg(null), 2000);
    re();
  }

  const pwInput = (val, set, placeholder) => (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <input
        type="password"
        value={val}
        onChange={e => { set(e.target.value); setResetMsg(null); }}
        placeholder={placeholder}
        style={{ width:"100%", padding:"11px 14px", borderRadius:12, background:t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:14, outline:"none" }}
      />
    </div>
  );

  return (
    <div style={{ padding:"8px 0 20px" }}>
      {/* Add member */}
      <AdminCard t={t}>
        <AdminLabel t={t}>Ajouter un membre</AdminLabel>
        <div style={{ display:"flex", gap:8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==="Enter" && addUser()}
            placeholder="Prénom ou pseudo" style={{ flex:1, padding:"11px 14px", borderRadius:12, background:t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:14, outline:"none" }} />
          <button onClick={addUser} style={{ padding:"11px 16px", borderRadius:12, background:t.accent, border:"none", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:18 }}>+</button>
        </div>
      </AdminCard>

      {/* Member list */}
      <AdminCard t={t}>
        <AdminLabel t={t}>{window._wmm.users.length} membre{window._wmm.users.length>1?"s":""}</AdminLabel>
        {window._wmm.users.map(u => {
          const hasPw = !!window._wmm.passwords[u];
          return (
            <div key={u}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${t.border}22` }}>
                {/* Avatar */}
                <div style={{ width:36, height:36, borderRadius:"50%", background:`${t.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", color:t.text, fontWeight:700, fontSize:15, flexShrink:0 }}>{u[0]}</div>
                {/* Name + pw status */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:t.text, fontSize:14, fontWeight:600 }}>{u}</div>
                  <div style={{ fontSize:11, color: hasPw ? t.green : t.muted }}>
                    {hasPw ? "🔒 Mot de passe défini" : "🔓 Sans mot de passe"}
                  </div>
                </div>
                {/* Reset btn */}
                <button
                  onClick={() => resetTarget === u && showReset ? setShowReset(false) : openReset(u)}
                  style={{ background:"none", border:`1px solid ${t.accent}55`, borderRadius:8, padding:"5px 9px", color:t.accent, fontSize:11, cursor:"pointer", fontWeight:600, flexShrink:0 }}
                  title="Réinitialiser le mot de passe"
                >🔑</button>
                {/* Remove btn */}
                <button onClick={() => removeUser(u)} style={{ background:"none", border:`1px solid ${t.danger}55`, borderRadius:8, padding:"5px 9px", color:t.danger, fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
              </div>

              {/* Inline reset panel */}
              {showReset && resetTarget === u && (
                <div style={{ margin:"8px 0 12px", padding:"14px", background:t.bg, borderRadius:12, border:`1px solid ${t.accent}33` }}>
                  <div style={{ color:t.text, fontWeight:600, fontSize:13, marginBottom:10 }}>
                    Nouveau mot de passe pour <span style={{color:t.accent}}>{u}</span>
                  </div>
                  {pwInput(resetPw, setResetPw, "Nouveau mot de passe")}
                  {pwInput(resetConfirm, setResetConfirm, "Confirmer")}
                  {resetMsg && (
                    <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:10, fontSize:12, fontWeight:600, background: resetMsg.ok ? `${t.green}18` : `${t.danger}18`, color: resetMsg.ok ? t.green : t.danger }}>
                      {resetMsg.text}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={applyReset} style={{ flex:1, padding:"10px", borderRadius:10, background:t.accent, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      ✓ Appliquer
                    </button>
                    {hasPw && (
                      <button onClick={() => clearPassword(u)} style={{ padding:"10px 12px", borderRadius:10, background:"none", border:`1px solid ${t.danger}55`, color:t.danger, fontSize:12, cursor:"pointer" }}>
                        🗑 Supprimer
                      </button>
                    )}
                    <button onClick={() => { setShowReset(false); setResetTarget(null); }} style={{ padding:"10px 12px", borderRadius:10, background:"none", border:`1px solid ${t.border}`, color:t.muted, fontSize:12, cursor:"pointer" }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </AdminCard>
    </div>
  );
}

function AdminAvail({ t, refresh }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [sel, setSel]     = useState(null);
  const [, rerender]      = useState(0);
  const re = () => { rerender(n=>n+1); refresh(); };
  const avail = window._wmm.availability;
  const users = window._wmm.users;
  const days  = getDays(year, month);
  const first = getFirst(year, month);

  function toggleUserOnDay(dateStr, user) {
    if (!avail[dateStr]) avail[dateStr] = [];
    const idx = avail[dateStr].indexOf(user);
    if (idx===-1) avail[dateStr].push(user);
    else avail[dateStr].splice(idx, 1);
    re();
  }
  function clearDay(dateStr) { avail[dateStr] = []; re(); }

  function prevM() { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); setSel(null); }
  function nextM() { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); setSel(null); }

  return (
    <div style={{ padding:"8px 0 20px" }}>
      <AdminCard t={t}>
        <AdminLabel t={t}>Calendrier admin — cliquez un jour puis modifiez</AdminLabel>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <button onClick={prevM} style={{ background:"none", border:"none", color:t.muted, fontSize:22, cursor:"pointer", padding:"2px 8px" }}>‹</button>
          <span style={{ color:t.text, fontWeight:700, fontSize:15 }}>{MONTHS[month]} {year}</span>
          <button onClick={nextM} style={{ background:"none", border:"none", color:t.muted, fontSize:22, cursor:"pointer", padding:"2px 8px" }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
          {DAYS_FR.map((d,i) => <div key={i} style={{ textAlign:"center", color:t.muted, fontSize:10, fontWeight:600 }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {Array(first).fill(null).map((_,i) => <div key={"e"+i} />)}
          {Array.from({length:days},(_,i)=>i+1).map(d => {
            const ds = fmtDate(year,month,d);
            const count = (avail[ds]||[]).length;
            const isSel = sel===ds;
            return (
              <button key={d} onClick={() => setSel(isSel ? null : ds)} style={{
                aspectRatio:"1", borderRadius:8,
                background: count>0 ? heatColor(count, users.length, t) : t.bg,
                border: isSel ? `2px solid ${t.accent}` : `2px solid ${t.border}33`,
                cursor:"pointer", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
              }}>
                <span style={{ color:t.text, fontSize:11 }}>{d}</span>
                {count>0 && <span style={{ fontSize:8, color:"#fff", fontWeight:700 }}>{count}</span>}
              </button>
            );
          })}
        </div>
      </AdminCard>

      {sel && (
        <AdminCard t={t}>
          <AdminLabel t={t}>{new Date(sel+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</AdminLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {users.map(u => {
              const checked = (avail[sel]||[]).includes(u);
              return (
                <button key={u} onClick={() => toggleUserOnDay(sel, u)} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px", borderRadius:12,
                  background: checked ? `${t.green}18` : t.bg,
                  border: `1px solid ${checked ? t.green+"66" : t.border}`,
                  cursor:"pointer",
                }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:`${t.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", color:t.text, fontWeight:700, fontSize:13 }}>{u[0]}</div>
                  <span style={{ color:t.text, fontSize:14, flex:1 }}>{u}</span>
                  <div style={{ width:24, height:24, borderRadius:6, background: checked ? t.green : t.bg, border:`2px solid ${checked ? t.green : t.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {checked && <span style={{ color:"#000", fontSize:13, fontWeight:800 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => clearDay(sel)} style={{ marginTop:12, width:"100%", padding:"10px", borderRadius:12, background:"none", border:`1px solid ${t.danger}55`, color:t.danger, fontSize:13, cursor:"pointer" }}>
            🗑 Effacer toutes les dispos de ce jour
          </button>
        </AdminCard>
      )}
    </div>
  );
}

function AdminSecurity({ t, refresh }) {
  const [cur, setCur]   = useState("");
  const [np, setNp]     = useState("");
  const [conf, setConf] = useState("");
  const [msg, setMsg]   = useState(null);

  function save() {
    if (cur !== window._wmm.adminPassword) { setMsg({ok:false, text:"Mot de passe actuel incorrect"}); return; }
    if (np.length < 4) { setMsg({ok:false, text:"Le nouveau mot de passe doit faire au moins 4 caractères"}); return; }
    if (np !== conf) { setMsg({ok:false, text:"Les mots de passe ne correspondent pas"}); return; }
    window._wmm.adminPassword = np;
    setCur(""); setNp(""); setConf("");
    setMsg({ok:true, text:"Mot de passe modifié avec succès !"});
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div style={{ padding:"8px 0 20px" }}>
      <AdminCard t={t}>
        <AdminLabel t={t}>Changer le mot de passe admin</AdminLabel>
        {[
          ["Mot de passe actuel", cur, setCur],
          ["Nouveau mot de passe", np, setNp],
          ["Confirmer le nouveau", conf, setConf],
        ].map(([label, val, set]) => (
          <div key={label} style={{ marginBottom:12 }}>
            <div style={{ color:t.muted, fontSize:12, marginBottom:6 }}>{label}</div>
            <input type="password" value={val} onChange={e => set(e.target.value)}
              style={{ width:"100%", padding:"11px 14px", borderRadius:12, background:t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:14, outline:"none" }} />
          </div>
        ))}
        {msg && <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:8, background: msg.ok ? `${t.green}18` : `${t.danger}18`, color: msg.ok ? t.green : t.danger, fontSize:13 }}>{msg.text}</div>}
        <SaveBtn onClick={save} t={t} label="Changer le mot de passe" />
      </AdminCard>
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab({ currentUser }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSel] = useState(null);
  const [, rerender]      = useState(0);
  const avail = window._wmm.availability;
  const users = window._wmm.users;
  const t = C();
  const days  = getDays(year, month);
  const first = getFirst(year, month);

  function toggleDay(ds) {
    if (!avail[ds]) avail[ds] = [];
    const idx = avail[ds].indexOf(currentUser);
    if (idx===-1) avail[ds].push(currentUser); else avail[ds].splice(idx, 1);
    setSel(ds); rerender(n=>n+1);
  }
  function prevM() { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); setSel(null); }
  function nextM() { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); setSel(null); }

  let bestDate=null, bestCount=0;
  for (let d=1; d<=days; d++) {
    const k = fmtDate(year,month,d);
    const c = (avail[k]||[]).length;
    if (c>bestCount) { bestCount=c; bestDate=k; }
  }
  const selPeople = selected ? (avail[selected]||[]) : [];

  return (
    <div style={{ padding:"0 0 16px" }}>
      {bestDate && bestCount>1 && (
        <div style={{ margin:"12px 16px", padding:"12px 16px", background:`${t.green}11`, border:`1px solid ${t.green}44`, borderRadius:14, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{fontSize:22}}>🏆</span>
          <div>
            <div style={{color:t.green, fontWeight:700, fontSize:13}}>Meilleure date ce mois</div>
            <div style={{color:t.text, fontSize:15, fontWeight:600}}>{new Date(bestDate+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
            <div style={{color:t.muted, fontSize:12}}>{bestCount} personne{bestCount>1?"s":""} disponible{bestCount>1?"s":""}</div>
          </div>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 20px 4px"}}>
        <button onClick={prevM} style={{background:"none",border:"none",cursor:"pointer",color:t.muted,fontSize:22,padding:"4px 12px"}}>‹</button>
        <span style={{color:t.text,fontWeight:700,fontSize:17,fontFamily:"Syne,sans-serif"}}>{MONTHS[month]} {year}</span>
        <button onClick={nextM} style={{background:"none",border:"none",cursor:"pointer",color:t.muted,fontSize:22,padding:"4px 12px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"8px 12px 4px",gap:2}}>
        {DAYS_FR.map((d,i) => <div key={i} style={{textAlign:"center",color:t.muted,fontSize:11,fontWeight:600}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 12px",gap:4}}>
        {Array(first).fill(null).map((_,i)=><div key={"e"+i}/>)}
        {Array.from({length:days},(_,i)=>i+1).map(d => {
          const ds = fmtDate(year,month,d);
          const people = avail[ds]||[];
          const count = people.length;
          const isMe = people.includes(currentUser);
          const isSel = selected===ds;
          const isToday = ds===fmtDate(now.getFullYear(),now.getMonth(),now.getDate());
          return (
            <button key={d} onClick={() => toggleDay(ds)} style={{
              aspectRatio:"1", borderRadius:10,
              border: isSel ? `2px solid ${t.accent}` : isToday ? `2px solid ${t.accent}44` : "2px solid transparent",
              background: heatColor(count, users.length, t),
              cursor:"pointer", display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", position:"relative", transition:"transform 0.1s",
            }}>
              <span style={{color:count>0?t.text:t.muted,fontSize:13,fontWeight:isToday?800:500}}>{d}</span>
              {count>0 && <span style={{fontSize:9,color:count>=users.length*0.75?t.green:t.accentLight,fontWeight:700}}>{count}/{users.length}</span>}
              {isMe && <span style={{position:"absolute",top:2,right:3,width:5,height:5,borderRadius:"50%",background:t.green}}/>}
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",gap:10,padding:"12px 16px 4px",flexWrap:"wrap"}}>
        {[{c:t.accent+"44",l:"Peu"},{c:t.accent+"88",l:"Quelques"},{c:t.accent,l:"Beaucoup"},{c:t.green,l:"Tous !"}].map(({c,l})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:12,height:12,borderRadius:3,background:c}}/>
            <span style={{color:t.muted,fontSize:11}}>{l}</span>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:t.green}}/>
          <span style={{color:t.muted,fontSize:11}}>Vous</span>
        </div>
      </div>
      {selected && (
        <div style={{margin:"12px 16px 0",padding:"14px 16px",background:t.card,borderRadius:14,border:`1px solid ${t.border}`}}>
          <div style={{color:t.text,fontWeight:700,marginBottom:8,fontSize:14}}>
            {new Date(selected+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
          </div>
          {selPeople.length===0
            ? <div style={{color:t.muted,fontSize:13}}>Personne — appuie pour te marquer disponible !</div>
            : <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {selPeople.map(p => (
                  <span key={p} style={{padding:"4px 10px",borderRadius:20,background:p===currentUser?`${t.green}22`:`${t.accent}22`,color:p===currentUser?t.green:t.accentLight,fontSize:12,fontWeight:600,border:`1px solid ${p===currentUser?t.green:t.accent}44`}}>{p}</span>
                ))}
              </div>
          }
          <div style={{marginTop:8,color:t.muted,fontSize:12}}>Appuie pour basculer ta disponibilité</div>
        </div>
      )}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab({ currentUser }) {
  const [input, setInput] = useState("");
  const [, rerender] = useState(0);
  const bottomRef = useRef(null);
  const t = C();
  const msgs = window._wmm.messages;

  function send() {
    const text = input.trim(); if (!text) return;
    const now = new Date();
    msgs.push({ id: window._wmm.nextMsgId++, user: currentUser, text, time:`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}` });
    setInput(""); rerender(n=>n+1);
    setTimeout(() => bottomRef.current?.scrollIntoView({behavior:"smooth"}), 50);
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, []);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
        {msgs.map(m => {
          const isMe = m.user===currentUser;
          return (
            <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
              {!isMe && <span style={{color:t.muted,fontSize:11,marginBottom:2,marginLeft:4}}>{m.user}</span>}
              <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isMe?t.accent:t.card,color:t.text,fontSize:14,lineHeight:1.4,border:isMe?"none":`1px solid ${t.border}`}}>
                {m.text}
              </div>
              <span style={{color:t.muted,fontSize:10,marginTop:2,marginLeft:4,marginRight:4}}>{m.time}</span>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"10px 16px 16px",borderTop:`1px solid ${t.border}`,display:"flex",gap:8,background:t.bg}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Message..." style={{flex:1,padding:"11px 14px",borderRadius:24,border:`1px solid ${t.border}`,background:t.card,color:t.text,fontSize:14,outline:"none"}}/>
        <button onClick={send} style={{width:44,height:44,borderRadius:"50%",background:t.accent,border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff"}}>↑</button>
      </div>
    </div>
  );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────
function FriendsTab() {
  const t = C();
  const avail = window._wmm.availability;
  const users = window._wmm.users;
  const counts = {};
  users.forEach(u => { counts[u]=0; });
  Object.values(avail).forEach(p => p.forEach(u => { if (counts[u]!==undefined) counts[u]++; }));
  const shared = Object.entries(avail).map(([d,p])=>({date:d,people:p,count:p.length})).filter(x=>x.count>1).sort((a,b)=>b.count-a.count).slice(0,6);

  return (
    <div style={{padding:"12px 16px"}}>
      <div style={{color:t.text,fontWeight:700,fontSize:16,marginBottom:12,fontFamily:"Syne,sans-serif"}}>Membres du groupe</div>
      {users.map(u => (
        <div key={u} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:8,background:t.card,borderRadius:14,border:`1px solid ${t.border}`}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:`${t.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",color:t.text,fontWeight:700,fontSize:16,flexShrink:0}}>{u[0]}</div>
          <div style={{flex:1}}>
            <div style={{color:t.text,fontWeight:600,fontSize:14}}>{u}</div>
            <div style={{color:t.muted,fontSize:12}}>{counts[u]} jour{counts[u]!==1?"s":""} marqué{counts[u]!==1?"s":""}</div>
          </div>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${t.green}22`,display:"flex",alignItems:"center",justifyContent:"center",color:t.green,fontWeight:700,fontSize:13}}>{counts[u]}</div>
        </div>
      ))}
      <div style={{color:t.text,fontWeight:700,fontSize:16,margin:"20px 0 12px",fontFamily:"Syne,sans-serif"}}>🔥 Top dates communes</div>
      {shared.length===0
        ? <div style={{color:t.muted,fontSize:13}}>Pas encore de dates communes !</div>
        : shared.map(({date,people,count}) => (
          <div key={date} style={{padding:"12px 14px",marginBottom:8,background:t.card,borderRadius:14,border:`1px solid ${count===users.length?t.green+"66":t.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{color:t.text,fontWeight:600,fontSize:14}}>{new Date(date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}</span>
              <span style={{padding:"3px 10px",borderRadius:20,background:count===users.length?`${t.green}22`:`${t.accent}22`,color:count===users.length?t.green:t.accentLight,fontSize:12,fontWeight:700}}>{count}/{users.length}</span>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {people.map(p => <span key={p} style={{padding:"2px 8px",borderRadius:12,background:`${t.accent}15`,color:t.muted,fontSize:11}}>{p}</span>)}
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── User App ─────────────────────────────────────────────────────────────────
function UserApp({ currentUser, onLogout }) {
  const [tab, setTab] = useState("calendar");
  const [, rerender]  = useState(0);
  const t = C();

  const tabs = [
    {id:"calendar",icon:"📅",label:"Calendrier"},
    {id:"chat",    icon:"💬",label:"Chat"},
    {id:"friends", icon:"👥",label:"Amis"},
  ];

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"Inter,sans-serif",display:"flex",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:430,minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative"}}>
        <div style={{padding:"14px 20px 11px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:t.bg,position:"sticky",top:0,zIndex:10}}>
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,letterSpacing:-0.5,color:t.text}}>
              {window._wmm.appName.split("").map((ch,i)=>(
                <span key={i} style={{color: i < Math.floor(window._wmm.appName.length/2) ? t.text : t.accent}}>{ch}</span>
              ))}
            </div>
            <div style={{color:t.muted,fontSize:11}}>{window._wmm.appSubtitle}</div>
          </div>
          <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:t.card,border:`1px solid ${t.border}`,borderRadius:20,cursor:"pointer",color:t.text,fontSize:13,fontWeight:600}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{currentUser[0]}</div>
            {currentUser}
          </button>
        </div>
        <div style={{flex:1,overflowY:tab==="chat"?"hidden":"auto",display:"flex",flexDirection:"column"}}>
          {tab==="calendar" && <CalendarTab currentUser={currentUser}/>}
          {tab==="chat"     && <ChatTab currentUser={currentUser}/>}
          {tab==="friends"  && <FriendsTab/>}
        </div>
        <div style={{display:"flex",borderTop:`1px solid ${t.border}`,background:t.bg,position:"sticky",bottom:0,zIndex:10}}>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{flex:1,padding:"12px 0 14px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,borderTop:tab===tb.id?`2px solid ${t.accent}`:"2px solid transparent",marginTop:-1}}>
              <span style={{fontSize:20}}>{tb.icon}</span>
              <span style={{fontSize:10,fontWeight:600,color:tab===tb.id?t.accentLight:t.muted}}>{tb.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash"); // splash | user | admin
  const [currentUser, setCurrentUser] = useState(null);
  const [, rerender] = useState(0);

  function handleEnter(mode, user) {
    if (mode === "admin") { setScreen("admin"); setCurrentUser(null); }
    else { setCurrentUser(user); setScreen("user"); }
  }

  if (screen === "splash") return <SplashScreen onEnter={handleEnter} />;
  if (screen === "admin")  return <AdminPanel onExit={() => setScreen("splash")} forceRefresh={() => rerender(n=>n+1)} />;
  return <UserApp currentUser={currentUser} onLogout={() => setScreen("splash")} />;
}
