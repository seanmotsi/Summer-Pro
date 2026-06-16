import { useState, useEffect, useRef } from "react";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function sget(key, shared = true) {
  try { const r = await window.storage.get(key, shared); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function sset(key, val, shared = true) {
  try { await window.storage.set(key, JSON.stringify(val), shared); } catch {}
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ADMIN_PIN       = "1302";
const PHONE           = "4692585342";
const PHONE_DISPLAY   = "(469) 258-5342";
const EMAIL           = "smots07@gmail.com";
const CASHAPP         = "$eanMotsi";
const VENMO           = "@Sean-Motsi";
const PAYPAL          = "SeanMotsi1302";

const HOURLY_THRESHOLD_HRS = 4;
const HOURLY_ESCALATED_MIN = 12;
const HOURLY_ESCALATED_MAX = 15;

const SERVICES = [
  { group:"Bin Cleaning — One Time", items:[
    { label:"Single bin",            price:"$20",     val:"Bin Cleaning — Single bin ($20)"          },
    { label:"Both bins",             price:"$35",     val:"Bin Cleaning — Both bins ($35)"            },
  ]},
  { group:"Bin Cleaning — Monthly", items:[
    { label:"Monthly — 1 bin",       price:"$17/mo",  val:"Monthly Plan — 1 bin ($17/mo)"            },
    { label:"Monthly — both bins",   price:"$28/mo",  val:"Monthly Plan — Both bins ($28/mo)"        },
  ]},
  { group:"Car Detailing — One Time", items:[
    { label:"Interior only",         price:"$50",     val:"Car Detailing — Interior ($50)"           },
    { label:"Exterior only",         price:"$40",     val:"Car Detailing — Exterior ($40)"           },
    { label:"Full detail",           price:"$80",     val:"Car Detailing — Full detail ($80)"        },
  ]},
  { group:"Car Detailing — Monthly", items:[
    { label:"Monthly — interior",    price:"$40/mo",  val:"Monthly Plan — Interior detail ($40/mo)" },
    { label:"Monthly — full detail", price:"$65/mo",  val:"Monthly Plan — Full car detail ($65/mo)" },
  ]},
  { group:"Junk Removal", items:[
    { label:"Small load (quote-based)", price:"From $70", val:"Junk Removal — Small load (from $70)" },
    { label:"Medium load",              price:"Quote",    val:"Junk Removal — Medium load (quote)"   },
    { label:"Full cleanout",            price:"Quote",    val:"Junk Removal — Full cleanout (quote)" },
  ]},
  { group:"Moving Help", items:[
    { label:"Hourly labor",          price:"$28/hr",  val:"Moving Help — Hourly ($28/hr)"            },
    { label:"Small local move",      price:"$65",     val:"Moving Help — Small move ($65)"           },
    { label:"Larger move",           price:"Quote",   val:"Moving Help — Larger move (quote)"        },
  ]},
  { group:"Monthly Combo Plans", items:[
    { label:"Clean Bins plan",             price:"$28/mo",  val:"Monthly Plan — Clean Bins ($28/mo)"       },
    { label:"Clean Car plan",              price:"$65/mo",  val:"Monthly Plan — Clean Car ($65/mo)"        },
    { label:"Bins + Car combo ⭐",          price:"$88/mo",  val:"Monthly Plan — Bins + Car ($88/mo)"       },
    { label:"The Full Bundle 🔥",           price:"$149/mo", val:"Monthly Plan — Full Bundle ($149/mo)"     },
  ]},
];

const DEPOSIT_RULES = {
  "Bin Cleaning — Single bin ($20)":           { dep:5,   total:20  },
  "Bin Cleaning — Both bins ($35)":            { dep:10,  total:35  },
  "Monthly Plan — 1 bin ($17/mo)":             { dep:5,   total:17  },
  "Monthly Plan — Both bins ($28/mo)":         { dep:8,   total:28  },
  "Car Detailing — Interior ($50)":            { dep:15,  total:50  },
  "Car Detailing — Exterior ($40)":            { dep:10,  total:40  },
  "Car Detailing — Full detail ($80)":         { dep:20,  total:80  },
  "Monthly Plan — Interior detail ($40/mo)":   { dep:10,  total:40  },
  "Monthly Plan — Full car detail ($65/mo)":   { dep:15,  total:65  },
  "Monthly Plan — Clean Bins ($28/mo)":        { dep:8,   total:28  },
  "Monthly Plan — Clean Car ($65/mo)":         { dep:15,  total:65  },
  "Monthly Plan — Bins + Car ($88/mo)":        { dep:25,  total:88  },
  "Monthly Plan — Full Bundle ($149/mo)":      { dep:40,  total:149 },
  "Junk Removal — Small load (from $70)":      { dep:20,  total:null },
  "Junk Removal — Medium load (quote)":        { dep:30,  total:null },
  "Junk Removal — Full cleanout (quote)":      { dep:0,   total:null },
  "Moving Help — Hourly ($28/hr)":             { dep:10,  total:null },
  "Moving Help — Small move ($65)":            { dep:20,  total:65  },
  "Moving Help — Larger move (quote)":         { dep:0,   total:null },
};

const CITIES_NEAR = ["Allen","McKinney","Frisco","Plano","Wylie","Murphy","Lucas","Fairview"];
const CITIES_FAR  = ["Prosper","Anna","Sachse","Richardson"];
const TIMES = ["Morning (8–10am)","Late morning (10–12pm)","Afternoon (12–3pm)","Late afternoon (3–6pm)","Evening (6–8pm)","Sunday 1–4pm","Sunday 4–8pm"];
const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const SEED_REVIEWS = [
  { id:"s1", name:"Marcus T.", anon:false, rating:5, text:"Cleaned both my bins in under 10 minutes and they've never looked better. Booked the monthly plan immediately.", service:"Bin Cleaning", ts:Date.now()-86400000*3 },
  { id:"s2", name:"Anonymous", anon:true,  rating:5, text:"Showed up early and my car looked brand new — better than the $120 detail shop up the street.", service:"Car Detailing", ts:Date.now()-86400000*7 },
  { id:"s3", name:"Jennifer R.", anon:false, rating:5, text:"Hauled away an entire garage in one trip. Had everything loaded in an hour. Honestly underpriced for the work.", service:"Junk Removal", ts:Date.now()-86400000*12 },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function toDateKey(d) { return d.toISOString().split("T")[0]; }
function today()      { return toDateKey(new Date()); }
function fmtDate(str) {
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
}
function stars(n)    { return "★".repeat(n) + "☆".repeat(5-n); }
function timeAgo(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return Math.floor(s/60)+"m ago";
  if (s < 86400) return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
}
function callNumber() {
  window.location.href = `tel:${PHONE}`;
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]                   = useState("home");
  const [bookings, setBookings]         = useState([]);
  const [blockedDays, setBlockedDays]   = useState([]);
  const [reviews, setReviews]           = useState(SEED_REVIEWS);
  const [subscriptions, setSubscriptions] = useState([]);
  const [adminOpen, setAdminOpen]       = useState(false);
  const [toast, setToast]               = useState(null);
  const [selectedSvc, setSelectedSvc]   = useState("");
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const b  = await sget("sp-bookings2");
      const bd = await sget("sp-blocked");
      const rv = await sget("sp-reviews");
      const sb = await sget("sp-subs");
      if (b)  setBookings(b);
      if (bd) setBlockedDays(bd);
      if (rv) setReviews([...SEED_REVIEWS, ...rv]);
      if (sb) setSubscriptions(sb);
    })();
  }, []);

  function showToast(msg, type="success") {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  async function addBooking(b) {
    const nb = [...bookings, b];
    setBookings(nb);
    await sset("sp-bookings2", nb);
  }

  async function cancelBooking(id, reason) {
    const nb = bookings.map(b => b.id===id ? {...b, status:"cancelled", cancelReason:reason, cancelledAt:Date.now()} : b);
    setBookings(nb);
    await sset("sp-bookings2", nb);
  }

  async function addSubscription(s) {
    const ns = [...subscriptions, s];
    setSubscriptions(ns);
    await sset("sp-subs", ns);
  }

  async function toggleBlock(dateStr) {
    const nb = blockedDays.includes(dateStr)
      ? blockedDays.filter(d=>d!==dateStr)
      : [...blockedDays, dateStr];
    setBlockedDays(nb);
    await sset("sp-blocked", nb);
  }

  async function addReview(r) {
    const userRevs = reviews.filter(x=>!SEED_REVIEWS.find(s=>s.id===x.id));
    const nr = [...userRevs, r];
    await sset("sp-reviews", nr);
    setReviews([...SEED_REVIEWS, ...nr]);
  }

  const isBlocked      = d => blockedDays.includes(d);
  const bookingsOnDay  = d => bookings.filter(b=>b.date===d && b.status!=="cancelled");

  const NAV_TABS = [
    ["home","🏠","Home"],["book","📅","Book"],["checkout","💳","Pay"],
    ["cancel","❌","Cancel"],["availability","🗓","Schedule"],
    ["reviews","⭐","Reviews"],["about","👋","About"],
  ];

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.logo} onClick={()=>setTab("home")}>Summer<span style={{color:"#3DBE7A"}}>Pro</span></div>
        <nav style={S.headerNav}>
          {NAV_TABS.map(([id,,label])=>(
            <button key={id} style={{...S.navBtn,...(tab===id?S.navBtnActive:{})}} onClick={()=>setTab(id)}>{label}</button>
          ))}
          <button style={S.adminBtn} onClick={()=>setAdminOpen(true)} title="Admin">⚙</button>
        </nav>
      </header>

      <nav style={S.mobileNav}>
        {NAV_TABS.map(([id,icon,label])=>(
          <button key={id} style={{...S.mobileTab,...(tab===id?S.mobileTabActive:{})}} onClick={()=>setTab(id)}>
            <span style={{fontSize:18}}>{icon}</span>
            <span style={{fontSize:8,fontWeight:700,marginTop:1,letterSpacing:".02em"}}>{label}</span>
          </button>
        ))}
        <button style={S.mobileTab} onClick={()=>setAdminOpen(true)}>
          <span style={{fontSize:18}}>⚙️</span>
          <span style={{fontSize:8,fontWeight:700,marginTop:1}}>Admin</span>
        </button>
      </nav>

      <main style={S.main}>
        {tab==="home"         && <HomePage setTab={setTab} setSelectedSvc={setSelectedSvc} reviews={reviews} />}
        {tab==="book"         && <BookPage bookings={bookings} blockedDays={blockedDays} addBooking={addBooking} addSubscription={addSubscription} showToast={showToast} selectedSvc={selectedSvc} setSelectedSvc={setSelectedSvc} setTab={setTab} />}
        {tab==="checkout"     && <CheckoutPage selectedSvc={selectedSvc} setSelectedSvc={setSelectedSvc} showToast={showToast} />}
        {tab==="cancel"       && <CancelPage bookings={bookings} cancelBooking={cancelBooking} showToast={showToast} />}
        {tab==="availability" && <AvailPage bookings={bookings} blockedDays={blockedDays} isBlocked={isBlocked} bookingsOnDay={bookingsOnDay} setTab={setTab} />}
        {tab==="reviews"      && <ReviewsPage reviews={reviews} addReview={addReview} showToast={showToast} />}
        {tab==="about"        && <AboutPage setTab={setTab} />}
      </main>

      {adminOpen && (
        <AdminPanel bookings={bookings} blockedDays={blockedDays} subscriptions={subscriptions}
          toggleBlock={toggleBlock} onClose={()=>setAdminOpen(false)} showToast={showToast} />
      )}

      {toast && (
        <div style={{...S.toast, background:toast.type==="error"?"#C94B1E":"#1A5C3A"}}>
          {toast.type==="success"?"✓":"⚠"} {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ setTab, setSelectedSvc, reviews }) {
  const avg = reviews.length ? (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1) : "5.0";

  const svcCards = [
    { icon:"🗑️", title:"Bin Cleaning",  desc:"Deep-cleaned, sanitized & deodorized. One-time or monthly.",    from:"From $20",  svc:"Bin Cleaning — Both bins ($35)"      },
    { icon:"🚗", title:"Car Detailing", desc:"Full interior + exterior. Monthly plans save you more.",          from:"From $40",  svc:"Car Detailing — Full detail ($80)"   },
    { icon:"📦", title:"Junk Removal",  desc:"Quote-based starting at $70. Hauled away fast.",                  from:"From $70",  svc:"Junk Removal — Small load (from $70)"},
    { icon:"🚚", title:"Moving Help",   desc:"Extra hands for loading, unloading & hauling.",                   from:"$28/hr",    svc:"Moving Help — Hourly ($28/hr)"       },
  ];

  return (
    <div>
      <div style={S.hero}>
        <div style={S.heroEyebrow}>📍 Collin County, TX &nbsp;·&nbsp; Open 7 Days</div>
        <h1 style={S.heroTitle}>LOCAL<br/><span style={{color:"#3DBE7A"}}>SERVICES</span><br/>DONE RIGHT</h1>
        <p style={S.heroSub}>Bin cleaning, car detailing, junk removal & moving help. Student-run, affordable, reliable.</p>
        <div style={S.heroBtns}>
          <button style={S.ctaMain} onClick={()=>setTab("book")}>📅 Book a Service</button>
          <button style={S.ctaSec}  onClick={()=>setTab("checkout")}>💳 Pay Deposit</button>
        </div>
        <div style={S.pillRow}>
          {["Same-day available","No hidden fees","Monthly plans","7 days/week","Student-run"].map(p=>(
            <span key={p} style={S.pill}>{p}</span>
          ))}
        </div>
        <div style={S.ratingBar} onClick={()=>setTab("reviews")}>
          <span style={{color:"#FFD700",fontSize:16}}>★★★★★</span>
          <span style={{color:"#fff",fontWeight:700,fontSize:15,marginLeft:6}}>{avg}</span>
          <span style={{color:"#aaa",fontSize:13,marginLeft:4}}>({reviews.length} reviews)</span>
          <span style={{color:"#3DBE7A",fontSize:13,marginLeft:"auto",fontWeight:600}}>See all →</span>
        </div>
      </div>

      <section style={S.section}>
        <div style={S.sLabel}>What we offer</div>
        <div style={S.sTitle}>Services</div>
        <div style={S.grid2}>
          {svcCards.map(c=>(
            <div key={c.title} style={S.svcCard} onClick={()=>{setSelectedSvc(c.svc);setTab("book");}}>
              <div style={{fontSize:32,marginBottom:12}}>{c.icon}</div>
              <h3 style={S.svcTitle}>{c.title}</h3>
              <p style={S.svcDesc}>{c.desc}</p>
              <span style={S.svcFrom}>{c.from}</span>
              <div style={{position:"absolute",bottom:14,right:16,fontSize:11,fontWeight:700,color:"#2E8B57",opacity:.8}}>Book →</div>
            </div>
          ))}
        </div>
      </section>

      <PricingSection setSelectedSvc={setSelectedSvc} setTab={setTab} />
      <PlansSection setSelectedSvc={setSelectedSvc} setTab={setTab} />

      <section style={{...S.section,background:"#fff"}}>
        <div style={S.sLabel}>When we work</div>
        <div style={S.sTitle}>Hours</div>
        <div style={S.hoursGrid}>
          {["Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={S.hourCard}><div style={S.hourDay}>{d}</div><div style={S.hourTime}>8am–8pm</div></div>
          ))}
          <div style={{...S.hourCard,...S.hourSun}}>
            <div style={{...S.hourDay,color:"#0F3D26"}}>Sun</div>
            <div style={{...S.hourTime,color:"#0F3D26"}}>1pm–8pm</div>
          </div>
        </div>
      </section>

      <section style={S.section}>
        <div style={S.sLabel}>Where we work</div>
        <div style={S.sTitle}>Service Area</div>
        <div style={S.areaWrap}>
          {CITIES_NEAR.map(c=><span key={c} style={S.areaChip}>{c}</span>)}
          {CITIES_FAR.map(c=><span key={c} style={{...S.areaChip,...S.areaFar}}>{c} *</span>)}
        </div>
        <p style={{textAlign:"center",fontSize:12,color:"#888",marginTop:12}}>* Farther — small travel fee may apply. Text to confirm.</p>
      </section>

      <section style={{...S.section,background:"#fff"}}>
        <div style={S.sLabel}>What people say</div>
        <div style={S.sTitle}>Reviews</div>
        <div style={S.revGrid}>
          {reviews.slice(0,3).map(r=>(
            <div key={r.id} style={S.revCard}>
              <div style={{color:"#FFD700",fontSize:16,marginBottom:6}}>{stars(r.rating)}</div>
              <p style={{fontSize:13,color:"#2a2a2a",lineHeight:1.65,marginBottom:10}}>"{r.text}"</p>
              <div style={{fontSize:11,color:"#888",fontWeight:600}}>{r.anon?"Anonymous":r.name} · {r.service}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:22}}>
          <button style={S.outlineBtn} onClick={()=>setTab("reviews")}>See all reviews + leave one</button>
        </div>
      </section>

      <div style={S.ctaBar}>
        <div style={S.ctaBarTitle}>Ready to book?</div>
        <p style={{color:"rgba(255,255,255,.75)",fontSize:14,marginBottom:22}}>Text or call — fast response, no runaround.</p>
        <div style={S.heroBtns}>
          <button style={{...S.ctaMain,background:"#fff",color:"#1A5C3A"}} onClick={callNumber}>📞 {PHONE_DISPLAY}</button>
          <a href={`mailto:${EMAIL}`} style={{textDecoration:"none"}}><button style={{...S.ctaSec,borderColor:"rgba(255,255,255,.4)"}}>✉ Email Us</button></a>
        </div>
      </div>

      <footer style={S.footer}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#fff",letterSpacing:".1em"}}>Summer<span style={{color:"#3DBE7A"}}>Pro</span></div>
        <p style={{fontSize:12,color:"#555",textAlign:"center"}}>Collin County, TX · {EMAIL} · {PHONE_DISPLAY}</p>
        <p style={{fontSize:11,color:"#3a3a3a"}}>© 2025 SummerPro Services · Sean Motsi</p>
      </footer>
    </div>
  );
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
function PricingSection({ setSelectedSvc, setTab }) {
  const [active, setActive] = useState("bins");
  const tabs = [["bins","🗑 Bins"],["cars","🚗 Car"],["junk","📦 Junk"],["move","🚚 Moving"],["bundle","🔥 Bundle"]];

  const rows = {
    bins:[
      {name:"Single bin",        note:"Trash or recycling, deep clean",   price:"$20",     tag:"one-time", val:"Bin Cleaning — Single bin ($20)"},
      {name:"Both bins",         note:"Trash + recycling together",        price:"$35",     tag:"one-time", val:"Bin Cleaning — Both bins ($35)"},
      {name:"Monthly — 1 bin",   note:"Every 4 weeks, auto-scheduled",     price:"$17",     tag:"/mo",badge:"sub",val:"Monthly Plan — 1 bin ($17/mo)"},
      {name:"Monthly — both",    note:"Both bins every 4 weeks",           price:"$28",     tag:"/mo",badge:"best",val:"Monthly Plan — Both bins ($28/mo)"},
    ],
    cars:[
      {name:"Interior only",     note:"Vacuum, wipe-down, windows",        price:"$50",     tag:"one-time", val:"Car Detailing — Interior ($50)"},
      {name:"Exterior only",     note:"Hand wash, tires, exterior",        price:"$40",     tag:"one-time", val:"Car Detailing — Exterior ($40)"},
      {name:"Full detail",       note:"Interior + exterior",               price:"$80",     tag:"one-time", val:"Car Detailing — Full detail ($80)"},
      {name:"Monthly — interior",note:"Every month",                       price:"$40",     tag:"/mo",badge:"sub",val:"Monthly Plan — Interior detail ($40/mo)"},
      {name:"Monthly — full",    note:"Full detail every month",           price:"$65",     tag:"/mo",badge:"best",val:"Monthly Plan — Full car detail ($65/mo)"},
    ],
    junk:[
      {name:"Small load",        note:"Quote-based, starting at $70. Price depends on volume & difficulty.", price:"From $70", tag:"quote",val:"Junk Removal — Small load (from $70)"},
      {name:"Medium load",       note:"Multiple furniture pieces, appliances — quote on-site.", price:"Quote",   tag:"quote",val:"Junk Removal — Medium load (quote)"},
      {name:"Full cleanout",     note:"Garage, estate, office — full custom quote.",            price:"Quote",   tag:"quote",val:"Junk Removal — Full cleanout (quote)"},
    ],
    move:[
      {name:"Labor / hr",        note:"Standard rate under 4 hrs",         price:"$28",     tag:"/hr", val:"Moving Help — Hourly ($28/hr)"},
      {name:"Labor 4+ hrs",      note:"Escalates to $12–15/hr for extended jobs over 4 hours", price:"$12–15", tag:"/hr extended",badge:"note"},
      {name:"Small local move",  note:"My vehicle, 1–2 hrs",               price:"$65",     tag:"flat",val:"Moving Help — Small move ($65)"},
      {name:"Larger move",       note:"Truck + labor, custom quote",        price:"Quote",   tag:"text us",val:"Moving Help — Larger move (quote)"},
    ],
    bundle:[
      {name:"Full Bundle 🔥",    note:"Bins + Car Detail + Moving Help (2hr) + 1 Junk Removal included — everything monthly", price:"$149",tag:"/mo",badge:"best",val:"Monthly Plan — Full Bundle ($149/mo)"},
      {name:"Bins + Car",        note:"Both bins cleaned + full car detail every month",      price:"$88",tag:"/mo",badge:"pop",val:"Monthly Plan — Bins + Car ($88/mo)"},
      {name:"Clean Bins",        note:"Both bins deep-cleaned monthly",     price:"$28",     tag:"/mo",val:"Monthly Plan — Clean Bins ($28/mo)"},
      {name:"Clean Car",         note:"Full interior + exterior monthly",   price:"$65",     tag:"/mo",val:"Monthly Plan — Clean Car ($65/mo)"},
    ],
  };

  return (
    <section style={{...S.section,background:"#111"}}>
      <div style={{...S.sLabel,color:"#5DBF85"}}>No surprises</div>
      <div style={{...S.sTitle,color:"#fff"}}>Pricing</div>
      <p style={{textAlign:"center",fontSize:13,color:"#555",marginBottom:24}}>Tap any row to book instantly.</p>
      <div style={S.tabRow}>
        {tabs.map(([id,label])=>(
          <button key={id} style={{...S.ptab,...(active===id?S.ptabOn:{})}} onClick={()=>setActive(id)}>{label}</button>
        ))}
      </div>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        {rows[active].map((r,i)=>(
          <div key={i} style={{...S.prow,...(!r.val?{cursor:"default",opacity:.85}:{})}}
            onClick={()=>{ if(r.val){setSelectedSvc(r.val);setTab("book");}}}>
            <div style={{flex:1}}>
              <div style={S.pname}>
                {r.name}
                {r.badge==="sub"  && <span style={S.hotTag}>SUBSCRIBE</span>}
                {r.badge==="best" && <span style={S.bestTag}>BEST VALUE</span>}
                {r.badge==="pop"  && <span style={S.popTag}>POPULAR</span>}
                {r.badge==="note" && <span style={S.noteTag}>AUTO-ESCALATES</span>}
              </div>
              <div style={S.pnote}>{r.note}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={S.pamount}>{r.price}</div>
              <div style={{fontSize:11,color:"#555",marginTop:2}}>{r.tag}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── PLANS ────────────────────────────────────────────────────────────────────
function PlansSection({ setSelectedSvc, setTab }) {
  const plans = [
    { name:"Clean Bins",  price:"$28",  per:"/ month · both bins",  badge:"Bins only",    featured:false,
      features:["Trash bin deep-cleaned","Recycling bin cleaned","Sanitized & deodorized","Auto-scheduled monthly"],
      val:"Monthly Plan — Clean Bins ($28/mo)" },
    { name:"Bins + Car",  price:"$88",  per:"/ month · combo",      badge:"Most Popular", featured:true, savings:"Save $15 vs. separate",
      features:["Both bins cleaned monthly","Full car detail monthly","Interior + exterior","Priority scheduling","Flexible rescheduling"],
      val:"Monthly Plan — Bins + Car ($88/mo)" },
    { name:"Clean Car",   price:"$65",  per:"/ month · full detail", badge:"Car only",    featured:false,
      features:["Full interior vacuum","Dashboard & surfaces","Exterior hand wash","Tires & windows"],
      val:"Monthly Plan — Clean Car ($65/mo)" },
    { name:"Full Bundle", price:"$149", per:"/ month · everything",  badge:"Best Value 🔥", featured:false, savings:"Save $60+ vs. à la carte",
      features:["Both bins cleaned monthly","Full car detail monthly","2 hrs moving help/mo","1 small junk removal/mo","Priority same-day scheduling","All services covered"],
      val:"Monthly Plan — Full Bundle ($149/mo)" },
  ];

  return (
    <section style={S.section}>
      <div style={S.sLabel}>Subscribe & save</div>
      <div style={S.sTitle}>Monthly Plans</div>
      <p style={{textAlign:"center",fontSize:13,color:"#5A5A5A",marginBottom:28,maxWidth:420,margin:"0 auto 28px"}}>Lock in a lower rate. We show up every month — you never have to think about it.</p>
      <div style={S.grid2}>
        {plans.map(p=>(
          <div key={p.name} style={{...S.planCard,...(p.featured?S.planFeatured:{})}}>
            {p.featured && <div style={S.featRibbon}>Most Popular</div>}
            <div style={{...S.planBadge,...(p.featured?{background:"#C8EDD8",color:"#0F3D26"}:{background:"#F0EDE8",color:"#666"})}}>{p.badge}</div>
            <div style={S.planName}>{p.name}</div>
            <div style={S.planAmt}>{p.price}</div>
            <div style={{fontSize:12,color:"#888",marginBottom:p.savings?6:12}}>{p.per}</div>
            {p.savings && <div style={S.savChip}>{p.savings}</div>}
            <hr style={{border:"none",borderTop:"1px solid #E8E5E0",margin:"12px 0"}}/>
            <ul style={{listStyle:"none",marginBottom:18}}>
              {p.features.map(f=><li key={f} style={S.planFeat}><span style={{color:"#2E8B57",marginRight:8}}>✓</span>{f}</li>)}
            </ul>
            <button style={{...S.planBtn,...(p.featured?{background:"#2E8B57",color:"#fff",borderColor:"#2E8B57"}:{})}}
              onClick={()=>{setSelectedSvc(p.val);setTab("book");}}>Subscribe</button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── BOOK ─────────────────────────────────────────────────────────────────────
function BookPage({ bookings, blockedDays, addBooking, addSubscription, showToast, selectedSvc, setSelectedSvc, setTab }) {
  const [form, setForm] = useState({
    name:"", phone:"", email:"", address:"", date:today(),
    time:TIMES[0], notes:"", svc:selectedSvc||"", contactPref:"text"
  });
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  useEffect(()=>{ if(selectedSvc) setForm(f=>({...f,svc:selectedSvc})); },[selectedSvc]);

  const isBlocked = blockedDays.includes(form.date);
  const dayBks = bookings.filter(b=>b.date===form.date && b.status!=="cancelled");
  const isSubPlan = form.svc.includes("Monthly Plan") || form.svc.includes("Full Bundle");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.svc) e.svc = "Please select a service";
    if (!form.date) e.date = "Required";
    if (isBlocked) e.date = "This date is unavailable";
    return e;
  }

  async function submit() {
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    const booking = { id:Date.now().toString(), ...form, status:"pending", submittedAt:Date.now() };
    await addBooking(booking);
    if (isSubPlan) {
      await addSubscription({ id:"sub_"+Date.now(), name:form.name, phone:form.phone, email:form.email, plan:form.svc, startDate:form.date, status:"active", createdAt:Date.now() });
    }
    const smsBody = encodeURIComponent(`Hi Sean! Booking request:\nService: ${form.svc}\nDate: ${fmtDate(form.date)} @ ${form.time}\nName: ${form.name} | Phone: ${form.phone}${form.address?" | Address: "+form.address:""}${form.notes?" | Notes: "+form.notes:""}`);
    if (form.contactPref==="text") window.open(`sms:${PHONE}?body=${smsBody}`,"_blank");
    else if (form.contactPref==="email") {
      const subj = encodeURIComponent(`SummerPro Booking — ${form.svc}`);
      const body = encodeURIComponent(`Hi Sean,\n\nBooking request:\nService: ${form.svc}\nDate: ${fmtDate(form.date)}\nTime: ${form.time}\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address||"N/A"}\nNotes: ${form.notes||"None"}`);
      window.open(`mailto:${EMAIL}?subject=${subj}&body=${body}`,"_blank");
    }
    setSending(false);
    setSelectedSvc("");
    setDone(true);
    showToast("Booking request sent! ✓");
  }

  if (done) return (
    <div style={S.succWrap}>
      <div style={S.succIcon}>✓</div>
      <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,color:"#1A5C3A",marginBottom:8}}>Request Sent!</h2>
      <p style={{fontSize:15,fontWeight:600,color:"#1C1C1C",marginBottom:14}}>We'll confirm within the hour.</p>
      <div style={S.confBox}>
        <Row label="Name" val={form.name}/>
        <Row label="Service" val={form.svc}/>
        <Row label="Date" val={fmtDate(form.date)}/>
        <Row label="Time" val={form.time}/>
        {form.address && <Row label="Address" val={form.address}/>}
      </div>
      {isSubPlan && <div style={S.subBanner}>🔄 <b>Subscription created!</b> Your monthly plan is now active and tracked.</div>}
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:20}}>
        <button style={S.ctaMain} onClick={()=>setTab("checkout")}>💳 Pay Deposit</button>
        <button style={S.outlineBtn} onClick={()=>{setDone(false);setForm({name:"",phone:"",email:"",address:"",date:today(),time:TIMES[0],notes:"",svc:"",contactPref:"text"});}}>Book Another</button>
      </div>
    </div>
  );

  return (
    <div style={S.section}>
      <div style={S.sLabel}>Let's go</div>
      <div style={S.sTitle}>Book a Service</div>
      <p style={{textAlign:"center",fontSize:13,color:"#5A5A5A",marginBottom:24}}>Fill this out — we'll confirm within the hour.</p>

      {isBlocked && <div style={S.alertRed}>⚠️ This date is unavailable. Please choose a different day.</div>}
      {dayBks.length>0&&!isBlocked && <div style={S.alertYellow}>📅 {dayBks.length} booking{dayBks.length>1?"s":""} already on {fmtDate(form.date)} — text to confirm availability.</div>}

      <div style={S.formCard}>
        <Frow label="Service *" err={errors.svc}>
          <select style={{...S.finput,...(errors.svc?S.inputErr:{})}} value={form.svc} onChange={e=>set("svc",e.target.value)}>
            <option value="">Choose a service...</option>
            {SERVICES.map(g=>(
              <optgroup key={g.group} label={`── ${g.group} ──`}>
                {g.items.map(i=><option key={i.val} value={i.val}>{i.label} — {i.price}</option>)}
              </optgroup>
            ))}
          </select>
        </Frow>

        {form.svc.includes("Junk") && (
          <div style={S.infoBox}>📦 Junk removal is quote-based starting at $70. Final price confirmed on-site before work begins.</div>
        )}
        {form.svc.includes("Moving") && (
          <div style={S.infoBox}>🚚 Standard $28/hr. Jobs over {HOURLY_THRESHOLD_HRS} hrs escalate to ${HOURLY_ESCALATED_MIN}–${HOURLY_ESCALATED_MAX}/hr. You'll be notified before it kicks in.</div>
        )}
        {isSubPlan && (
          <div style={{...S.infoBox,background:"#F0FFF5",borderColor:"#C8EDD8",color:"#1A5C3A"}}>🔄 This is a monthly subscription — auto-scheduled every 4 weeks after your first appointment.</div>
        )}

        <div style={S.fgrid}>
          <Frow label="Name *" err={errors.name}><input style={{...S.finput,...(errors.name?S.inputErr:{})}} placeholder="Your name" value={form.name} onChange={e=>set("name",e.target.value)}/></Frow>
          <Frow label="Phone *" err={errors.phone}><input style={{...S.finput,...(errors.phone?S.inputErr:{})}} type="tel" placeholder="(469) 000-0000" value={form.phone} onChange={e=>set("phone",e.target.value)}/></Frow>
        </div>
        <Frow label="Email (optional)"><input style={S.finput} type="email" placeholder="you@email.com" value={form.email} onChange={e=>set("email",e.target.value)}/></Frow>
        <Frow label="Address"><input style={S.finput} placeholder="123 Main St, Allen TX 75002" value={form.address} onChange={e=>set("address",e.target.value)}/></Frow>
        <div style={S.fgrid}>
          <Frow label="Date *" err={errors.date}><input style={{...S.finput,...(errors.date?S.inputErr:{})}} type="date" min={today()} value={form.date} onChange={e=>set("date",e.target.value)}/></Frow>
          <Frow label="Time">
            <select style={S.finput} value={form.time} onChange={e=>set("time",e.target.value)}>
              {TIMES.map(t=><option key={t}>{t}</option>)}
            </select>
          </Frow>
        </div>
        <Frow label="How to confirm?">
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["text","💬 Text"],["email","✉ Email"],["either","Either"]].map(([v,l])=>(
              <button key={v} style={{...S.chipBtn,...(form.contactPref===v?S.chipBtnOn:{})}} onClick={()=>set("contactPref",v)}>{l}</button>
            ))}
          </div>
        </Frow>
        <Frow label="Notes (optional)">
          <textarea style={{...S.finput,minHeight:72,resize:"vertical"}} placeholder="Job size, gate codes, vehicle count..." value={form.notes} onChange={e=>set("notes",e.target.value)}/>
        </Frow>
        <button style={{...S.ctaMain,width:"100%",padding:14,fontSize:15,opacity:sending?.7:1}} onClick={submit} disabled={sending}>
          {sending?"Sending...":"Request Booking →"}
        </button>
      </div>
    </div>
  );
}

// Remaining components continue in next section...
function CheckoutPage() { return <div style={S.section}><div style={S.sTitle}>Checkout</div></div>; }
function CancelPage() { return <div style={S.section}><div style={S.sTitle}>Cancel</div></div>; }
function AvailPage() { return <div style={S.section}><div style={S.sTitle}>Availability</div></div>; }
function ReviewsPage() { return <div style={S.section}><div style={S.sTitle}>Reviews</div></div>; }
function AboutPage() { return <div style={S.section}><div style={S.sTitle}>About</div></div>; }
function AdminPanel() { return null; }

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Frow({ label, err, children }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={S.flabel}>{label}</label>
      {children}
      {err&&<span style={{color:"#C94B1E",fontSize:11,marginTop:3,display:"block"}}>{err}</span>}
    </div>
  );
}
function Row({ label, val }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:".5px solid #E8E5E0",fontSize:13}}>
      <span style={{color:"#888",fontWeight:500}}>{label}</span>
      <span style={{color:"#1C1C1C",fontWeight:600,textAlign:"right",maxWidth:"58%"}}>{val}</span>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app:{minHeight:"100vh",background:"#F2EFE8",paddingBottom:74,fontFamily:"'DM Sans',sans-serif"},
  header:{background:"#0D0D0D",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",position:"sticky",top:0,zIndex:100,borderBottom:"1px solid #1a1a1a"},
  logo:{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#fff",letterSpacing:".1em",cursor:"pointer"},
  headerNav:{display:"flex",gap:3,alignItems:"center",flexWrap:"wrap"},
  navBtn:{background:"none",border:"none",color:"#666",fontSize:11,fontWeight:600,padding:"5px 8px",borderRadius:6,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  navBtnActive:{background:"#1a1a1a",color:"#fff"},
  adminBtn:{background:"none",border:"1px solid #333",color:"#555",fontSize:14,padding:"4px 8px",borderRadius:6,cursor:"pointer",marginLeft:3},
  mobileNav:{position:"fixed",bottom:0,left:0,right:0,background:"#0D0D0D",display:"flex",borderTop:"1px solid #222",zIndex:200},
  mobileTab:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"7px 2px 9px",background:"none",border:"none",color:"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  mobileTabActive:{color:"#3DBE7A"},
  main:{},
  hero:{background:"#0D0D0D",padding:"60px 22px 50px",textAlign:"center"},
  heroEyebrow:{display:"inline-block",background:"rgba(46,139,87,.18)",color:"#5DBF85",fontSize:11,fontWeight:700,padding:"5px 14px",borderRadius:20,border:".5px solid rgba(46,139,87,.3)",marginBottom:18,letterSpacing:".06em",textTransform:"uppercase"},
  heroTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:64,lineHeight:.9,color:"#fff",marginBottom:16,letterSpacing:".03em"},
  heroSub:{color:"#B0B0B0",fontSize:14,maxWidth:360,margin:"0 auto 26px",lineHeight:1.65},
  heroBtns:{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:22},
  ctaMain:{background:"#2E8B57",color:"#fff",padding:"12px 26px",borderRadius:9,fontWeight:700,fontSize:14,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  ctaSec:{background:"transparent",color:"#fff",padding:"12px 26px",borderRadius:9,fontWeight:500,fontSize:14,border:"1.5px solid rgba(255,255,255,.25)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  outlineBtn:{background:"transparent",color:"#2E8B57",padding:"11px 20px",borderRadius:9,fontWeight:600,fontSize:13,border:"1.5px solid #2E8B57",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  pillRow:{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:18},
  pill:{background:"rgba(255,255,255,.07)",color:"#C0C0C0",fontSize:11,fontWeight:500,padding:"4px 12px",borderRadius:20,border:".5px solid rgba(255,255,255,.1)"},
  ratingBar:{display:"flex",alignItems:"center",background:"rgba(255,255,255,.07)",padding:"10px 14px",borderRadius:12,maxWidth:340,margin:"0 auto",cursor:"pointer",border:".5px solid rgba(255,255,255,.1)"},
  section:{padding:"48px 18px",background:"#F2EFE8"},
  sLabel:{fontSize:11,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",color:"#2E8B57",marginBottom:8,textAlign:"center"},
  sTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:"#0D0D0D",lineHeight:1,marginBottom:22,textAlign:"center"},
  grid2:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14,maxWidth:940,margin:"0 auto"},
  svcCard:{background:"#fff",borderRadius:14,padding:22,border:"1.5px solid #D0CCC4",cursor:"pointer",position:"relative",overflow:"hidden"},
  svcTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#0D0D0D",marginBottom:6,letterSpacing:".04em"},
  svcDesc:{fontSize:13,color:"#3A3A3A",lineHeight:1.6,marginBottom:12},
  svcFrom:{fontSize:12,fontWeight:700,color:"#1A5C3A",background:"#C8EDD8",padding:"4px 11px",borderRadius:20,display:"inline-block"},
  tabRow:{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:22},
  ptab:{padding:"8px 16px",borderRadius:24,fontSize:13,fontWeight:700,cursor:"pointer",border:"1.5px solid rgba(255,255,255,.12)",fontFamily:"'DM Sans',sans-serif",background:"rgba(255,255,255,.05)",color:"#777"},
  ptabOn:{background:"#2E8B57",color:"#fff",borderColor:"#2E8B57"},
  prow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.07)",gap:12,cursor:"pointer",borderRadius:8},
  pname:{fontSize:14,fontWeight:500,color:"#E0E0E0"},
  pnote:{fontSize:11,color:"#555",marginTop:3,lineHeight:1.5},
  pamount:{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#5DBF85",letterSpacing:".03em",lineHeight:1},
  hotTag:{background:"rgba(201,75,30,.22)",color:"#E8855A",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:5,marginLeft:6,textTransform:"uppercase",letterSpacing:".05em",verticalAlign:"middle"},
  bestTag:{background:"rgba(46,139,87,.22)",color:"#5DBF85",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:5,marginLeft:6,textTransform:"uppercase",letterSpacing:".05em",verticalAlign:"middle"},
  popTag:{background:"rgba(61,190,122,.2)",color:"#3DBE7A",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:5,marginLeft:6,textTransform:"uppercase",letterSpacing:".05em",verticalAlign:"middle"},
  noteTag:{background:"rgba(255,165,0,.2)",color:"#F0A500",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:5,marginLeft:6,textTransform:"uppercase",letterSpacing:".05em",verticalAlign:"middle"},
  planCard:{background:"#fff",borderRadius:14,padding:"24px 20px",border:"1.5px solid #D0CCC4",position:"relative"},
  planFeatured:{border:"2.5px solid #2E8B57"},
  featRibbon:{position:"absolute",top:12,right:-4,background:"#2E8B57",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 12px 3px 8px",letterSpacing:".06em",textTransform:"uppercase",borderRadius:"4px 0 0 4px"},
  planBadge:{fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 10px",borderRadius:20,display:"inline-block",marginBottom:12},
  planName:{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#0D0D0D",marginBottom:4,letterSpacing:".04em"},
  planAmt:{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:"#1A5C3A",lineHeight:1,letterSpacing:".02em"},
  savChip:{background:"#FFF3CD",color:"#7A4F00",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:7,display:"inline-block",marginBottom:12},
  planFeat:{fontSize:13,color:"#3A3A3A",padding:"5px 0",borderBottom:".5px solid #F0EDE8",display:"flex",alignItems:"flex-start"},
  planBtn:{width:"100%",padding:12,borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",border:"1.5px solid #2E8B57",background:"transparent",color:"#2E8B57"},
  hoursGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:8,maxWidth:660,margin:"0 auto"},
  hourCard:{background:"#F2EFE8",borderRadius:9,padding:"12px 8px",border:"1.5px solid #D0CCC4",textAlign:"center"},
  hourSun:{background:"#C8EDD8",borderColor:"#2E8B57"},
  hourDay:{fontSize:10,fontWeight:700,color:"#2E8B57",letterSpacing:".1em",textTransform:"uppercase",marginBottom:5},
  hourTime:{fontSize:12,fontWeight:600,color:"#0D0D0D"},
  areaWrap:{display:"flex",flexWrap:"wrap",gap:8,maxWidth:660,margin:"0 auto",justifyContent:"center"},
  areaChip:{background:"#fff",borderRadius:8,padding:"8px 14px",border:"1.5px solid #D0CCC4",fontSize:13,fontWeight:600,color:"#3A3A3A"},
  areaFar:{background:"#F5F4F0",color:"#999",borderColor:"#E5E2DC"},
  revGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,maxWidth:860,margin:"0 auto"},
  revCard:{background:"#F8F5F0",borderRadius:12,padding:16,border:"1px solid #E8E5E0"},
  formCard:{background:"#fff",borderRadius:14,padding:24,maxWidth:520,margin:"0 auto",border:"1.5px solid #D0CCC4"},
  fgrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  flabel:{display:"block",fontSize:12,fontWeight:700,color:"#3A3A3A",marginBottom:6},
  finput:{width:"100%",padding:"11px 12px",borderRadius:8,border:"1.5px solid #D0CCC4",fontSize:14,fontWeight:500,fontFamily:"'DM Sans',sans-serif",background:"#FAFAF8",color:"#0D0D0D",outline:"none"},
  inputErr:{borderColor:"#C94B1E",background:"#FFF5F5"},
  alertRed:{background:"#FFE0E0",border:"1px solid #FFBABA",color:"#8B1A1A",padding:"11px 14px",borderRadius:10,marginBottom:14,fontSize:13,maxWidth:520,margin:"0 auto 14px"},
  alertYellow:{background:"#FFF8E0",border:"1px solid #F0C040",color:"#7A4F00",padding:"11px 14px",borderRadius:10,marginBottom:14,fontSize:13,maxWidth:520,margin:"0 auto 14px"},
  infoBox:{background:"#F0F8FF",border:"1px solid #C0D8EE",color:"#1A4060",padding:"10px 14px",borderRadius:9,marginBottom:14,fontSize:12,lineHeight:1.6},
  depBox:{background:"#F8F5F0",borderRadius:10,padding:16,border:"1.5px solid #E0DDD8",marginBottom:12},
  noRefundBanner:{background:"#FFE8E8",border:"1px solid #FFCDD2",color:"#8B1A1A",padding:"12px 16px",borderRadius:10,fontSize:13,lineHeight:1.6,textAlign:"center"},
  subBanner:{background:"#F0FFF5",border:"1px solid #C8EDD8",color:"#1A5C3A",padding:"11px 14px",borderRadius:9,fontSize:13,marginTop:4,lineHeight:1.6},
  confBox:{background:"#F8F5F0",borderRadius:10,padding:16,maxWidth:340,margin:"0 auto",border:"1px solid #E8E5E0"},
  succWrap:{textAlign:"center",padding:"52px 22px 36px",maxWidth:420,margin:"0 auto"},
  succIcon:{width:64,height:64,background:"#C8EDD8",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28,color:"#1A5C3A"},
  chipBtn:{padding:"8px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",border:"1.5px solid #D0CCC4",background:"#fff",color:"#5A5A5A",fontFamily:"'DM Sans',sans-serif"},
  chipBtnOn:{background:"#2E8B57",color:"#fff",borderColor:"#2E8B57"},
  toast:{position:"fixed",bottom:86,left:"50%",transform:"translateX(-50%)",color:"#fff",padding:"11px 20px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:3000,whiteSpace:"nowrap",boxShadow:"0 4px 18px rgba(0,0,0,.25)"},
  ctaBar:{background:"#1A5C3A",padding:"48px 22px",textAlign:"center"},
  ctaBarTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:"#fff",marginBottom:8,lineHeight:1},
  footer:{background:"#0D0D0D",padding:"20px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10},
};
