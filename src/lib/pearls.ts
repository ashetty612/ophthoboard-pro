/**
 * Teaching Pearls & ABO Oral Boards Tips
 * Comprehensive evidence-based clinical pearls, examiner expectations,
 * and board-relevant teaching points organized by question type and subspecialty.
 */

export interface TeachingPearl {
  category: string;
  pearl: string;
  examTip?: string;
}

// General oral boards exam strategy pearls
export const EXAM_STRATEGY_PEARLS: TeachingPearl[] = [
  {
    category: 'General Strategy',
    pearl: 'Always start with a systematic photo description: laterality, imaging modality, anatomical structures, then abnormal findings.',
    examTip: 'Examiners want to hear your thought process. Describe what you see before jumping to diagnosis.',
  },
  {
    category: 'General Strategy',
    pearl: 'For every case, always mention: checking VA, pupils (including RAPD), IOP, confrontation visual fields, and full anterior/posterior segment exam.',
    examTip: 'Even if the question seems focused on one area, show you do a complete exam.',
  },
  {
    category: 'General Strategy',
    pearl: 'Present your differential diagnosis in order from most likely to least likely. Start with the most common/important diagnosis.',
    examTip: 'The examiner will usually tell you the correct diagnosis and move on. Having it first shows confidence.',
  },
  {
    category: 'General Strategy',
    pearl: 'When discussing treatment, always mention conservative measures first, then escalate. Include specific drug names, dosages, and frequencies when possible.',
    examTip: 'Vague answers like "give antibiotics" score poorly. Say "erythromycin ointment QHS" instead.',
  },
  {
    category: 'General Strategy',
    pearl: 'For natural history questions, always discuss: timeline, prognosis, follow-up schedule, warning signs to watch for, and when to refer.',
    examTip: 'Showing you can counsel a patient demonstrates clinical maturity.',
  },
  {
    category: 'General Strategy',
    pearl: 'The ABO exam uses compensatory scoring: strong performance in one domain can offset weakness in another. Focus on demonstrating consistent competence.',
    examTip: 'You do not need to be perfect. Consistent, organized, safe answers pass the exam.',
  },
  {
    category: 'General Strategy',
    pearl: 'Time management is critical: ~3.5 minutes per case. If you have not reached management in 2 minutes, the examiner will redirect you.',
    examTip: 'Practice with a timer. Being concise is a skill the exam rewards.',
  },
  {
    category: 'General Strategy',
    pearl: 'The "soliloquy approach": rehearse scripted verbal responses for high-yield conditions so you sound fluent and organized under pressure.',
    examTip: 'Verbal fluency is one of the strongest predictors of passing.',
  },
  {
    category: 'General Strategy',
    pearl: 'Always check the FELLOW EYE. Many conditions are bilateral or have contralateral implications (angle closure, TED, strabismus).',
    examTip: 'Forgetting the fellow eye is a commonly penalized oversight.',
  },
  {
    category: 'General Strategy',
    pearl: 'When unsure of a diagnosis, describe your clinical reasoning: "Given the presentation of X and Y, I would be most concerned about Z because..."',
    examTip: 'Examiners reward clinical reasoning even when you are not 100% certain of the diagnosis.',
  },
];

// Subspecialty-specific pearls — massively expanded
export const SUBSPECIALTY_PEARLS: { [key: string]: TeachingPearl[] } = {
  'Anterior Segment': [
    {
      category: 'Cornea',
      pearl: 'Neurotrophic keratopathy: Always check corneal sensation BEFORE instilling anesthetic drops.',
      examTip: 'This is a classic pitfall - mentioning you check sensation shows clinical awareness.',
    },
    {
      category: 'Cornea',
      pearl: 'For any corneal infiltrate/ulcer, always obtain cultures (blood agar, chocolate agar, Sabouraud) before starting empiric broad-spectrum antibiotics.',
      examTip: 'Mention specific culture media to demonstrate thoroughness.',
    },
    {
      category: 'Cornea',
      pearl: 'Corneal transplant rejection: "KEPS" mnemonic — Keratic precipitates, Edema, Precipitation of AC cells, Stromal rejection line (Khodadoust). Treat with hourly topical prednisolone 1%.',
      examTip: 'Know the difference between epithelial, stromal, and endothelial rejection.',
    },
    {
      category: 'Cornea',
      pearl: 'HSV keratitis: dendritic ulcer with terminal bulbs (vs pseudodendrite in HZO without bulbs). NEVER use steroids alone. HEDS trial: oral acyclovir 400mg BID reduces recurrence by 50%.',
      examTip: 'Know the HEDS trial findings cold — they are heavily tested.',
    },
    {
      category: 'Cornea',
      pearl: 'Acanthamoeba keratitis: ring infiltrate, perineural infiltrates, radial keratoneuritis. Contact lens wearer exposed to water. Treat with PHMB + propamidine (Brolene).',
      examTip: 'History of swimming or showering in contact lenses is the key risk factor.',
    },
    {
      category: 'Cornea',
      pearl: 'Corneal cross-linking (CXL): riboflavin + UVA light for progressive keratoconus. Minimum corneal thickness 400 microns. Stops progression in >95%.',
      examTip: 'Know the indications, contraindications, and minimum thickness requirement.',
    },
    {
      category: 'Glaucoma',
      pearl: 'Acute angle closure: Remember the sequence - lower IOP medically first (timolol, brimonidine, pilocarpine, acetazolamide, mannitol), then laser PI when cornea clears.',
      examTip: 'Know the order of treatments and dont forget to treat the fellow eye prophylactically.',
    },
    {
      category: 'Glaucoma',
      pearl: 'Neovascular glaucoma (NVG): Always look for the cause — diabetic retinopathy, CRVO, OIS. PRP to the ischemic retina is essential. Anti-VEGF can help acutely.',
      examTip: 'Treating the underlying ischemia is more important than lowering IOP alone.',
    },
    {
      category: 'Glaucoma',
      pearl: 'ICE syndrome (iridocorneal endothelial): unilateral, young to middle-aged women. Corneal endothelial abnormalities, iris atrophy, secondary glaucoma. Hammered silver appearance on specular microscopy.',
      examTip: 'Always unilateral — if bilateral, reconsider the diagnosis.',
    },
    {
      category: 'Glaucoma',
      pearl: 'Target IOP: generally 25% below baseline for early glaucoma, 30-40% for moderate, >40% for severe/rapid progressors. Adjust based on central corneal thickness.',
      examTip: 'State a specific target IOP, not just "lower the pressure."',
    },
    {
      category: 'Lens',
      pearl: 'Pseudoexfoliation: Always check for zonular weakness, phacodonesis, and increased IOP. Capsular tension ring may be needed during cataract surgery.',
      examTip: 'Mention the surgical implications to show you think ahead.',
    },
    {
      category: 'Lens',
      pearl: 'Posterior capsule rupture during cataract surgery: key steps — do NOT aspirate remaining lens material with the phaco probe, convert to anterior vitrectomy, place IOL in the sulcus (reduce power by 0.5-1.0 D), consider optic capture.',
      examTip: 'Know the complication management steps in order — this is a classic curveball.',
    },
    {
      category: 'Lens',
      pearl: 'Intraoperative floppy iris syndrome (IFIS): caused by tamsulosin (Flomax). Use iris hooks, Malyugin ring, or intracameral phenylephrine. Low-flow fluidics.',
      examTip: 'Always ask about alpha-blocker use preoperatively.',
    },
    {
      category: 'External Disease',
      pearl: 'Blepharitis is CONTROLLED, not CURED. Always counsel the patient about the chronic nature and maintenance therapy.',
      examTip: 'Patient counseling is scored - dont skip it.',
    },
    {
      category: 'External Disease',
      pearl: 'Stevens-Johnson syndrome: acute phase — stop offending drug, IV immunoglobulin, amniotic membrane transplant to ocular surface. Chronic phase — manage cicatricial changes.',
      examTip: 'This is a true ophthalmic emergency requiring immediate intervention.',
    },
    {
      category: 'Uveitis',
      pearl: 'For anterior uveitis, always consider systemic workup: HLA-B27, RPR/VDRL, FTA-ABS, chest X-ray, ACE level, CBC.',
      examTip: 'The examiner may ask about systemic associations - be prepared with a workup.',
    },
    {
      category: 'Uveitis',
      pearl: 'Granulomatous vs non-granulomatous uveitis: Granulomatous (mutton-fat KPs, Busacca nodules) = sarcoid, TB, syphilis, VKH. Non-granulomatous (fine KPs) = HLA-B27, idiopathic.',
      examTip: 'The type of KPs guides your systemic workup entirely.',
    },
    {
      category: 'Trauma',
      pearl: 'Open globe: peaked pupil, low IOP, positive Seidel test, deep AC, lens dislocation. NEVER apply pressure. Place a shield, NPO, IV antibiotics, urgent OR.',
      examTip: 'Missing open globe is a FATAL FLAW on the ABO exam.',
    },
    {
      category: 'Trauma',
      pearl: 'Orbital floor fracture: entrapment = surgical emergency (bradycardia, nausea, restricted upgaze). White-eyed blowout in children is especially dangerous.',
      examTip: 'Children can have a "trapdoor" fracture with minimal external signs but severe entrapment.',
    },
  ],
  'Posterior Segment': [
    {
      category: 'Retina',
      pearl: 'Central retinal artery occlusion is an ophthalmic EMERGENCY. Time is critical - attempt ocular massage, AC paracentesis, and urgent stroke workup (carotid Doppler, echo, ESR/CRP for GCA).',
      examTip: 'Know the difference between arteritic and non-arteritic causes.',
    },
    {
      category: 'Retina',
      pearl: 'For any retinal vein occlusion, always check: blood pressure, blood glucose, CBC, lipid panel. Consider hypercoagulability workup in young patients.',
      examTip: 'Systemic workup shows you think beyond the eye.',
    },
    {
      category: 'Retina',
      pearl: '4-2-1 rule for severe NPDR: 4 quadrants of hemorrhages, 2+ quadrants of venous beading, 1+ quadrant of IRMA. Any ONE meets criteria for severe NPDR.',
      examTip: 'Know this rule perfectly — it determines when to consider PRP vs observation.',
    },
    {
      category: 'Retina',
      pearl: 'DRCR.net Protocol T: For DME with VA 20/50 or worse, aflibercept is superior to bevacizumab at year 1. For VA 20/40 or better, all anti-VEGF agents are similar.',
      examTip: 'Reference this specific trial when discussing anti-VEGF choice for DME.',
    },
    {
      category: 'Retina',
      pearl: 'Endophthalmitis Vitrectomy Study (EVS): PPV + intravitreal antibiotics if VA = light perception or worse. Tap + inject if VA better than LP. Systemic antibiotics did NOT help.',
      examTip: 'Know the EVS criteria cold — intravitreal vancomycin 1mg + ceftazidime 2.25mg.',
    },
    {
      category: 'Retina',
      pearl: 'RD repair: pneumatic retinopexy for single superior break (8-4 oclock), no PVR. Scleral buckle for young/phakic, inferior breaks. PPV for complex, PVR, posterior breaks, giant tears.',
      examTip: 'Know the specific indications for each approach.',
    },
    {
      category: 'Macula',
      pearl: 'Bulls eye maculopathy differential: chloroquine/hydroxychloroquine toxicity, Stargardts, cone dystrophy, benign concentric annular macular dystrophy.',
      examTip: 'Always ask about medication history, especially plaquenil.',
    },
    {
      category: 'Macula',
      pearl: 'AREDS2 formula: Vitamins C (500mg), E (400IU), zinc (80mg), lutein (10mg), zeaxanthin (2mg). NO beta-carotene — lung cancer risk in smokers.',
      examTip: 'Know the exact doses and why beta-carotene was removed.',
    },
    {
      category: 'Macula',
      pearl: 'Central serous chorioretinopathy (CSR): type A personality, steroid use, pregnancy. Avoid steroids. Observation 3 months, then consider half-dose PDT or focal laser if persistent.',
      examTip: 'Always ask about steroid use (even nasal sprays, creams, inhalers).',
    },
    {
      category: 'Macula',
      pearl: 'Macular hole staging (Gass): Stage 1 (impending), Stage 2 (small full-thickness), Stage 3 (full-thickness + operculum), Stage 4 (full-thickness + PVD). PPV + ILM peel + gas for stages 2-4.',
      examTip: 'Know the staging system and surgical indications.',
    },
    {
      category: 'Vitreoretinal',
      pearl: 'PVR (proliferative vitreoretinopathy): most common cause of RD repair failure. Risk factors: large/multiple breaks, vitreous hemorrhage, choroidal detachment, chronic detachment.',
      examTip: 'Know PVR staging and when silicone oil is preferred over gas.',
    },
    {
      category: 'Uveitis',
      pearl: 'Toxoplasmosis: Classic "headlight in fog" appearance. Treat with triple therapy (pyrimethamine + sulfadiazine + folinic acid) or TMP-SMX if near disc/macula.',
      examTip: 'Know when to treat vs observe (threat to macula or optic nerve).',
    },
    {
      category: 'Uveitis',
      pearl: 'CMV retinitis: "pizza pie" fundus (hemorrhages + necrosis). Treatment: IV ganciclovir or oral valganciclovir. Intravitreal ganciclovir for bilateral or when systemic not possible.',
      examTip: 'IRIS (immune recovery uveitis) can occur when CD4 count improves.',
    },
    {
      category: 'Oncology',
      pearl: 'Choroidal nevus vs melanoma: Use the mnemonic TFSOM (To Find Small Ocular Melanoma) - Thickness >2mm, Fluid (SRF), Symptoms, Orange pigment, Margin touching disc.',
      examTip: 'This mnemonic impresses examiners and helps organize your answer.',
    },
    {
      category: 'Oncology',
      pearl: 'COMS study: Small melanomas = observe. Medium melanomas = plaque brachytherapy (I-125) vs enucleation — no survival difference. Large melanomas = enucleation (pre-enucleation radiation did NOT improve survival).',
      examTip: 'Know the COMS criteria for small/medium/large and the treatment for each.',
    },
    {
      category: 'Retina',
      pearl: 'Sickle cell retinopathy: sea fan neovascularization at the junction of perfused and non-perfused retina. Laser the neovascularization, not the entire periphery. Avoid scleral buckling (risk of anterior segment ischemia).',
      examTip: 'Know the unique treatment considerations and surgical risks in sickle cell patients.',
    },
  ],
  'Neuro-Ophthalmology and Orbit': [
    {
      category: 'Neuro',
      pearl: 'Third nerve palsy with pupil involvement: MUST rule out posterior communicating artery aneurysm with urgent CTA/MRA. This is a neurosurgical emergency.',
      examTip: 'Never miss the pupil-involving CN3 palsy - this is a classic board question.',
    },
    {
      category: 'Neuro',
      pearl: 'Sixth nerve palsy: most common cranial nerve palsy. Causes vary by age — children: increased ICP (tumor), adults: microvascular (DM/HTN), elderly: mass lesion.',
      examTip: 'Always consider increased ICP in children with CN6 palsy.',
    },
    {
      category: 'Neuro',
      pearl: 'Fourth nerve palsy: most common cause of vertical diplopia. Parks 3-step test: hypertropia, worse in contralateral gaze, worse with ipsilateral head tilt. Head tilt test is the critical step.',
      examTip: 'Be able to perform the 3-step test smoothly.',
    },
    {
      category: 'Neuro',
      pearl: 'Horner syndrome workup: cocaine test confirms, hydroxyamphetamine localizes (pre vs postganglionic). Always image the sympathetic chain from hypothalamus to T2.',
      examTip: 'Know the pharmacologic testing and the three-neuron pathway.',
    },
    {
      category: 'Neuro',
      pearl: 'Horner + ipsilateral neck/face pain = carotid dissection until proven otherwise. Urgent CTA or MRA of the neck. Can occur spontaneously or after minor trauma.',
      examTip: 'This is a can-not-miss diagnosis — carotid dissection can cause stroke.',
    },
    {
      category: 'Neuro',
      pearl: 'GCA: ESR (often >50) + CRP + CBC (thrombocytosis). Start high-dose IV methylprednisolone BEFORE temporal artery biopsy. Biopsy within 2 weeks of starting steroids.',
      examTip: 'NEVER delay treatment waiting for biopsy — treating on suspicion is the standard of care.',
    },
    {
      category: 'Neuro',
      pearl: 'NAION vs GCA-AION: NAION has altitudinal field loss, small "disc at risk" (no cup), usually painless. GCA-AION has chalky white disc edema, profound vision loss, systemic symptoms.',
      examTip: 'Age >50 with any AION = must rule out GCA.',
    },
    {
      category: 'Orbit',
      pearl: 'Orbital cellulitis: Distinguish from preseptal by looking for proptosis, restricted motility, decreased vision, RAPD. CT orbits with contrast is essential.',
      examTip: 'Know when to admit (orbital) vs treat outpatient (preseptal).',
    },
    {
      category: 'Neuro',
      pearl: 'Optic neuritis: MRI brain with contrast for MS plaques. Treat per ONTT protocol: IV methylprednisolone 250mg q6h x 3 days, then oral prednisone taper. Never oral steroids alone.',
      examTip: 'Knowing the ONTT is essential - oral steroids alone increased recurrence.',
    },
    {
      category: 'Neuro',
      pearl: 'IIH (pseudotumor cerebri): modified Dandy criteria — elevated OP (>25 cmH2O), normal CSF composition, no mass on MRI. Treatment: weight loss, acetazolamide. ONSF if vision threatened.',
      examTip: 'Always check MRV to rule out venous sinus thrombosis, which can mimic IIH.',
    },
    {
      category: 'Neuro',
      pearl: 'Myasthenia gravis: Cogan lid twitch sign, curtain sign, ice test (2 min of ice on ptosis). AChR antibodies (85%), anti-MuSK if seronegative. CT chest for thymoma.',
      examTip: 'Know the bedside tests and when to order AChR vs anti-MuSK antibodies.',
    },
    {
      category: 'Neuro',
      pearl: 'Internuclear ophthalmoplegia (INO): MLF lesion. Ipsilateral adduction deficit + contralateral abducting nystagmus. Bilateral INO in young person = MS. Unilateral in elderly = stroke.',
      examTip: 'Know the anatomy and the age-based differential.',
    },
    {
      category: 'Orbit',
      pearl: 'Thyroid eye disease: CAS (Clinical Activity Score) guides treatment. Active disease: steroids/radiation. Stable disease: surgical rehabilitation (decompression, strabismus, then lids).',
      examTip: 'Know the surgical sequence - it always goes decompression first, lids last.',
    },
    {
      category: 'Orbit',
      pearl: 'Teprotumumab (Tepezza): IGF-1R inhibitor, FDA-approved for active TED. Significant reduction in proptosis and diplopia. Know this as a game-changing treatment option.',
      examTip: 'Being aware of new treatments shows you are up to date.',
    },
    {
      category: 'Orbit',
      pearl: 'Orbital tumors in children: rhabdomyosarcoma (most common primary malignant), capillary hemangioma, dermoid cyst, optic nerve glioma (NF1), neuroblastoma metastasis.',
      examTip: 'Know the most common orbital tumors by age group.',
    },
    {
      category: 'Orbit',
      pearl: 'Cavernous sinus syndrome: CN3, CN4, CN6, V1, V2, and sympathetic fibers. Any combination of these suggests cavernous sinus pathology. MRI with cavernous sinus protocol.',
      examTip: 'Know the anatomy — what passes through the cavernous sinus vs the superior orbital fissure.',
    },
  ],
  'Pediatric Ophthalmology': [
    {
      category: 'Strabismus',
      pearl: 'Accommodative esotropia: Full cycloplegic refraction is essential. Correct hyperopia fully. Bifocals if high AC/A ratio with near deviation > distance deviation.',
      examTip: 'Always mention cycloplegic refraction (atropine 1% for children) as your first step.',
    },
    {
      category: 'Strabismus',
      pearl: 'Infantile esotropia: onset before 6 months, large angle (>30 PD), cross-fixation. Surgery by 12-24 months for best binocular outcomes.',
      examTip: 'Know the distinction from accommodative esotropia (later onset, smaller angle).',
    },
    {
      category: 'Strabismus',
      pearl: 'Intermittent exotropia: most common form of childhood exotropia. Observe if well-controlled, surgery if decompensating (increasing frequency, decreasing stereopsis).',
      examTip: 'Know the Newcastle control score for monitoring.',
    },
    {
      category: 'Strabismus',
      pearl: 'Duane syndrome Type 1 (most common): limited abduction with globe retraction on adduction. Usually sporadic, unilateral, left eye. Usually does not require surgery unless significant face turn.',
      examTip: 'Know all 3 types and when surgery is indicated.',
    },
    {
      category: 'Pediatric',
      pearl: 'Leukocoria differential: Retinoblastoma (most important to rule out), PHPV/PFV, Coats disease, cataract, ROP, toxocariasis, retinal detachment.',
      examTip: 'Start with retinoblastoma - missing it is never acceptable.',
    },
    {
      category: 'Pediatric',
      pearl: 'Retinoblastoma: NEVER biopsy intraocularly (tumor seeding). Diagnosis is clinical + imaging (calcification on CT/ultrasound). Trilateral RB: bilateral RB + pinealoblastoma.',
      examTip: 'Suggesting intraocular biopsy for suspected RB is a FATAL FLAW.',
    },
    {
      category: 'Pediatric',
      pearl: 'Congenital glaucoma: Classic triad of epiphora, photophobia, blepharospasm. EUA for corneal diameter (>12mm), IOP, gonioscopy. Surgery (goniotomy/trabeculotomy) is first-line.',
      examTip: 'Medical therapy alone is insufficient - surgery is the definitive treatment.',
    },
    {
      category: 'Pediatric',
      pearl: 'Amblyopia treatment: Patch the better-seeing eye 2-6 hours/day depending on severity. Alternative: atropine penalization. Critical period for treatment is before age 7-8.',
      examTip: 'Know the PEDIG studies on patching hours and atropine vs patching.',
    },
    {
      category: 'Pediatric',
      pearl: 'ROP screening: gestational age <=30 weeks OR birth weight <=1500g. Screen at 31 weeks PMA or 4 weeks chronological age, whichever is later. Type 1 ROP = treat (laser or anti-VEGF).',
      examTip: 'Know the screening criteria, the classification system, and treatment indications.',
    },
    {
      category: 'Pediatric',
      pearl: 'Ophthalmia neonatorum: day 1 = chemical (silver nitrate), day 2-5 = gonococcal (hyperacute, emergency), day 5-14 = chlamydial (most common infectious). Treat GC with IV ceftriaxone, chlamydia with oral erythromycin.',
      examTip: 'Know the timeline-based differential — the timing of onset is the key clue.',
    },
    {
      category: 'Pediatric',
      pearl: 'Congenital nasolacrimal duct obstruction: 90% resolve by age 12 months with conservative management (digital massage, warm compresses). Probing if persistent after 12 months.',
      examTip: 'Know when to probe vs continue conservative management.',
    },
    {
      category: 'Strabismus',
      pearl: 'Brown syndrome: Limited elevation in adduction. Distinguish from IO palsy (which has limited elevation in adduction AND excyclotorsion).',
      examTip: 'Know forced duction testing interpretation.',
    },
    {
      category: 'Pediatric',
      pearl: 'Congenital cataracts: URGENT referral — operate within 6-8 weeks for unilateral, 8-10 weeks for bilateral to prevent amblyopia. Aphakic contact lens in infants; IOL typically after age 1-2.',
      examTip: 'Know the timing of surgery and when IOL implantation is appropriate.',
    },
  ],
  'Optics': [
    {
      category: 'Refraction',
      pearl: 'Transposition: To convert plus to minus cylinder, add cylinder to sphere, change sign of cylinder, change axis by 90 degrees.',
      examTip: 'Be able to do this quickly - its a common practical question.',
    },
    {
      category: 'Low Vision',
      pearl: 'Low vision aids: Magnification = Desired acuity / Current acuity. For near: M = D/4 where D is diopters of add. Telescope magnification = -Dobj/Deyepiece.',
      examTip: 'Know the formulas and be able to calculate on the spot.',
    },
    {
      category: 'IOL',
      pearl: 'IOL calculation post-refractive surgery: Use adjusted K values. Methods: clinical history, contact lens over-refraction, or newer formulas (Barrett True-K, Haigis-L).',
      examTip: 'This is a frequently tested topic. Know at least 2-3 methods.',
    },
    {
      category: 'IOL',
      pearl: 'SRK/T: standard for average eyes. Holladay 1: short eyes. Haigis: long and short eyes. Barrett Universal II: all eye lengths. Always use multiple formulas and compare.',
      examTip: 'Know which formula to use based on axial length.',
    },
    {
      category: 'IOL',
      pearl: 'Sulcus IOL: reduce power by 0.5-1.0 D compared to in-the-bag IOL. Consider optic capture to prevent iris chafe. Avoid 3-piece acrylic in the sulcus (not designed for it).',
      examTip: 'Know the power adjustment for sulcus placement — this comes up in complication scenarios.',
    },
    {
      category: 'Instruments',
      pearl: 'Geneva lens clock: Measures lens surface curvature. Three-pronged device with central movable pin. Used to determine base curve of spectacle lenses.',
      examTip: 'Be familiar with common ophthalmic instruments and their uses.',
    },
    {
      category: 'Instruments',
      pearl: 'Lensometer (focimeter): measures power, cylinder axis, prism, and optical center of spectacle lenses. Start with the most plus power (find the sphere first), then refine cylinder.',
      examTip: 'Know the step-by-step lensometer technique.',
    },
    {
      category: 'Optics',
      pearl: 'Spherical aberration: Peripheral rays refracted more than paraxial rays. Managed with aspheric lens designs. Relevant for IOL selection.',
      examTip: 'Understand the clinical relevance of optical aberrations.',
    },
    {
      category: 'Optics',
      pearl: 'Chromatic aberration: shorter wavelengths refracted more (blue bends most). Duochrome test uses this: if red is clearer, add minus; if green is clearer, add plus (or reduce minus).',
      examTip: 'Know the duochrome test and the principle behind it.',
    },
    {
      category: 'Prisms',
      pearl: 'Prentice rule: Prism (diopters) = decentration (cm) x lens power (D). Used to calculate induced prism from lens decentration. Critical for understanding unwanted prismatic effects.',
      examTip: 'Know when this matters clinically: bifocal segment placement, progressive lens fitting.',
    },
    {
      category: 'Prisms',
      pearl: 'Fresnel prisms: press-on prisms for temporary correction. Useful for acute diplopia, diagnostic trial before surgery. Degrade image quality at high powers.',
      examTip: 'Know the advantages and limitations of Fresnel vs ground-in prisms.',
    },
    {
      category: 'Refraction',
      pearl: 'Jackson cross-cylinder (JCC): Used to refine cylinder power and axis. Flip shows two choices - patient picks the clearer one. For axis: straddle the current axis. For power: align with the current axis.',
      examTip: 'Understand the step-by-step procedure and when to switch from axis to power refinement.',
    },
    {
      category: 'Contact Lens',
      pearl: 'Contact lens fitting: base curve should be slightly flatter than central K reading. Fluorescein pattern: ideal = central alignment with edge clearance. Too flat = central touch with edge pooling. Too steep = central pooling with edge touch/lift-off.',
      examTip: 'Know the fluorescein patterns and what each indicates.',
    },
    {
      category: 'Optics',
      pearl: 'Vergence formula: V = U + P (V = image vergence, U = object vergence, P = lens power). Everything in diopters. Negative vergence = diverging, positive = converging.',
      examTip: 'This fundamental formula underlies most optics calculations.',
    },
    {
      category: 'Refraction',
      pearl: 'Retinoscopy: with motion = add plus (or you are working outside your working distance). Against motion = add minus. Neutral point = no motion = endpoint.',
      examTip: 'Always subtract your working distance lens from the final retinoscopy result.',
    },
  ],
};

// Additional high-yield exam strategy pearls
export const ADVANCED_STRATEGY_PEARLS: TeachingPearl[] = [
  {
    category: 'Exam Technique',
    pearl: 'When the examiner says "anything else?" they are almost always hinting that you missed something important. Pause, reconsider your differential, and think about what you may have overlooked.',
    examTip: 'This is a gift from the examiner - use it.',
  },
  {
    category: 'Exam Technique',
    pearl: 'Never say "I dont know" outright. Instead, reason through it: "I would approach this systematically by considering..." Even partial credit matters.',
    examTip: 'Examiners give credit for clinical reasoning even without the exact answer.',
  },
  {
    category: 'Exam Technique',
    pearl: 'If you realize you made an error, correct yourself: "Actually, on reflection, I would also consider..." Self-correction shows clinical maturity.',
    examTip: 'Self-correction is viewed more favorably than not recognizing the error.',
  },
  {
    category: 'Surgical',
    pearl: 'For any surgical complication question, always address: immediate management, short-term follow-up, long-term prognosis, and informed consent considerations.',
    examTip: 'Showing you can manage complications demonstrates surgical maturity.',
  },
  {
    category: 'Surgical',
    pearl: 'Retained lens fragments after cataract surgery: small fragments may be observed. Large or nuclear fragments = urgent PPV referral. Start topical steroid + cycloplegic. Monitor IOP.',
    examTip: 'Know when to refer vs observe retained lens material.',
  },
  {
    category: 'Systemic Disease',
    pearl: 'For diabetes, hypertension, and autoimmune conditions affecting the eye, always mention: co-management with the appropriate specialist, systemic optimization, and the specific screening schedule.',
    examTip: 'Multidisciplinary care shows you practice comprehensive ophthalmology.',
  },
  {
    category: 'Systemic Disease',
    pearl: 'Hydroxychloroquine toxicity screening (AAO 2016): baseline exam, then annual screening after 5 years. SD-OCT + multifocal ERG + visual fields (10-2). Risk factors: >5 mg/kg/day, cumulative dose, renal disease.',
    examTip: 'Know the updated screening guidelines and the risk factors for toxicity.',
  },
  {
    category: 'Ethics/Communication',
    pearl: 'If asked about a complication or error, always include: honest disclosure to the patient, documentation, informed consent for next steps, and when to involve risk management.',
    examTip: 'Patient communication and ethics are scored - dont skip them.',
  },
  {
    category: 'Ethics/Communication',
    pearl: 'Informed consent discussion must include: nature of the procedure, risks, benefits, alternatives (including no treatment), and expected outcomes. Document the discussion.',
    examTip: 'Examiners want to hear that you discuss ALL options including observation.',
  },
  {
    category: 'Pharmacology',
    pearl: 'Topical steroid potency ladder: fluorometholone < loteprednol < prednisolone 0.12% < prednisolone 1% < difluprednate 0.05%. Choose based on needed potency and IOP risk.',
    examTip: 'Know the relative potencies and when to use each.',
  },
  {
    category: 'Pharmacology',
    pearl: 'Anti-VEGF agents: bevacizumab (off-label, cheapest), ranibizumab (FDA-approved), aflibercept (FDA-approved, higher binding affinity), faricimab (bispecific: VEGF-A + Ang-2), brolucizumab (risk of vasculitis).',
    examTip: 'Know the differences between agents and the landmark trials for each.',
  },
  {
    category: 'Landmark Trials',
    pearl: 'Must-know landmark trials: ONTT (optic neuritis), EVS (endophthalmitis), CATT (AMD), DRCR.net (DME/DR), AREDS/AREDS2 (AMD supplements), OHTS (ocular hypertension), COMS (choroidal melanoma), PEDIG (amblyopia), IIHTT (IIH).',
    examTip: 'For each trial, know: what was studied, key inclusion criteria, main findings, and clinical implications.',
  },
];

export function getPearlsForCase(subspecialty: string, title: string): TeachingPearl[] {
  const pearls: TeachingPearl[] = [];

  // Add relevant subspecialty pearls based on title keyword matching
  const specPearls = SUBSPECIALTY_PEARLS[subspecialty] || [];
  pearls.push(...specPearls.filter(p => {
    const titleLower = title.toLowerCase();
    const pearlLower = p.pearl.toLowerCase();
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
    return titleWords.some(w => pearlLower.includes(w));
  }));

  // If no specific match, include first 2 general pearls for the subspecialty
  if (pearls.length === 0 && specPearls.length > 0) {
    pearls.push(specPearls[0], specPearls[Math.min(1, specPearls.length - 1)]);
  }

  // Include one general strategy pearl and one advanced pearl
  const strategyPearl = EXAM_STRATEGY_PEARLS[Math.floor(Math.random() * EXAM_STRATEGY_PEARLS.length)];
  const advancedPearl = ADVANCED_STRATEGY_PEARLS[Math.floor(Math.random() * ADVANCED_STRATEGY_PEARLS.length)];
  pearls.push(strategyPearl, advancedPearl);

  return pearls;
}

// ABO 8-ELEMENT PMP FRAMEWORK
// Photo phase = Element 1 (DESCRIBE) — scored separately
// Q1-Q6 map to Elements 2-8 (with Diagnosis implicit in Differential)
//
// Element 1: DESCRIBE — "Describe what you see" (photo phase, not numbered)
// Element 2: HISTORY (Q2) — focused, hypothesis-driven questions
// Element 3: EXAM (Q3) — VA, pupils, IOP, motility, CVF, slit lamp, DFE
// Element 4: DIFFERENTIAL (Q1) — 3-4 entities, ordered, include can't-miss
// Element 5: WORKUP (Q4) — targeted labs/imaging, explain why each is ordered
// Element 6: DIAGNOSIS — implicit (examiner confirms after differential)
// Element 7: MANAGEMENT (Q5) — drug, dose, procedure, counsel, refer
// Element 8: FOLLOW-UP (Q6) — explicit interval + what to check (HEAVILY WEIGHTED)
//
// Management + Follow-up = ~40% of ABO score — highest yield area
export const QUESTION_TYPE_INFO: { [key: number]: { name: string; description: string; tips: string } } = {
  1: {
    name: 'Differential Diagnosis',
    description: '3-4 entities, ordered by likelihood. Always include the can\'t-miss life-, eye-, or sight-threatening diagnosis.',
    tips: 'Lead with the most likely first, then life/sight-threatening rule-outs (GCA, retinoblastoma, open globe). Include 3-5 differentials ranked by frequency. After you give your differential, the examiner will usually confirm the diagnosis and move on. Having it first shows confidence.',
  },
  2: {
    name: 'Focused History',
    description: 'Ask focused, hypothesis-driven questions — NOT a full review of systems.',
    tips: 'Target onset, duration, pain, vision change, trauma, systemic disease (DM, HTN, autoimmune), meds (steroids, HCQ, tamsulosin, anticoagulants), family history. Each question should help narrow your differential. Quality over quantity.',
  },
  3: {
    name: 'Targeted Examination',
    description: 'State what you want on exam — VA, pupils (RAPD), IOP, motility, CVF, slit lamp, DFE — tailored to the complaint.',
    tips: 'Always start with: VA, pupils with swinging flashlight (RAPD), IOP, confrontation fields. Then targeted exam based on suspected diagnosis. Name specific signs: Shafer sign, Seidel test, forced duction, NVI on gonioscopy. The examiner scores your PROCESS.',
  },
  4: {
    name: 'Targeted Workup',
    description: 'Targeted labs/imaging (OCT, FA, B-scan, MRI, CBC, ESR/CRP) — explain WHY each is ordered.',
    tips: 'Order ONLY pertinent tests — shotgunning loses points. For each test, state what you expect to find and how it changes management. Non-invasive before invasive. Sometimes "no additional testing" IS the right answer.',
  },
  5: {
    name: 'Management',
    description: 'Specific treatment: drug name + dose + route + frequency. What to counsel and when to refer/co-manage.',
    tips: 'Management is ~30% of your score alone. Be specific: "prednisolone 1% q1h" not "steroid drops." Least to most invasive UNLESS emergency. Reference landmark trials (EVS, ONTT, DRCR.net). Anticipate curveballs: allergies, complications, treatment failure. Always mention what you\'d counsel the patient.',
  },
  6: {
    name: 'Follow-Up',
    description: 'Explicit follow-up interval and what you would check. This is the step most candidates forget — it is HEAVILY weighted.',
    tips: 'State a SPECIFIC interval: "1 week" not "soon." State what you would check at follow-up. Include: return precautions (new floaters, vision loss, increasing pain), activity restrictions, driving restrictions if applicable. Follow-up accounts for ~20% of the question score and is the most commonly omitted element.',
  },
};
