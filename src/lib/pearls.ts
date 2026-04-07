/**
 * Teaching Pearls & ABO Oral Boards Tips
 * These are evidence-based clinical pearls and examiner expectations
 * organized by question type and subspecialty.
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
];

// Subspecialty-specific pearls
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
      category: 'Glaucoma',
      pearl: 'Acute angle closure: Remember the sequence - lower IOP medically first (timolol, brimonidine, pilocarpine, acetazolamide, mannitol), then laser PI when cornea clears.',
      examTip: 'Know the order of treatments and dont forget to treat the fellow eye prophylactically.',
    },
    {
      category: 'Lens',
      pearl: 'Pseudoexfoliation: Always check for zonular weakness, phacodonesis, and increased IOP. Capsular tension ring may be needed during cataract surgery.',
      examTip: 'Mention the surgical implications to show you think ahead.',
    },
    {
      category: 'External Disease',
      pearl: 'Blepharitis is CONTROLLED, not CURED. Always counsel the patient about the chronic nature and maintenance therapy.',
      examTip: 'Patient counseling is scored - dont skip it.',
    },
    {
      category: 'Uveitis',
      pearl: 'For anterior uveitis, always consider systemic workup: HLA-B27, RPR/VDRL, FTA-ABS, chest X-ray, ACE level, CBC.',
      examTip: 'The examiner may ask about systemic associations - be prepared with a workup.',
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
      category: 'Macula',
      pearl: 'Bulls eye maculopathy differential: chloroquine/hydroxychloroquine toxicity, Stargardts, cone dystrophy, benign concentric annular macular dystrophy.',
      examTip: 'Always ask about medication history, especially plaquenil.',
    },
    {
      category: 'Vitreoretinal',
      pearl: 'Rhegmatogenous retinal detachment repair options: pneumatic retinopexy (superior breaks), scleral buckle (inferior, young patients), PPV (complex, PVR, posterior breaks).',
      examTip: 'Know the indications for each surgical approach.',
    },
    {
      category: 'Uveitis',
      pearl: 'Toxoplasmosis: Classic "headlight in fog" appearance. Treat with triple therapy (pyrimethamine + sulfadiazine + folinic acid) or TMP-SMX if near disc/macula.',
      examTip: 'Know when to treat vs observe (threat to macula or optic nerve).',
    },
    {
      category: 'Oncology',
      pearl: 'Choroidal nevus vs melanoma: Use the mnemonic TFSOM (To Find Small Ocular Melanoma) - Thickness >2mm, Fluid (SRF), Symptoms, Orange pigment, Margin touching disc.',
      examTip: 'This mnemonic impresses examiners and helps organize your answer.',
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
      pearl: 'Horner syndrome workup: cocaine test confirms, hydroxyamphetamine localizes (pre vs postganglionic). Always image the sympathetic chain from hypothalamus to T2.',
      examTip: 'Know the pharmacologic testing and the three-neuron pathway.',
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
      category: 'Orbit',
      pearl: 'Thyroid eye disease: CAS (Clinical Activity Score) guides treatment. Active disease: steroids/radiation. Stable disease: surgical rehabilitation (decompression, strabismus, then lids).',
      examTip: 'Know the surgical sequence - it always goes decompression first, lids last.',
    },
  ],
  'Pediatric Ophthalmology': [
    {
      category: 'Strabismus',
      pearl: 'Accommodative esotropia: Full cycloplegic refraction is essential. Correct hyperopia fully. Bifocals if high AC/A ratio with near deviation > distance deviation.',
      examTip: 'Always mention cycloplegic refraction (atropine 1% for children) as your first step.',
    },
    {
      category: 'Pediatric',
      pearl: 'Leukocoria differential: Retinoblastoma (most important to rule out), PHPV/PFV, Coats disease, cataract, ROP, toxocariasis, retinal detachment.',
      examTip: 'Start with retinoblastoma - missing it is never acceptable.',
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
      category: 'Strabismus',
      pearl: 'Brown syndrome: Limited elevation in adduction. Distinguish from IO palsy (which has limited elevation in adduction AND excyclotorsion).',
      examTip: 'Know forced duction testing interpretation.',
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
      category: 'Instruments',
      pearl: 'Geneva lens clock: Measures lens surface curvature. Three-pronged device with central movable pin. Used to determine base curve of spectacle lenses.',
      examTip: 'Be familiar with common ophthalmic instruments and their uses.',
    },
    {
      category: 'Optics',
      pearl: 'Spherical aberration: Peripheral rays refracted more than paraxial rays. Managed with aspheric lens designs. Relevant for IOL selection.',
      examTip: 'Understand the clinical relevance of optical aberrations.',
    },
    {
      category: 'Prisms',
      pearl: 'Prentice rule: Prism (diopters) = decentration (cm) x lens power (D). Used to calculate induced prism from lens decentration. Critical for understanding unwanted prismatic effects.',
      examTip: 'Know when this matters clinically: bifocal segment placement, progressive lens fitting.',
    },
    {
      category: 'Refraction',
      pearl: 'Jackson cross-cylinder (JCC): Used to refine cylinder power and axis. Flip shows two choices - patient picks the clearer one. For axis: straddle the current axis. For power: align with the current axis.',
      examTip: 'Understand the step-by-step procedure and when to switch from axis to power refinement.',
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
    category: 'Surgical',
    pearl: 'For any surgical complication question, always address: immediate management, short-term follow-up, long-term prognosis, and informed consent considerations.',
    examTip: 'Showing you can manage complications demonstrates surgical maturity.',
  },
  {
    category: 'Systemic Disease',
    pearl: 'For diabetes, hypertension, and autoimmune conditions affecting the eye, always mention: co-management with the appropriate specialist, systemic optimization, and the specific screening schedule.',
    examTip: 'Multidisciplinary care shows you practice comprehensive ophthalmology.',
  },
  {
    category: 'Ethics/Communication',
    pearl: 'If asked about a complication or error, always include: honest disclosure to the patient, documentation, informed consent for next steps, and when to involve risk management.',
    examTip: 'Patient communication and ethics are scored - dont skip them.',
  },
];

export function getPearlsForCase(subspecialty: string, title: string): TeachingPearl[] {
  const pearls: TeachingPearl[] = [];

  // Add relevant subspecialty pearls
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

  // Include one general strategy pearl
  const allStrategy = [...EXAM_STRATEGY_PEARLS, ...ADVANCED_STRATEGY_PEARLS];
  pearls.push(allStrategy[Math.floor(Math.random() * allStrategy.length)]);

  return pearls;
}

// ABO 8-Element PMP Framework — maps question numbers to structured answer sequence
export const QUESTION_TYPE_INFO: { [key: number]: { name: string; description: string; tips: string } } = {
  1: {
    name: 'Differential Diagnosis',
    description: 'List the most likely diagnoses from most to least probable.',
    tips: 'Lead with the most likely first, then life/sight-threatening rule-outs (GCA, retinoblastoma, open globe). Include 3-5 differentials ranked by frequency. Avoid over-differentiating with rare "zebras."',
  },
  2: {
    name: 'Patient History',
    description: 'What targeted questions would you ask to narrow your differential?',
    tips: 'Ask FOCUSED questions, not an exhaustive ROS. Target onset, duration, pain, PMH (DM, HTN, autoimmune), medications (steroids, hydroxychloroquine), family and social history. Hypothesis-driven, not shotgunning.',
  },
  3: {
    name: 'Clinical Examination',
    description: 'What specific exam findings are you looking for?',
    tips: 'Always start with VA, pupils (RAPD), IOP, confrontation fields. Name specific signs: Shafer sign, Seidel test, forced duction. The examiner scores your PROCESS, not just the finding.',
  },
  4: {
    name: 'Diagnostic Testing',
    description: 'What tests would confirm or rule out your leading diagnosis?',
    tips: 'Order ONLY pertinent tests — shotgunning loses points. Name specific tests: OCT, FFA, B-scan, CT/MRI. State what you expect each to show. Avoid invasive tests unless clearly indicated.',
  },
  5: {
    name: 'Treatment & Management',
    description: 'How would you treat this condition?',
    tips: 'Least to most invasive UNLESS emergency. Be specific: drug names, doses, frequencies, duration. Reference landmark trials (EVS, ONTT, DRCR.net). Anticipate curveballs: allergies, complications, treatment failure.',
  },
  6: {
    name: 'Prognosis & Counseling',
    description: 'What do you tell the patient about their condition?',
    tips: 'Cover: natural history, expected outcomes, warning signs for return, lifestyle changes, follow-up intervals. Discuss informed consent for procedures. Patient counseling IS scored — never skip it.',
  },
};
