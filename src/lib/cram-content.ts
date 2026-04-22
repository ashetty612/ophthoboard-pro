/**
 * Cram Sheet Content
 * ------------------
 * High-yield, board-focused reference content organized by subspecialty.
 * The "2 AM before the exam" cheat sheet — terse, clinically accurate,
 * and structured for rapid scanning and printing.
 *
 * Pairs with src/components/CramSheet.tsx which handles the UI, search,
 * filtering, and print layout. Trial one-liners, killer diagnoses first-step
 * management, and drug quick-ref are intentionally compressed to board-answer
 * phrasing ("tap-and-inject", "IV methylpred 1g x3d", etc.).
 */

export interface CramItem {
  label?: string;
  content: string;
  subtext?: string;
}

export interface CramSection {
  title: string;
  items: CramItem[];
}

export interface SubspecialtyCram {
  id: string;
  name: string;
  classicPresentations: CramSection;
  killerDiagnoses: CramSection;
  keyTrials: CramSection;
  pearls: CramSection;
  pharmacology: CramSection;
}

export const CRAM_CONTENT: SubspecialtyCram[] = [
  // =========================================================================
  // ANTERIOR SEGMENT
  // =========================================================================
  {
    id: 'anterior',
    name: 'Anterior Segment',
    classicPresentations: {
      title: 'Classic Presentations',
      items: [
        { label: 'Contact-lens wearer, overnight use, ring infiltrate, severe pain out of proportion', content: 'Acanthamoeba keratitis', subtext: 'Confocal microscopy shows double-walled cysts; PHMB + chlorhexidine.' },
        { label: 'Dendritic epithelial ulcer with terminal bulbs, fluorescein uptake', content: 'HSV epithelial keratitis', subtext: 'Topical ganciclovir 0.15% or trifluridine; avoid steroid in epithelial disease.' },
        { label: 'Hazy cornea, mid-dilated pupil, red eye, nausea, vomiting, halos', content: 'Acute angle-closure glaucoma', subtext: 'IOP often 50–80 mmHg; laser PI after cornea clears.' },
        { label: 'Elderly patient, central/paracentral ulcer with feathery edges, contact lens or plant trauma', content: 'Fungal keratitis', subtext: 'Natamycin 5% first-line for filamentous; voriconazole for yeast.' },
        { label: 'Vesicular rash V1 dermatome with Hutchinson sign (tip of nose)', content: 'Herpes zoster ophthalmicus', subtext: 'Oral valacyclovir 1g TID x 7d within 72h.' },
        { label: 'Recurrent unilateral acute anterior uveitis in young male, low-back stiffness', content: 'HLA-B27 ankylosing spondylitis uveitis', subtext: 'Send HLA-B27, SI-joint imaging, rheumatology.' },
        { label: 'White plaque in pupil area of hypermature cataract + acute IOP rise', content: 'Phacolytic glaucoma', subtext: 'Heavy flare, macrophages clog TM; definitive = CE.' },
        { label: 'Postop day 3–5 cataract, pain, hypopyon, vision down to HM', content: 'Acute postoperative endophthalmitis', subtext: 'EVS: tap-and-inject; PPV if LP or worse.' },
        { label: 'Young contact-lens wearer, paracentral infiltrate, mucopurulent discharge', content: 'Pseudomonas keratitis', subtext: 'Fortified vanc + tobra or fluoroquinolone q1h.' },
        { label: 'Kayser-Fleischer ring at Descemet membrane in young adult with liver/behavior changes', content: 'Wilson disease', subtext: 'Ceruloplasmin, 24h urine copper; D-penicillamine.' },
      ],
    },
    killerDiagnoses: {
      title: 'Killer Diagnoses (First-Step Management)',
      items: [
        { label: 'Open-globe rupture', content: 'Rigid Fox shield, NPO, IV vanc + ceftazidime, tetanus, CT orbit thin cuts, OR same day. No pressure on eye.' },
        { label: 'Chemical burn (alkali worse than acid)', content: 'Immediate irrigation >30 min with LR/saline until pH 7.0–7.4 on two checks 5 min apart BEFORE history.' },
        { label: 'Acute angle-closure glaucoma', content: 'Timolol + brimonidine + dorzolamide + acetazolamide 500mg PO/IV; pilocarpine 1–2% once IOP drops; laser PI same day bilateral.' },
        { label: 'Infectious endophthalmitis', content: 'Tap-and-inject vancomycin 1mg/0.1mL + ceftazidime 2.25mg/0.1mL. PPV if VA ≤HM (EVS).' },
        { label: 'Corneal ulcer / microbial keratitis', content: 'Scrape for Gram/culture BEFORE abx; fortified vanc 25mg/mL + tobra 14mg/mL q1h around the clock.' },
        { label: 'Hyphema with sickle trait', content: 'Avoid CAIs (acidosis sickles RBCs blocking TM); topical steroid + cycloplegic; consider washout earlier.' },
        { label: 'HSV keratouveitis with IOP rise', content: 'Oral acyclovir 400mg 5x/day + topical steroid (carefully tapered) + aqueous suppressants; avoid prostaglandin.' },
        { label: 'Descemetocele / impending perforation', content: 'Cyanoacrylate glue + BCL, urgent tectonic PK; stop topical steroids and aminoglycosides.' },
        { label: 'Wound leak with shallow chamber postop', content: 'Seidel test; reform with BCL or suture; watch for choroidal effusion/flat bleb.' },
        { label: 'Suprachoroidal hemorrhage intraop', content: 'Close wound immediately, elevate head, IOP-lowering; drainage sclerotomies in 7–14 days when blood liquefies.' },
      ],
    },
    keyTrials: {
      title: 'Key Trials (One-Line Takeaways)',
      items: [
        { label: 'EVS (Endophthalmitis Vitrectomy Study)', content: 'Post-cataract endophthalmitis: PPV improves VA only if VA ≤ light perception; otherwise tap-and-inject equal. Routine IV abx not beneficial.' },
        { label: 'OHTS (Ocular Hypertension Treatment Study)', content: 'Topical therapy halves 5y risk of converting OHT→POAG (9.5%→4.4%). Risk factors: age, CCT <555, VCDR, PSD, IOP.' },
        { label: 'CLEK (Collaborative Longitudinal Evaluation of Keratoconus)', content: 'Steep K, younger age, poorer VA predict progression; contact lens wear does not cause scarring.' },
        { label: 'HEDS I / II (Herpetic Eye Disease Study)', content: 'Topical steroid + trifluridine for stromal keratitis speeds resolution. Oral acyclovir 400mg BID halves recurrence.' },
        { label: 'CCTS (Cornea Donor Study)', content: 'Donor age up to 75 does not affect 5-year graft survival after PK.' },
        { label: 'PHACO (Bowman Lab / multiple)', content: 'Phaco + IOL in uveitis eyes safe if quiet ≥3 months preop; perioperative oral prednisone reduces CME.' },
        { label: 'LOCS III', content: 'Standardized grading of NS, cortical, and PSC cataract severity.' },
        { label: 'TAP / VIP (PDT era, historical)', content: 'PDT reduced moderate vision loss in subfoveal CNV before anti-VEGF era; now largely replaced.' },
      ],
    },
    pearls: {
      title: 'High-Yield Pearls',
      items: [
        { content: 'Fuchs endothelial dystrophy: guttae on specular; corneal edema worse AM; DSAEK/DMEK when symptomatic.' },
        { content: 'Keratoconus: steep inferior K, Vogt striae, Munson sign, Fleischer ring, Rizzuti sign; cross-linking for progression.' },
        { content: 'Crosslinking (Dresden protocol): epi-off + riboflavin 0.1% + UVA 370nm 3 mW/cm² x 30 min; halts progression in >90%.' },
        { content: 'Posterior polymorphous dystrophy: railroad-track lesions at Descemet; AD; rarely needs treatment.' },
        { content: 'Lattice dystrophy (TGFBI): branching amyloid lines; recurrent erosions; type II = Meretoja (familial amyloidosis).' },
        { content: 'Granular dystrophy: crumb-like hyaline; Masson trichrome red.' },
        { content: 'Macular dystrophy: diffuse stromal haze, AR; stains with colloidal iron (AMP buildup).' },
        { content: 'Meesmann dystrophy: epithelial microcysts (KRT3/KRT12 genes).' },
        { content: 'Thygeson SPK: bilateral elevated epithelial opacities, minimal injection; topical steroid or cyclosporine.' },
        { content: 'Salzmann nodular degeneration: elevated bluish-white subepithelial nodules; superficial keratectomy.' },
        { content: 'POAG mnemonic: "IOP + CCT + C/D + VF". Target IOP ≈ 30% reduction from baseline.' },
        { content: 'PXF syndrome: dandruff-like material on lens capsule + pupil ruffle; high IOP spikes, zonular weakness during cataract.' },
        { content: 'Pigment dispersion: Krukenberg spindle, mid-peripheral iris TIDs, Sampaolesi line, reverse pupil block.' },
        { content: 'Plateau iris: confirmed on UBM — ciliary body anteriorly displaced; treat with iridoplasty ± PI.' },
        { content: 'Topical steroid-responders: ~5% of population IOP rise >10 mmHg with prolonged use.' },
        { content: 'Fortified vancomycin = 25–50 mg/mL (prepared from IV vial); tobramycin fortified = 14 mg/mL.' },
        { content: 'Gram-positive cocci predominate in post-cataract endophthalmitis (~70%), S. epidermidis most common.' },
        { content: 'Toxic anterior segment syndrome (TASS): sterile, POD 1, diffuse limbus-to-limbus edema; steroids, no abx.' },
        { content: 'Bleb-associated endophthalmitis: late, Streptococcus most common, worse prognosis than cataract-related.' },
      ],
    },
    pharmacology: {
      title: 'Pharmacology Quick Reference',
      items: [
        { label: 'Timolol 0.5%', content: 'β-blocker; 1 gtt BID; AE: bronchospasm, bradycardia, depression, impotence.' },
        { label: 'Brimonidine 0.1–0.2%', content: 'α2-agonist; 1 gtt TID; AE: allergy, somnolence (AVOID in infants/toddlers — CNS depression, apnea).' },
        { label: 'Dorzolamide / Brinzolamide', content: 'Topical CAI; 1 gtt TID; AE: metallic taste, superficial punctate keratitis; sulfa class.' },
        { label: 'Latanoprost / Travoprost / Bimatoprost', content: 'PGA; 1 gtt qHS; AE: iris pigmentation, lash growth, periorbital fat atrophy (PAP), CME, uveitis.' },
        { label: 'Pilocarpine 1–2%', content: 'Muscarinic; for acute AACG post-IOP drop; AE: brow ache, miosis, retinal detachment risk.' },
        { label: 'Acetazolamide 500mg PO/IV', content: 'Systemic CAI; AE: paresthesias, metabolic acidosis, kidney stones, aplastic anemia; avoid in sickle.' },
        { label: 'Atropine 1%', content: 'Long-acting cycloplegic (7–14d); uveitis, amblyopia penalization; AE: fever, flushing, tachycardia in kids.' },
        { label: 'Cyclopentolate 1%', content: 'Cycloplegic for cycloplegic refraction; AE: CNS (hallucinations in kids — use 0.5% under 1 yo).' },
        { label: 'Prednisolone acetate 1%', content: 'Topical steroid; q1h severe inflammation; AE: IOP rise, cataract, infection (HSV reactivation).' },
        { label: 'Cyclosporine 0.05% (Restasis)', content: 'Dry eye; BID; takes 3 months for full effect; AE: burning.' },
        { label: 'Doxycycline 50–100mg BID', content: 'MGD, chemical burn (MMP inhibitor), pediatric MGD (use azithromycin if <8 yo).' },
      ],
    },
  },

  // =========================================================================
  // POSTERIOR SEGMENT
  // =========================================================================
  {
    id: 'posterior',
    name: 'Posterior Segment',
    classicPresentations: {
      title: 'Classic Presentations',
      items: [
        { label: 'Sudden painless monocular vision loss, cherry-red spot, pale retina, box-car venules', content: 'Central retinal artery occlusion', subtext: 'Rule out GCA; TPA not standard; lower IOP; carotid workup.' },
        { label: 'Sudden vision loss, "blood-and-thunder" fundus, dilated tortuous veins', content: 'Central retinal vein occlusion', subtext: 'Anti-VEGF for ME; monitor for 90-day ischemic conversion → NVI.' },
        { label: 'Metamorphopsia + central scotoma, drusen, RPE changes in older adult', content: 'Age-related macular degeneration', subtext: 'AREDS2 for intermediate; anti-VEGF for wet.' },
        { label: 'Diabetic with hard exudates in macula + retinal thickening on OCT', content: 'Diabetic macular edema', subtext: 'DRCR Protocol T: anti-VEGF first-line; bevacizumab if VA ≥20/40.' },
        { label: 'Young myope with sudden flashes, floaters, curtain in peripheral vision', content: 'Rhegmatogenous retinal detachment', subtext: 'Scleral depression 360°; same-day repair if mac-on.' },
        { label: 'HIV+ with CD4 <50, peripheral retinal whitening + hemorrhages', content: 'CMV retinitis', subtext: 'Oral valganciclovir 900mg BID + intravitreal ganciclovir if zone 1.' },
        { label: 'Teenage boy with bilateral night blindness, bone-spicule pigmentation, attenuated vessels', content: 'Retinitis pigmentosa', subtext: 'ERG markedly reduced; Luxturna for RPE65.' },
        { label: 'Young woman with serous macular detachment after stress, pachychoroid on OCT', content: 'Central serous chorioretinopathy', subtext: 'Stop steroids; observe; PDT if chronic.' },
        { label: 'Yellowish subretinal mass with orange lipofuscin in older adult', content: 'Choroidal melanoma (vs nevus)', subtext: 'TFSOM: Thickness >2mm, Fluid, Symptoms, Orange, Margin at disc.' },
        { label: 'Multiple small white-yellow dots in young myope with enlarged blind spot', content: 'MEWDS (Multiple Evanescent White Dot Syndrome)', subtext: 'Self-limited in 4–10 weeks; observe.' },
      ],
    },
    killerDiagnoses: {
      title: 'Killer Diagnoses (First-Step Management)',
      items: [
        { label: 'CRAO (age >50)', content: 'STAT ESR/CRP/platelets + stroke workup; assume GCA until proven otherwise. IV methylpred 1g if GCA suspected.' },
        { label: 'Rhegmatogenous RD (mac-on)', content: 'Same-day VR referral. Position to keep macula dependent; scleral buckle/PPV/pneumatic per case.' },
        { label: 'Postop or post-injection endophthalmitis', content: 'Tap-and-inject vanc 1mg + ceftazidime 2.25mg (EVS); PPV if VA ≤HM.' },
        { label: 'Proliferative DR with NVI/NVD', content: 'PRP 1500–2000 spots ± anti-VEGF; control BP, HbA1c; watch for NVG.' },
        { label: 'Retinal detachment with PVR grade C+', content: 'PPV with silicone oil + membrane peel; guarded prognosis.' },
        { label: 'Vitreous hemorrhage of unknown etiology', content: 'B-scan to rule out RD/tumor; observe 1–2 weeks; PPV if persistent or RD.' },
        { label: 'Acute retinal necrosis (VZV/HSV)', content: 'IV acyclovir 10mg/kg q8h x 5–10d → oral valacyclovir 1g TID; prophylactic laser around lesion; watch fellow eye (BARN).' },
        { label: 'Ocular syphilis', content: 'IV penicillin G 18–24 MU/day x 14d; LP to rule out neurosyphilis; co-treat for HIV.' },
        { label: 'Abusive head trauma (multilayered hemes)', content: 'Document with RetCam; MRI brain (SDH protocol); child-abuse team; mandatory CPS report.' },
        { label: 'Choroidal melanoma (medium, per COMS)', content: 'I-125 plaque brachytherapy equivalent to enucleation in survival; enucleation for large.' },
      ],
    },
    keyTrials: {
      title: 'Key Trials (One-Line Takeaways)',
      items: [
        { label: 'DRCR Protocol I', content: 'DME: anti-VEGF + deferred laser outperforms laser alone.' },
        { label: 'DRCR Protocol T', content: 'DME head-to-head: aflibercept superior when baseline VA ≤20/50; all 3 equal when VA ≥20/40.' },
        { label: 'DRCR Protocol S', content: 'PDR: ranibizumab noninferior to PRP at 2y; more visual field preservation, fewer vitrectomies.' },
        { label: 'ETDRS', content: 'Focal laser halves moderate vision loss in CSME; aspirin does not affect DR progression; scatter PRP for high-risk PDR.' },
        { label: 'DCCT / UKPDS', content: 'Tight glycemic control reduces DR progression (DCCT type 1, UKPDS type 2).' },
        { label: 'BRAVO / CRUISE', content: 'Ranibizumab for macular edema from BRVO / CRVO respectively; superior to sham.' },
        { label: 'COPERNICUS / GALILEO', content: 'Aflibercept for CRVO-ME; superior to sham; monthly for 6 mo then PRN.' },
        { label: 'SCORE', content: 'CRVO: IVT triamcinolone no better than observation; BRVO: grid laser > triamcinolone.' },
        { label: 'CATT', content: 'Wet AMD: ranibizumab and bevacizumab equivalent; monthly > PRN by 1–2 letters.' },
        { label: 'MARINA / ANCHOR', content: 'Ranibizumab wet AMD: MARINA (occult) vs ANCHOR (classic + PDT comparator); ~90% stable, ~40% gained ≥15 letters.' },
        { label: 'HARBOR', content: 'Ranibizumab 0.5 vs 2.0 mg wet AMD; PRN noninferior to monthly; no benefit to higher dose.' },
        { label: 'VIEW 1 / VIEW 2', content: 'Aflibercept wet AMD: q8-week dosing noninferior to monthly ranibizumab.' },
        { label: 'AREDS', content: 'Vitamin C/E, beta-carotene, zinc, copper → 25% reduction in AMD progression in intermediate/advanced.' },
        { label: 'AREDS2', content: 'Lutein + zeaxanthin replaces beta-carotene (no lung-cancer risk in smokers); no benefit of omega-3.' },
        { label: 'EVS', content: 'Postop endophthalmitis: PPV benefit only if VA ≤LP; routine IV abx not helpful.' },
        { label: 'COMS', content: 'Medium choroidal melanoma: plaque brachytherapy = enucleation for survival. Large: enucleation; pre-enucleation EBRT not beneficial.' },
        { label: 'CAPT', content: 'Prophylactic laser to drusen: no benefit; increased CNV risk.' },
      ],
    },
    pearls: {
      title: 'High-Yield Pearls',
      items: [
        { content: 'NPDR severity (4-2-1 rule for severe NPDR): hemes in 4 quadrants, venous beading in 2, IRMA in 1.' },
        { content: 'High-risk PDR: NVD ≥1/3 disc area, any NVD + VH, NVE ≥1/2 DA + VH. Needs PRP.' },
        { content: 'Diabetic papillopathy: disc swelling in diabetic, minimal VF loss, self-resolves.' },
        { content: 'Terson syndrome: SAH + vitreous hemorrhage; observe 6–12 weeks before PPV.' },
        { content: 'Valsalva retinopathy: preretinal/subILM hemorrhage after straining; observe or YAG hyaloidotomy.' },
        { content: 'Coats disease: boys, unilateral, telangiectasias + lipid exudation; laser/cryo; differentiate from retinoblastoma.' },
        { content: 'Best disease (vitelliform): egg-yolk macula; EOG Arden ratio <1.5 (normal >1.8); BEST1 gene.' },
        { content: 'Stargardt: bilateral pisciform flecks + bull\'s eye maculopathy; ABCA4 gene; dark choroid on FA.' },
        { content: 'X-linked retinoschisis: foveal cartwheel/schisis, low b-wave with preserved a-wave (negative ERG).' },
        { content: 'Sickle cell SC/SThal > SS for proliferative changes; sea-fan neovascularization; Goldberg stages 1–5.' },
        { content: 'Plaquenil screening: SD-OCT, 10-2 HVF annually after 5y; max 5 mg/kg/day real weight; bull\'s eye late.' },
        { content: 'Chloroquine retinal toxicity: lower threshold, seen even at low doses (malaria prophylaxis).' },
        { content: 'Vigabatrin: peripheral VF constriction, nasal > temporal; baseline + q6mo VF.' },
        { content: 'Thioridazine: pigmentary retinopathy, plumbism of retina.' },
        { content: 'Tamoxifen: crystalline maculopathy, CME; usually subclinical.' },
        { content: 'OCT reading: ILM, NFL, GCL, IPL, INL, OPL, ONL, ELM, ellipsoid zone (EZ), RPE/Bruch; EZ disruption = photoreceptor damage.' },
        { content: 'FA phases: choroidal (8–12s), arterial (10–15s), AV transit (15–25s), venous, late (≥5 min).' },
        { content: 'ICG better than FA for polypoidal CV, CSCR, pachychoroid.' },
        { content: 'Anti-VEGF dosing: bevacizumab 1.25mg/0.05mL, ranibizumab 0.5mg/0.05mL, aflibercept 2mg/0.05mL, brolucizumab 6mg/0.05mL, faricimab 6mg/0.05mL.' },
        { content: 'Brolucizumab has black-box warning for intraocular inflammation/occlusive retinal vasculitis (HAWK/HARRIER post-hoc).' },
      ],
    },
    pharmacology: {
      title: 'Pharmacology Quick Reference',
      items: [
        { label: 'Bevacizumab (Avastin) 1.25mg', content: 'Off-label anti-VEGF; wet AMD, DME, RVO, ROP; AE: endophthalmitis ~1:2000, systemic VTE risk (mild).' },
        { label: 'Ranibizumab (Lucentis) 0.5mg', content: 'Fab anti-VEGF; FDA approved AMD, DME, RVO, mCNV, ROP; AE: IOI rare.' },
        { label: 'Aflibercept (Eylea) 2mg', content: 'VEGF-trap; q8-week dosing after loading; approved wet AMD, DME, RVO.' },
        { label: 'Aflibercept HD (Eylea HD) 8mg', content: 'q12–16 week after loading; AMD, DME.' },
        { label: 'Faricimab (Vabysmo) 6mg', content: 'Anti–VEGF-A + Ang-2; q16-week dosing possible; AMD, DME.' },
        { label: 'Brolucizumab (Beovu) 6mg', content: 'Small single-chain antibody; AE: intraocular inflammation/retinal vasculitis black box.' },
        { label: 'Dexamethasone implant (Ozurdex)', content: 'Sustained-release steroid; DME, RVO-ME, non-infectious uveitis; AE: cataract, IOP rise.' },
        { label: 'Fluocinolone implant (Iluvien/Retisert)', content: '3y sustained steroid; chronic DME (Iluvien) / uveitis (Retisert); high cataract/IOP rate.' },
        { label: 'Voretigene (Luxturna)', content: 'AAV-RPE65 gene therapy; subretinal injection for Leber congenital amaurosis type 2.' },
        { label: 'Pegcetacoplan (Syfovre) / Avacincaptad (Izervay)', content: 'Complement C3/C5 inhibitors; slow GA progression; AE: CNV conversion risk.' },
        { label: 'Intravitreal vanc 1mg / ceftazidime 2.25mg', content: 'Endophthalmitis empirical coverage; amikacin 0.4mg if PCN allergy.' },
        { label: 'Intravitreal foscarnet 2.4mg', content: 'Acyclovir-resistant ARN/CMV; nephrotoxic systemically.' },
      ],
    },
  },

  // =========================================================================
  // NEURO-OPHTHALMOLOGY / ORBIT
  // =========================================================================
  {
    id: 'neuro',
    name: 'Neuro-Ophthalmology & Orbit',
    classicPresentations: {
      title: 'Classic Presentations',
      items: [
        { label: 'Young woman, subacute monocular vision loss, pain on EOM, RAPD, color desaturation', content: 'Optic neuritis (demyelinating)', subtext: 'Per ONTT: MRI brain/orbits; IVMP or observe; NO oral pred alone.' },
        { label: 'Obese young woman, headache, transient visual obscurations, bilateral disc edema', content: 'Idiopathic intracranial hypertension', subtext: 'MRI + MRV → LP opening pressure >25; acetazolamide; weight loss.' },
        { label: 'Older patient, acute monocular vision loss, chalky pale disc edema, jaw claudication', content: 'Arteritic AION (GCA)', subtext: 'ESR/CRP/plt STAT; IV solumedrol 1g x 3d; TAB within 2 weeks.' },
        { label: 'Ptosis + down-and-out + dilated pupil', content: 'Pupil-involving CN3 palsy → PCom aneurysm', subtext: 'STAT CTA/MRA head; neurosurgery.' },
        { label: 'Proptosis, lid lag, lid retraction, restricted motility, Graves disease', content: 'Thyroid eye disease', subtext: 'EUGOGO; teprotumumab; decompression if DON.' },
        { label: 'Painful Horner (ptosis, miosis, anhidrosis) + neck pain', content: 'Carotid dissection', subtext: 'STAT CTA/MRA head+neck; antithrombotic.' },
        { label: 'Diplopia worse at end of day, variable ptosis, fatigable', content: 'Myasthenia gravis', subtext: 'Ice test, AChR/MuSK Ab, SFEMG; CT chest for thymoma.' },
        { label: 'Transient monocular vision loss "curtain coming down," older patient', content: 'Amaurosis fugax → carotid stenosis', subtext: 'Carotid US, stroke workup; anti-platelet.' },
        { label: 'Child with unilateral proptosis, bruit, conjunctival corkscrew vessels', content: 'Carotid-cavernous fistula (direct = high-flow)', subtext: 'CTA; endovascular closure.' },
        { label: 'Rapidly progressive proptosis in elderly with poor immunity + black eschar', content: 'Rhino-orbital mucormycosis', subtext: 'Emergent debridement + IV amphotericin B; correct acidosis.' },
      ],
    },
    killerDiagnoses: {
      title: 'Killer Diagnoses (First-Step Management)',
      items: [
        { label: 'Arteritic AION (GCA)', content: 'IV methylpred 1g x 3d → oral pred 60–80mg; TAB within 2 weeks; steroid does not invalidate biopsy.' },
        { label: 'Pupil-involving CN3 palsy', content: 'STAT CTA (or MRA) for PCom aneurysm; neurosurgery.' },
        { label: 'Papilledema (new)', content: 'MRI brain + MRV BEFORE LP (rule out mass, CVST); then LP for opening pressure.' },
        { label: 'Painful Horner syndrome', content: 'STAT CTA/MRA head and neck for carotid dissection.' },
        { label: 'Orbital cellulitis with post-septal signs (proptosis, motility loss, vision change)', content: 'Admit; CT orbit/sinus; IV vanc + ceftriaxone + metronidazole; ENT consult; MRV if suspect CST.' },
        { label: 'Dysthyroid optic neuropathy', content: 'IV methylpred 500mg weekly (EUGOGO) x 6–12 weeks; urgent decompression if vision dropping.' },
        { label: 'Rhino-orbital mucormycosis', content: 'IV amphotericin B + emergent surgical debridement; correct DKA.' },
        { label: 'Traumatic optic neuropathy', content: 'Controversial: observation vs high-dose steroids (NASCIS) vs decompression; individualize.' },
        { label: 'CN6 palsy in child', content: 'MRI brain to rule out pontine glioma, chiasmal tumor, elevated ICP.' },
        { label: 'Wernicke encephalopathy (ophthalmoplegia, ataxia, confusion)', content: 'IV thiamine 500mg TID x 3d BEFORE any glucose.' },
      ],
    },
    keyTrials: {
      title: 'Key Trials (One-Line Takeaways)',
      items: [
        { label: 'ONTT (Optic Neuritis Treatment Trial)', content: 'IV methylpred speeds visual recovery but no final VA benefit; oral pred alone DOUBLES recurrence; MRI predicts MS (>0 lesions → 72% at 15y).' },
        { label: 'CHAMPS / ETOMS / BENEFIT', content: 'Interferon/disease-modifying therapy after first demyelinating event delays conversion to clinically definite MS.' },
        { label: 'IIHTT (IIH Treatment Trial)', content: 'Acetazolamide (up to 4g/day) + low-sodium weight loss diet improves VF in mild IIH.' },
        { label: 'NAION (IONDT)', content: 'Optic nerve sheath fenestration did NOT improve outcomes; can worsen vision — no role in NAION.' },
        { label: 'GCA management guidelines (BSR/EULAR)', content: 'High-dose steroid pulse for visual involvement; tocilizumab steroid-sparing (GiACTA).' },
        { label: 'GiACTA', content: 'Tocilizumab in GCA: higher sustained remission + lower cumulative steroid vs placebo.' },
        { label: 'NMO / AQP4 and MOG studies', content: 'AQP4+ NMOSD: eculizumab, inebilizumab, satralizumab. MOGAD: distinct entity, often steroid-responsive.' },
        { label: 'Teprotumumab (OPTIC / OPTIC-X)', content: 'IGF-1R inhibitor: significant proptosis + diplopia reduction in active TED; AE: hyperglycemia, hearing loss, IBD flare.' },
        { label: 'CLASS (cavernous sinus / skull-base — clinical guidelines)', content: 'Cavernous sinus thrombosis needs MRV + anticoagulation + broad-spectrum abx.' },
      ],
    },
    pearls: {
      title: 'High-Yield Pearls',
      items: [
        { content: 'APD grading: 0.3 log (subtle) to 2.1 log (dense); use neutral-density filter over better eye to quantify.' },
        { content: 'Pupil pathway: afferent → pretectal → EWN → CN3 → ciliary ganglion → short posterior ciliary → iris sphincter.' },
        { content: 'Light-near dissociation: Adie tonic, Argyll Robertson (neurosyphilis), Parinaud dorsal midbrain, DM, severe AFD.' },
        { content: 'Parinaud syndrome: upgaze palsy + light-near dissociation + convergence-retraction nystagmus → pineal tumor.' },
        { content: 'INO: ipsilateral MLF; adducting eye fails, contralateral abducting nystagmus; young = MS, old = stroke.' },
        { content: 'One-and-a-half syndrome: PPRF + MLF on same side; only CL abduction preserved.' },
        { content: 'CN4 palsy: vertical diplopia worse on downgaze/contralateral tilt; Parks 3-step + Bielschowsky.' },
        { content: 'CN6: isolated = microvascular if >50; check BP/DM; MRI if no recovery at 3 months.' },
        { content: 'Horner cocaine 10% test: no dilation = Horner. Apraclonidine 0.5%: reverses anisocoria in Horner. Hydroxyamphetamine 1%: localizes 1st/2nd (dilates) vs 3rd (no dilation) order.' },
        { content: 'Adie pupil: dilated, light-near dissociation, vermiform iris movements, supersensitivity to pilocarpine 0.125% (constricts).' },
        { content: 'Pharmacologic dilation: large, nonreactive, no constriction to pilocarpine 1% (vs CN3 which WILL constrict).' },
        { content: 'VF localization: prechiasmal = monocular; chiasm = bitemporal; postchiasm = homonymous (more congruous = more posterior).' },
        { content: 'Pie-in-sky homonymous quadrantanopia = contralateral temporal (Meyer loop).' },
        { content: 'Macular sparing suggests occipital lesion with dual blood supply (MCA + PCA).' },
        { content: 'Optic disc pallor + enlarged cup + small fellow disc + no field loss = optic nerve hypoplasia (de Morsier if + septo-optic).' },
        { content: 'LHON: young males, painless subacute bilateral sequential vision loss, mtDNA (11778 most common).' },
        { content: 'ADOA (Kjer): childhood-onset insidious bilateral vision loss, temporal pallor, OPA1 gene.' },
        { content: 'TED: NO-SPECS or EUGOGO classification; Hertel >22 abnormal; CAS ≥3 → active.' },
        { content: 'Orbital pseudotumor: painful proptosis, responds dramatically to steroids; biopsy if atypical.' },
        { content: 'Lacrimal gland mass: inflammatory (dacryoadenitis) vs lymphoid (bx) vs epithelial (ACC — painful, perineural).' },
      ],
    },
    pharmacology: {
      title: 'Pharmacology Quick Reference',
      items: [
        { label: 'Methylprednisolone IV 1g/day x 3d', content: 'ON, arteritic AION, TED optic neuropathy; AE: hyperglycemia, insomnia, GI bleed, avascular necrosis.' },
        { label: 'Prednisone PO 60–80mg (1 mg/kg)', content: 'GCA, TED; slow taper over months; bone protection (Ca, vit D, bisphos), PPI, PJP ppx if prolonged.' },
        { label: 'Acetazolamide 1–4g/day', content: 'IIH (IIHTT); AE: paresthesias, kidney stones, Stevens-Johnson; avoid sickle.' },
        { label: 'Topiramate', content: 'Alternative to acetazolamide for IIH; AE: acute myopia + AACG, renal stones, paresthesias.' },
        { label: 'Methotrexate / Mycophenolate / Azathioprine', content: 'Steroid-sparing for TED, sarcoid uveitis, GPA; baseline CBC, LFTs.' },
        { label: 'Teprotumumab 10mg/kg x 1 then 20mg/kg q3wk x 7', content: 'Active moderate-severe TED; AE: hyperglycemia, hearing loss (audiogram baseline), IBD flare.' },
        { label: 'Tocilizumab', content: 'Steroid-sparing in GCA (GiACTA); AE: infection, LFTs, GI perforation.' },
        { label: 'Pyridostigmine (Mestinon) 60mg TID', content: 'Ocular MG; bridging until immunosuppression; AE: cramps, diarrhea.' },
        { label: 'Thiamine IV 500mg TID', content: 'Wernicke — give BEFORE glucose.' },
        { label: 'Amphotericin B (liposomal)', content: 'Mucormycosis; nephrotoxic; monitor K+, Mg2+.' },
        { label: 'Apraclonidine 0.5% / 1%', content: 'Horner diagnostic test (reverses anisocoria via denervation supersensitivity).' },
      ],
    },
  },

  // =========================================================================
  // PEDIATRIC
  // =========================================================================
  {
    id: 'pediatric',
    name: 'Pediatric Ophthalmology',
    classicPresentations: {
      title: 'Classic Presentations',
      items: [
        { label: 'Toddler with white pupillary reflex noted in flash photo', content: 'Retinoblastoma', subtext: 'EUA + RetCam + MRI orbit/brain; NEVER biopsy.' },
        { label: 'Premature infant <30 wk GA or <1500g BW', content: 'Screen for ROP at 31 wk PMA or 4 wk chronologic (later of two)', subtext: 'ICROP3 staging; Type 1 → treat within 48–72h.' },
        { label: 'Infant with epiphora, photophobia, buphthalmos, Haab striae', content: 'Primary congenital glaucoma', subtext: 'EUA + goniotomy (clear) or trabeculotomy (hazy).' },
        { label: 'Child with alternate cover reveals constant esotropia at near + distance, high hyperopia', content: 'Refractive accommodative ET', subtext: 'Full cycloplegic hyperopic correction.' },
        { label: 'Child with head tilt, limited upgaze in adduction, overaction in elevation in abduction', content: 'Congenital SO palsy (CN4)', subtext: 'Parks 3-step; Harada-Ito or IO weakening.' },
        { label: '6-month-old, failure to fix and follow, nystagmus, iris transillumination', content: 'Oculocutaneous albinism', subtext: 'Foveal hypoplasia on OCT; genetic workup.' },
        { label: 'Infant with roving eye movements + poor vision + normal pupils', content: 'Leber congenital amaurosis / achromatopsia', subtext: 'ERG extinguished; genetic panel.' },
        { label: 'Child with new-onset esotropia + headaches + papilledema', content: 'CN6 palsy from posterior fossa tumor', subtext: 'MRI brain with contrast SAME DAY.' },
        { label: 'School-age myopia progressing >0.5 D/year', content: 'Myopia control', subtext: 'Atropine 0.01–0.05%, ortho-K, MiSight; outdoor time.' },
        { label: 'Red reflex asymmetry on exam, 3-year-old', content: 'Amblyogenic refractive error / strabismus / cataract', subtext: 'Full cycloplegic refraction + dilated exam.' },
      ],
    },
    killerDiagnoses: {
      title: 'Killer Diagnoses (First-Step Management)',
      items: [
        { label: 'Retinoblastoma', content: 'EUA + RetCam + B-scan + MRI orbit/brain. NEVER biopsy. Pediatric oncology. Group by IIRC.' },
        { label: 'Type 1 ROP', content: 'Laser (primary) or intravitreal bevacizumab within 48–72h. Bevacizumab: anterior zone I/posterior II; laser: peripheral avascular retina.' },
        { label: 'Primary congenital glaucoma', content: 'EUA measurements → goniotomy (clear cornea) or trabeculotomy (cloudy); trab/tube if fails.' },
        { label: 'Non-accidental trauma (shaken baby)', content: 'Multilayered retinal hemes bilateral; RetCam docs; MRI brain; child-abuse team; mandatory CPS report.' },
        { label: 'Congenital cataract, dense', content: 'Surgery within 4–6 weeks for unilateral, 8–10 weeks for bilateral to prevent deprivation amblyopia.' },
        { label: 'Acute onset esotropia in child', content: 'Rule out CN6 palsy, posterior fossa tumor, or hydrocephalus with MRI.' },
        { label: 'Orbital cellulitis in child (often H. flu/Strep)', content: 'Admit, IV vanc + ceftriaxone ± metronidazole; CT orbit; ENT if sinus source.' },
        { label: 'Preseptal vs orbital cellulitis', content: 'Orbital: proptosis, pain with EOM, motility loss, APD. Preseptal: lid only.' },
        { label: 'Dacryocystocele/amniotocele', content: 'Massage; if infected (dacryocystitis) → IV abx, probing; risk of airway compromise if intranasal cyst.' },
        { label: 'Leukocoria DDx', content: 'Retinoblastoma, PFV, Coats, ROP, toxocara, cataract, FEVR, Norrie disease, coloboma.' },
      ],
    },
    keyTrials: {
      title: 'Key Trials (One-Line Takeaways)',
      items: [
        { label: 'CRYO-ROP', content: 'Cryotherapy for threshold ROP halved unfavorable outcomes; established screening in US.' },
        { label: 'ETROP', content: 'Early Type 1 ROP treatment (laser before threshold) better outcomes than waiting for threshold.' },
        { label: 'BEAT-ROP', content: 'IV bevacizumab superior to laser for zone I stage 3+ ROP; caveat: recurrences up to week 60 PMA.' },
        { label: 'PEDIG ATS (Amblyopia Treatment Studies)', content: 'Patching 2h/day equal to 6h for moderate amblyopia; atropine equal to patching.' },
        { label: 'PEDIG IXT1 / IXT5', content: 'Intermittent exotropia: observation acceptable; overminus lenses effective short-term but effect fades after discontinuation.' },
        { label: 'IATS (Infant Aphakia Treatment Study)', content: 'Unilateral infant cataract: contact lens equal to primary IOL at age 5; IOL → more complications/reoperations.' },
        { label: 'ATOM1 / ATOM2 / LAMP', content: 'Atropine slows myopia progression; 0.05% optimal balance efficacy/AE (LAMP).' },
        { label: 'MOTAS / ROTAS', content: 'Occlusion dose-response for amblyopia; refractive adaptation accounts for significant improvement.' },
        { label: 'CHEER / Luxturna', content: 'AAV-RPE65 gene therapy (voretigene) restores mobility in LCA2 patients.' },
        { label: 'ICROP3 (2021 update)', content: 'Added posterior zone II, notching, pre-plus, reactivation after anti-VEGF; formalizes anti-VEGF outcomes.' },
      ],
    },
    pearls: {
      title: 'High-Yield Pearls',
      items: [
        { content: 'Visual development: birth ~20/400; 3 mo 20/200; 6 mo 20/60; 2 yr 20/30; 4 yr 20/25; 5 yr 20/20.' },
        { content: 'Amblyopia: critical period 0–3y highest plasticity, useful until ~8–10y; occasional success in older children.' },
        { content: 'Amblyogenic factors: anisometropia >1D sphere / 1.5D astig, isoametropia (high refractive error), strabismus, deprivation.' },
        { content: 'Accommodative ET: AC/A ratio >6; treat high with bifocal (+2.50 add) or PALs.' },
        { content: 'Infantile ET: onset <6mo, large angle (>30 PD), latent nystagmus, DVD, IO overaction; surgery 6–24 mo.' },
        { content: 'Intermittent XT: "Newcastle" control score; patching, overminus, surgery if decompensating.' },
        { content: 'Brown syndrome: limited elevation in adduction; congenital or acquired (RA trochleitis).' },
        { content: 'Duane syndrome: CN6 hypoplasia; Type I (no abduction), II (no adduction), III (both); globe retraction on adduction.' },
        { content: 'Möbius: CN6 + CN7 palsy; masklike face, ET, feeding issues.' },
        { content: 'Congenital nystagmus: present by 2–3 mo; null zone; improves with convergence; workup for sensory deprivation.' },
        { content: 'Ptosis congenital: usually levator dystrophy; if occluding pupil → ptosis repair early to prevent amblyopia.' },
        { content: 'Marcus-Gunn jaw-winking: aberrant CN5-CN3 connection; lid elevates with jaw movement.' },
        { content: 'Nasolacrimal duct obstruction: 90% self-resolve by 12 months; probing after 12 mo or sooner if dacryocystitis.' },
        { content: 'Retinoblastoma: RB1 gene, chromosome 13q14; bilateral = germline (40%); trilateral = + pineoblastoma.' },
        { content: 'Group A retinoblastoma (<3 mm, away from fovea/disc) → laser/cryo. Higher groups → chemoreduction + focal.' },
        { content: 'Intra-arterial chemo (melphalan) for group D/E unilateral avoids systemic toxicity.' },
        { content: 'ICROP zones: Zone I = 2× disc-to-fovea around disc; Zone II = to nasal ora; Zone III = remaining temporal crescent.' },
        { content: 'Plus disease: venous dilation + arterial tortuosity in 2+ quadrants posterior pole; key treatment criterion.' },
        { content: 'JIA uveitis screening: oligoarticular ANA+ <6y → q3mo; highest risk cohort. Chronic bilateral anterior uveitis.' },
        { content: 'Coats disease: male, unilateral telangiectasia + exudation; laser/cryo; differentiate from retinoblastoma.' },
      ],
    },
    pharmacology: {
      title: 'Pharmacology Quick Reference',
      items: [
        { label: 'Atropine 1% (0.5% if <1 yo)', content: 'Cycloplegic refraction, amblyopia penalization; AE: fever, flushing, tachycardia, CNS toxicity.' },
        { label: 'Cyclopentolate 1% (0.5% if <1 yo)', content: 'Cycloplegic refraction; max cycloplegia 30–45 min; AE: CNS (hallucinations).' },
        { label: 'Atropine 0.01–0.05%', content: 'Myopia control (LAMP/ATOM2); 0.05% > 0.025% > 0.01%; AE: pupil dilation, near blur at higher doses.' },
        { label: 'Bevacizumab 0.625mg (half adult dose)', content: 'Type 1 ROP; BEAT-ROP; recurrence window extends to ~60 wk PMA; theoretical systemic VEGF lowering concern.' },
        { label: 'Oral prednisolone', content: 'JIA uveitis bridge; growth suppression; steroid-sparing (MTX, adalimumab) preferred long-term.' },
        { label: 'Methotrexate 10–15 mg/m2 weekly PO/SC', content: 'First-line steroid-sparing for JIA uveitis.' },
        { label: 'Adalimumab', content: 'Anti-TNF; SYCAMORE and ADJUVITE trials support; q2-week SC; screen TB/HBV.' },
        { label: 'Topical cyclopentolate (amblyopia penalization)', content: 'Alternative to atropine; AE: milder systemic, sting.' },
        { label: 'Timolol 0.25% gel (kids)', content: 'Pediatric glaucoma bridging; monitor bradycardia/apnea in infants.' },
        { label: 'Dorzolamide / Brinzolamide', content: 'Pediatric glaucoma; preferred systemic acetazolamide alternative.' },
        { label: 'AVOID: brimonidine <2 years old', content: 'CNS depression, apnea, hypotension, bradycardia; strict contraindication.' },
      ],
    },
  },

  // =========================================================================
  // OPTICS
  // =========================================================================
  {
    id: 'optics',
    name: 'Optics & Refraction',
    classicPresentations: {
      title: 'Classic Presentations',
      items: [
        { label: 'Post-cataract patient with progressive blurring + glare, PCO on exam', content: 'Posterior capsular opacification', subtext: 'YAG capsulotomy 3 mm central.' },
        { label: 'New spectacle patient with distortion/swim + nausea', content: 'Induced prism / improper centration / slab-off needed', subtext: 'Verify Rx at lensometer, measure fitting cross.' },
        { label: 'High hyperope post-cataract with unexpected myopic refraction', content: 'IOL power calculation error — wrong eye axial length or K', subtext: 'Re-IOLMaster; consider piggyback IOL or exchange.' },
        { label: 'Presbyopic patient unhappy with progressive lenses, "too narrow corridor"', content: 'Progressive addition lens fitting error', subtext: 'Verify fitting height; may need shorter corridor or premium PAL.' },
        { label: 'Post-LASIK patient seeking IOL surgery', content: 'Need post-refractive IOL calculation (Barrett True-K, Haigis-L)', subtext: 'Historical method, clinical history method, ASCRS calculator.' },
        { label: 'Diplopia after new Rx in anisometropia patient', content: 'Induced vertical prism on downgaze (reading)', subtext: 'Slab-off or Fresnel prism.' },
        { label: 'Monocular diplopia that disappears with pinhole', content: 'Refractive origin — astigmatism, cataract, corneal irregularity', subtext: 'Topography; corneal rigid GP may resolve.' },
        { label: 'Cataract patient on tamsulosin', content: 'IFIS risk — floppy iris, poor dilation, iris prolapse', subtext: 'Intracameral phenylephrine, iris hooks, Malyugin ring.' },
      ],
    },
    killerDiagnoses: {
      title: 'Killer Diagnoses / Must-Not-Miss Optics Pitfalls',
      items: [
        { label: 'IFIS in tamsulosin patient', content: 'Plan small-pupil technique PREOPERATIVELY: intracameral phenylephrine/epi, Malyugin ring or iris hooks, lowered flow parameters.' },
        { label: 'IOL power error', content: 'Recheck biometry; confirm correct eye (R vs L) marked preop; consider IOL exchange if refractive surprise >1D.' },
        { label: 'Post-refractive IOL pitfall', content: 'Never use SRK/T without adjustment; always use post-LASIK formula (Barrett, Haigis-L, ASCRS online).' },
        { label: 'Unintended monovision / mini-monovision dissatisfaction', content: 'Counsel BEFORE surgery; trial contact lenses; reverse if intolerant.' },
        { label: 'Induced prism / slab-off miss', content: 'Anisometropia >1D → check vertical phoria in downgaze; prescribe slab-off if symptomatic.' },
        { label: 'Pediatric cycloplegic refraction missed', content: 'Hyperopia >+3.5 D in 1y or >+2.0 D in school age is amblyogenic; correct.' },
        { label: 'Astigmatism under-corrected post-cataract', content: 'Toric IOL, LRI, or postop excimer; SIA varies by wound location.' },
      ],
    },
    keyTrials: {
      title: 'Key Principles / Clinical Pearls',
      items: [
        { label: 'IOL formulas by axial length', content: 'Short eyes (<22mm): Haigis, Holladay 2, Barrett. Average: SRK/T, Hoffer Q. Long (>25mm): SRK/T, Barrett, Haigis with AL adjustment.' },
        { label: 'ASCRS Post-Refractive Calculator', content: 'Multiple formulas, averaging approach for eyes after LASIK/PRK/RK.' },
        { label: 'ORA / intraoperative aberrometry', content: 'Useful for post-refractive, toric alignment; reduces mean absolute error modestly.' },
        { label: 'Toric IOL alignment error', content: 'Every 1° off-axis = ~3.3% loss of cylinder correction; ~30° off = 0 correction.' },
        { label: 'Monovision target', content: 'Non-dominant eye ~-1.25 to -1.75 D for balance between near and distance.' },
      ],
    },
    pearls: {
      title: 'High-Yield Pearls',
      items: [
        { content: 'Vergence equation: U + P = V (reciprocals of object/image distances in meters, lens power in diopters).' },
        { content: 'Snell\'s law: n1 sin θ1 = n2 sin θ2. Critical angle arcsin(n2/n1); total internal reflection above it.' },
        { content: 'Reduced eye: single refracting surface, +60 D, effective axial length 22.9 mm.' },
        { content: 'Emmetropic eye: far point at infinity; myope: far point in front of eye; hyperope: behind eye.' },
        { content: 'Vertex distance correction: high myopes/hyperopes need adjustment beyond ±4 D. Power at cornea > spectacle in myopia (more minus at cornea? opposite).' },
        { content: 'Contact lens power < spectacle for myope (less minus); > for hyperope (more plus).' },
        { content: 'Astigmatism types: with-the-rule (steep vertical, youth), against (steep horizontal, aging).' },
        { content: 'Spherical equivalent = sphere + ½ cylinder.' },
        { content: 'Transposition: new sphere = old sphere + cyl; new cyl sign flipped; new axis ±90°.' },
        { content: 'Jackson cross-cylinder: placed with handle between axes to refine cylinder axis and power.' },
        { content: 'Prism: 1 PD = 1 cm deflection at 1 m; Prentice rule: P(PD) = h(cm) × D; decentration induces prism.' },
        { content: 'IOL A-constant: proxy for effective lens position; higher A → more IOL power at fixed AL.' },
        { content: 'Axial length: each 1 mm change ≈ 2.5 D IOL change in average eye.' },
        { content: 'Duochrome (red-green): red-better = undercorrected myope; green-better = overcorrected myope.' },
        { content: 'Keratometry: measures anterior corneal radius; central 3 mm; assumes spherocylinder.' },
        { content: 'Corneal power = 376/radius (mm) using keratometric index 1.3375.' },
        { content: 'Pseudophakic reading add depends on IOL: monofocal needs ~+2.5; EDOF less; multifocal variable.' },
        { content: 'Multifocal IOL: diffractive rings split light; dysphotopsias (halos/glare); toric versions available.' },
        { content: 'Accommodating IOL: axial IOL movement with ciliary body contraction; modest near benefit.' },
        { content: 'Contact lens fit flat K steep Rx = steeper lens; aim for 3-and-9 o\'clock bearing + apical clearance on RGP.' },
      ],
    },
    pharmacology: {
      title: 'Drugs Relevant to Refractive/Cataract Surgery',
      items: [
        { label: 'Tamsulosin (Flomax) / Silodosin', content: 'α1A-selective; highest IFIS risk; effect persists after stopping; plan small-pupil technique.' },
        { label: 'Intracameral phenylephrine 1% (Omidria)', content: 'Pupil dilation + NSAID (ketorolac); IFIS prophylaxis.' },
        { label: 'Intracameral epinephrine (non-preserved)', content: 'Pupil dilation during cataract; 0.3 mL of 1:10,000.' },
        { label: 'Intracameral moxifloxacin 0.5mg', content: 'Endophthalmitis prophylaxis (ESCRS): ~5× reduction in post-op endo rate.' },
        { label: 'Intracameral cefuroxime 1mg', content: 'ESCRS endophthalmitis prophylaxis alternative.' },
        { label: 'Ketorolac / Nepafenac / Bromfenac', content: 'Topical NSAID; CME prophylaxis; caution with corneal melt (dry eye, diabetic).' },
        { label: 'Prednisolone acetate 1% / Difluprednate', content: 'Postop steroid; diflupred 4x more potent, higher IOP rise risk.' },
        { label: 'Pilocarpine 1.25% (Vuity)', content: 'Presbyopia drops; AE: brow ache, RD risk, accommodative spasm.' },
        { label: 'Atropine 0.01–0.05%', content: 'Myopia control; AE: pupil dilation, photophobia at higher doses.' },
        { label: 'Trypan blue 0.06%', content: 'Capsule stain for white/mature cataract or poor red reflex.' },
      ],
    },
  },

  // =========================================================================
  // GENERAL
  // =========================================================================
  {
    id: 'general',
    name: 'General / Exam Strategy',
    classicPresentations: {
      title: 'Classic Presentations (Cross-Subspecialty)',
      items: [
        { label: 'Painless progressive monocular vision loss', content: 'Cataract, open-angle glaucoma, dry AMD, optic atrophy, compressive lesion' },
        { label: 'Painless sudden monocular vision loss', content: 'CRAO/BRAO, CRVO/BRVO, ION, vitreous hemorrhage, retinal detachment' },
        { label: 'Painful sudden monocular vision loss', content: 'AACG, optic neuritis, scleritis, GCA, endophthalmitis, corneal ulcer' },
        { label: 'Binocular diplopia', content: 'CN3/4/6, MG, TED, decompensated phoria, skew deviation, INO' },
        { label: 'Monocular diplopia', content: 'Refractive error, cataract, corneal irregularity, iris abnormality, macular pathology' },
        { label: 'Metamorphopsia', content: 'ERM, CME, macular edema, CSCR, wet AMD, MacTel, VMT' },
        { label: 'Halos around lights', content: 'Corneal edema (AACG, Fuchs), cataract, glare (PCO, YAG-related)' },
        { label: 'Red eye DDx', content: 'Conjunctivitis, uveitis, scleritis, keratitis, AACG, subconjunctival hemorrhage, episcleritis' },
      ],
    },
    killerDiagnoses: {
      title: 'ABO Fatal Flaws — Must-Not-Miss',
      items: [
        { label: 'GCA in any older adult with vision loss', content: 'ESR/CRP/platelets; start IV steroid before biopsy.' },
        { label: 'Open globe', content: 'Fox shield, NPO, IV abx, CT, OR.' },
        { label: 'Chemical burn', content: 'Irrigate BEFORE history; pH check.' },
        { label: 'Retinoblastoma in leukocoria', content: 'MRI NOT CT; never biopsy.' },
        { label: 'PCom aneurysm in CN3 pupil-involving palsy', content: 'STAT CTA.' },
        { label: 'Endophthalmitis (any hypopyon/postop pain)', content: 'Tap-and-inject same day.' },
        { label: 'Shaken baby (multilayered retinal hemes)', content: 'CPS report mandatory.' },
        { label: 'Mucormycosis in DKA / immunocompromised', content: 'IV amphotericin + emergent debridement.' },
        { label: 'Carotid dissection in painful Horner', content: 'STAT CTA/MRA.' },
        { label: 'IIH with mass on imaging', content: 'MRI/MRV BEFORE LP.' },
      ],
    },
    keyTrials: {
      title: 'Most-Cited Trials (All Subspecialties)',
      items: [
        { label: 'ONTT', content: 'ON — no oral pred alone; MRI predicts MS.' },
        { label: 'CATT', content: 'Wet AMD — bev = ranibizumab; monthly slightly better than PRN.' },
        { label: 'DRCR Protocol T', content: 'DME — aflibercept best when VA ≤20/50.' },
        { label: 'DRCR Protocol S', content: 'PDR — anti-VEGF noninferior to PRP at 2y.' },
        { label: 'EVS', content: 'Postop endo — PPV only if VA ≤LP.' },
        { label: 'COMS', content: 'Medium choroidal melanoma — plaque = enucleation.' },
        { label: 'AREDS2', content: 'Lutein/zeaxanthin replace beta-carotene.' },
        { label: 'PEDIG ATS', content: 'Patching 2h/day ≈ 6h; atropine ≈ patching.' },
        { label: 'IIHTT', content: 'Acetazolamide + weight loss improves VF.' },
        { label: 'OHTS', content: 'Topical drops halve OHT→POAG conversion.' },
        { label: 'BRAVO / CRUISE', content: 'Ranibizumab for BRVO / CRVO ME.' },
        { label: 'MARINA / ANCHOR', content: 'Ranibizumab for occult / classic wet AMD.' },
        { label: 'HARBOR', content: 'Ranibizumab 0.5 = 2.0 mg; PRN ≈ monthly.' },
        { label: 'VIEW', content: 'Aflibercept q8 wk noninferior to monthly ranibizumab.' },
        { label: 'SCORE', content: 'CRVO ME — IVT triamcinolone no better than obs; BRVO — grid laser.' },
        { label: 'IATS', content: 'Unilateral infant cataract — CL = IOL; IOL more complications.' },
        { label: 'BEAT-ROP', content: 'IV bev > laser for zone I stage 3+ ROP.' },
        { label: 'HEDS', content: 'HSV stromal — topical steroid + trifluridine; acyclovir halves recurrence.' },
      ],
    },
    pearls: {
      title: 'Oral Board Strategy Pearls',
      items: [
        { content: '8-element PMP framework: Image Description → History → Exam → DDx → Workup → Diagnosis → Management → Patient Education.' },
        { content: 'Always start with ABCs when indicated: airway, breathing, circulation, open globe precautions, contact precautions.' },
        { content: 'Safety-net phrase: "I would not want to miss...[fatal flaw]..." to demonstrate awareness.' },
        { content: 'Speak in OMIs: One Minute Illness framework — concise, structured, complete.' },
        { content: 'For workup: SEPARATE lab / imaging / ancillary tests; say names (ESR, CRP, HbA1c).' },
        { content: 'For management: medical → laser → surgical; acute → maintenance.' },
        { content: 'For ped cases: always consider amblyopia, NAI, refractive error, systemic syndrome.' },
        { content: 'For elderly with sudden vision loss: always mention GCA ruleout.' },
        { content: 'Don\'t anchor on first diagnosis — generate 3+ DDx before committing.' },
        { content: 'Pre-op for cataract: full dilated exam, biometry, endothelial count if Fuchs, macular OCT if AMD/DR suspected.' },
        { content: 'Post-op endophthalmitis within 6 weeks; consider Strep/Prop acnes if late.' },
        { content: 'For any uveitis: workup = HLA-B27, ACE/lysozyme, CXR, RPR/FTA-ABS, QuantiFERON, CBC, ESR; Lyme/Bartonella/Brucella if geographic.' },
        { content: 'For any optic neuropathy: vision, color, APD, VF, disc, OCT RNFL/GCL, MRI if demyelination suspected.' },
        { content: 'For any retinal finding: FA + OCT + OCTA + B-scan if media opacity.' },
        { content: 'Communicate with patients at 6th-grade level; check understanding; shared decision making.' },
        { content: 'Referral language: "I\'d involve [specialty] same day for [specific action]." Not vague "refer to."' },
        { content: 'Informed consent: specific risks for the specific procedure, reasonable alternatives including observation, questions answered.' },
        { content: 'Documentation: follow-up plan, worsening precautions, ability to reach doctor, patient agreement.' },
      ],
    },
    pharmacology: {
      title: 'Top Drugs Every Ophthalmologist Must Know',
      items: [
        { label: 'Timolol 0.5%', content: 'IOP-lowering β-blocker; BID; systemic β-blockade.' },
        { label: 'Latanoprost 0.005%', content: 'IOP-lowering PGA; qHS; PAP, CME, pigmentation.' },
        { label: 'Acetazolamide 500mg PO/IV', content: 'Systemic CAI; IIH, AACG; sulfa, acidosis.' },
        { label: 'Prednisolone acetate 1%', content: 'Topical steroid; IOP rise, cataract.' },
        { label: 'Bevacizumab 1.25mg IVT', content: 'Off-label anti-VEGF for AMD/DME/RVO/ROP.' },
        { label: 'IV methylpred 1g x 3d', content: 'GCA, ON, TED DON, TON; hyperglycemia, infection.' },
        { label: 'Oral valacyclovir 1g TID x 7d', content: 'HZO; start within 72h; renal dose adjust.' },
        { label: 'Oral acyclovir 400mg BID', content: 'HSV keratitis recurrence prophylaxis (HEDS).' },
        { label: 'Fortified vanc + tobra q1h', content: 'Corneal ulcer empirical; scrape first.' },
        { label: 'Intravitreal vanc 1mg + ceftaz 2.25mg', content: 'Endophthalmitis empirical (EVS).' },
        { label: 'Atropine 1%', content: 'Cycloplegic; amblyopia penalization; cyclopentolate 1% alternative.' },
      ],
    },
  },
];

export const SUBSPECIALTY_TABS = CRAM_CONTENT.map((s) => ({ id: s.id, name: s.name }));
