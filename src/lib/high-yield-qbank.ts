// High-yield boards-style rapid-recall Q&A bank.
// Structured, typed items for test-prep "pure Q->A" feel — not full cases.
// Every question is board-relevant, specific, and has a crisp definitive answer.

export type QBankSubspecialty =
  | "Anterior Segment"
  | "Posterior Segment"
  | "Neuro-Ophthalmology and Orbit"
  | "Pediatric Ophthalmology"
  | "Optics"
  | "General";

export type QBankDifficulty = "core" | "intermediate" | "advanced";

export interface QBankItem {
  id: string;
  subspecialty: QBankSubspecialty;
  topic: string;
  difficulty: QBankDifficulty;
  question: string;
  answer: string;
  pearl?: string;
  mnemonic?: string;
  triggerKeywords: string[];
}

export const HIGH_YIELD_QBANK: QBankItem[] = [
  // ——————————— ANTERIOR SEGMENT (10) ———————————
  {
    id: "qb-001",
    subspecialty: "Anterior Segment",
    topic: "Acute angle-closure glaucoma",
    difficulty: "core",
    question:
      "A 62-year-old hyperope presents with a red, painful eye, mid-dilated pupil, IOP 58. After topical timolol, brimonidine, and dorzolamide, what is the next medical step and the definitive treatment?",
    answer:
      "Topical pilocarpine 1-2% (after IOP <40) + oral/IV acetazolamide 500 mg; consider hyperosmotics (mannitol 1-2 g/kg IV). Definitive treatment is laser peripheral iridotomy (LPI) once cornea clears; LPI the fellow eye prophylactically.",
    pearl:
      "Pilocarpine does not work when the iris sphincter is ischemic at very high IOP — lower pressure first, then miose.",
    mnemonic: "BAD-P: Beta-blocker, Alpha-agonist, Dorzolamide, Pilocarpine (after IOP drops)",
    triggerKeywords: ["angle closure", "iridotomy", "pilocarpine", "acute glaucoma"],
  },
  {
    id: "qb-002",
    subspecialty: "Anterior Segment",
    topic: "Bacterial keratitis",
    difficulty: "core",
    question:
      "A contact-lens wearer has a 3 mm central corneal infiltrate with hypopyon. What is first-line empiric therapy while cultures are pending?",
    answer:
      "Fortified vancomycin 25 mg/mL and fortified tobramycin 14 mg/mL (or ceftazidime 50 mg/mL) — alternate every 30-60 minutes around the clock. Moxifloxacin 0.5% monotherapy is acceptable for small, peripheral, non-vision-threatening ulcers.",
    pearl: "No steroids until organism identified and clinical improvement on antibiotics (per SCUT trial adjunctive data).",
    triggerKeywords: ["corneal ulcer", "keratitis", "fortified", "hypopyon", "contact lens"],
  },
  {
    id: "qb-003",
    subspecialty: "Anterior Segment",
    topic: "HSV epithelial keratitis",
    difficulty: "core",
    question:
      "A 35-year-old has a unilateral branching dendrite with terminal bulbs staining with fluorescein. Best first-line therapy?",
    answer:
      "Oral valacyclovir 500 mg TID x 7-10 days OR topical ganciclovir 0.15% gel 5x/day OR trifluridine 1% 9x/day. Avoid topical steroids in active epithelial disease.",
    pearl: "HEDS: oral acyclovir 400 mg BID reduces recurrence of stromal disease by ~50%.",
    triggerKeywords: ["HSV", "dendrite", "herpes simplex", "ganciclovir", "trifluridine"],
  },
  {
    id: "qb-004",
    subspecialty: "Anterior Segment",
    topic: "Fuchs endothelial dystrophy",
    difficulty: "intermediate",
    question:
      "What corneal pachymetry threshold and symptoms define the need for DMEK/DSAEK in Fuchs?",
    answer:
      "Visually significant edema with morning blur lasting >1-2 hours, pachymetry typically >640-650 μm, and/or BCVA <20/40 unresponsive to hypertonic saline (Muro 128). Combined cataract-DMEK if cataract coexists.",
    pearl: "DMEK has faster visual recovery and lower rejection rate than DSAEK.",
    triggerKeywords: ["Fuchs", "DMEK", "DSAEK", "endothelial dystrophy", "guttae"],
  },
  {
    id: "qb-005",
    subspecialty: "Anterior Segment",
    topic: "Pigment dispersion / Pigmentary glaucoma",
    difficulty: "intermediate",
    question:
      "A myopic 30-year-old man has Krukenberg spindle, iris transillumination defects, and heavy TM pigment. What IOP-lowering procedure can be considered when medical therapy is inadequate?",
    answer:
      "Selective laser trabeculoplasty (SLT) — responds well due to heavy pigment. Laser peripheral iridotomy is controversial (flattens iris concavity) but not standard first-line.",
    pearl: "Exercise-induced pigment showers can cause IOP spikes.",
    triggerKeywords: ["pigment dispersion", "Krukenberg", "pigmentary glaucoma", "SLT"],
  },
  {
    id: "qb-006",
    subspecialty: "Anterior Segment",
    topic: "Endophthalmitis — post-cataract",
    difficulty: "core",
    question:
      "Day 4 post-cataract, a patient has hand-motion vision, hypopyon, and vitritis. Per the EVS, what are the management thresholds?",
    answer:
      "Vision light-perception only: pars plana vitrectomy + intravitreal vancomycin 1 mg/0.1 mL + ceftazidime 2.25 mg/0.1 mL. Vision hand-motion or better: vitreous tap + intravitreal antibiotics alone. Systemic antibiotics do NOT improve outcomes in EVS.",
    pearl: "Most common organism: coagulase-negative Staphylococcus (S. epidermidis).",
    mnemonic: "LP = vitrectomy, HM or better = tap-and-inject",
    triggerKeywords: ["endophthalmitis", "EVS", "vancomycin", "ceftazidime", "hypopyon"],
  },
  {
    id: "qb-007",
    subspecialty: "Anterior Segment",
    topic: "Primary open-angle glaucoma",
    difficulty: "core",
    question:
      "Per the OHTS study, a 5% IOP reduction in an ocular hypertensive patient with a CCT of 520 μm reduces 5-year conversion risk to glaucoma by how much?",
    answer:
      "OHTS showed medical therapy to a ~20% IOP reduction cut 5-year conversion from ~9.5% to ~4.4% (about half). Thin CCT (<555 μm), older age, larger cup/disc, higher IOP, and higher PSD were key risk factors.",
    pearl: "CCT is the single strongest predictor of conversion in OHTS.",
    triggerKeywords: ["OHTS", "ocular hypertension", "glaucoma conversion", "central corneal thickness"],
  },
  {
    id: "qb-008",
    subspecialty: "Anterior Segment",
    topic: "Alkali chemical burn",
    difficulty: "core",
    question:
      "A patient arrives after lye splash. Vision HM, 4+ conjunctival blanching, hazy cornea. First five management steps?",
    answer:
      "(1) Copious irrigation with saline/LR until pH neutralizes (check pH 5 min after stopping), (2) sweep fornices for particles, (3) topical antibiotic + cycloplegic, (4) topical steroid for 7-10 days (then taper to prevent melt) + doxycycline + ascorbate (oral and topical), (5) consider amniotic membrane for limbal ischemia.",
    pearl: "Roper-Hall Grade IV = >50% limbal ischemia + total epithelial loss → poor prognosis, needs stem cell transplant consideration.",
    triggerKeywords: ["chemical burn", "alkali", "irrigation", "limbal ischemia", "Roper-Hall"],
  },
  {
    id: "qb-009",
    subspecialty: "Anterior Segment",
    topic: "Neovascular glaucoma",
    difficulty: "intermediate",
    question:
      "A patient with PDR presents with IOP 45 and neovascularization of the iris. What is the immediate and definitive treatment sequence?",
    answer:
      "Immediate: topical IOP-lowering drops + atropine + prednisolone. Definitive: urgent panretinal photocoagulation (PRP). Bridge with intravitreal anti-VEGF (bevacizumab 1.25 mg) to rapidly regress NVI while PRP takes effect. Glaucoma drainage device if angle is closed by synechiae.",
    pearl: "Anti-VEGF works within 48 hours; PRP prevents recurrence.",
    triggerKeywords: ["neovascular glaucoma", "NVI", "rubeosis", "PRP", "anti-VEGF"],
  },
  {
    id: "qb-010",
    subspecialty: "Anterior Segment",
    topic: "Phacoantigenic / lens-induced uveitis",
    difficulty: "advanced",
    question:
      "A patient has chronic granulomatous uveitis after cataract surgery 6 weeks ago with retained lens fragments. Most likely diagnosis and treatment?",
    answer:
      "Phacoantigenic (phacoanaphylactic) uveitis — zonal granulomatous inflammation around lens protein. Treatment: surgical removal of retained lens material (pars plana vitrectomy/lensectomy) + topical and systemic steroids.",
    pearl: "Medical therapy alone fails — you must remove the antigen.",
    triggerKeywords: ["phacoantigenic", "retained lens", "lens-induced uveitis", "phacoanaphylactic"],
  },

  // ——————————— POSTERIOR SEGMENT (10) ———————————
  {
    id: "qb-011",
    subspecialty: "Posterior Segment",
    topic: "Neovascular AMD",
    difficulty: "core",
    question:
      "Per the CATT trial, what was the visual outcome difference between monthly bevacizumab and ranibizumab at 2 years?",
    answer:
      "No clinically significant difference in visual acuity — both drugs equivalent on a monthly dosing schedule. PRN dosing had slightly worse anatomic outcomes but similar visual acuity. Geographic atrophy developed more with monthly therapy.",
    pearl: "Equivalence justifies bevacizumab (~$50) vs ranibizumab (~$2000) on cost grounds.",
    triggerKeywords: ["CATT", "bevacizumab", "ranibizumab", "AMD", "anti-VEGF"],
  },
  {
    id: "qb-012",
    subspecialty: "Posterior Segment",
    topic: "Diabetic macular edema",
    difficulty: "core",
    question:
      "In DRCR Protocol T, which anti-VEGF agent was superior for patients with baseline VA 20/50 or worse?",
    answer:
      "Aflibercept was superior to bevacizumab and ranibizumab at 1 year for worse baseline vision (VA ≤20/50); by 2 years, aflibercept and ranibizumab were similar, both better than bevacizumab. For VA ≥20/40 baseline, all three were equivalent.",
    pearl: "Worse baseline vision → use aflibercept.",
    triggerKeywords: ["DRCR", "Protocol T", "aflibercept", "diabetic macular edema", "DME"],
  },
  {
    id: "qb-013",
    subspecialty: "Posterior Segment",
    topic: "Retinal detachment — macula-on vs off",
    difficulty: "core",
    question:
      "Fresh rhegmatogenous retinal detachment with the macula ON in a 58-year-old. Urgency and timing?",
    answer:
      "Emergent repair within 24 hours — ideally the same day. Every hour of macular involvement worsens outcome. Positioning (head-down, inferior-dependent) can delay macular involvement pre-op. Macula-off RDs ideally repaired within 7 days to preserve cone function.",
    pearl: "Macula-on RD = surgical emergency; macula-off = urgent (within a week).",
    triggerKeywords: ["retinal detachment", "macula-on", "macula-off", "rhegmatogenous"],
  },
  {
    id: "qb-014",
    subspecialty: "Posterior Segment",
    topic: "CRAO",
    difficulty: "core",
    question:
      "A 70-year-old presents with sudden painless vision loss to count-fingers, cherry-red spot, and a box-carred retinal artery. What is the most important immediate systemic workup and disposition?",
    answer:
      "Treat as stroke equivalent: STAT referral to ED/stroke team, carotid Doppler, echocardiogram, ESR/CRP to rule out GCA. MRI brain with DWI — 25% have silent concurrent cerebral infarct. Tissue plasminogen activator within 4.5 hours at stroke centers is being investigated.",
    pearl: "CRAO = stroke until proven otherwise.",
    triggerKeywords: ["CRAO", "cherry-red spot", "artery occlusion", "stroke workup"],
  },
  {
    id: "qb-015",
    subspecialty: "Posterior Segment",
    topic: "Endophthalmitis — endogenous",
    difficulty: "advanced",
    question:
      "A diabetic patient has bilateral vitritis and subretinal abscess without recent surgery. Most likely etiology and first test?",
    answer:
      "Endogenous endophthalmitis — most commonly Candida albicans (fungal) in the US. Blood cultures, echocardiogram (rule out endocarditis), and vitreous tap for Gram/fungal stain and culture. Treat with intravitreal voriconazole or amphotericin B + systemic antifungals.",
    pearl: "Any IV drug user or immunocompromised patient with vitritis = endogenous endophthalmitis until proven otherwise.",
    triggerKeywords: ["endogenous endophthalmitis", "Candida", "voriconazole", "fungal"],
  },
  {
    id: "qb-016",
    subspecialty: "Posterior Segment",
    topic: "Retinal break management",
    difficulty: "intermediate",
    question:
      "Symptomatic horseshoe tear without subretinal fluid in a phakic 60-year-old. Recommended treatment?",
    answer:
      "Prompt laser retinopexy (3 rows of confluent burns around the break) or cryotherapy. Follow at 1-2 weeks. Asymptomatic atrophic holes and lattice without traction generally do NOT need prophylactic treatment in phakic eyes per PPP.",
    pearl: "Symptoms = treat. Asymptomatic + no traction = observe.",
    triggerKeywords: ["horseshoe tear", "retinal break", "laser retinopexy", "lattice degeneration"],
  },
  {
    id: "qb-017",
    subspecialty: "Posterior Segment",
    topic: "AREDS2 supplementation",
    difficulty: "core",
    question:
      "What is the AREDS2 formulation and which patients benefit?",
    answer:
      "Vitamin C 500 mg, Vitamin E 400 IU, Zinc 80 mg (or 25 mg), Copper 2 mg, Lutein 10 mg + Zeaxanthin 2 mg (beta-carotene removed — causes lung cancer in smokers). Benefits patients with intermediate AMD (extensive intermediate drusen or any large druse) or advanced AMD in one eye — reduces progression risk by ~25% over 5 years.",
    pearl: "AREDS2 does NOT prevent early AMD from developing.",
    triggerKeywords: ["AREDS2", "macular degeneration", "lutein", "zeaxanthin", "zinc"],
  },
  {
    id: "qb-018",
    subspecialty: "Posterior Segment",
    topic: "Central serous chorioretinopathy",
    difficulty: "intermediate",
    question:
      "A 40-year-old type A male on oral prednisone has acute CSCR with a subretinal blister on OCT. First intervention?",
    answer:
      "Stop exogenous steroids (oral, topical, intranasal, inhaled). Observe for 3 months — most resolve spontaneously. For chronic/recurrent: half-fluence photodynamic therapy (PDT) with verteporfin is first-line. Focal laser to extrafoveal leaking points is an alternative. Avoid anti-VEGF — not indicated unless secondary CNV.",
    pearl: "Type A personality + steroids = classic CSCR trigger.",
    triggerKeywords: ["CSCR", "central serous", "photodynamic therapy", "steroid"],
  },
  {
    id: "qb-019",
    subspecialty: "Posterior Segment",
    topic: "Proliferative diabetic retinopathy",
    difficulty: "core",
    question:
      "A diabetic with NVD >1/3 disc area and vitreous hemorrhage. Best initial therapy?",
    answer:
      "Prompt PRP (pan-retinal photocoagulation) — 1200-1600 500-μm burns over 2-3 sessions. Intravitreal anti-VEGF (per Protocol S) is non-inferior for vision at 5 years and can be first-line or adjunct, especially if vitrectomy is being considered. Vitrectomy if non-clearing vitreous hemorrhage >3 months or tractional RD threatens macula.",
    pearl: "Protocol S: anti-VEGF non-inferior to PRP at 5 years.",
    triggerKeywords: ["PDR", "NVD", "PRP", "Protocol S", "vitreous hemorrhage"],
  },
  {
    id: "qb-020",
    subspecialty: "Posterior Segment",
    topic: "Retinitis pigmentosa",
    difficulty: "intermediate",
    question:
      "A 25-year-old with nyctalopia has bone-spicule pigmentation, attenuated arterioles, and a ring scotoma. Key tests and current disease-modifying therapy?",
    answer:
      "Full-field ERG (markedly reduced/extinguished scotopic and photopic), Goldmann visual fields, OCT (epiretinal membrane, macular edema common). Voretigene neparvovec-rzyl (Luxturna) — subretinal gene therapy for confirmed biallelic RPE65 mutations. Vitamin A palmitate 15,000 IU/day may slow decline in some forms.",
    pearl: "Get genetic testing — RPE65 mutations are treatable with gene therapy.",
    triggerKeywords: ["retinitis pigmentosa", "RPE65", "Luxturna", "bone spicule", "ERG"],
  },

  // ——————————— NEURO-OPHTHALMOLOGY & ORBIT (10) ———————————
  {
    id: "qb-021",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Giant cell arteritis",
    difficulty: "core",
    question:
      "A 72-year-old with jaw claudication, new headache, and transient monocular vision loss has ESR 88, CRP 45. Next step before biopsy?",
    answer:
      "Start IV methylprednisolone 1 g daily x 3 days (if vision loss present) then oral prednisone 1 mg/kg. Do not delay steroids for biopsy — biopsy remains valid up to 2 weeks after steroid initiation. Temporal artery biopsy 1-3 cm segment within 1-2 weeks.",
    pearl: "GCA with vision loss = IV steroids NOW; biopsy can wait.",
    mnemonic: "JAW-HATS: Jaw claudication, Age >50, Weight loss, Headache, Amaurosis, Tenderness, Scalp pain",
    triggerKeywords: ["GCA", "giant cell arteritis", "temporal arteritis", "ESR", "arteritic AION"],
  },
  {
    id: "qb-022",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Optic neuritis",
    difficulty: "core",
    question:
      "A 32-year-old woman has 1-week progressive monocular vision loss, pain with EOM, and RAPD. Per the ONTT, what is the evidence-based treatment?",
    answer:
      "IV methylprednisolone 1 g/day x 3 days followed by oral prednisone 1 mg/kg x 11 days — speeds recovery but does NOT change final visual outcome. Oral prednisone ALONE is CONTRAINDICATED (doubled recurrence rate in ONTT). Get MRI brain with gadolinium for MS risk stratification.",
    pearl: "Never give oral steroids alone for optic neuritis — it's a fatal flaw.",
    triggerKeywords: ["ONTT", "optic neuritis", "RAPD", "multiple sclerosis", "methylprednisolone"],
  },
  {
    id: "qb-023",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Idiopathic intracranial hypertension",
    difficulty: "core",
    question:
      "A 28-year-old obese woman has papilledema, headache, and opening pressure 38 cm H2O with normal CSF composition. First-line treatment per the IIHTT?",
    answer:
      "Acetazolamide 500 mg PO BID titrated up to 4 g/day as tolerated + weight loss (≥6% body weight improves outcomes). Surgery (optic nerve sheath fenestration or VP shunt) for progressive vision loss despite maximal medical therapy. Topiramate is second-line.",
    pearl: "IIHTT showed acetazolamide + low-sodium weight-loss diet beat placebo for visual field recovery.",
    triggerKeywords: ["IIH", "pseudotumor cerebri", "papilledema", "acetazolamide", "IIHTT"],
  },
  {
    id: "qb-024",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Thyroid eye disease",
    difficulty: "intermediate",
    question:
      "A patient with active, moderate-to-severe thyroid eye disease (CAS ≥4, proptosis progression, diplopia) is euthyroid on levothyroxine. What IV and targeted therapies are evidence-based?",
    answer:
      "IV methylprednisolone per EUGOGO protocol: 500 mg weekly x 6, then 250 mg weekly x 6 (cumulative ≤8 g to avoid hepatotoxicity). Teprotumumab (IGF-1R antibody) 10 mg/kg then 20 mg/kg q3 weeks x 8 infusions — reduces proptosis and diplopia. Orbital decompression for compressive optic neuropathy.",
    pearl: "Compressive optic neuropathy = urgent orbital decompression, not drops.",
    triggerKeywords: ["thyroid eye disease", "TED", "teprotumumab", "CAS", "Graves ophthalmopathy"],
  },
  {
    id: "qb-025",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Horner syndrome",
    difficulty: "intermediate",
    question:
      "A 50-year-old smoker has anisocoria greater in dim light, mild ptosis, and anhidrosis. How do you localize with pharmacologic testing?",
    answer:
      "Apraclonidine 0.5-1%: reversal of anisocoria confirms Horner (denervation supersensitivity). Hydroxyamphetamine 1%: dilates 1st/2nd-order (preganglionic) but FAILS to dilate 3rd-order (postganglionic). Always image — CT chest/neck for Pancoast tumor, carotid dissection (MRA), or cavernous sinus lesion.",
    pearl: "Acute painful Horner = carotid dissection until ruled out by MRA.",
    triggerKeywords: ["Horner", "anisocoria", "apraclonidine", "hydroxyamphetamine", "carotid dissection"],
  },
  {
    id: "qb-026",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Third nerve palsy",
    difficulty: "core",
    question:
      "A 65-year-old with hypertension has an acute pupil-INVOLVING CN III palsy with complete ptosis. What is the most urgent diagnosis and first test?",
    answer:
      "Posterior communicating artery aneurysm — emergent CTA or MRA head/neck; cerebral angiography if aneurysm confirmed. Pupil involvement reflects compression of superficial parasympathetic fibers. Treat with coiling or clipping.",
    pearl: "Pupil-involving CN III = aneurysm until proven otherwise; pupil-sparing + vasculopathic = likely ischemic (follow for 3 months).",
    triggerKeywords: ["CN III", "third nerve palsy", "PCOM aneurysm", "pupil involving"],
  },
  {
    id: "qb-027",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Neuromyelitis optica spectrum disorder",
    difficulty: "advanced",
    question:
      "A woman has severe bilateral optic neuritis with longitudinally extensive transverse myelitis. Key antibody test and long-term therapy?",
    answer:
      "AQP4-IgG (aquaporin-4) antibody — highly specific for NMOSD. Acute: IV methylprednisolone + plasmapheresis for severe attacks. Chronic immunosuppression: eculizumab, inebilizumab, satralizumab, or rituximab. Avoid interferon-beta (used for MS) — worsens NMO.",
    pearl: "Bilateral/severe/recurrent ON → always test AQP4 and MOG antibodies.",
    triggerKeywords: ["NMOSD", "aquaporin-4", "AQP4", "Devic", "optic neuritis MOG"],
  },
  {
    id: "qb-028",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Orbital cellulitis vs preseptal",
    difficulty: "core",
    question:
      "A 9-year-old has proptosis, pain with EOM, and ophthalmoplegia after acute sinusitis. Most important imaging and management?",
    answer:
      "Contrast CT orbits + sinuses — look for subperiosteal abscess. IV vancomycin + ceftriaxone (add metronidazole if intracranial extension suspected). Surgical drainage indicated if abscess >10 mm, optic neuropathy, no improvement in 48 hours, or age >9 years.",
    pearl: "Ethmoid sinusitis is the most common cause in children.",
    triggerKeywords: ["orbital cellulitis", "subperiosteal abscess", "ethmoiditis", "preseptal"],
  },
  {
    id: "qb-029",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Neuroretinitis",
    difficulty: "intermediate",
    question:
      "A young adult has unilateral disc edema and a macular star 2 weeks after a cat scratch. Diagnosis and treatment?",
    answer:
      "Cat-scratch neuroretinitis (Bartonella henselae). Confirm with Bartonella serology. Doxycycline 100 mg BID + rifampin 300 mg BID x 4-6 weeks. Usually self-limited; steroids may speed resolution in severe cases.",
    pearl: "Macular star + unilateral disc edema = neuroretinitis (think Bartonella, Lyme, syphilis).",
    triggerKeywords: ["neuroretinitis", "macular star", "Bartonella", "cat scratch"],
  },
  {
    id: "qb-030",
    subspecialty: "Neuro-Ophthalmology and Orbit",
    topic: "Myasthenia gravis",
    difficulty: "intermediate",
    question:
      "A patient has variable ptosis that worsens with fatigue and a positive ice pack test. What are the next two tests and why image the chest?",
    answer:
      "Acetylcholine receptor antibodies (70-80% positive in generalized, lower in ocular) and MuSK antibodies if AChR negative. Single-fiber EMG is most sensitive. CT/MRI chest to rule out thymoma (present in 10-15%; thymectomy improves outcomes). Treat with pyridostigmine + steroids or steroid-sparing immunosuppressants.",
    pearl: "Ice pack test (ice on eyelid 2 min, ptosis improves) is quick bedside — positive in ~80%.",
    triggerKeywords: ["myasthenia gravis", "ice pack test", "AChR antibody", "thymoma", "pyridostigmine"],
  },

  // ——————————— PEDIATRIC OPHTHALMOLOGY (7) ———————————
  {
    id: "qb-031",
    subspecialty: "Pediatric Ophthalmology",
    topic: "Retinoblastoma",
    difficulty: "core",
    question:
      "A 14-month-old has unilateral leukocoria. What is the first-line imaging and why is it important?",
    answer:
      "B-scan ultrasound (calcification is pathognomonic) + MRI orbits and brain with contrast (evaluate optic nerve invasion, pineal gland for trilateral retinoblastoma). Avoid CT — radiation risk, especially in hereditary bilateral cases (RB1 germline). Refer to ocular oncologist urgently.",
    pearl: "Leukocoria in a child = retinoblastoma until proven otherwise.",
    mnemonic: "CALCIFICATION on B-scan = retinoblastoma",
    triggerKeywords: ["retinoblastoma", "leukocoria", "RB1", "calcification"],
  },
  {
    id: "qb-032",
    subspecialty: "Pediatric Ophthalmology",
    topic: "Amblyopia — PEDIG treatment",
    difficulty: "core",
    question:
      "Per PEDIG ATS, how many hours of patching per day for moderate amblyopia (20/40-20/80) in a 6-year-old?",
    answer:
      "2 hours of daily patching is equivalent to 6 hours for moderate amblyopia. For severe (20/100-20/400), 6 hours is equivalent to full-time patching. Atropine 1% daily (fogging the good eye) is equally effective for moderate amblyopia. Treatment can still improve vision up to age 13-17.",
    pearl: "More patching is NOT better — 2 hours works for moderate amblyopia.",
    triggerKeywords: ["amblyopia", "PEDIG", "patching", "atropine penalization", "ATS"],
  },
  {
    id: "qb-033",
    subspecialty: "Pediatric Ophthalmology",
    topic: "Retinopathy of prematurity",
    difficulty: "core",
    question:
      "At what gestational age and birth weight should ROP screening begin, and what are Type 1 ROP criteria per ETROP?",
    answer:
      "Screen infants ≤30 weeks GA or ≤1500 g. First exam at 31 weeks postmenstrual age or 4 weeks chronologic (whichever later). Type 1 (treat): Zone I any stage with plus disease; Zone I stage 3 without plus; Zone II stage 2 or 3 with plus. Treat within 72 hours with laser or intravitreal bevacizumab (BEAT-ROP).",
    pearl: "Plus disease = dilated, tortuous posterior pole vessels = need treatment.",
    triggerKeywords: ["ROP", "retinopathy of prematurity", "ETROP", "plus disease", "BEAT-ROP"],
  },
  {
    id: "qb-034",
    subspecialty: "Pediatric Ophthalmology",
    topic: "Congenital nasolacrimal duct obstruction",
    difficulty: "core",
    question:
      "A 10-month-old has chronic tearing since birth and mucoid discharge. Timing and first-line management?",
    answer:
      "Observation + Crigler massage (lacrimal sac digital massage 2-3x/day) until 12 months — 90% resolve spontaneously. Probing under topical anesthesia in office or with general anesthesia after 12 months. Balloon dacryoplasty or silicone intubation if probing fails.",
    pearl: "Dacryocystocele (bluish distended lac sac at birth) requires earlier intervention — risk of infection.",
    triggerKeywords: ["NLDO", "nasolacrimal duct", "Crigler massage", "probing", "tearing infant"],
  },
  {
    id: "qb-035",
    subspecialty: "Pediatric Ophthalmology",
    topic: "Congenital cataract",
    difficulty: "intermediate",
    question:
      "A 4-week-old has a dense unilateral congenital cataract. Timing of surgery and postoperative optical correction?",
    answer:
      "Surgery ideally by 6-8 weeks for unilateral (earlier than bilateral) to prevent deprivation amblyopia. Immediate contact lens correction (aphakic, +30 D typical) with overcorrection for near. IATS showed no difference between primary IOL and contact lens at age 5 years, but IOL group had more complications. Aggressive amblyopia therapy.",
    pearl: "Critical period closes fast — unilateral cataracts need surgery by 6 weeks.",
    triggerKeywords: ["congenital cataract", "IATS", "aphakic contact lens", "deprivation amblyopia"],
  },
  {
    id: "qb-036",
    subspecialty: "Pediatric Ophthalmology",
    topic: "Esotropia — accommodative",
    difficulty: "core",
    question:
      "A 3-year-old hyperope (+5.00 D) has intermittent esotropia that resolves fully with cycloplegic refraction spectacles. Next step if near deviation > distance deviation in glasses?",
    answer:
      "Bifocals (+2.50 or +3.00 D add) for high AC/A ratio, partially accommodative esotropia. Patch for amblyopia if present. Surgery (bilateral medial rectus recession) if significant residual deviation at distance despite full correction. Full cycloplegic Rx must be worn full-time.",
    pearl: "Always give the FULL cycloplegic Rx in accommodative esotropia — don't cut plus.",
    triggerKeywords: ["accommodative esotropia", "AC/A ratio", "bifocal", "hyperopia"],
  },
  {
    id: "qb-037",
    subspecialty: "Pediatric Ophthalmology",
    topic: "Shaken baby / abusive head trauma",
    difficulty: "intermediate",
    question:
      "A 4-month-old has unexplained bilateral multilayered retinal hemorrhages extending to the ora serrata. Must-do actions?",
    answer:
      "Immediately report suspected abuse to Child Protective Services (mandated reporting). Document with RetCam imaging. MRI brain (subdural hemorrhage), skeletal survey, and hospitalize for complete workup. Retinal hemorrhages in AHT are typically too numerous to count, multilayered, and extend to the periphery — distinguishes from birth hemorrhages (resolve by 4-6 weeks) or CPR (typically mild/posterior).",
    pearl: "Multilayered hemorrhages to the ora = shaken baby syndrome.",
    triggerKeywords: ["abusive head trauma", "shaken baby", "retinal hemorrhages", "non-accidental trauma"],
  },

  // ——————————— OPTICS (8) ———————————
  {
    id: "qb-038",
    subspecialty: "Optics",
    topic: "IOL power calculation",
    difficulty: "intermediate",
    question:
      "Which IOL formula is most accurate for a patient with a prior myopic LASIK who needs cataract surgery?",
    answer:
      "Use formulas that do NOT rely on standard keratometry: Barrett True-K, Haigis-L, or ASCRS post-refractive calculator (averages multiple methods). Standard SRK/T or Holladay over-estimate corneal power → hyperopic surprise. Target slight myopia (–0.50 D) to hedge against hyperopic error.",
    pearl: "Never use SRK/T after LASIK — patient will end up hyperopic.",
    triggerKeywords: ["IOL calculation", "post-LASIK", "Barrett True-K", "ASCRS calculator"],
  },
  {
    id: "qb-039",
    subspecialty: "Optics",
    topic: "Prism prescription",
    difficulty: "core",
    question:
      "A patient with diplopia has 12 PD right hypertropia. How many prism diopters do you split between the two lenses, and in which direction?",
    answer:
      "Split 6 PD base-down OD + 6 PD base-up OS (prisms converge to the fovea). Prisms move the image toward the apex — so base-down moves the image up for the deviating hypertropic eye. Fresnel prisms (stick-on) up to 30 PD for trial; grind-in prisms more durable up to 12 PD per lens.",
    pearl: "Prism apex points AWAY from the muscle being 'substituted' for.",
    triggerKeywords: ["prism", "diplopia", "hypertropia", "Fresnel prism"],
  },
  {
    id: "qb-040",
    subspecialty: "Optics",
    topic: "Keratometry and astigmatism",
    difficulty: "core",
    question:
      "A patient has K readings 43.00 @ 180 and 45.00 @ 090. What is the corneal astigmatism and axis?",
    answer:
      "2.00 D with-the-rule astigmatism. The steeper meridian is at 090 (vertical), so minus-cylinder refraction is written with axis 090 (axis of the minus cylinder = flat meridian). +2.00 x 090 in plus cyl, or –2.00 x 180 in minus cyl.",
    pearl: "WTR astigmatism (steep vertical) is physiological in young patients; against-the-rule develops with age.",
    triggerKeywords: ["keratometry", "astigmatism", "with-the-rule", "cylinder axis"],
  },
  {
    id: "qb-041",
    subspecialty: "Optics",
    topic: "Contact lens overrefraction",
    difficulty: "intermediate",
    question:
      "A patient wears a –4.00 D soft contact lens (vertex distance 0). Spectacle Rx is –4.00 –2.00 x 180. What does their residual astigmatism mean?",
    answer:
      "Soft lenses drape and don't correct corneal astigmatism well — residual astigmatism of –2.00 D x 180 remains. Options: toric soft CL, rigid gas permeable (RGP, which masks corneal astigmatism with a tear lens), or hybrid lens. RGP neutralizes irregular astigmatism best (e.g., keratoconus).",
    pearl: "Irregular astigmatism → RGP is king.",
    triggerKeywords: ["contact lens", "residual astigmatism", "toric", "RGP", "keratoconus"],
  },
  {
    id: "qb-042",
    subspecialty: "Optics",
    topic: "Accommodation and presbyopia",
    difficulty: "core",
    question:
      "A 50-year-old emmetrope has 2.50 D of accommodative amplitude. What reading add at 40 cm is appropriate?",
    answer:
      "Working distance demand at 40 cm = 2.50 D. Using half the amplitude in reserve → usable amplitude = 1.25 D. Required add = 2.50 – 1.25 = +1.25 D. A +1.25 or +1.50 add is typical for a 50-year-old.",
    pearl: "Hofstetter's formula: minimum accommodation amplitude = 15 – (0.25 × age).",
    triggerKeywords: ["presbyopia", "accommodation", "Hofstetter", "reading add"],
  },
  {
    id: "qb-043",
    subspecialty: "Optics",
    topic: "Aniseikonia and anisometropia",
    difficulty: "advanced",
    question:
      "A post-op aphakic patient complains of distorted vision with aphakic spectacles (+12 D). Why, and what is the solution?",
    answer:
      "Aniseikonia — high-plus spectacle causes ~25-33% image magnification relative to the fellow phakic eye → diplopia, distortion. Solutions: contact lens (much less magnification, ~7-10%), IOL (essentially no aniseikonia), or iseikonic spectacle lens design. Always place optical correction as close to the nodal point as possible to minimize magnification.",
    pearl: "Contact lens > spectacle lens for unilateral high ametropia.",
    triggerKeywords: ["aniseikonia", "anisometropia", "aphakia", "image magnification"],
  },
  {
    id: "qb-044",
    subspecialty: "Optics",
    topic: "Prentice's rule",
    difficulty: "core",
    question:
      "A patient wears –5.00 D bifocals and looks 5 mm below the optical center through the near-add segment. What is the induced prismatic effect?",
    answer:
      "Prentice's rule: Δ = h × D (h in cm, D in diopters). 0.5 cm × 5 D = 2.5 PD base-up (minus lens below center = base-up effect). This is why anisometropic patients get vertical diplopia at the reading position — consider slab-off prism or single-vision readers.",
    pearl: "Anisometropia + bifocals = reading zone diplopia. Solution: slab-off or separate readers.",
    mnemonic: "Plus = Base toward center; Minus = Base AWAY from center",
    triggerKeywords: ["Prentice's rule", "prism", "bifocals", "anisometropia", "slab-off"],
  },
  {
    id: "qb-045",
    subspecialty: "Optics",
    topic: "Jackson cross cylinder (JCC)",
    difficulty: "intermediate",
    question:
      "What two refinements does the Jackson cross cylinder perform, and in what order?",
    answer:
      "(1) Refine cylinder AXIS first (flip JCC, patient chooses clearer; rotate axis toward the plus-cylinder dot on the chosen side). (2) Refine cylinder POWER next (align JCC axis with the refraction cylinder axis; flip; if plus axis is clearer, add plus cylinder in 0.25 D steps; if minus is clearer, reduce cylinder). Always add sphere to maintain spherical equivalent when changing cylinder.",
    pearl: "Axis first, then power — changing axis with incorrect power gives misleading answers.",
    triggerKeywords: ["Jackson cross cylinder", "JCC", "refraction", "cylinder axis"],
  },

  // ——————————— GENERAL / EXAM STRATEGY (5) ———————————
  {
    id: "qb-046",
    subspecialty: "General",
    topic: "ABO 8-element framework",
    difficulty: "core",
    question:
      "Name the 8 elements of the ABO PMP case structure in order.",
    answer:
      "(1) Image description, (2) History, (3) Exam, (4) Differential diagnosis, (5) Workup, (6) Diagnosis, (7) Management, (8) Patient education/counseling. The examiner may skip or emphasize elements — follow their lead. Always describe images in systematic anatomical order.",
    pearl: "Narrate out loud — silence is scored poorly even if you're thinking.",
    mnemonic: "I Have Exams, Daily Work Demands My Patience",
    triggerKeywords: ["ABO", "PMP", "8-element", "oral boards framework"],
  },
  {
    id: "qb-047",
    subspecialty: "General",
    topic: "Fatal flaws — must-not-miss",
    difficulty: "core",
    question:
      "List the top 5 'fatal flaw' errors on the oral boards that can fail an otherwise strong candidate.",
    answer:
      "(1) Missing GCA in any >50-year-old with vision loss, (2) Missing retinoblastoma in a child with leukocoria, (3) Giving oral prednisone ALONE for optic neuritis (ONTT contraindication), (4) Missing open-globe signs (Seidel, 360° conjunctival hemorrhage, teardrop pupil) before pressing on the globe, (5) Missing orbital cellulitis / cavernous sinus thrombosis in a patient with proptosis and ophthalmoplegia.",
    pearl: "A single fatal flaw can fail a room — always verbalize your safety check.",
    triggerKeywords: ["fatal flaw", "must not miss", "GCA", "retinoblastoma", "open globe"],
  },
  {
    id: "qb-048",
    subspecialty: "General",
    topic: "Consent and managing complications",
    difficulty: "intermediate",
    question:
      "How do you structure the answer when an examiner asks 'what are the risks of cataract surgery?' to the patient?",
    answer:
      "Plain language, layered disclosure: (1) Common (incidence): refractive surprise, dry eye, posterior capsule opacification (30% at 5 years). (2) Less common: endophthalmitis (~0.1%), cystoid macular edema (1-2%), retinal detachment (~0.5-1% phakic myopes higher). (3) Rare catastrophic: suprachoroidal hemorrhage, vision loss. Provide numbers when asked. Document discussion and informed consent.",
    pearl: "Use plain words, give numbers, offer the 'What would you recommend for your own eye?' question.",
    triggerKeywords: ["informed consent", "cataract surgery risks", "complications", "patient education"],
  },
  {
    id: "qb-049",
    subspecialty: "General",
    topic: "Exam day strategy",
    difficulty: "core",
    question:
      "When an examiner asks an open-ended question like 'What do you see?', what is the structured verbal answer?",
    answer:
      "Start with one sentence of demographics (if available) + image type. Then describe systematically: external → anterior segment → posterior segment / imaging specifics. End with a differential of 3-4 items ranked by likelihood. Avoid jumping to diagnosis — describe first, diagnose second.",
    pearl: "DESCRIBE > DIAGNOSE. Describing earns points even if the diagnosis is wrong.",
    mnemonic: "What I see, what it could be, what I'd do next",
    triggerKeywords: ["exam strategy", "image description", "verbal fluency", "differential"],
  },
  {
    id: "qb-050",
    subspecialty: "General",
    topic: "Landmark trial rapid recall",
    difficulty: "core",
    question:
      "Name the landmark trial and its one-line takeaway for each: ONTT, CATT, DRCR Protocol T, EVS, AREDS2, OHTS, ETROP, IIHTT.",
    answer:
      "ONTT: IV steroids speed recovery in ON; oral alone contraindicated. CATT: bevacizumab = ranibizumab for AMD. Protocol T: aflibercept superior for DME VA ≤20/50 baseline. EVS: vitrectomy if vision LP only; no benefit from systemic abx. AREDS2: reduces AMD progression; lutein/zeaxanthin replaces beta-carotene. OHTS: IOP reduction halves 5-year conversion; thin CCT is top risk factor. ETROP: treat Type 1 within 72 hours. IIHTT: acetazolamide + weight loss beats placebo in IIH.",
    pearl: "Examiners love trial acronyms — knowing the one-line takeaway beats knowing the author.",
    triggerKeywords: ["landmark trials", "ONTT", "CATT", "DRCR", "EVS", "AREDS2", "OHTS", "ETROP", "IIHTT"],
  },
];

// Convenience: counts by subspecialty (for UI displays and tests).
export const QBANK_COUNTS: Record<QBankSubspecialty, number> = HIGH_YIELD_QBANK.reduce(
  (acc, item) => {
    acc[item.subspecialty] = (acc[item.subspecialty] || 0) + 1;
    return acc;
  },
  {} as Record<QBankSubspecialty, number>
);

export const QBANK_SUBSPECIALTIES: QBankSubspecialty[] = [
  "Anterior Segment",
  "Posterior Segment",
  "Neuro-Ophthalmology and Orbit",
  "Pediatric Ophthalmology",
  "Optics",
  "General",
];
