"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ensureUserId } from "@/lib/user-id";

const STATES_UT = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu","Delhi (NCT)",
  "Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const OCCUPATIONS_GROUPED = [
  { group:"Agriculture & Allied", items:[
    "Marginal Farmer (< 1 hectare)","Small Farmer (1–2 hectares)",
    "Medium / Large Farmer (> 2 hectares)","Tenant Farmer / Sharecropper",
    "Agricultural Labourer","Fisherman / Fisher Folk",
    "Animal Husbandry / Dairy Farmer","Horticulture / Plantation Farmer",
  ]},
  { group:"Labour & Unorganised Sector", items:[
    "Construction Worker / Mason / Plumber","MGNREGA / Rural Job Card Worker",
    "Beedi / Cigar / Tobacco Worker","Mine / Quarry Worker",
    "Domestic Worker / Household Help","Sanitation / Safai Karamchari",
    "Street Vendor / Hawker / Thela","Auto / Taxi / Rickshaw Driver",
    "Loading / Unloading Worker","Daily Wage Labourer (General)",
  ]},
  { group:"Artisan & Self-Employed", items:[
    "Weaver / Handloom Worker","Artisan / Craftsman (Pottery/Woodwork)",
    "Cobbler / Leather Worker","Blacksmith / Goldsmith","Barber / Nai",
    "Tailor / Darzi","Washerman / Dhobi","Micro Entrepreneur (< ₹5L/yr)",
    "Small Business Owner","Street Food Vendor / Cook",
  ]},
  { group:"Service & Government", items:[
    "Government Employee (Class III / IV / MTS)","Government Employee (Gazetted Officer)",
    "Private Sector Employee (Formal)","Contractual / Outsourced Employee",
    "Teacher (Govt School)","Anganwadi Worker / Helper","ASHA / Health Worker",
    "Nurse / Paramedic / Lab Technician","Armed Forces (Active Duty)","Ex-Serviceman / Veteran",
  ]},
  { group:"Students & Others", items:[
    "School Student (Class 1–8)","School Student (Class 9–12 / Intermediate)",
    "ITI / Vocational Training Student","Polytechnic / Diploma Student",
    "Graduate / Post-Graduate Student","Professional Course Student (MBBS / Law / MBA)",
    "Unemployed (Seeking Work)","Homemaker / Housewife",
    "Retired (Drawing Pension)","Senior Citizen (Not Working)",
    "Person with Disability (Not Working)",
  ]},
];

const EDUCATION = [
  "No Formal Education / Illiterate","Literate (No schooling)",
  "Primary (Class 1–5)","Upper Primary (Class 6–8)",
  "Secondary / Matric (Class 10 Pass)","Higher Secondary / Intermediate (Class 12)",
  "ITI / National Trade Certificate","Diploma (Polytechnic / Other)",
  "Graduate — Arts / Science / Commerce","Graduate — Engineering (B.E./B.Tech)",
  "Graduate — Medical (MBBS/BDS)","Graduate — Law (LLB)","Graduate — Agriculture (B.Sc Agri)",
  "Post Graduate (MA/M.Sc/M.Com/MBA)","Post Graduate — Engineering","Post Graduate — Medical",
  "Ph.D / Doctorate",
];

const CATEGORIES_GOV = [
  "General / Unreserved",
  "SC — Scheduled Caste",
  "ST — Scheduled Tribe",
  "OBC — Other Backward Class (Central List)",
  "OBC — Other Backward Class (State List)",
  "EWS — Economically Weaker Section",
  "DNT — De-notified / Nomadic Tribe",
  "Minority — Muslim","Minority — Christian","Minority — Sikh",
  "Minority — Buddhist","Minority — Parsi","Minority — Jain",
];

const RATION_CARD = [
  "None / Not Applicable",
  "AAY — Antyodaya Anna Yojana (Poorest of Poor)",
  "BPL — Below Poverty Line",
  "PHH — Priority Household",
  "APL — Above Poverty Line",
  "NPHH — Non-Priority Household",
];

const HOUSE_TYPE = [
  "Pucca — Brick / Concrete / RCC",
  "Semi-Pucca — Partial brick with mud/thatch roof",
  "Kutcha — Mud / Bamboo / Thatch",
  "No House — Open / Footpath / Homeless",
  "Rented Accommodation","Living with relatives / others",
];

const LAND_TYPES = [
  "Irrigated — Canal / Well / Borewell water available",
  "Rain-fed / Dryland — Dependent on monsoon",
  "Horticulture / Plantation / Orchard",
  "Degraded / Wasteland being reclaimed",
  "Forest Land with Patta (Tribal Rights)",
  "Leased / Tenant / Sharecropping land",
];

const DISABILITY_TYPES = [
  "Locomotor Disability (Orthopaedic)","Visual Impairment — Low Vision",
  "Visual Impairment — Blind (Total)","Hearing Impairment — Hard of Hearing",
  "Hearing Impairment — Deaf (Total)","Speech & Language Disability",
  "Intellectual Disability / Mental Retardation",
  "Specific Learning Disability (Dyslexia etc.)",
  "Mental Illness / Psychiatric Disability","Autism Spectrum Disorder",
  "Chronic Neurological Conditions (Parkinson / MS / MND)",
  "Multiple Sclerosis","Blood Disorder — Thalassemia",
  "Blood Disorder — Haemophilia","Blood Disorder — Sickle Cell",
  "Acid Attack Victim","Dwarfism","Leprosy Cured Person","Multiple Disabilities",
];

const STEPS = [
  { id:1, label:"Personal",  icon:"👤", desc:"Basic identity details" },
  { id:2, label:"Location",  icon:"📍", desc:"State, district, contact" },
  { id:3, label:"Economic",  icon:"💰", desc:"Occupation & income" },
  { id:4, label:"Assets",    icon:"🏠", desc:"Housing & entitlements" },
  { id:5, label:"Special",   icon:"📋", desc:"Disability & review" },
];

interface PF {
  full_name:string; dob:string; age:string; gender:string;
  marital_status:string; religion:string; category:string;
  education:string; children_count:string; dependents_count:string;
  state:string; district:string; block:string; village_town:string;
  pincode:string; mobile:string; aadhaar_last4:string;
  occupation:string; monthly_income:string; annual_income:string;
  income_source:string; ration_card:string; bank_account:string;
  house_type:string; has_electricity:boolean; has_toilet:boolean;
  has_drinking_water:boolean;
  has_land:boolean; land_acres:string; land_type:string;
  enrolled_pmjay:boolean; has_pmjdy:boolean; has_kcc:boolean;
  is_exserviceman:boolean; is_student:boolean; is_senior:boolean;
  is_pregnant:boolean; is_widow:boolean; is_minority:boolean;
  bpl:boolean; disabled:boolean; disability_type:string; disability_pct:string;
}

const EMPTY:PF = {
  full_name:"",dob:"",age:"",gender:"Male",marital_status:"Unmarried / Single",
  religion:"",category:"",education:"",children_count:"0",dependents_count:"1",
  state:"",district:"",block:"",village_town:"",pincode:"",mobile:"",aadhaar_last4:"",
  occupation:"",monthly_income:"",annual_income:"",income_source:"",
  ration_card:"None / Not Applicable",bank_account:"",
  house_type:"",has_electricity:false,has_toilet:false,has_drinking_water:false,
  has_land:false,land_acres:"",land_type:"",
  enrolled_pmjay:false,has_pmjdy:false,has_kcc:false,
  is_exserviceman:false,is_student:false,is_senior:false,
  is_pregnant:false,is_widow:false,is_minority:false,
  bpl:false,disabled:false,disability_type:"",disability_pct:"",
};

function ageFromDOB(dob:string){
  if(!dob) return "";
  return String(Math.floor((Date.now()-new Date(dob).getTime())/(1000*60*60*24*365.25)));
}

function pct(f:PF){
  const checks=[f.full_name,f.dob||f.age,f.gender,f.category,f.state,
    f.district,f.mobile,f.occupation,f.annual_income,f.ration_card,f.education,f.house_type];
  return Math.round(checks.filter(Boolean).length/checks.length*100);
}

// map category to short for DB
function shortCat(c:string){
  if(c.startsWith("SC")) return "SC";
  if(c.startsWith("ST")) return "ST";
  if(c.startsWith("OBC")) return "OBC";
  if(c.startsWith("EWS")) return "EWS";
  if(c.startsWith("DNT")) return "ST";
  if(c.startsWith("Minority")) return "minority";
  return "General";
}

export default function ProfilePage(){
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState<PF>(EMPTY);
  const [loaded,  setLoaded]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [hasProf, setHasProf] = useState(false);
  const [errs,    setErrs]    = useState<Partial<Record<keyof PF,string>>>({});

  useEffect(()=>{
    ensureUserId();
    fetch("/api/profile").then(r=>r.json()).then(d=>{
      if(d.profile){
        const p=d.profile; const det=p.details?JSON.parse(p.details):{}; 
        setForm(f=>({...f,
          full_name:p.name||"",age:String(p.age||""),gender:p.gender||"Male",
          state:p.state||"",occupation:p.occupation||"",
          annual_income:String(p.income||""),monthly_income:p.income?String(Math.round(p.income/12)):"",
          category:p.category==="General"?"General / Unreserved":p.category||"",
          bpl:p.bpl||false,has_land:p.has_land||false,disabled:p.disabled||false,...det,
        }));
        setHasProf(true);
      }
    }).catch(()=>{}).finally(()=>setLoaded(true));
  },[]);

  function set<K extends keyof PF>(k:K,v:PF[K]){
    setForm(f=>{
      const n={...f,[k]:v};
      if(k==="dob") n.age=ageFromDOB(v as string);
      if(k==="monthly_income"&&v) n.annual_income=String(Number(v)*12);
      if(k==="annual_income"&&v)  n.monthly_income=String(Math.round(Number(v)/12));
      if(k==="ration_card"){
        const rv=v as string;
        n.bpl=rv.includes("AAY")||rv.includes("BPL");
        if(rv.includes("AAY")||rv.includes("BPL")) n.enrolled_pmjay=true;
      }
      if(k==="marital_status"&&v==="Widowed") n.is_widow=true;
      if(k==="bank_account"&&String(v).includes("Jan Dhan")) n.has_pmjdy=true;
      if(k==="age"&&Number(v)>=60) n.is_senior=true;
      return n;
    });
    setErrs(e=>({...e,[k]:undefined}));
  }

  function validate(){
    const e:Partial<Record<keyof PF,string>>={};
    if(step===1){
      if(!form.full_name.trim()) e.full_name="Full name required";
      if(!form.dob&&!form.age)   e.dob="Date of birth or age required";
      if(!form.category)         e.category="Category required";
    }
    if(step===2){
      if(!form.state)    e.state="State required";
      if(!form.district) e.district="District required";
      if(form.mobile&&!/^\d{10}$/.test(form.mobile)) e.mobile="Enter valid 10-digit number";
    }
    if(step===3){
      if(!form.occupation)    e.occupation="Occupation required";
      if(!form.annual_income) e.annual_income="Income required (enter 0 if none)";
    }
    setErrs(e);
    return Object.keys(e).length===0;
  }

  function next(){ if(validate()) setStep(s=>Math.min(5,s+1)); window.scrollTo(0,0); }
  function prev(){ setStep(s=>Math.max(1,s-1)); window.scrollTo(0,0); }

  async function save(){
    if(!validate()) return;
    setSaving(true);
    const details={
      dob:form.dob,marital_status:form.marital_status,religion:form.religion,
      education:form.education,children_count:form.children_count,
      dependents_count:form.dependents_count,
      district:form.district,block:form.block,village_town:form.village_town,
      pincode:form.pincode,mobile:form.mobile,aadhaar_last4:form.aadhaar_last4,
      monthly_income:form.monthly_income,income_source:form.income_source,
      bank_account:form.bank_account,ration_card:form.ration_card,
      house_type:form.house_type,has_electricity:form.has_electricity,
      has_toilet:form.has_toilet,has_drinking_water:form.has_drinking_water,
      land_acres:form.land_acres,land_type:form.land_type,
      enrolled_pmjay:form.enrolled_pmjay,has_pmjdy:form.has_pmjdy,has_kcc:form.has_kcc,
      is_exserviceman:form.is_exserviceman,is_student:form.is_student,
      is_senior:form.is_senior,is_pregnant:form.is_pregnant,
      is_widow:form.is_widow,is_minority:form.is_minority,
      disability_type:form.disability_type,disability_pct:form.disability_pct,
    };
    try{
      const payload={
        name:form.full_name,age:Number(form.age)||0,gender:form.gender,
        state:form.state,occupation:form.occupation,
        income:Number(form.annual_income)||0,
        category:shortCat(form.category),
        bpl:form.bpl,has_land:form.has_land,disabled:form.disabled,
        details:JSON.stringify(details),
      };

      const res = await fetch("/api/profile",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
      });
      if(!res.ok) throw new Error("save_failed");

      if(typeof window!=="undefined"){
        localStorage.setItem("yojana_profile_cache", JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent("yojana_profile_updated", { detail: payload }));
      }

      setHasProf(true); setDone(true);
    }catch{/**/}
    setSaving(false);
  }

  const completion=pct(form);

  if(!loaded) return(
    <><Header/>
    <main><div style={{textAlign:"center",padding:"56px 16px"}}>
      <div style={{width:36,height:36,border:"3px solid #002366",borderTopColor:"transparent",
        borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/>
      <div style={{color:"#6b7a99",marginTop:14,fontSize:14}}>Loading profile...</div>
    </div></main><Footer/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  if(done) return(
    <><Header/>
    <main style={{background:"#f0f4f8"}}>
      <div style={{maxWidth:1400,width:"100%",margin:"0 auto",padding:"14px 10px 8px",textAlign:"center"}}>
        <div style={{background:"#fff",border:"1px solid #d0d9e8",borderRadius:8,padding:"48px 32px"}}>
          <div style={{fontSize:64,marginBottom:16}}>✅</div>
          <div style={{fontSize:22,fontWeight:800,color:"#002366",marginBottom:8}}>Profile Saved Successfully!</div>
          <div style={{fontSize:14,color:"#556080",marginBottom:8}}>
            नमस्ते <strong>{form.full_name.split(" ")[0]}</strong> — your profile is saved.
          </div>
          <div style={{background:"#f0f4ff",border:"1px solid #c8d4f0",borderRadius:6,
            padding:"12px 20px",display:"inline-block",marginBottom:28,fontSize:13,color:"#2d3a5a"}}>
            {form.occupation} · {form.state} · {shortCat(form.category)}
            {form.bpl?" · BPL":""}
            {form.has_land?" · Land Owner":""}
            {form.disabled?" · Divyang":""}
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <a href="/my-profile" style={{background:"#138808",color:"#fff",borderRadius:6,
              padding:"12px 28px",fontSize:14,fontWeight:700,textDecoration:"none"}}>
              👤 Open My Profile
            </a>
            <a href="/find" style={{background:"#002366",color:"#fff",borderRadius:6,
              padding:"12px 28px",fontSize:14,fontWeight:700,textDecoration:"none"}}>
              🔍 Find My Schemes
            </a>
            <a href="/chat" style={{background:"#fff",color:"#002366",border:"1.5px solid #002366",
              borderRadius:6,padding:"12px 28px",fontSize:14,fontWeight:700,textDecoration:"none"}}>
              💬 Ask AI
            </a>
          </div>
        </div>
      </div>
    </main><Footer/></>
  );

  return(
    <><Header/>
    <main style={{background:"#f0f4f8"}}>
      <div style={{maxWidth:1540,width:"100%",margin:"0 auto",padding:"8px 8px 8px"}}>

        {/* Page Header */}
        <div style={{background:"#002366",color:"#fff",borderRadius:"8px 8px 0 0",
          padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:2.5,opacity:0.65,marginBottom:4,textTransform:"uppercase"}}>
              Government of India · YojanaAI Citizen Portal
            </div>
            <div style={{fontSize:18,fontWeight:800}}>Citizen Profile Registration Form</div>
            <div style={{fontSize:11,opacity:0.7,marginTop:3}}>
              नागरिक प्रोफ़ाइल पंजीकरण — All fields help match you to more schemes
            </div>
          </div>
          {/* Completion donut */}
          <div style={{textAlign:"center",flexShrink:0}}>
            <svg width={64} height={64} viewBox="0 0 64 64">
              <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={5}/>
              <circle cx={32} cy={32} r={26} fill="none"
                stroke={completion>=80?"#4ade80":completion>=50?"#fbbf24":"#fb923c"}
                strokeWidth={5} strokeDasharray={`${completion*1.634} 163.4`}
                strokeLinecap="round" transform="rotate(-90 32 32)"/>
              <text x={32} y={37} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>{completion}%</text>
            </svg>
            <div style={{fontSize:9,opacity:0.6,marginTop:1}}>Complete</div>
          </div>
        </div>

        {/* Step tabs */}
        <div style={{background:"#fff",display:"flex",borderLeft:"1px solid #d0d9e8",borderRight:"1px solid #d0d9e8"}}>
          {STEPS.map(s=>(
            <button key={s.id} onClick={()=>setStep(s.id)} style={{
              flex:1,padding:"10px 4px",border:"none",cursor:"pointer",
              borderBottom:step===s.id?"3px solid #FF9933":"3px solid transparent",
              background:step===s.id?"#fffaf5":"#fff",
              color:step===s.id?"#002366":s.id<step?"#138808":"#8898aa",
              fontWeight:step===s.id?700:500,
              fontSize:11,transition:"all 0.15s",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
            }}>
              <span style={{fontSize:18}}>{s.id<step?"✅":s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Form body */}
        <div style={{background:"#fff",border:"1px solid #d0d9e8",borderTop:"none",
          borderRadius:"0 0 8px 8px",padding:"18px 16px 12px"}}>

          {/* STEP 1 — Personal */}
          {step===1&&<>
            <SH icon="👤" title="Personal Details" sub="व्यक्तिगत विवरण — As per Aadhaar / government records"/>
            <R2>
              <F label="Full Name (as per Aadhaar)" req err={errs.full_name}>
                <input className="gi" placeholder="e.g. RAMESH KUMAR SHARMA"
                  value={form.full_name} style={{textTransform:"uppercase"}}
                  onChange={e=>set("full_name",e.target.value.toUpperCase())}/>
              </F>
              <F label="Date of Birth" hint="Age auto-calculates" err={errs.dob}>
                <input className="gi" type="date" max={new Date().toISOString().split("T")[0]}
                  value={form.dob} onChange={e=>set("dob",e.target.value)}/>
              </F>
            </R2>
            <R3>
              <F label="Age (Years)" hint="Auto-filled from DOB">
                <input className="gi" type="number" min={0} max={120}
                  placeholder="35" value={form.age} onChange={e=>set("age",e.target.value)}/>
              </F>
              <F label="Gender" req>
                <select className="gi" value={form.gender} onChange={e=>set("gender",e.target.value)}>
                  {["Male","Female","Transgender / Third Gender"].map(g=><option key={g}>{g}</option>)}
                </select>
              </F>
              <F label="Marital Status">
                <select className="gi" value={form.marital_status} onChange={e=>set("marital_status",e.target.value)}>
                  {["Unmarried / Single","Married","Widowed","Divorced","Separated","Deserted"].map(m=><option key={m}>{m}</option>)}
                </select>
              </F>
            </R3>
            <R3>
              <F label="Social Category" req err={errs.category}>
                <select className="gi" value={form.category} onChange={e=>set("category",e.target.value)}>
                  <option value="">— Select —</option>
                  {CATEGORIES_GOV.map(c=><option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="Religion">
                <select className="gi" value={form.religion} onChange={e=>set("religion",e.target.value)}>
                  <option value="">— Select —</option>
                  {["Hindu","Muslim","Christian","Sikh","Buddhist","Jain","Zoroastrian","Other","Prefer not to say"].map(r=><option key={r}>{r}</option>)}
                </select>
              </F>
              <F label="Highest Education Qualification">
                <select className="gi" value={form.education} onChange={e=>set("education",e.target.value)}>
                  <option value="">— Select —</option>
                  {EDUCATION.map(e=><option key={e}>{e}</option>)}
                </select>
              </F>
            </R3>
            <R2>
              <F label="Number of Children / Sons-Daughters">
                <select className="gi" value={form.children_count} onChange={e=>set("children_count",e.target.value)}>
                  {["0","1","2","3","4","5","6 or more"].map(n=><option key={n}>{n}</option>)}
                </select>
              </F>
              <F label="Total Family Members (Dependents incl. self)">
                <select className="gi" value={form.dependents_count} onChange={e=>set("dependents_count",e.target.value)}>
                  {["1","2","3","4","5","6","7","8 or more"].map(n=><option key={n}>{n}</option>)}
                </select>
              </F>
            </R2>
            <IB>ℹ️ <strong>Privacy:</strong> All data is stored locally in SQLite on your device only. Never sent to external servers.</IB>
          </>}

          {/* STEP 2 — Location */}
          {step===2&&<>
            <SH icon="📍" title="Location & Contact Details" sub="स्थान एवं संपर्क विवरण"/>
            <R2>
              <F label="State / Union Territory" req err={errs.state}>
                <select className="gi" value={form.state} onChange={e=>set("state",e.target.value)}>
                  <option value="">— Select State / UT —</option>
                  {STATES_UT.map(s=><option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="District" req err={errs.district}>
                <input className="gi" placeholder="e.g. Pune / Varanasi / Mysuru"
                  value={form.district} onChange={e=>set("district",e.target.value)}/>
              </F>
            </R2>
            <R3>
              <F label="Block / Taluka / Tehsil">
                <input className="gi" placeholder="e.g. Haveli / Dehu Road"
                  value={form.block} onChange={e=>set("block",e.target.value)}/>
              </F>
              <F label="Village / Town / Ward">
                <input className="gi" placeholder="e.g. Wagholi / Sector 15"
                  value={form.village_town} onChange={e=>set("village_town",e.target.value)}/>
              </F>
              <F label="PIN Code">
                <input className="gi" placeholder="6-digit PIN" maxLength={6}
                  value={form.pincode} onChange={e=>set("pincode",e.target.value.replace(/\D/g,""))}/>
              </F>
            </R3>
            <R2>
              <F label="Mobile Number" err={errs.mobile}>
                <input className="gi" placeholder="10-digit mobile number" maxLength={10}
                  value={form.mobile} onChange={e=>set("mobile",e.target.value.replace(/\D/g,""))}/>
              </F>
              <F label="Aadhaar Last 4 Digits" hint="For cross-reference only — optional">
                <input className="gi" placeholder="XXXX" maxLength={4}
                  value={form.aadhaar_last4} onChange={e=>set("aadhaar_last4",e.target.value.replace(/\D/g,""))}/>
              </F>
            </R2>
            <SH icon="🏠" title="Housing Details" sub="आवास विवरण" style={{marginTop:20}}/>
            <R2>
              <F label="Type of House / Dwelling">
                <select className="gi" value={form.house_type} onChange={e=>set("house_type",e.target.value)}>
                  <option value="">— Select —</option>
                  {HOUSE_TYPE.map(h=><option key={h}>{h}</option>)}
                </select>
              </F>
              <div style={{display:"flex",flexDirection:"column",gap:8,justifyContent:"flex-end",paddingBottom:2}}>
                <TG label="Has Electricity Connection" value={form.has_electricity} onChange={v=>set("has_electricity",v)}/>
                <TG label="Has Toilet / Sanitation Facility" value={form.has_toilet} onChange={v=>set("has_toilet",v)}/>
                <TG label="Has Safe Drinking Water Access" value={form.has_drinking_water} onChange={v=>set("has_drinking_water",v)}/>
              </div>
            </R2>
          </>}

          {/* STEP 3 — Economic */}
          {step===3&&<>
            <SH icon="💰" title="Occupation & Economic Details" sub="व्यवसाय एवं आर्थिक विवरण"/>
            <F label="Occupation / Primary Profession" req err={errs.occupation} style={{marginBottom:16}}>
              <select className="gi" value={form.occupation} onChange={e=>set("occupation",e.target.value)}>
                <option value="">— Select your primary occupation —</option>
                {OCCUPATIONS_GROUPED.map(g=>(
                  <optgroup key={g.group} label={`── ${g.group} ──`}>
                    {g.items.map(i=><option key={i}>{i}</option>)}
                  </optgroup>
                ))}
              </select>
            </F>
            <R3>
              <F label="Monthly Income (₹)" hint="All sources combined">
                <input className="gi" type="number" min={0} placeholder="e.g. 8000"
                  value={form.monthly_income} onChange={e=>set("monthly_income",e.target.value)}/>
              </F>
              <F label="Annual Income (₹)" req err={errs.annual_income} hint="Auto-fills from monthly">
                <input className="gi" type="number" min={0} placeholder="e.g. 96000"
                  value={form.annual_income} onChange={e=>set("annual_income",e.target.value)}/>
              </F>
              <F label="Primary Source of Income">
                <select className="gi" value={form.income_source} onChange={e=>set("income_source",e.target.value)}>
                  <option value="">— Select —</option>
                  {["Agriculture / Farming","Daily Wages / Labour","Business / Trade",
                    "Government Salary / Job","Private Employment","Pension / PF",
                    "Remittance from family member","No Regular Income","Other"].map(s=><option key={s}>{s}</option>)}
                </select>
              </F>
            </R3>
            <R2>
              <F label="Ration Card Type" hint="BPL / AAY auto-detected">
                <select className="gi" value={form.ration_card} onChange={e=>set("ration_card",e.target.value)}>
                  {RATION_CARD.map(r=><option key={r}>{r}</option>)}
                </select>
                {form.bpl&&<div style={{fontSize:11,color:"#138808",marginTop:3}}>✓ BPL status auto-detected</div>}
              </F>
              <F label="Bank Account Type">
                <select className="gi" value={form.bank_account} onChange={e=>set("bank_account",e.target.value)}>
                  <option value="">— Select —</option>
                  {["Jan Dhan (PMJDY) Account","Regular Savings Account (Nationalised Bank)",
                    "Post Office Savings Account","Private Bank Account","No Bank Account"].map(b=><option key={b}>{b}</option>)}
                </select>
              </F>
            </R2>
            <div style={{margin:"8px 0 12px"}}>
              <TG label="Owns / Operates Agricultural Land" value={form.has_land} onChange={v=>set("has_land",v)} large/>
            </div>
            {form.has_land&&<R2>
              <F label="Total Land Area (Acres)">
                <input className="gi" type="number" min={0} step={0.1} placeholder="e.g. 2.5"
                  value={form.land_acres} onChange={e=>set("land_acres",e.target.value)}/>
              </F>
              <F label="Type of Agricultural Land">
                <select className="gi" value={form.land_type} onChange={e=>set("land_type",e.target.value)}>
                  <option value="">— Select —</option>
                  {LAND_TYPES.map(l=><option key={l}>{l}</option>)}
                </select>
              </F>
            </R2>}
            <IB>💡 <strong>Income note:</strong> Enter total household income (all earning members). Most schemes use annual household income as threshold (e.g. PM-KISAN: any income, Ayushman: SECC data, MUDRA: no limit).</IB>
          </>}

          {/* STEP 4 — Assets & Entitlements */}
          {step===4&&<>
            <SH icon="🏛️" title="Current Scheme Enrollments" sub="वर्तमान योजना नामांकन — Mark all that apply"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[
                {k:"enrolled_pmjay"  as const,label:"Ayushman Bharat PM-JAY Enrolled",icon:"🏥"},
                {k:"has_pmjdy"       as const,label:"Jan Dhan (PMJDY) Account Holder",icon:"🏦"},
                {k:"has_kcc"         as const,label:"Kisan Credit Card (KCC) Holder",icon:"💳"},
                {k:"is_exserviceman" as const,label:"Ex-Serviceman / Defence Family",icon:"🎖️"},
              ].map(({k,label,icon})=>(
                <div key={k} onClick={()=>set(k,!form[k])} style={{
                  display:"flex",alignItems:"center",gap:10,
                  border:`1.5px solid ${form[k]?"#002366":"#d0d9e8"}`,
                  background:form[k]?"#f0f4ff":"#fafbff",
                  borderRadius:6,padding:"12px 14px",cursor:"pointer",transition:"all 0.15s",
                }}>
                  <span style={{fontSize:20}}>{icon}</span>
                  <div style={{flex:1,fontSize:13,fontWeight:600,color:form[k]?"#002366":"#374567"}}>{label}</div>
                  <div style={{width:18,height:18,borderRadius:3,border:`2px solid ${form[k]?"#002366":"#aab4c8"}`,
                    background:form[k]?"#002366":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {form[k]&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
            <SH icon="🌸" title="Special Circumstances" sub="विशेष परिस्थितियाँ — Unlocks additional targeted schemes"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {k:"is_student"  as const,label:"Currently Enrolled as Student",icon:"🎓"},
                {k:"is_senior"   as const,label:"Senior Citizen (Age 60 or above)",icon:"👴"},
                {k:"is_pregnant" as const,label:"Pregnant / Lactating Mother",icon:"🤱"},
                {k:"is_widow"    as const,label:"Widow / Deserted / Destitute Woman",icon:"🙏"},
                {k:"is_minority" as const,label:"Minority Community Member",icon:"🕌"},
              ].map(({k,label,icon})=>(
                <div key={k} onClick={()=>set(k,!form[k])} style={{
                  display:"flex",alignItems:"center",gap:10,
                  border:`1.5px solid ${form[k]?"#FF9933":"#d0d9e8"}`,
                  background:form[k]?"#fffaf0":"#fafbff",
                  borderRadius:6,padding:"12px 14px",cursor:"pointer",transition:"all 0.15s",
                }}>
                  <span style={{fontSize:20}}>{icon}</span>
                  <div style={{flex:1,fontSize:13,fontWeight:600,color:form[k]?"#b45309":"#374567"}}>{label}</div>
                  <div style={{width:18,height:18,borderRadius:3,border:`2px solid ${form[k]?"#FF9933":"#aab4c8"}`,
                    background:form[k]?"#FF9933":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {form[k]&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* STEP 5 — Disability & Review */}
          {step===5&&<>
            <SH icon="♿" title="Disability Details (Divyangjan)" sub="दिव्यांगजन विवरण — Under Rights of Persons with Disabilities Act, 2016"/>
            <div style={{marginBottom:16}}>
              <TG label="Person with Disability (Divyangjan)" value={form.disabled} onChange={v=>set("disabled",v)} large/>
            </div>
            {form.disabled&&<R2>
              <F label="Type of Disability (RPWD Act 2016)">
                <select className="gi" value={form.disability_type} onChange={e=>set("disability_type",e.target.value)}>
                  <option value="">— Select disability type —</option>
                  {DISABILITY_TYPES.map(d=><option key={d}>{d}</option>)}
                </select>
              </F>
              <F label="Disability Percentage" hint="As per Disability Certificate">
                <select className="gi" value={form.disability_pct} onChange={e=>set("disability_pct",e.target.value)}>
                  <option value="">— Select —</option>
                  {["Less than 40% (Sub-threshold)","40–50%","51–60%","61–70%","71–80%","81–90%","91–100% (Severe)"].map(p=><option key={p}>{p}</option>)}
                </select>
              </F>
            </R2>}

            {/* Summary table */}
            <SH icon="📄" title="Profile Summary" sub="Review before saving — click any step tab to edit" style={{marginTop:24}}/>
            <div className="profile-summary-grid" style={{fontSize:13}}>
              {[
                ["Full Name",form.full_name||"—"],
                ["Age / Date of Birth",form.age?`${form.age} yrs${form.dob?` (${form.dob})`:""}`:form.dob||"—"],
                ["Gender",form.gender],["Marital Status",form.marital_status],
                ["Category",form.category||"—"],["Education",form.education||"—"],
                ["State",form.state||"—"],["District",form.district||"—"],
                ["Mobile",form.mobile||"—"],
                ["Occupation",form.occupation||"—"],
                ["Annual Income",form.annual_income?`₹${Number(form.annual_income).toLocaleString("en-IN")}/yr`:"—"],
                ["Ration Card",form.ration_card],["Bank Account",form.bank_account||"—"],
                ["Land",form.has_land?`Yes — ${form.land_acres||"?"} acres (${form.land_type||"type not set"})`:"No"],
                ["House Type",form.house_type||"—"],
                ["Electricity",form.has_electricity?"Yes":"No"],["Toilet",form.has_toilet?"Yes":"No"],
                ["BPL Status",form.bpl?"Yes — BPL Household":"No"],
                ["Disability",form.disabled?`Yes — ${form.disability_type||"type not specified"}`:"No"],
                ["Ayushman PM-JAY",form.enrolled_pmjay?"Enrolled":"Not enrolled"],
              ].map(([k,v],i)=>(
                <div key={String(k)} style={{
                  border:"1px solid #d0d9e8",
                  borderRadius:6,
                  background:i%2===0?"#f8fafd":"#fff",
                  padding:"10px 12px",
                  minHeight:72,
                  display:"flex",
                  flexDirection:"column",
                  justifyContent:"center",
                  gap:4,
                }}>
                  <div style={{color:"#6b7a99",fontSize:12,fontWeight:600,lineHeight:1.3}}>{k}</div>
                  <div style={{color:"#1a2340",fontWeight:600,fontSize:13,lineHeight:1.35,wordBreak:"break-word"}}>{v}</div>
                </div>
              ))}
            </div>
            <IB style={{marginTop:16}}>
              ✅ After saving, visit <strong>/find</strong> to see personalised scheme recommendations.
              Your profile will be auto-loaded — no re-entry needed.
            </IB>
          </>}

          {/* Nav buttons */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            marginTop:24,paddingTop:18,borderTop:"2px solid #f0f4f8"}}>
            <button onClick={prev} disabled={step===1} style={{
              padding:"9px 22px",borderRadius:4,border:"1.5px solid #d0d9e8",
              background:step===1?"#f8f9ff":"#fff",
              color:step===1?"#aab4c8":"#374567",
              fontSize:13,fontWeight:600,cursor:step===1?"not-allowed":"pointer",
            }}>← Previous</button>
            <span style={{fontSize:12,color:"#8898aa",fontWeight:600}}>Step {step} / {STEPS.length}</span>
            {step<5?(
              <button onClick={next} style={{padding:"9px 24px",borderRadius:4,border:"none",
                background:"#002366",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Next: {STEPS[step].label} →
              </button>
            ):(
              <button onClick={save} disabled={saving} style={{padding:"9px 24px",borderRadius:4,border:"none",
                background:saving?"#6b82a8":"#138808",color:"#fff",
                fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",
                display:"flex",alignItems:"center",gap:8}}>
                {saving?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",
                  borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                  animation:"spin 0.7s linear infinite"}}/> Saving...</>:"💾 Save Profile"}
              </button>
            )}
          </div>
        </div>

        {hasProf&&(
          <div style={{marginTop:8,display:"flex",gap:10,justifyContent:"center"}}>
            <a href="/find" style={{background:"#002366",color:"#fff",borderRadius:6,
              padding:"9px 20px",fontSize:13,fontWeight:700,textDecoration:"none"}}>🔍 Find My Schemes</a>
            <a href="/chat" style={{background:"#fff",color:"#002366",border:"1.5px solid #002366",
              borderRadius:6,padding:"9px 20px",fontSize:13,fontWeight:700,textDecoration:"none"}}>💬 Ask AI</a>
          </div>
        )}
      </div>
    </main>
    <Footer/>
    <style>{`
      .gi{width:100%;padding:8px 10px;border:1.5px solid #c8d0de;border-radius:4px;
        font-size:13px;color:#1a2340;background:#fff;outline:none;font-family:inherit;box-sizing:border-box;}
      .gi:focus{border-color:#002366;box-shadow:0 0 0 2px rgba(0,35,102,0.1);}
      .profile-summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
      @keyframes spin{to{transform:rotate(360deg)}}
      @media(max-width:1200px){
        .profile-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
      }
      @media(max-width:700px){
        .profile-summary-grid{grid-template-columns:1fr;}
      }
      @media(max-width:900px){
        .r2,.r3{grid-template-columns:1fr!important;}
      }
    `}</style>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SH({icon,title,sub,style:s}:{icon:string;title:string;sub:string;style?:React.CSSProperties}){
  return(<div style={{marginBottom:14,paddingBottom:10,borderBottom:"2px solid #f0f4f8",...s}}>
    <div style={{fontSize:14,fontWeight:700,color:"#002366"}}>{icon} {title}</div>
    <div style={{fontSize:11,color:"#8898aa",marginTop:2}}>{sub}</div>
  </div>);
}
function R2({children,style:s}:{children:React.ReactNode;style?:React.CSSProperties}){
  return <div className="r2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14,...s}}>{children}</div>;
}
function R3({children,style:s}:{children:React.ReactNode;style?:React.CSSProperties}){
  return <div className="r3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14,...s}}>{children}</div>;
}
function F({label,children,req,hint,err,style:s}:{label:string;children:React.ReactNode;req?:boolean;hint?:string;err?:string;style?:React.CSSProperties}){
  return(<div style={{display:"flex",flexDirection:"column",gap:3,...s}}>
    <label style={{fontSize:12,fontWeight:600,color:err?"#dc2626":"#4a5568"}}>
      {label}{req&&<span style={{color:"#dc2626",marginLeft:2}}>*</span>}
    </label>
    {children}
    {hint&&<div style={{fontSize:11,color:"#8898aa"}}>{hint}</div>}
    {err&&<div style={{fontSize:11,color:"#dc2626"}}>⚠ {err}</div>}
  </div>);
}
function TG({label,value,onChange,large}:{label:string;value:boolean;onChange:(v:boolean)=>void;large?:boolean}){
  return(<div onClick={()=>onChange(!value)} style={{
    display:"flex",alignItems:"center",gap:10,cursor:"pointer",
    padding:large?"11px 14px":"7px 12px",
    border:`1.5px solid ${value?"#002366":"#d0d9e8"}`,
    borderRadius:6,background:value?"#f0f4ff":"#fafbff",transition:"all 0.15s",userSelect:"none",
  }}>
    <div style={{width:38,height:20,borderRadius:10,background:value?"#002366":"#c8d0de",
      position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",
        top:2,left:value?20:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
    </div>
    <span style={{fontSize:large?14:13,fontWeight:600,color:value?"#002366":"#374567"}}>{label}</span>
  </div>);
}
function IB({children,style:s}:{children:React.ReactNode;style?:React.CSSProperties}){
  return(<div style={{background:"#f0f4ff",border:"1px solid #c8d4f0",borderLeft:"4px solid #002366",
    borderRadius:4,padding:"10px 14px",fontSize:12,color:"#2d3a5a",lineHeight:1.6,...s}}>{children}</div>);
}