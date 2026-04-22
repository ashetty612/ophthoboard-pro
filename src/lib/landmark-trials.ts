/**
 * Landmark Ophthalmology Trials Registry
 * --------------------------------------
 * Curated, board-relevant index of the clinical trials ABO examiners
 * expect candidates to cite by acronym with a one-line takeaway.
 *
 * Used by `ai-context.ts` to ground the AI examiner in verifiable
 * evidence rather than hallucinated study names/numbers.
 */

export interface Trial {
  acronym: string;
  fullName: string;
  subspecialty: string;
  population: string;
  intervention: string;
  keyFinding: string;
  clinicalImpact: string;
  /** Lowercase substrings that should cause this trial to be retrieved. */
  triggerKeywords: string[];
}

export const LANDMARK_TRIALS: Trial[] = [
  // ============================================================================
  // NEURO-OPHTHALMOLOGY
  // ============================================================================
  {
    acronym: 'ONTT',
    fullName: 'Optic Neuritis Treatment Trial',
    subspecialty: 'Neuro-Ophthalmology',
    population: 'Acute demyelinating optic neuritis, ages 18–46',
    intervention: 'IV methylprednisolone 250mg q6h ×3d → oral taper vs oral prednisone 1 mg/kg vs placebo',
    keyFinding: 'Oral prednisone ALONE increased 2-year relapse rate. IVMP sped recovery but did not change final VA. MRI white-matter lesions predict 15-year MS risk (~50% with ≥1 lesion, ~25% with none).',
    clinicalImpact: 'Never treat optic neuritis with oral prednisone alone. MRI brain is the single best MS risk stratifier.',
    triggerKeywords: ['optic neuritis', 'ontt', 'demyelinating', 'retrobulbar neuritis', 'ms risk', 'multiple sclerosis'],
  },
  {
    acronym: 'IIHTT',
    fullName: 'Idiopathic Intracranial Hypertension Treatment Trial',
    subspecialty: 'Neuro-Ophthalmology',
    population: 'Women with mild vision loss from IIH',
    intervention: 'Acetazolamide up to 4 g/day + weight loss vs weight loss alone',
    keyFinding: 'Acetazolamide improved perimetric mean deviation, papilledema grade, QOL, and CSF opening pressure.',
    clinicalImpact: 'Acetazolamide is first-line medical therapy for IIH with mild vision loss; titrate to 1–4 g/day.',
    triggerKeywords: ['iih', 'idiopathic intracranial hypertension', 'pseudotumor cerebri', 'papilledema', 'acetazolamide'],
  },

  // ============================================================================
  // RETINA — AMD / ANTI-VEGF
  // ============================================================================
  {
    acronym: 'MARINA',
    fullName: 'Minimally Classic/Occult Trial of anti-VEGF in nAMD',
    subspecialty: 'Retina',
    population: 'Minimally classic / occult subfoveal neovascular AMD',
    intervention: 'Monthly ranibizumab 0.3 or 0.5 mg vs sham for 24 months',
    keyFinding: '~95% lost <15 letters vs 62% sham; ~33% gained ≥15 letters.',
    clinicalImpact: 'Established ranibizumab as standard of care for wet AMD.',
    triggerKeywords: ['marina', 'ranibizumab', 'wet amd', 'neovascular amd', 'nvamd', 'anti-vegf'],
  },
  {
    acronym: 'ANCHOR',
    fullName: 'Anti-VEGF Antibody for the Treatment of Predominantly Classic CNV',
    subspecialty: 'Retina',
    population: 'Predominantly classic subfoveal CNV from AMD',
    intervention: 'Monthly ranibizumab vs verteporfin PDT',
    keyFinding: 'Ranibizumab superior at 1 and 2 years across all endpoints.',
    clinicalImpact: 'Anti-VEGF replaced PDT as first-line for classic neovascular AMD.',
    triggerKeywords: ['anchor', 'classic cnv', 'ranibizumab', 'pdt comparison', 'wet amd'],
  },
  {
    acronym: 'CATT',
    fullName: 'Comparison of AMD Treatment Trials',
    subspecialty: 'Retina',
    population: 'Neovascular AMD',
    intervention: 'Bevacizumab vs ranibizumab; monthly vs PRN',
    keyFinding: 'Bevacizumab non-inferior to ranibizumab. Monthly slightly better than PRN at 2 years. No difference in serious systemic AEs.',
    clinicalImpact: 'Justifies off-label bevacizumab use; monthly dosing preferred when feasible.',
    triggerKeywords: ['catt', 'bevacizumab', 'avastin', 'ranibizumab', 'lucentis', 'wet amd'],
  },
  {
    acronym: 'IVAN',
    fullName: 'Inhibition of VEGF in Age-related choroidal Neovascularisation',
    subspecialty: 'Retina',
    population: 'Neovascular AMD (UK)',
    intervention: 'Bevacizumab vs ranibizumab; continuous vs discontinuous',
    keyFinding: 'Drugs equivalent for VA; discontinuous therapy slightly inferior.',
    clinicalImpact: 'UK corroboration of CATT; supports bevacizumab use.',
    triggerKeywords: ['ivan', 'bevacizumab', 'ranibizumab', 'wet amd'],
  },
  {
    acronym: 'VIEW 1/2',
    fullName: 'VEGF Trap-Eye: Investigation of Efficacy in Wet AMD',
    subspecialty: 'Retina',
    population: 'Neovascular AMD',
    intervention: 'Aflibercept (various dosing) vs monthly ranibizumab',
    keyFinding: 'Aflibercept q8 weeks after 3 monthly loading doses non-inferior to monthly ranibizumab.',
    clinicalImpact: 'Extended dosing interval with aflibercept standard of care.',
    triggerKeywords: ['view', 'aflibercept', 'eylea', 'wet amd', 'vegf trap'],
  },
  {
    acronym: 'HARBOR',
    fullName: 'Ranibizumab 0.5 mg vs 2.0 mg in Wet AMD',
    subspecialty: 'Retina',
    population: 'Neovascular AMD',
    intervention: 'Ranibizumab 0.5 vs 2.0 mg; monthly vs PRN',
    keyFinding: 'Higher dose no benefit; PRN regimen with ~8 injections/year close to monthly.',
    clinicalImpact: 'Supports PRN / treat-and-extend strategies.',
    triggerKeywords: ['harbor', 'ranibizumab', 'wet amd', 'treat and extend'],
  },
  {
    acronym: 'AREDS',
    fullName: 'Age-Related Eye Disease Study',
    subspecialty: 'Retina',
    population: 'Intermediate dry AMD (many large drusen, noncentral GA, or unilateral advanced AMD)',
    intervention: 'Vitamin C 500 mg, E 400 IU, beta-carotene 15 mg, zinc 80 mg, copper 2 mg',
    keyFinding: '25% reduction in 5-year risk of progression to advanced AMD.',
    clinicalImpact: 'Basis for AMD vitamin supplementation.',
    triggerKeywords: ['areds', 'amd vitamins', 'dry amd', 'drusen', 'intermediate amd'],
  },
  {
    acronym: 'AREDS2',
    fullName: 'Age-Related Eye Disease Study 2',
    subspecialty: 'Retina',
    population: 'Intermediate or advanced-unilateral AMD',
    intervention: 'Lutein 10 mg + zeaxanthin 2 mg replaced beta-carotene; lower zinc optional',
    keyFinding: 'Lutein/zeaxanthin equivalent to beta-carotene without lung-cancer risk in smokers. Omega-3 showed no benefit.',
    clinicalImpact: 'Modern AREDS2 formula: no beta-carotene, add lutein/zeaxanthin — safe for former smokers.',
    triggerKeywords: ['areds2', 'lutein', 'zeaxanthin', 'dry amd', 'smoker amd'],
  },

  // ============================================================================
  // RETINA — CRVO / BRVO / DME
  // ============================================================================
  {
    acronym: 'CRUISE',
    fullName: 'Ranibizumab in CRVO',
    subspecialty: 'Retina',
    population: 'Macular edema from CRVO',
    intervention: 'Monthly ranibizumab 0.3 or 0.5 mg vs sham ×6 mo',
    keyFinding: '~48% gained ≥15 letters vs 17% sham.',
    clinicalImpact: 'Anti-VEGF first-line for CRVO ME.',
    triggerKeywords: ['cruise', 'crvo', 'central retinal vein occlusion', 'macular edema vein', 'ranibizumab'],
  },
  {
    acronym: 'BRAVO',
    fullName: 'Ranibizumab in BRVO',
    subspecialty: 'Retina',
    population: 'Macular edema from BRVO',
    intervention: 'Monthly ranibizumab vs sham ×6 mo',
    keyFinding: '~61% gained ≥15 letters vs 29% sham.',
    clinicalImpact: 'Anti-VEGF first-line for BRVO ME.',
    triggerKeywords: ['bravo', 'brvo', 'branch retinal vein occlusion', 'ranibizumab'],
  },
  {
    acronym: 'GALILEO',
    fullName: 'Aflibercept in CRVO (Europe)',
    subspecialty: 'Retina',
    population: 'Macular edema from CRVO',
    intervention: 'Monthly aflibercept 2 mg vs sham',
    keyFinding: '60% gained ≥15 letters vs 22%.',
    clinicalImpact: 'Aflibercept effective for CRVO ME; gains maintained with PRN.',
    triggerKeywords: ['galileo', 'aflibercept', 'crvo'],
  },
  {
    acronym: 'COPERNICUS',
    fullName: 'Aflibercept in CRVO (USA)',
    subspecialty: 'Retina',
    population: 'Macular edema from CRVO',
    intervention: 'Monthly aflibercept vs sham',
    keyFinding: '56% gained ≥15 letters vs 12%.',
    clinicalImpact: 'FDA approval of aflibercept for CRVO.',
    triggerKeywords: ['copernicus', 'aflibercept', 'crvo'],
  },
  {
    acronym: 'SCORE',
    fullName: 'Standard Care vs Corticosteroid for Retinal Vein Occlusion',
    subspecialty: 'Retina',
    population: 'CRVO and BRVO with ME',
    intervention: 'IVTA 1 mg or 4 mg vs observation (CRVO) or grid laser (BRVO)',
    keyFinding: 'CRVO: IVTA superior to observation. BRVO: grid laser superior/equal to IVTA with fewer side effects.',
    clinicalImpact: 'Grid laser preferred for BRVO historically; now anti-VEGF first-line. IVTA a steroid option.',
    triggerKeywords: ['score', 'triamcinolone', 'ivta', 'crvo', 'brvo', 'vein occlusion'],
  },
  {
    acronym: 'CVOS',
    fullName: 'Central Vein Occlusion Study',
    subspecialty: 'Retina',
    population: 'CRVO',
    intervention: 'PRP for iris neovascularization; grid laser for ME',
    keyFinding: 'Prophylactic PRP did not prevent NVI; PRP effective once NVI develops. Grid laser did not improve VA in CRVO ME.',
    clinicalImpact: 'Follow closely for NVI; treat PRP when it appears. Grid laser NOT for CRVO ME.',
    triggerKeywords: ['cvos', 'crvo', 'central vein occlusion', 'prp', 'nvi'],
  },
  {
    acronym: 'BVOS',
    fullName: 'Branch Vein Occlusion Study',
    subspecialty: 'Retina',
    population: 'BRVO',
    intervention: 'Grid laser vs observation (ME); scatter laser vs observation (NV)',
    keyFinding: 'Grid laser improves VA in BRVO ME after ≥3 mo; scatter laser reduces vitreous hemorrhage risk with NV.',
    clinicalImpact: 'Historical basis; anti-VEGF now first-line for ME.',
    triggerKeywords: ['bvos', 'brvo', 'branch vein', 'grid laser'],
  },
  {
    acronym: 'DRCR Protocol I',
    fullName: 'DRCR.net Protocol I',
    subspecialty: 'Retina',
    population: 'Center-involving DME',
    intervention: 'Ranibizumab + prompt or deferred laser vs laser alone',
    keyFinding: 'Ranibizumab + deferred laser best VA outcomes at 1 and 2 years.',
    clinicalImpact: 'Anti-VEGF first-line for DME; laser deferred.',
    triggerKeywords: ['drcr protocol i', 'protocol i', 'dme', 'diabetic macular edema'],
  },
  {
    acronym: 'DRCR Protocol T',
    fullName: 'DRCR.net Protocol T',
    subspecialty: 'Retina',
    population: 'Center-involving DME',
    intervention: 'Aflibercept vs bevacizumab vs ranibizumab',
    keyFinding: 'At VA 20/50 or worse: aflibercept superior. At 20/32–20/40: all equivalent.',
    clinicalImpact: 'Prefer aflibercept for DME with VA 20/50 or worse.',
    triggerKeywords: ['protocol t', 'dme', 'aflibercept', 'bevacizumab', 'ranibizumab'],
  },
  {
    acronym: 'DRCR Protocol S',
    fullName: 'DRCR.net Protocol S',
    subspecialty: 'Retina',
    population: 'Proliferative diabetic retinopathy',
    intervention: 'Ranibizumab vs PRP',
    keyFinding: 'Ranibizumab non-inferior for VA at 2 years; less peripheral VF loss and DME, but injection burden and worse if lost to follow-up.',
    clinicalImpact: 'Anti-VEGF an alternative to PRP for PDR in compliant patients.',
    triggerKeywords: ['protocol s', 'pdr', 'proliferative diabetic', 'prp', 'anti-vegf pdr'],
  },
  {
    acronym: 'DRCR Protocol U',
    fullName: 'DRCR.net Protocol U',
    subspecialty: 'Retina',
    population: 'DME persistent despite anti-VEGF',
    intervention: 'Adding dexamethasone implant vs continued ranibizumab',
    keyFinding: 'Adding steroid improved OCT thickness but not VA.',
    clinicalImpact: 'Do not reflexively add steroid for anti-VEGF–refractory DME without considering lens/IOP.',
    triggerKeywords: ['protocol u', 'dme', 'dexamethasone implant', 'ozurdex'],
  },
  {
    acronym: 'DRCR Protocol V',
    fullName: 'DRCR.net Protocol V',
    subspecialty: 'Retina',
    population: 'Center-involving DME with VA 20/25 or better',
    intervention: 'Aflibercept vs laser vs observation (treat if VA drops)',
    keyFinding: 'No difference in VA at 2 years.',
    clinicalImpact: 'Good-vision DME can be observed — treat if VA drops.',
    triggerKeywords: ['protocol v', 'dme', 'good vision dme', 'observe dme'],
  },
  {
    acronym: 'ETDRS',
    fullName: 'Early Treatment Diabetic Retinopathy Study',
    subspecialty: 'Retina',
    population: 'Non-proliferative and early proliferative DR, DME',
    intervention: 'Focal/grid laser for CSME; scatter laser timing; aspirin',
    keyFinding: 'Focal laser halved moderate VA loss in CSME. Early scatter laser for severe NPDR or early PDR reduced severe vision loss. Aspirin no effect on retinopathy.',
    clinicalImpact: 'Defined CSME and standard of care for laser prior to anti-VEGF era.',
    triggerKeywords: ['etdrs', 'csme', 'clinically significant macular edema', 'focal laser', 'dr'],
  },
  {
    acronym: 'DRS',
    fullName: 'Diabetic Retinopathy Study',
    subspecialty: 'Retina',
    population: 'Proliferative diabetic retinopathy',
    intervention: 'Scatter (pan-retinal) photocoagulation vs no treatment',
    keyFinding: 'PRP halved risk of severe vision loss in high-risk PDR.',
    clinicalImpact: 'Established PRP for high-risk PDR.',
    triggerKeywords: ['drs', 'pdr', 'prp', 'proliferative diabetic', 'pan retinal photocoagulation'],
  },

  // ============================================================================
  // RETINA — OTHER
  // ============================================================================
  {
    acronym: 'EVS',
    fullName: 'Endophthalmitis Vitrectomy Study',
    subspecialty: 'Retina',
    population: 'Acute postoperative endophthalmitis within 6 weeks of cataract surgery',
    intervention: 'Immediate PPV vs tap-and-inject; IV antibiotics vs none',
    keyFinding: 'PPV benefit only if VA ≤ light perception. Systemic IV antibiotics no benefit.',
    clinicalImpact: 'Tap-and-inject unless VA ≤ LP → then PPV. Skip routine IV abx.',
    triggerKeywords: ['evs', 'endophthalmitis', 'tap and inject', 'postoperative endophthalmitis', 'vitrectomy'],
  },
  {
    acronym: 'COMS',
    fullName: 'Collaborative Ocular Melanoma Study',
    subspecialty: 'Ocular Oncology',
    population: 'Choroidal melanoma',
    intervention: 'Medium tumors: I-125 plaque brachytherapy vs enucleation. Large tumors: preop EBRT vs enucleation.',
    keyFinding: 'No mortality difference for medium melanoma between plaque and enucleation. Preop EBRT did not improve survival for large tumors.',
    clinicalImpact: 'Plaque brachytherapy is eye-sparing and oncologically equivalent for medium melanoma.',
    triggerKeywords: ['coms', 'choroidal melanoma', 'plaque brachytherapy', 'ocular melanoma', 'uveal melanoma'],
  },
  {
    acronym: 'SST',
    fullName: 'Submacular Surgery Trials',
    subspecialty: 'Retina',
    population: 'Subfoveal CNV, large submacular hemorrhage',
    intervention: 'Submacular surgery vs observation',
    keyFinding: 'No benefit for AMD-related CNV. Modest benefit for selected idiopathic/OHS CNV and hemorrhage.',
    clinicalImpact: 'Largely historical; anti-VEGF supplanted submacular surgery for AMD.',
    triggerKeywords: ['sst', 'submacular surgery', 'submacular hemorrhage'],
  },

  // ============================================================================
  // GLAUCOMA
  // ============================================================================
  {
    acronym: 'OHTS',
    fullName: 'Ocular Hypertension Treatment Study',
    subspecialty: 'Glaucoma',
    population: 'Ocular hypertension (IOP 24–32)',
    intervention: 'Topical ocular hypotensive vs observation',
    keyFinding: 'Treatment halved 5-year risk of POAG (9.5% → 4.4%). Risk factors: older age, thinner CCT, larger C/D, higher PSD, higher IOP.',
    clinicalImpact: 'Risk-stratified treatment of OHT; CCT is required part of workup.',
    triggerKeywords: ['ohts', 'ocular hypertension', 'oht', 'ccT', 'central corneal thickness', 'glaucoma risk'],
  },
  {
    acronym: 'CIGTS',
    fullName: 'Collaborative Initial Glaucoma Treatment Study',
    subspecialty: 'Glaucoma',
    population: 'Newly diagnosed open-angle glaucoma',
    intervention: 'Initial medical therapy vs initial trabeculectomy',
    keyFinding: 'Similar VF outcomes long-term; surgery had more cataract. Aggressive IOP lowering beneficial.',
    clinicalImpact: 'Medical therapy reasonable first-line; surgery not inferior for aggressive targets.',
    triggerKeywords: ['cigts', 'trabeculectomy', 'initial glaucoma treatment', 'poag'],
  },
  {
    acronym: 'AGIS',
    fullName: 'Advanced Glaucoma Intervention Study',
    subspecialty: 'Glaucoma',
    population: 'Advanced glaucoma failing medical therapy',
    intervention: 'ALT-then-trab vs trab-then-ALT',
    keyFinding: 'Lower IOP (<18 at every visit, mean ~12.3) = no VF progression. Black patients fared better with ALT first; white patients with trab first.',
    clinicalImpact: 'Target low-teens IOP for advanced glaucoma. Race-stratified sequence.',
    triggerKeywords: ['agis', 'advanced glaucoma', 'alt', 'trabeculectomy sequence'],
  },
  {
    acronym: 'CNTGS',
    fullName: 'Collaborative Normal-Tension Glaucoma Study',
    subspecialty: 'Glaucoma',
    population: 'Normal-tension glaucoma',
    intervention: '30% IOP lowering vs observation',
    keyFinding: 'Treatment slowed progression (12% vs 35%), but cataract confounded VA outcomes.',
    clinicalImpact: '30% IOP reduction is benchmark target for NTG.',
    triggerKeywords: ['cntgs', 'normal tension glaucoma', 'ntg', 'low tension glaucoma'],
  },
  {
    acronym: 'EMGT',
    fullName: 'Early Manifest Glaucoma Trial',
    subspecialty: 'Glaucoma',
    population: 'Early POAG',
    intervention: 'Betaxolol + ALT vs observation',
    keyFinding: 'Treatment reduced progression (45% vs 62%). Each 1 mmHg IOP lowering ≈10% progression risk reduction.',
    clinicalImpact: 'Every mmHg counts; early treatment slows progression.',
    triggerKeywords: ['emgt', 'early manifest glaucoma', 'glaucoma progression'],
  },
  {
    acronym: 'LiGHT',
    fullName: 'Laser in Glaucoma and Ocular Hypertension Trial',
    subspecialty: 'Glaucoma',
    population: 'Newly diagnosed POAG or OHT',
    intervention: 'Primary SLT vs topical medication',
    keyFinding: 'SLT achieved target IOP drug-free in ~75% at 3 years; fewer trabeculectomies, better QOL, cost-effective.',
    clinicalImpact: 'SLT reasonable first-line for POAG/OHT.',
    triggerKeywords: ['light trial', 'slt', 'selective laser trabeculoplasty', 'primary slt', 'poag', 'oht'],
  },

  // ============================================================================
  // CORNEA
  // ============================================================================
  {
    acronym: 'CLEK',
    fullName: 'Collaborative Longitudinal Evaluation of Keratoconus',
    subspecialty: 'Cornea',
    population: 'Keratoconus patients',
    intervention: 'Observational cohort — contact lens wear and progression',
    keyFinding: 'Contact lens wear does not cause scarring. Steep K, younger age, poorer VA predict progression.',
    clinicalImpact: 'CLs safe in KCN; prognosticators for progression identified.',
    triggerKeywords: ['clek', 'keratoconus', 'contact lens keratoconus'],
  },
  {
    acronym: 'HEDS I',
    fullName: 'Herpetic Eye Disease Study I',
    subspecialty: 'Cornea',
    population: 'HSV keratitis',
    intervention: 'Topical steroid ± trifluridine; oral acyclovir for iridocyclitis / stromal keratitis',
    keyFinding: 'Topical steroid + trifluridine shortens HSV stromal keratitis. Oral acyclovir helps iridocyclitis.',
    clinicalImpact: 'Topical steroid indicated for HSV stromal keratitis (with antiviral cover).',
    triggerKeywords: ['heds', 'heds i', 'hsv keratitis', 'herpes simplex keratitis', 'stromal keratitis'],
  },
  {
    acronym: 'HEDS II',
    fullName: 'Herpetic Eye Disease Study II',
    subspecialty: 'Cornea',
    population: 'HSV ocular disease, prophylaxis',
    intervention: 'Oral acyclovir 400 mg BID ×12 mo vs placebo',
    keyFinding: '~50% reduction in any HSV ocular recurrence. Stress and sunlight not significant triggers.',
    clinicalImpact: 'Long-term oral acyclovir prophylaxis for recurrent HSV keratitis.',
    triggerKeywords: ['heds ii', 'hsv prophylaxis', 'recurrent herpes', 'acyclovir prophylaxis'],
  },
  {
    acronym: 'CCTS',
    fullName: 'Cornea Donor Study',
    subspecialty: 'Cornea',
    population: 'Penetrating keratoplasty candidates',
    intervention: 'Donor age 12–65 vs 66–75',
    keyFinding: 'Donor age up to 75 does not affect 5-year graft survival.',
    clinicalImpact: 'Expanded donor pool for PK.',
    triggerKeywords: ['ccts', 'cornea donor', 'pk', 'penetrating keratoplasty', 'graft survival'],
  },

  // ============================================================================
  // PEDIATRICS / STRABISMUS
  // ============================================================================
  {
    acronym: 'PEDIG ATS',
    fullName: 'Pediatric Eye Disease Investigator Group — Amblyopia Treatment Studies',
    subspecialty: 'Pediatrics',
    population: 'Children with amblyopia',
    intervention: 'Patching hours, atropine vs patching, age-effect',
    keyFinding: '2h patching = 6h for moderate amblyopia. Atropine weekend-dose = daily. Effective through age 12–17 in some cases.',
    clinicalImpact: 'Shorter patching regimens and atropine are viable; older-child amblyopia treatable.',
    triggerKeywords: ['pedig', 'ats', 'amblyopia', 'patching', 'atropine amblyopia', 'lazy eye'],
  },
  {
    acronym: 'ETROP',
    fullName: 'Early Treatment for Retinopathy of Prematurity',
    subspecialty: 'Pediatrics',
    population: 'Preterm infants with high-risk prethreshold ROP',
    intervention: 'Early laser at Type 1 ROP vs conventional threshold treatment',
    keyFinding: 'Early treatment improved VA and anatomic outcomes.',
    clinicalImpact: 'Treat Type 1 ROP within 48–72 h; do not wait for threshold.',
    triggerKeywords: ['etrop', 'rop', 'retinopathy of prematurity', 'type 1 rop', 'threshold rop'],
  },
  {
    acronym: 'BEAT-ROP',
    fullName: 'Bevacizumab Eliminates the Angiogenic Threat of ROP',
    subspecialty: 'Pediatrics',
    population: 'Stage 3+ ROP zone I or posterior zone II',
    intervention: 'Intravitreal bevacizumab vs laser',
    keyFinding: 'Bevacizumab superior for zone I disease; late recurrences possible → prolonged follow-up.',
    clinicalImpact: 'Anti-VEGF option for posterior ROP; screen longer.',
    triggerKeywords: ['beat-rop', 'bevacizumab rop', 'zone 1 rop', 'aggressive rop'],
  },
  {
    acronym: 'IATS',
    fullName: 'Infant Aphakia Treatment Study',
    subspecialty: 'Pediatrics',
    population: 'Unilateral congenital cataract, age 1–7 months',
    intervention: 'Primary IOL vs contact lens',
    keyFinding: 'No VA difference at 5 years; IOL group had more complications (visual axis opacification, glaucoma-related events).',
    clinicalImpact: 'Contact lens preferred in infants <7 months; avoid primary IOL.',
    triggerKeywords: ['iats', 'infant aphakia', 'congenital cataract', 'pediatric iol'],
  },

  // ============================================================================
  // SYSTEMIC / DIABETES
  // ============================================================================
  {
    acronym: 'DCCT',
    fullName: 'Diabetes Control and Complications Trial',
    subspecialty: 'Retina',
    population: 'Type 1 diabetes',
    intervention: 'Intensive vs conventional glycemic control',
    keyFinding: 'Intensive control (HbA1c ~7%) reduced retinopathy onset 76% and progression 54%. Early worsening possible with rapid tightening.',
    clinicalImpact: 'Tight glycemic control prevents DR; warn about transient worsening.',
    triggerKeywords: ['dcct', 'type 1 diabetes', 'hba1c', 'glycemic control', 'diabetic retinopathy'],
  },
  {
    acronym: 'UKPDS',
    fullName: 'United Kingdom Prospective Diabetes Study',
    subspecialty: 'Retina',
    population: 'Type 2 diabetes',
    intervention: 'Intensive glucose and BP control',
    keyFinding: 'Tight glucose and BP control reduced microvascular complications including DR.',
    clinicalImpact: 'Glycemic and BP control both reduce DR in T2DM.',
    triggerKeywords: ['ukpds', 'type 2 diabetes', 'bp control diabetes', 'diabetic retinopathy'],
  },

  // ============================================================================
  // SAFETY
  // ============================================================================
  {
    acronym: 'TASS (ASCRS registry)',
    fullName: 'Toxic Anterior Segment Syndrome surveillance',
    subspecialty: 'Anterior Segment',
    population: 'Postoperative cataract patients with sterile inflammation',
    intervention: 'Root-cause analysis of OR solutions, instruments, autoclaves',
    keyFinding: 'TASS is a sterile reaction to contaminants (detergents, heat-stable endotoxin, preservatives) peaking 12–48 h postop — contrast with infectious endophthalmitis (typically 3–7 d, hypopyon, pain).',
    clinicalImpact: 'TASS is cluster-associated; audit ASC protocols urgently when cases appear.',
    triggerKeywords: ['tass', 'toxic anterior segment syndrome', 'sterile endophthalmitis'],
  },
];

/**
 * Return trials whose triggerKeywords appear in the supplied text.
 * Case-insensitive substring match. Dedup by acronym.
 */
export function getTrialsForText(text: string): Trial[] {
  const haystack = (text || '').toLowerCase();
  if (!haystack.trim()) return [];
  const matches: Trial[] = [];
  const seen = new Set<string>();
  for (const t of LANDMARK_TRIALS) {
    for (const kw of t.triggerKeywords) {
      if (haystack.includes(kw.toLowerCase())) {
        if (!seen.has(t.acronym)) {
          matches.push(t);
          seen.add(t.acronym);
        }
        break;
      }
    }
  }
  return matches;
}
