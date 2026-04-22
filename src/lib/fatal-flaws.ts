/**
 * Fatal-Flaw Registry
 * -------------------
 * Curated list of must-not-miss items examiners fail candidates for missing.
 * Surfaced in CaseViewer's answer-reveal area as high-visibility alerts.
 *
 * Each entry represents a clinical scenario where missing the specified
 * diagnosis or action is considered a "fatal flaw" on the ABO oral exam —
 * vision- or life-threatening, and explicitly called out in examiner guides.
 */

export type FatalFlawSubspecialty =
  | 'Anterior Segment'
  | 'Posterior Segment'
  | 'Neuro-Ophthalmology and Orbit'
  | 'Pediatric Ophthalmology'
  | 'Optics'
  | 'General';

export interface FatalFlaw {
  id: string;
  subspecialty: FatalFlawSubspecialty;
  scenario: string;           // clinical trigger ("any older adult with sudden vision loss + headache")
  mustNotMiss: string;        // the diagnosis/action you MUST name
  whyCritical: string;        // vision/life-threatening rationale
  safetyNetPhrase: string;    // verbatim phrase to say on the exam
  immediateAction: string;    // first-step, same-day action
  triggerKeywords: string[];  // lowercase substrings matched against dx + title + Q5 answer
}

export const FATAL_FLAWS: FatalFlaw[] = [
  // ============================================================================
  // ANTERIOR SEGMENT
  // ============================================================================
  {
    id: 'as-open-globe',
    subspecialty: 'Anterior Segment',
    scenario: 'Any trauma with possible globe penetration (laceration, sharp object, hammering metal-on-metal)',
    mustNotMiss: 'Open globe rupture / intraocular foreign body',
    whyCritical: 'Extrusion of intraocular contents, endophthalmitis risk, vision-threatening.',
    safetyNetPhrase:
      '"No pressure on the eye — Fox shield only, NPO, IV antibiotics, tetanus update, CT orbits (no MRI if metallic FB possible), and urgent OR for exploration/repair."',
    immediateAction:
      'Rigid Fox shield, NPO, broad-spectrum IV antibiotics (vancomycin + ceftazidime), antiemetics, tetanus prophylaxis, CT orbits thin cuts.',
    triggerKeywords: [
      'open globe', 'ruptured globe', 'globe rupture', 'penetrating', 'perforating',
      'intraocular foreign body', 'iofb', 'hammer', 'metal on metal', 'laceration',
    ],
  },
  {
    id: 'as-infectious-keratitis',
    subspecialty: 'Anterior Segment',
    scenario: 'Any corneal ulcer/infiltrate, especially contact lens wearer',
    mustNotMiss: 'Bacterial or fungal keratitis — treat as infectious until cultures return',
    whyCritical: 'Progressive corneal melt, perforation, endophthalmitis risk within 24–48h.',
    safetyNetPhrase:
      '"I would scrape for Gram stain and culture BEFORE starting antibiotics, then start fortified vancomycin + tobramycin q1h around the clock."',
    immediateAction:
      'Corneal scrape → Gram + Giemsa + KOH + cultures (blood, chocolate, Sabouraud). Fortified abx q1h. Admit if sight-threatening central ulcer or non-compliant patient.',
    triggerKeywords: [
      'corneal ulcer', 'bacterial keratitis', 'microbial keratitis', 'fungal keratitis',
      'contact lens', 'acanthamoeba', 'infiltrate',
    ],
  },
  {
    id: 'as-hypopyon-endo',
    subspecialty: 'Anterior Segment',
    scenario: 'Hypopyon of any cause — do NOT anchor on uveitis',
    mustNotMiss: 'Infectious endophthalmitis',
    whyCritical: 'Missing endophthalmitis loses the eye within days.',
    safetyNetPhrase:
      '"Any hypopyon is endophthalmitis until proven otherwise — especially postop or after intravitreal injection. I\'d tap-and-inject without delay."',
    immediateAction:
      'Vitreous tap for culture/gram/PCR + intravitreal vancomycin 1mg/0.1mL + ceftazidime 2.25mg/0.1mL; consider vitrectomy if count-fingers or worse per EVS.',
    triggerKeywords: ['hypopyon', 'endophthalmitis', 'post-op infection', 'postoperative pain'],
  },
  {
    id: 'as-hzo-hutchinson',
    subspecialty: 'Anterior Segment',
    scenario: 'Herpes zoster ophthalmicus with tip-of-nose involvement (Hutchinson sign)',
    mustNotMiss: 'Nasociliary branch of V1 → high risk of corneal/uveal involvement',
    whyCritical: 'Chronic uveitis, stromal keratitis, secondary glaucoma, PORN in immunocompromised.',
    safetyNetPhrase:
      '"Hutchinson sign means high risk of ocular involvement — I\'d start oral acyclovir 800mg 5×/day within 72h and follow for uveitis, glaucoma, and keratitis."',
    immediateAction:
      'Oral valacyclovir 1g TID ×7d (or acyclovir 800mg 5×/day). Topical steroid ONLY if stromal/uveitic involvement. Check IOP. Dermatology/ID for postherpetic neuralgia.',
    triggerKeywords: ['herpes zoster', 'hzo', 'shingles', 'hutchinson', 'v1 distribution'],
  },
  {
    id: 'as-chemical-burn',
    subspecialty: 'Anterior Segment',
    scenario: 'Chemical splash to eye — alkali or acid',
    mustNotMiss: 'Limbal ischemia, pH not yet normalized',
    whyCritical: 'Seconds matter; limbal stem cell destruction is permanent.',
    safetyNetPhrase:
      '"Irrigate BEFORE history-taking — copious LR or saline, lid eversion, sweep fornices, continue until pH is 7.0–7.4 on two consecutive checks 5 minutes apart."',
    immediateAction:
      'Morgan lens or IV tubing with LR, ≥30 min irrigation, pH check. Roper-Hall/Dua grading. Topical steroid, antibiotic, cycloplegic, doxycycline, vitamin C, amniotic membrane if severe.',
    triggerKeywords: ['chemical burn', 'chemical injury', 'alkali burn', 'acid burn', 'limbal ischemia'],
  },
  {
    id: 'as-aacg',
    subspecialty: 'Anterior Segment',
    scenario: 'Elderly with acute unilateral red painful eye, nausea/vomiting, hazy cornea, mid-dilated pupil',
    mustNotMiss: 'Acute angle-closure glaucoma',
    whyCritical: 'IOP >40–60 mmHg → ischemic optic nerve damage in hours.',
    safetyNetPhrase:
      '"Any elderly patient with nausea and a red eye gets tonometry before I do anything else — I would not want to miss angle closure."',
    immediateAction:
      'Lower IOP: topical β-blocker + α-agonist + CAI; oral acetazolamide 500mg; IV mannitol if refractory. Pilocarpine 1–2% once IOP breaks. Laser PI same day bilaterally.',
    triggerKeywords: ['angle closure', 'acute angle closure', 'aacg', 'pupillary block', 'mid-dilated pupil'],
  },
  {
    id: 'as-hlab27-uveitis',
    subspecialty: 'Anterior Segment',
    scenario: 'Young male with recurrent unilateral acute anterior uveitis ± back pain / IBD / psoriasis',
    mustNotMiss: 'HLA-B27–associated spondyloarthropathy workup',
    whyCritical: 'Undiagnosed systemic disease progresses; ocular complications from inadequate control.',
    safetyNetPhrase:
      '"I\'d send HLA-B27, HLA-B51, ask about back pain/morning stiffness, GI symptoms, psoriasis, and refer to rheumatology."',
    immediateAction:
      'Topical prednisolone q1h + cycloplegia. HLA-B27, CBC, ESR/CRP, ACE, lysozyme, RPR, FTA-ABS, QuantiFERON, CXR. Rheumatology referral.',
    triggerKeywords: ['anterior uveitis', 'iritis', 'iridocyclitis', 'hla-b27', 'ankylosing', 'back pain'],
  },
  {
    id: 'as-lens-induced-glaucoma',
    subspecialty: 'Anterior Segment',
    scenario: 'Hypermature cataract + acute IOP rise',
    mustNotMiss: 'Phacolytic, phacomorphic, or lens-particle glaucoma',
    whyCritical: 'Inflammatory response won\'t resolve without lens removal.',
    safetyNetPhrase:
      '"The lens itself is the problem — medical IOP lowering and steroids are temporizing; definitive treatment is urgent cataract extraction."',
    immediateAction:
      'Aqueous suppressants, topical steroid and cycloplegic to control inflammation, then cataract extraction within days.',
    triggerKeywords: ['phacolytic', 'phacomorphic', 'lens-induced', 'hypermature cataract', 'lens particle'],
  },

  // ============================================================================
  // POSTERIOR SEGMENT
  // ============================================================================
  {
    id: 'ps-crao-gca',
    subspecialty: 'Posterior Segment',
    scenario: 'Any older adult (>50) with sudden painless monocular vision loss',
    mustNotMiss: 'Giant cell arteritis (GCA) — even with a seemingly embolic CRAO',
    whyCritical: 'Fellow-eye blindness within days if untreated; life-threatening stroke risk.',
    safetyNetPhrase:
      '"I would check STAT ESR, CRP, and platelet count, ask about jaw claudication, scalp tenderness, polymyalgia symptoms, and start high-dose IV methylprednisolone 1g/day while arranging temporal artery biopsy within 1–2 weeks."',
    immediateAction:
      'ESR, CRP, platelets same-visit. If any GCA suspicion → IV methylprednisolone 1g × 3 days then oral prednisone 60–80mg; TAB within 2 weeks.',
    triggerKeywords: [
      'crao', 'central retinal artery', 'branch retinal artery', 'sudden vision loss',
      'giant cell arteritis', 'gca', 'temporal arteritis', 'aion', 'anterior ischemic',
      'cherry red spot', 'amaurosis',
    ],
  },
  {
    id: 'ps-flashes-floaters-rd',
    subspecialty: 'Posterior Segment',
    scenario: 'New onset flashes/floaters',
    mustNotMiss: 'Retinal break or rhegmatogenous retinal detachment',
    whyCritical: 'Macula-on RD becomes macula-off within hours-days.',
    safetyNetPhrase:
      '"I\'d do a dilated exam with scleral depression 360° to rule out a peripheral tear or detachment before calling it posterior vitreous detachment."',
    immediateAction:
      'Dilated fundus exam with scleral depression today. If tear without RD: laser/cryo barricade within 24–48h. If macula-on RD: urgent vitreoretinal referral same day.',
    triggerKeywords: ['flashes', 'floaters', 'pvd', 'posterior vitreous detachment', 'retinal tear', 'retinal detachment', 'shafer sign'],
  },
  {
    id: 'ps-post-op-endo',
    subspecialty: 'Posterior Segment',
    scenario: 'Any pain / vision loss after intraocular surgery or intravitreal injection',
    mustNotMiss: 'Acute postoperative endophthalmitis',
    whyCritical: 'Time from onset to tap-and-inject predicts visual outcome (EVS).',
    safetyNetPhrase:
      '"Postop pain is endophthalmitis until proven otherwise — I\'d do a vitreous tap with intravitreal vancomycin and ceftazidime today, not tomorrow."',
    immediateAction:
      'Tap-and-inject (vancomycin 1mg/ceftazidime 2.25mg). Vitrectomy if visual acuity ≤ hand motion per EVS. Re-inject in 48–72h if no improvement.',
    triggerKeywords: ['endophthalmitis', 'post-op', 'postoperative', 'post-injection', 'anti-vegf', 'intravitreal'],
  },
  {
    id: 'ps-pdr-nvi',
    subspecialty: 'Posterior Segment',
    scenario: 'Diabetic patient with new iris or disc neovascularization',
    mustNotMiss: 'High-risk proliferative diabetic retinopathy → impending vitreous hemorrhage / NVG',
    whyCritical: 'Neovascular glaucoma and traction RD follow quickly without PRP.',
    safetyNetPhrase:
      '"New NVI or NVD is high-risk PDR — I\'d start PRP or anti-VEGF today and bring the patient back in 1–2 weeks."',
    immediateAction:
      'Pan-retinal photocoagulation (1500–2000 spots) over 1–3 sessions OR anti-VEGF loading doses. Check IOP, treat NVG aggressively.',
    triggerKeywords: ['proliferative diabetic', 'pdr', 'neovascularization', 'nvi', 'nvd', 'rubeosis', 'neovascular glaucoma'],
  },
  {
    id: 'ps-shaken-baby',
    subspecialty: 'Posterior Segment',
    scenario: 'Infant with multilayered retinal hemorrhages, especially bilateral',
    mustNotMiss: 'Abusive head trauma (shaken baby syndrome)',
    whyCritical: 'Reportable to Child Protective Services; prevents further abuse.',
    safetyNetPhrase:
      '"Multilayered retinal hemorrhages in a young child raise concern for non-accidental trauma — I\'d involve the child-abuse team and inform CPS per mandatory reporting laws."',
    immediateAction:
      'Document with RetCam photos. Neuroimaging (MRI brain + SDH protocol). Child-abuse pediatrics consult. Mandatory CPS report.',
    triggerKeywords: ['shaken baby', 'abusive head', 'non-accidental', 'retinal hemorrhage infant', 'subdural'],
  },

  // ============================================================================
  // NEURO-OPHTHALMOLOGY / ORBIT
  // ============================================================================
  {
    id: 'no-optic-neuritis-ontt',
    subspecialty: 'Neuro-Ophthalmology and Orbit',
    scenario: 'Young woman with subacute monocular vision loss, pain on eye movement, RAPD',
    mustNotMiss: 'Do NOT start oral prednisone alone — per ONTT this worsens relapse rate',
    whyCritical: 'Oral prednisone alone (without IVMP) increases 2-year MS relapse rate.',
    safetyNetPhrase:
      '"Per ONTT, I would not start oral prednisone alone — options are observation or IV methylprednisolone 250mg q6h × 3 days then oral taper. I\'d also get an MRI brain/orbits to risk-stratify for MS."',
    immediateAction:
      'MRI brain + orbits with contrast + FLAIR. IV methylprednisolone 1g/day × 3d if needed for rapid recovery or high MS risk. Neurology referral. Consider NMO/MOG if atypical.',
    triggerKeywords: ['optic neuritis', 'retrobulbar neuritis', 'ontt', 'demyelinating'],
  },
  {
    id: 'no-horner-dissection',
    subspecialty: 'Neuro-Ophthalmology and Orbit',
    scenario: 'Acute painful Horner syndrome (ptosis + miosis + anhidrosis)',
    mustNotMiss: 'Carotid artery dissection',
    whyCritical: 'Stroke risk within hours-days without antithrombotic therapy.',
    safetyNetPhrase:
      '"A painful Horner is a dissection until proven otherwise — I\'d get emergent CTA or MRA of the neck and head today."',
    immediateAction:
      'Same-day CTA/MRA head and neck. If dissection confirmed → antiplatelet or anticoagulation per neurology/vascular.',
    triggerKeywords: ['horner', 'horners syndrome', 'anisocoria', 'ptosis miosis', 'neck pain'],
  },
  {
    id: 'no-cn3-pcom',
    subspecialty: 'Neuro-Ophthalmology and Orbit',
    scenario: 'Pupil-involving third nerve palsy (ptosis + down-and-out + dilated pupil)',
    mustNotMiss: 'Posterior communicating artery aneurysm',
    whyCritical: 'Aneurysm rupture → SAH → catastrophic.',
    safetyNetPhrase:
      '"Any pupil-involving CN3 palsy needs emergent CTA or MRA today to rule out a PCom aneurysm — even if the patient is a vasculopath."',
    immediateAction:
      'Stat CTA (or MRA) head. Neurosurgery consult if aneurysm found. If truly pupil-sparing and vasculopath: observe with close follow-up.',
    triggerKeywords: ['third nerve palsy', 'oculomotor palsy', 'cn3', 'cn iii', 'pcom', 'posterior communicating'],
  },
  {
    id: 'no-papilledema-mass',
    subspecialty: 'Neuro-Ophthalmology and Orbit',
    scenario: 'Bilateral optic disc edema with normal vision and headache',
    mustNotMiss: 'Intracranial mass or venous sinus thrombosis before diagnosing IIH',
    whyCritical: 'LP in the setting of a mass can cause herniation; venous thrombosis needs anticoagulation.',
    safetyNetPhrase:
      '"I\'d get MRI brain with contrast AND MR venogram before LP, to rule out a mass lesion or cerebral venous sinus thrombosis — then LP for opening pressure to confirm IIH."',
    immediateAction:
      'MRI + MRV urgently. LP for opening pressure + CSF studies only after imaging. Acetazolamide 1–2g/day (IIHTT). Weight loss. ONSF or shunt if fulminant.',
    triggerKeywords: ['papilledema', 'disc edema', 'iih', 'idiopathic intracranial', 'pseudotumor cerebri'],
  },
  {
    id: 'no-ted-dysthyroid-opticneuropathy',
    subspecialty: 'Neuro-Ophthalmology and Orbit',
    scenario: 'Thyroid eye disease with decreased vision, color desaturation, or APD',
    mustNotMiss: 'Dysthyroid optic neuropathy (DON) from apical compression',
    whyCritical: 'Irreversible vision loss within days without decompression.',
    safetyNetPhrase:
      '"Any TED patient with a color-vision drop or APD gets high-dose IV methylprednisolone pulses plus urgent orbital decompression consult."',
    immediateAction:
      'IV methylprednisolone 500mg–1g weekly (EUGOGO). Urgent orbital decompression if steroids fail. Baseline/follow-up HVF + color plates.',
    triggerKeywords: ['thyroid eye disease', 'ted', 'graves ophthalmopathy', 'dysthyroid', 'compressive optic neuropathy'],
  },
  {
    id: 'no-orbital-cellulitis-cst',
    subspecialty: 'Neuro-Ophthalmology and Orbit',
    scenario: 'Proptosis + pain + fever + decreased motility',
    mustNotMiss: 'Orbital cellulitis with possible cavernous sinus thrombosis',
    whyCritical: 'CST is life-threatening; subperiosteal abscess needs drainage.',
    safetyNetPhrase:
      '"I\'d admit, get CT orbits/sinuses and MRV to rule out cavernous sinus thrombosis, start IV vancomycin + ceftriaxone + metronidazole, and consult ENT for sinus drainage."',
    immediateAction:
      'Admit. CT orbits + MRV. IV vancomycin + ceftriaxone + metronidazole. ENT + neurosurgery (if CST). Orbital decompression if SPA or worsening vision.',
    triggerKeywords: ['orbital cellulitis', 'proptosis', 'subperiosteal abscess', 'cavernous sinus thrombosis'],
  },
  {
    id: 'no-gca-aion',
    subspecialty: 'Neuro-Ophthalmology and Orbit',
    scenario: 'Patient >50 with acute monocular vision loss, disc edema, chalky-pale disc',
    mustNotMiss: 'Arteritic AION from GCA',
    whyCritical: 'Fellow-eye loss within days; stroke risk.',
    safetyNetPhrase:
      '"I\'m going to treat as GCA until biopsy says otherwise — IV methylprednisolone 1g/day, then oral prednisone, and TAB within 1–2 weeks."',
    immediateAction:
      'ESR, CRP, platelets. IV solumedrol 1g × 3d → oral pred 60–80mg. TAB within 2 weeks (steroid does not invalidate biopsy).',
    triggerKeywords: ['aion', 'arteritic', 'anterior ischemic optic neuropathy', 'giant cell arteritis', 'temporal arteritis'],
  },

  // ============================================================================
  // PEDIATRIC
  // ============================================================================
  {
    id: 'ped-leukocoria',
    subspecialty: 'Pediatric Ophthalmology',
    scenario: 'Child with absent or white pupillary reflex',
    mustNotMiss: 'Retinoblastoma',
    whyCritical: 'Life-threatening if metastasizes; eye-preserving treatment needs early detection.',
    safetyNetPhrase:
      '"Leukocoria is retinoblastoma until proven otherwise — I\'d do an EUA with RetCam, B-scan, and MRI orbits/brain, and refer to pediatric ocular oncology today."',
    immediateAction:
      'EUA with RetCam. B-scan. MRI orbits + brain (NO CT — radiation). Pediatric oncology referral same week. Never biopsy.',
    triggerKeywords: ['leukocoria', 'white pupil', 'retinoblastoma', 'white reflex', 'cat eye'],
  },
  {
    id: 'ped-congenital-glaucoma',
    subspecialty: 'Pediatric Ophthalmology',
    scenario: 'Infant with photophobia, epiphora, blepharospasm, enlarged cornea (buphthalmos)',
    mustNotMiss: 'Primary congenital glaucoma',
    whyCritical: 'Surgical disease (goniotomy/trabeculotomy) — drops alone fail.',
    safetyNetPhrase:
      '"Drops are temporizing — primary congenital glaucoma needs surgical angle surgery (goniotomy or trabeculotomy) as soon as feasible."',
    immediateAction:
      'EUA with IOP, pachymetry, axial length, corneal diameter, gonioscopy, disc exam. Goniotomy (clear cornea) or trabeculotomy (cloudy) within 1–2 weeks.',
    triggerKeywords: ['congenital glaucoma', 'buphthalmos', 'primary infantile glaucoma', 'haab stria'],
  },
  {
    id: 'ped-rop',
    subspecialty: 'Pediatric Ophthalmology',
    scenario: 'Premature infant (<30 weeks GA or <1500g BW)',
    mustNotMiss: 'Retinopathy of prematurity screening per AAO guidelines',
    whyCritical: 'Treatment-warranted ROP (Type 1) blinds without laser or anti-VEGF within days.',
    safetyNetPhrase:
      '"Any baby ≤30 weeks GA or ≤1500g needs first ROP screen at 31 weeks postmenstrual age or 4 weeks chronological, whichever is later — and continued q1–2 weeks per ICROP."',
    immediateAction:
      'Indirect ophthalmoscopy with 28D or RetCam. Classify by ICROP zone/stage/plus. Treatment-warranted: laser and/or bevacizumab within 48–72h.',
    triggerKeywords: ['retinopathy of prematurity', 'rop', 'preterm', 'premature infant', 'plus disease'],
  },
  {
    id: 'ped-acute-eso-brainstem',
    subspecialty: 'Pediatric Ophthalmology',
    scenario: 'Child with new-onset esotropia (especially with diplopia, headache, ataxia, papilledema)',
    mustNotMiss: 'CN6 palsy from intracranial mass or hydrocephalus',
    whyCritical: 'Posterior fossa tumor, raised ICP — needs neuroimaging same day.',
    safetyNetPhrase:
      '"A child with new eso isn\'t just accommodative — I\'d get an MRI brain with contrast before labeling this comitant."',
    immediateAction:
      'MRI brain with contrast. Disc check for papilledema. Pediatric neurology referral.',
    triggerKeywords: ['acute esotropia', 'new-onset esotropia', 'sixth nerve palsy child', 'brainstem', 'diplopia child'],
  },
  {
    id: 'ped-nystagmus-workup',
    subspecialty: 'Pediatric Ophthalmology',
    scenario: 'Infant with early-onset nystagmus',
    mustNotMiss: 'Sensory causes (albinism, achromatopsia, LCA, optic nerve hypoplasia, retinoblastoma)',
    whyCritical: 'Sensory nystagmus implies afferent visual pathway disease needing workup.',
    safetyNetPhrase:
      '"Before calling this motor nystagmus, I\'d get an ERG, MRI to look at the optic nerves and chiasm, and consider genetic testing — especially if there\'s iris transillumination or foveal hypoplasia."',
    immediateAction:
      'Dilated exam (iris TI, foveal exam, optic nerve). ERG. OCT macula (foveal hypoplasia). MRI brain. Genetic testing for albinism/achromatopsia/LCA.',
    triggerKeywords: ['congenital nystagmus', 'infantile nystagmus', 'sensory nystagmus', 'albinism', 'achromatopsia'],
  },

  // ============================================================================
  // OPTICS / GENERAL
  // ============================================================================
  {
    id: 'opt-ifis',
    subspecialty: 'Optics',
    scenario: 'Cataract surgery patient on α1-blocker (tamsulosin/Flomax) or history thereof',
    mustNotMiss: 'Intraoperative Floppy Iris Syndrome (IFIS)',
    whyCritical: 'Increases vitreous loss, PCR risk. Plan small-pupil technique upfront.',
    safetyNetPhrase:
      '"Any history of tamsulosin or α1-blocker needs a small-pupil plan — intracameral phenylephrine, iris hooks or Malyugin ring — even if the drug was stopped."',
    immediateAction:
      'Preop: intracameral phenylephrine 1%, Shugarcaine, or epinephrine; pupil expansion device (Malyugin/hooks); lower flow parameters.',
    triggerKeywords: ['ifis', 'intraoperative floppy iris', 'tamsulosin', 'flomax', 'alpha blocker'],
  },
  {
    id: 'opt-new-rx-prism',
    subspecialty: 'Optics',
    scenario: 'Patient unhappy with new spectacle Rx: diplopia, distortion, nausea',
    mustNotMiss: 'Unintended induced prism (vertex, centration, anisometropia, slab-off)',
    whyCritical: 'Continued wear causes headache, asthenopia, non-compliance.',
    safetyNetPhrase:
      '"I\'d re-check the lensometry against the Rx, measure the pupil centration, and assess for induced vertical prism with anisometropia — slab-off lenses may be needed."',
    immediateAction:
      'Lensometer-verify Rx. Measure fitting cross and pupillary centration. Check for slab-off or horizontal imbalance. Dispense corrected pair.',
    triggerKeywords: ['new glasses', 'spectacle intolerance', 'induced prism', 'slab-off', 'anisometropia'],
  },
];

/**
 * Return all fatal-flaw entries whose triggerKeywords appear anywhere in
 * the supplied diagnosisTitle / title / keywords. Case-insensitive substring match.
 */
export function getFatalFlawsForCase(
  diagnosisTitle: string,
  title: string,
  keywords: string[] = []
): FatalFlaw[] {
  const haystack = [
    (diagnosisTitle || '').toLowerCase(),
    (title || '').toLowerCase(),
    keywords.map(k => (k || '').toLowerCase()).join(' '),
  ].join(' ');
  if (!haystack.trim()) return [];

  const matches: FatalFlaw[] = [];
  const seen = new Set<string>();
  for (const flaw of FATAL_FLAWS) {
    for (const kw of flaw.triggerKeywords) {
      if (haystack.includes(kw.toLowerCase())) {
        if (!seen.has(flaw.id)) {
          matches.push(flaw);
          seen.add(flaw.id);
        }
        break;
      }
    }
  }
  return matches;
}
