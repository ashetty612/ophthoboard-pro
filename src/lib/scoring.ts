import { Question, UserAnswer } from './types';

/**
 * ABO Oral Boards Scoring System (2026 Guidelines)
 *
 * Modeled after the ABO's competency-based assessment:
 * - Examiners evaluate: clinical reasoning, knowledge depth,
 *   management decisions, and patient communication
 * - Partial credit for related/equivalent concepts
 * - Synonym-aware matching for medical terminology
 * - Weighted scoring by question category importance
 */

// Comprehensive medical synonym and abbreviation map
const SYNONYM_MAP: { [key: string]: string[] } = {
  // Conditions - Anterior Segment
  'blepharitis': ['bleph', 'lid inflammation', 'eyelid inflammation', 'lid margin disease', 'meibomian gland dysfunction', 'mgd'],
  'chalazion': ['meibomian cyst', 'meibomian gland', 'tarsal cyst', 'internal hordeolum', 'lipogranuloma'],
  'hordeolum': ['stye', 'sty', 'external hordeolum'],
  'keratitis': ['corneal inflammation', 'corneal ulcer', 'corneal infection'],
  'keratoconus': ['corneal ectasia', 'conical cornea', 'cone-shaped cornea'],
  'pterygium': ['surfers eye', 'wing-shaped growth', 'fibrovascular growth'],
  'conjunctivitis': ['pink eye', 'red eye', 'conjunctival inflammation'],
  'episcleritis': ['episcleral inflammation', 'simple episcleritis', 'nodular episcleritis'],
  'scleritis': ['scleral inflammation', 'necrotizing scleritis'],
  'uveitis': ['intraocular inflammation', 'iritis', 'anterior uveitis', 'iridocyclitis', 'cyclitis', 'panuveitis'],
  'hyphema': ['blood in anterior chamber', 'anterior chamber hemorrhage', 'ac hemorrhage'],
  'hypopyon': ['pus in anterior chamber', 'layered white cells'],
  'corneal abrasion': ['corneal scratch', 'epithelial defect', 'corneal erosion'],
  'dry eye': ['keratoconjunctivitis sicca', 'kcs', 'dry eye disease', 'ded', 'aqueous deficiency', 'evaporative dry eye', 'tear film dysfunction'],
  'pseudoexfoliation': ['pxf', 'exfoliation syndrome', 'pseudoexfoliation syndrome', 'pex'],
  'pigmentary dispersion': ['pigmentary glaucoma', 'pds', 'pigment dispersion syndrome'],
  'fuchs dystrophy': ['fuchs endothelial dystrophy', 'fuchs corneal dystrophy', 'fed', 'corneal guttata', 'guttae'],
  'band keratopathy': ['calcium deposition', 'calcific band keratopathy'],
  'salzmann nodular degeneration': ['salzmann nodule', 'salzmann'],
  'rosacea': ['ocular rosacea', 'acne rosacea', 'facial rosacea'],

  // Conditions - Posterior Segment
  'retinal detachment': ['rd', 'detached retina', 'rhegmatogenous', 'rhegmatogenous rd', 'rrd', 'tractional rd', 'trd', 'exudative rd'],
  'macular degeneration': ['amd', 'armd', 'age-related macular', 'age related macular degeneration', 'dry amd', 'wet amd', 'neovascular amd', 'nvamd'],
  'diabetic retinopathy': ['dr', 'diabetic eye', 'proliferative', 'pdr', 'npdr', 'nonproliferative', 'non-proliferative', 'proliferative diabetic retinopathy'],
  'macular hole': ['full thickness macular hole', 'ftmh', 'lamellar hole', 'stage 4 macular hole'],
  'epiretinal membrane': ['erm', 'macular pucker', 'cellophane maculopathy', 'preretinal membrane'],
  'central serous': ['csc', 'csr', 'central serous chorioretinopathy', 'central serous retinopathy', 'cscr'],
  'retinal vein occlusion': ['rvo', 'brvo', 'crvo', 'branch retinal vein occlusion', 'central retinal vein occlusion', 'vein occlusion'],
  'retinal artery occlusion': ['rao', 'brao', 'crao', 'branch retinal artery occlusion', 'central retinal artery occlusion', 'artery occlusion'],
  'toxoplasmosis': ['toxo', 'toxoplasma', 'toxoplasma gondii', 'headlight in fog'],
  'endophthalmitis': ['endoph', 'intraocular infection', 'post-operative endophthalmitis'],
  'vitreous hemorrhage': ['vh', 'vitreous blood', 'vitreous heme'],
  'choroidal neovascularization': ['cnv', 'choroidal neovasc', 'subretinal neovascularization', 'srnvm'],
  'retinitis pigmentosa': ['rp', 'rod-cone dystrophy', 'pigmentary retinopathy'],
  'stargardt disease': ['stargardts', 'fundus flavimaculatus', 'abca4'],
  'best disease': ['best vitelliform', 'vitelliform macular dystrophy', 'best macular dystrophy'],
  'angioid streaks': ['angioid streak', 'breaks in bruch membrane', 'bruch membrane crack'],
  'ocular histoplasmosis': ['pohs', 'presumed ocular histoplasmosis', 'histo spot'],
  'sickle cell retinopathy': ['sickle cell', 'sc retinopathy', 'sea fan neovascularization'],
  'coats disease': ['coats', 'retinal telangiectasia', 'exudative retinopathy'],

  // Conditions - Glaucoma
  'glaucoma': ['elevated iop', 'high pressure', 'optic neuropathy', 'glaucomatous', 'open angle glaucoma', 'oag', 'poag', 'primary open angle'],
  'angle closure': ['acute angle closure', 'aacg', 'angle closure glaucoma', 'acg', 'narrow angle', 'pupillary block', 'appositional closure'],
  'neovascular glaucoma': ['nvg', 'rubeotic glaucoma', 'rubeosis iridis'],
  'normal tension glaucoma': ['ntg', 'low tension glaucoma', 'low pressure glaucoma'],
  'congenital glaucoma': ['infantile glaucoma', 'buphthalmos', 'developmental glaucoma'],

  // Conditions - Neuro-ophthalmology
  'optic neuritis': ['on', 'optic nerve inflammation', 'retrobulbar neuritis', 'papillitis'],
  'papilledema': ['disc edema', 'disc swelling', 'optic disc edema', 'bilateral disc swelling', 'raised intracranial pressure'],
  'optic neuropathy': ['ischemic optic neuropathy', 'aion', 'naion', 'arteritic', 'nonarteritic', 'non-arteritic'],
  'giant cell arteritis': ['gca', 'temporal arteritis', 'cranial arteritis', 'horton disease'],
  'third nerve palsy': ['cn3 palsy', 'cn iii palsy', 'oculomotor palsy', '3rd nerve palsy', 'third cranial nerve'],
  'fourth nerve palsy': ['cn4 palsy', 'cn iv palsy', 'trochlear palsy', '4th nerve palsy', 'superior oblique palsy'],
  'sixth nerve palsy': ['cn6 palsy', 'cn vi palsy', 'abducens palsy', '6th nerve palsy', 'lateral rectus palsy'],
  'seventh nerve palsy': ['cn7 palsy', 'cn vii palsy', 'facial nerve palsy', 'bells palsy', 'bell palsy', 'facial palsy'],
  'horner syndrome': ['horners', 'horner', 'oculosympathetic paresis', 'miosis ptosis anhidrosis'],
  'myasthenia gravis': ['mg', 'myasthenia', 'neuromuscular junction disorder', 'acetylcholine receptor antibody'],
  'thyroid eye disease': ['ted', 'graves ophthalmopathy', 'graves eye disease', 'thyroid orbitopathy', 'graves orbitopathy'],
  'orbital cellulitis': ['orbital infection', 'postseptal cellulitis', 'post-septal cellulitis'],
  'preseptal cellulitis': ['periorbital cellulitis', 'pre-septal cellulitis'],
  'cavernous sinus thrombosis': ['cst', 'cavernous sinus'],

  // Conditions - Pediatric
  'amblyopia': ['lazy eye', 'reduced vision', 'amblyopic', 'deprivation amblyopia', 'strabismic amblyopia', 'refractive amblyopia', 'anisometropic amblyopia'],
  'strabismus': ['eye misalignment', 'esotropia', 'exotropia', 'crossed eyes', 'squint', 'tropia', 'phoria', 'hypertropia'],
  'esotropia': ['convergent squint', 'inward turning eye', 'crossed eye', 'et'],
  'exotropia': ['divergent squint', 'outward turning eye', 'wall-eyed', 'xt'],
  'retinoblastoma': ['rb', 'retinal tumor', 'intraocular tumor child', 'leukocoria'],
  'retinopathy of prematurity': ['rop', 'retrolental fibroplasia'],
  'congenital cataract': ['infantile cataract', 'developmental cataract', 'pediatric cataract'],
  'nasolacrimal duct obstruction': ['nldo', 'dacryostenosis', 'blocked tear duct', 'congenital nldo', 'cnldo'],

  // Conditions - Lens/Cataract
  'cataract': ['lens opacity', 'lens opacification', 'cortical cataract', 'nuclear cataract', 'posterior subcapsular', 'psc'],
  'posterior capsule opacification': ['pco', 'after-cataract', 'secondary cataract', 'capsular opacification'],
  'lens subluxation': ['ectopia lentis', 'lens dislocation', 'subluxated lens', 'dislocated lens'],

  // Conditions - Orbit/Adnexa
  'ptosis': ['droopy eyelid', 'droopy lid', 'lid droop', 'blepharoptosis', 'upper lid ptosis'],
  'proptosis': ['exophthalmos', 'bulging eye', 'proptotic', 'globe displacement'],
  'dacryocystitis': ['lacrimal sac infection', 'lacrimal sac inflammation', 'infected lacrimal sac'],
  'dacryoadenitis': ['lacrimal gland inflammation', 'lacrimal gland swelling'],
  'sebaceous cell carcinoma': ['sebaceous carcinoma', 'meibomian gland carcinoma', 'sgc'],
  'basal cell carcinoma': ['bcc', 'rodent ulcer', 'basal cell'],
  'squamous cell carcinoma': ['scc', 'squamous carcinoma'],
  'rhabdomyosarcoma': ['rhabdo', 'rms', 'embryonal rhabdomyosarcoma'],
  'capillary hemangioma': ['strawberry nevus', 'infantile hemangioma'],

  // Diagnostic Tests
  'fluorescein angiography': ['fa', 'ffa', 'fluorescein', 'fluorescein angio', 'ivfa'],
  'indocyanine green': ['icg', 'icg angiography', 'icga'],
  'optical coherence tomography': ['oct', 'oct scan', 'spectral domain oct', 'sd-oct', 'swept source oct'],
  'oct angiography': ['octa', 'oct-a', 'oct angio'],
  'b-scan': ['b scan ultrasound', 'ocular ultrasound', 'b-scan ultrasonography'],
  'a-scan': ['a scan', 'axial length measurement', 'biometry'],
  'visual field': ['vf', 'perimetry', 'humphrey', 'visual field test', 'hvf', 'goldmann', '24-2', '10-2'],
  'gonioscopy': ['angle examination', 'angle evaluation', 'goniolens'],
  'fundus photography': ['fundus photo', 'retinal photography', 'optos', 'wide field'],
  'ultrasound biomicroscopy': ['ubm'],
  'corneal topography': ['topography', 'placido disc', 'pentacam', 'orbscan'],
  'specular microscopy': ['specular', 'endothelial cell count', 'ecd'],
  'electroretinography': ['erg', 'electroretinogram', 'full field erg', 'fferg', 'multifocal erg', 'mferg'],
  'electrooculography': ['eog', 'electrooculogram'],
  'visual evoked potential': ['vep', 'visual evoked response'],

  // Clinical Measurements
  'iop': ['intraocular pressure', 'eye pressure', 'tonometry'],
  'va': ['visual acuity', 'vision', 'snellen'],
  'eom': ['extraocular motility', 'extraocular muscles', 'extraocular movement', 'eye movements'],
  'cvf': ['confrontation visual field', 'confrontation visual fields'],
  'rapd': ['relative afferent pupillary defect', 'apd', 'marcus gunn pupil', 'afferent pupillary defect'],
  'spk': ['superficial punctate keratitis', 'punctate keratopathy', 'superficial punctate keratopathy', 'punctate epithelial erosions'],
  'nvi': ['neovascularization of iris', 'iris neovascularization', 'rubeosis'],
  'nvd': ['neovascularization of disc', 'disc neovascularization'],
  'nve': ['neovascularization elsewhere', 'neovascularization'],
  'pvd': ['posterior vitreous detachment'],
  'srf': ['subretinal fluid', 'sub-retinal fluid'],
  'cmt': ['central macular thickness'],
  'cup to disc ratio': ['c/d ratio', 'cd ratio', 'cup disc ratio', 'cdr'],

  // Treatments - Medications
  'doxycycline': ['doxy', 'tetracycline', 'minocycline', 'oral antibiotic for mgd'],
  'erythromycin': ['erythro', 'erythromycin ointment'],
  'topical steroids': ['steroid drops', 'pred forte', 'prednisolone', 'prednisolone acetate', 'dexamethasone', 'loteprednol', 'lotemax', 'durezol', 'difluprednate', 'fluorometholone', 'fml'],
  'artificial tears': ['at', 'lubricating drops', 'lubricant', 'tears', 'preservative free tears', 'pf tears', 'refresh', 'systane'],
  'timolol': ['beta blocker', 'topical beta blocker', 'timoptic'],
  'brimonidine': ['alpha agonist', 'alphagan', 'alpha-2 agonist'],
  'latanoprost': ['prostaglandin', 'prostaglandin analog', 'pga', 'xalatan', 'travoprost', 'travatan', 'bimatoprost', 'lumigan'],
  'dorzolamide': ['topical cai', 'carbonic anhydrase inhibitor', 'trusopt', 'azopt', 'brinzolamide'],
  'acetazolamide': ['diamox', 'oral cai', 'oral carbonic anhydrase inhibitor'],
  'mannitol': ['osmotic agent', 'iv mannitol', 'osmotic diuretic'],
  'pilocarpine': ['miotic', 'cholinergic', 'parasympathomimetic'],
  'atropine': ['cycloplegic', 'mydriatic', 'atropine penalization'],
  'cyclopentolate': ['cycloplegic', 'cyclogyl'],
  'anti-vegf': ['vegf inhibitor', 'avastin', 'bevacizumab', 'lucentis', 'ranibizumab', 'eylea', 'aflibercept', 'vabysmo', 'faricimab', 'anti vegf injection', 'intravitreal injection'],
  'intravitreal steroid': ['ozurdex', 'dexamethasone implant', 'intravitreal triamcinolone', 'ivta', 'triesence'],
  'topical antibiotic': ['antibiotic drops', 'moxifloxacin', 'vigamox', 'gatifloxacin', 'zymaxid', 'ofloxacin', 'ciprofloxacin', 'tobramycin', 'fluoroquinolone'],
  'fortified antibiotics': ['fortified vancomycin', 'fortified tobramycin', 'fortified ceftazidime'],
  'antiviral': ['acyclovir', 'valacyclovir', 'valtrex', 'ganciclovir', 'valganciclovir', 'famciclovir'],
  'immunosuppressive': ['methotrexate', 'mycophenolate', 'cellcept', 'azathioprine', 'cyclosporine', 'restasis', 'tacrolimus'],
  'oral steroids': ['prednisone', 'oral prednisone', 'systemic steroids', 'methylprednisolone', 'iv steroids'],

  // Treatments - Surgical
  'warm compresses': ['hot compresses', 'warm compress', 'lid hygiene', 'eyelid hygiene'],
  'incision and curettage': ['i&c', 'i and c', 'incision curettage', 'chalazion surgery'],
  'tarsorrhaphy': ['lid closure', 'eyelid suture', 'temporary tarsorrhaphy'],
  'vitrectomy': ['ppv', 'pars plana vitrectomy', 'posterior vitrectomy', '23 gauge', '25 gauge'],
  'scleral buckle': ['sb', 'buckle', 'encircling band'],
  'pneumatic retinopexy': ['pr', 'gas bubble', 'sf6', 'c3f8'],
  'trabeculectomy': ['trab', 'filtration surgery', 'guarded filtration', 'filtering procedure'],
  'tube shunt': ['glaucoma drainage device', 'gdd', 'ahmed', 'baerveldt', 'tube surgery', 'aqueous shunt'],
  'laser trabeculoplasty': ['slt', 'alt', 'selective laser trabeculoplasty', 'argon laser trabeculoplasty'],
  'laser iridotomy': ['pi', 'lpi', 'laser peripheral iridotomy', 'yag iridotomy'],
  'yag capsulotomy': ['yag', 'posterior capsulotomy', 'yag laser'],
  'panretinal photocoagulation': ['prp', 'pan retinal laser', 'scatter laser', 'laser photocoagulation'],
  'focal laser': ['grid laser', 'macular laser', 'focal macular laser'],
  'cataract surgery': ['phacoemulsification', 'phaco', 'cataract extraction', 'iol implantation', 'lens implant'],
  'enucleation': ['eye removal', 'globe removal'],
  'exenteration': ['orbital exenteration', 'orbital contents removal'],
  'dacryocystorhinostomy': ['dcr', 'tear duct surgery', 'lacrimal surgery'],
  'ptosis repair': ['levator advancement', 'levator resection', 'muller muscle resection', 'frontalis sling'],
  'corneal transplant': ['penetrating keratoplasty', 'pk', 'pkp', 'dsaek', 'dsek', 'dmek', 'dalk', 'keratoplasty', 'corneal graft'],
  'amniotic membrane': ['am', 'amt', 'amniotic membrane transplant', 'amniograft', 'prokera'],
  'cross-linking': ['cxl', 'corneal cross-linking', 'collagen cross-linking', 'riboflavin uva'],
  'migs': ['minimally invasive glaucoma surgery', 'istent', 'trabectome', 'kahook', 'xen gel stent', 'goniotomy'],

  // Anatomy
  'macula': ['fovea', 'foveal', 'macular', 'central retina'],
  'optic disc': ['optic nerve head', 'onh', 'disc', 'optic disk'],
  'anterior chamber': ['ac', 'front chamber'],
  'posterior chamber': ['pc', 'behind iris'],
  'trabecular meshwork': ['tm', 'drainage angle', 'angle structures'],
  'schlemm canal': ['schlemms canal', 'canal of schlemm'],
  'bruch membrane': ['bruchs membrane', 'bruch'],
  'retinal pigment epithelium': ['rpe', 'pigment epithelium'],
  'ciliary body': ['cb', 'pars plana', 'pars plicata'],
};

// Related concept clusters - answers mentioning related terms get partial credit
const CONCEPT_CLUSTERS: { [key: string]: string[] } = {
  'infection_workup': ['culture', 'sensitivity', 'gram stain', 'blood agar', 'chocolate agar', 'sabouraud', 'thioglycolate', 'culture and sensitivity', 'c&s'],
  'inflammatory_workup': ['esr', 'crp', 'cbc', 'ana', 'anca', 'hla-b27', 'ace', 'lysozyme', 'chest xray', 'chest x-ray', 'rpr', 'vdrl', 'fta-abs', 'quantiferon'],
  'stroke_workup': ['carotid doppler', 'carotid ultrasound', 'echocardiogram', 'echo', 'mri brain', 'mra', 'cta', 'holter monitor', 'cardiac workup'],
  'retinal_imaging': ['oct', 'fluorescein angiography', 'fa', 'ffa', 'fundus photo', 'icg', 'octa', 'b-scan'],
  'glaucoma_drops': ['timolol', 'brimonidine', 'latanoprost', 'dorzolamide', 'prostaglandin', 'beta blocker', 'alpha agonist', 'cai'],
  'steroid_treatment': ['prednisolone', 'pred forte', 'dexamethasone', 'loteprednol', 'difluprednate', 'durezol', 'steroid', 'topical steroid'],
  'corneal_protection': ['artificial tears', 'lubricant', 'bandage contact lens', 'bcl', 'tarsorrhaphy', 'amniotic membrane', 'moisture chamber'],
};

// Question weight distribution aligned to ABO 3-Domain Rubric
// Domain 1 (Data Acquisition): Q2 History + Q3 Exam + Q4 Tests = 33%
// Domain 2 (Diagnosis): Q1 Differential = 33%
// Domain 3 (Management): Q5 Treatment + Q6 Counseling = 34%
const QUESTION_WEIGHTS: { [key: number]: number } = {
  1: 25, // Differential diagnosis — Diagnosis domain (must be prioritized, include must-not-miss)
  2: 10, // History — Data Acquisition domain (focused, hypothesis-driven)
  3: 12, // Exam findings — Data Acquisition domain (specific signs, not generic)
  4: 13, // Diagnostic tests — Data Acquisition domain (pertinent only, no shotgunning)
  5: 25, // Treatment — Management domain (specific drugs/doses, stepwise approach)
  6: 15, // Prognosis/Counseling — Management domain (follow-up, patient education IS scored)
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s\/\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word: string): string {
  // Simple medical-aware stemming
  return word
    .replace(/itis$/, '')
    .replace(/osis$/, '')
    .replace(/ectomy$/, '')
    .replace(/otomy$/, '')
    .replace(/plasty$/, '')
    .replace(/tion$/, '')
    .replace(/sion$/, '')
    .replace(/ment$/, '')
    .replace(/ness$/, '')
    .replace(/ing$/, '')
    .replace(/ies$/, 'y')
    .replace(/es$/, '')
    .replace(/s$/, '');
}

function findSynonyms(keyword: string): string[] {
  const normalized = normalizeText(keyword);
  const synonyms: string[] = [normalized];

  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (normalized.includes(key) || values.some(v => normalized.includes(v))) {
      synonyms.push(key, ...values);
    }
  }

  return [...new Set(synonyms)];
}

function checkKeywordMatch(userAnswer: string, keyword: string): boolean {
  const normalizedAnswer = normalizeText(userAnswer);
  const normalizedKeyword = normalizeText(keyword);

  // Direct match
  if (normalizedAnswer.includes(normalizedKeyword)) return true;

  // Synonym check
  const synonyms = findSynonyms(normalizedKeyword);
  if (synonyms.some(syn => normalizedAnswer.includes(syn))) return true;

  // Check individual significant words (3+ chars) - more lenient threshold
  const keywordWords = normalizedKeyword.split(' ').filter(w => w.length >= 3);
  if (keywordWords.length > 1) {
    const matchedWords = keywordWords.filter(w =>
      normalizedAnswer.includes(w) ||
      normalizedAnswer.includes(stemWord(w))
    );
    // Match if 50% of words match (more lenient)
    if (matchedWords.length >= Math.ceil(keywordWords.length * 0.5)) return true;
  }

  // Stemmed word matching for single important medical terms
  if (keywordWords.length === 1 && keywordWords[0].length >= 4) {
    const stemmed = stemWord(keywordWords[0]);
    if (stemmed.length >= 3 && normalizedAnswer.includes(stemmed)) return true;
  }

  // Check concept cluster partial credit
  for (const clusterTerms of Object.values(CONCEPT_CLUSTERS)) {
    if (clusterTerms.some(t => normalizedKeyword.includes(t))) {
      if (clusterTerms.some(t => normalizedAnswer.includes(t))) return true;
    }
  }

  return false;
}

export function scoreAnswer(question: Question, userAnswer: string): UserAnswer {
  const keywords = question.scoringKeywords.length > 0
    ? question.scoringKeywords
    : question.keyPoints;

  if (!userAnswer.trim()) {
    return {
      questionNumber: question.number,
      answer: userAnswer,
      score: 0,
      maxScore: QUESTION_WEIGHTS[question.number] || 15,
      matchedKeywords: [],
      missedKeywords: keywords,
      feedback: 'No answer provided. Review the key concepts for this question.',
    };
  }

  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  for (const keyword of keywords) {
    if (keyword.toLowerCase() === 'not applicable') continue;
    if (checkKeywordMatch(userAnswer, keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missedKeywords.push(keyword);
    }
  }

  const maxScore = QUESTION_WEIGHTS[question.number] || 15;
  const effectiveKeywords = keywords.filter(k => k.toLowerCase() !== 'not applicable');

  let score: number;
  if (effectiveKeywords.length === 0) {
    score = maxScore;
  } else {
    const matchPercentage = matchedKeywords.length / effectiveKeywords.length;
    // Apply a slight bonus curve - reward getting most answers right
    const adjustedPercentage = matchPercentage >= 0.8
      ? matchPercentage + (1 - matchPercentage) * 0.2
      : matchPercentage;
    score = Math.round(Math.min(adjustedPercentage, 1) * maxScore);
  }

  // Generate feedback
  let feedback: string;
  const percentage = effectiveKeywords.length > 0
    ? (matchedKeywords.length / effectiveKeywords.length) * 100
    : 100;

  if (percentage >= 90) {
    feedback = 'Above Expected (3/3) — Comprehensive response covering key concepts with specificity.';
  } else if (percentage >= 70) {
    feedback = 'Expected (2/3) — Solid answer hitting most important points.';
  } else if (percentage >= 50) {
    feedback = 'Below Expected (1/3) — Incomplete response. Key elements were missed.';
  } else if (percentage >= 25) {
    feedback = 'Unacceptable (0/3) — Major gaps in knowledge. Focused review needed.';
  } else {
    feedback = 'Unacceptable (0/3) — Significant deficiency. Review core concepts thoroughly.';
  }

  if (missedKeywords.length > 0 && missedKeywords.length <= 5) {
    feedback += ` Review: ${missedKeywords.slice(0, 3).join('; ')}.`;
  }

  return {
    questionNumber: question.number,
    answer: userAnswer,
    score,
    maxScore,
    matchedKeywords,
    missedKeywords,
    feedback,
  };
}

export function scorePhotoDescription(
  userDescription: string,
  correctDescription: string
): { score: number; maxScore: number; feedback: string } {
  const maxScore = 10;

  if (!userDescription.trim()) {
    return { score: 0, maxScore, feedback: 'No description provided.' };
  }

  const correctWords = normalizeText(correctDescription)
    .split(' ')
    .filter(w => w.length >= 3);
  const userWords = normalizeText(userDescription);

  // Check direct word matches plus stemmed matches
  const matchedWords = correctWords.filter(w =>
    userWords.includes(w) || userWords.includes(stemWord(w))
  );
  const matchPercentage = matchedWords.length / Math.max(correctWords.length, 1);
  const score = Math.min(Math.round(matchPercentage * maxScore * 1.2), maxScore); // Slight bonus

  let feedback: string;
  if (matchPercentage >= 0.6) {
    feedback = 'Excellent photo description! You identified the key findings.';
  } else if (matchPercentage >= 0.35) {
    feedback = 'Adequate description. Try to be more specific about clinical findings.';
  } else {
    feedback = 'Your description missed key findings. Practice describing clinical photos systematically.';
  }

  return { score, maxScore, feedback };
}

export function calculateGrade(percentageScore: number): string {
  if (percentageScore >= 90) return 'Above Expected';
  if (percentageScore >= 80) return 'Excellent';
  if (percentageScore >= 70) return 'Expected';
  if (percentageScore >= 60) return 'Borderline';
  if (percentageScore >= 50) return 'Below Expected';
  return 'Unacceptable';
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'Above Expected': return 'text-emerald-400';
    case 'Excellent': return 'text-emerald-500';
    case 'Expected': return 'text-primary-400';
    case 'Borderline': return 'text-amber-400';
    case 'Below Expected': return 'text-amber-500';
    case 'Unacceptable': return 'text-rose-400';
    default: return 'text-slate-400';
  }
}

export function getGradeBgColor(grade: string): string {
  switch (grade) {
    case 'Above Expected': return 'bg-emerald-500/20 border-emerald-500/30';
    case 'Excellent': return 'bg-emerald-500/15 border-emerald-500/25';
    case 'Expected': return 'bg-primary-500/20 border-primary-500/30';
    case 'Borderline': return 'bg-amber-500/20 border-amber-500/30';
    case 'Below Expected': return 'bg-amber-500/15 border-amber-500/25';
    case 'Unacceptable': return 'bg-rose-500/20 border-rose-500/30';
    default: return 'bg-slate-500/20 border-slate-500/30';
  }
}
