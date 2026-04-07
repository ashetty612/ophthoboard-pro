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
  ],
};

export function getPearlsForCase(subspecialty: string, title: string): TeachingPearl[] {
  const pearls: TeachingPearl[] = [];

  // Add relevant subspecialty pearls
  const specPearls = SUBSPECIALTY_PEARLS[subspecialty] || [];
  pearls.push(...specPearls.filter(p => {
    const titleLower = title.toLowerCase();
    const pearlLower = p.pearl.toLowerCase();
    // Check for keyword overlap between case title and pearl
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
    return titleWords.some(w => pearlLower.includes(w));
  }));

  // If no specific match, include first 2 general pearls for the subspecialty
  if (pearls.length === 0 && specPearls.length > 0) {
    pearls.push(specPearls[0]);
  }

  // Always include one general strategy pearl
  pearls.push(EXAM_STRATEGY_PEARLS[Math.floor(Math.random() * EXAM_STRATEGY_PEARLS.length)]);

  return pearls;
}

// ABO Question type descriptions for educational context
export const QUESTION_TYPE_INFO: { [key: number]: { name: string; description: string; tips: string } } = {
  1: {
    name: 'Differential Diagnosis',
    description: 'List the most likely diagnoses from most to least probable.',
    tips: 'Lead with the most likely diagnosis. Include 3-5 differentials. Consider common and must-not-miss diagnoses.',
  },
  2: {
    name: 'Patient History',
    description: 'What targeted questions would you ask to narrow your differential?',
    tips: 'Focus on symptoms, timing, associated conditions, medications, family history, and social history relevant to the differential.',
  },
  3: {
    name: 'Clinical Examination',
    description: 'What specific exam findings are you looking for?',
    tips: 'Be systematic. Start with observation, then targeted examination. Mention specific signs pathognomonic for your top diagnosis.',
  },
  4: {
    name: 'Diagnostic Testing',
    description: 'What tests would confirm or rule out your leading diagnosis?',
    tips: 'Start with non-invasive tests. Include specific test names (not just "blood work"). Know what results you expect.',
  },
  5: {
    name: 'Treatment & Management',
    description: 'How would you treat this condition?',
    tips: 'Be specific: drug names, doses, frequencies, duration. Start conservative, escalate as needed. Include follow-up plan.',
  },
  6: {
    name: 'Prognosis & Counseling',
    description: 'What do you tell the patient about their condition?',
    tips: 'Cover: natural history, expected outcomes, timeline, warning signs, lifestyle modifications, follow-up schedule.',
  },
};
