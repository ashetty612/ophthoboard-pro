#!/usr/bin/env python3
"""
Comprehensive Case Enhancement Script
Adds teaching enhancements, clinical images, and pearls to all 350 cases.
"""
import json
import re
import sys
from pathlib import Path

DB_PATH = Path("public/data/cases_database.json")

# ============================================================
# SECTION 1: Clinical Image URL Database
# Maps ophthalmic conditions to open-access clinical image URLs
# Sources: EyeWiki (AAO), Wikimedia Commons, NIH/NLM, OpenStax
# ============================================================

IMAGE_DATABASE = {
    # --- ANTERIOR SEGMENT ---
    "blepharitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Blepharitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "vernal keratoconjunctivitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Vernal_keratoconjunctivitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "vkc": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Vernal_keratoconjunctivitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "vortex keratopathy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/54/Cornea_verticillata.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "corneal erosion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Corneal_abrasion.JPG",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "recurrent corneal erosion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Corneal_abrasion.JPG",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "keratoconus": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Keratoconus.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "anterior uveitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/30/Hypopyon.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "uveitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/30/Hypopyon.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pigment dispersion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Krukenberg_spindle.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pds": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Krukenberg_spindle.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "salzmann": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e6/Salzmann_nodular_degeneration.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "dry eye": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Fluorescein_staining_of_the_cornea_in_a_case_of_dry_eyes.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "corneal edema": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Corneal_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "viral conjunctivitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Adenoviral_conjunctivitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "conjunctivitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Swollen_eye_with_conjunctivitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "blebitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Human_eye_with_conjunctival_bleb.jpg/1280px-Human_eye_with_conjunctival_bleb.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "fuchs": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cornea_guttata.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "fuchs dystrophy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cornea_guttata.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "endothelial dystrophy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cornea_guttata.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "marfan": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/55/Lens_subluxation_in_Marfan_syndrome.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "subluxed lens": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/55/Lens_subluxation_in_Marfan_syndrome.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pseudoexfoliation": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Pseudoexfoliation_%28PEX%29_on_anterior_lens_capsule.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "hyphema": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Hyphema_-_occupying_half_of_anterior_chamber_of_eye.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "traumatic hyphema": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Hyphema_-_occupying_half_of_anterior_chamber_of_eye.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "microbial keratitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Bacterial_corneal_ulcer.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "corneal ulcer": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Bacterial_corneal_ulcer.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "fungal keratitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Bacterial_corneal_ulcer.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "scleritis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/40/Scleritis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "chemical injury": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/69/Chemical_burn_of_the_eye.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "chemical burn": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/69/Chemical_burn_of_the_eye.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "chalazion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Chalazion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "molluscum": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/52/Molluscaklein.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "squamous cell carcinoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/61/Squamous_cell_carcinoma_of_the_conjunctiva.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cin": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/61/Squamous_cell_carcinoma_of_the_conjunctiva.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pterygium": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/55/Pterygium_%28from_Michigan_Uni%29.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pterygia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/55/Pterygium_%28from_Michigan_Uni%29.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "melanosis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Primary_acquired_melanosis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "primary acquired melanosis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Primary_acquired_melanosis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "herpes zoster": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Herpes_zoster_ophthalmicus.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "hzo": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Herpes_zoster_ophthalmicus.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "lymphoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d9/Conjunctival_lymphoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "salmon patch": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d9/Conjunctival_lymphoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "dacryocystitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Dacryocystitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "ocp": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Cicatricial_pemphigoid.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pemphigoid": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Cicatricial_pemphigoid.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "basal cell carcinoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Basal_cell_carcinoma_of_the_eyelid.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "bcc": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Basal_cell_carcinoma_of_the_eyelid.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "sebaceous cell carcinoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Sebaceous_carcinoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "episcleritis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Episcleritis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pinguecula": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Pinguecula.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "entropion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Entropion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "floppy eyelid": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f5/Floppy_eyelid_syndrome.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "band keratopathy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/db/Band_keratopathy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "interstitial keratitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/18/Interstitial_keratitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "preseptal cellulitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Preseptal_cellulitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "orbital cellulitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Preseptal_cellulitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cellulitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Preseptal_cellulitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "abmd": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Corneal_abrasion.JPG",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "basement membrane dystrophy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Corneal_abrasion.JPG",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "mooren": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Bacterial_corneal_ulcer.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "lasik": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ef/LASIK_eye_surgery.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "acute angle closure": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/40/Acute_angle_closure_glaucoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "angle closure": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/40/Acute_angle_closure_glaucoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "glaucoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Fundus_photograph_of_glaucoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cataract": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Cataract_in_human_eye.png",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },

    # --- POSTERIOR SEGMENT ---
    "macular degeneration": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/10/Intermediate_age_related_macular_degeneration.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "amd": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/10/Intermediate_age_related_macular_degeneration.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "wet amd": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Wet_AMD_OCT.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "diabetic retinopathy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
        "attribution": "Wikimedia Commons / NIH, Public Domain"
    },
    "proliferative diabetic retinopathy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
        "attribution": "Wikimedia Commons / NIH, Public Domain"
    },
    "diabetic macular edema": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
        "attribution": "Wikimedia Commons / NIH, Public Domain"
    },
    "retinal detachment": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Retinal_detachment.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "rhegmatogenous retinal detachment": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Retinal_detachment.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "central retinal vein occlusion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Central_retinal_vein_occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "crvo": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Central_retinal_vein_occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "branch retinal vein occlusion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/75/Branch_retinal_vein_occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "brvo": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/75/Branch_retinal_vein_occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "vein occlusion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Central_retinal_vein_occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "central retinal artery occlusion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/54/Central_Retinal_Artery_Occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "crao": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/54/Central_Retinal_Artery_Occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "artery occlusion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/54/Central_Retinal_Artery_Occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cherry red spot": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/54/Central_Retinal_Artery_Occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "choroidal melanoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Choroidal_melanoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "melanoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Choroidal_melanoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "epiretinal membrane": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Epiretinal_membrane_OCT.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "erm": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Epiretinal_membrane_OCT.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "macular hole": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a1/Full_thickness_macular_hole_by_OCT.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "retinal tear": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Retinal_detachment.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "lattice degeneration": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Retinal_detachment.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "toxoplasmosis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Fundus_photograph-toxoplasmosis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cmv retinitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/fb/CMV_retinitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "endophthalmitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/30/Hypopyon.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "retinoblastoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Retinoblastoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "coats disease": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4f/Coats_disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "retinitis pigmentosa": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/01/Fundus_of_patient_with_retinitis_pigmentosa%2C_mid_stage.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "rp": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/01/Fundus_of_patient_with_retinitis_pigmentosa%2C_mid_stage.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "stargardt": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Stargardt_disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "csr": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/43/Central_serous_retinopathy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "central serous": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/43/Central_serous_retinopathy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "retinal hemangioblastoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Retinal_detachment.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "angioid streaks": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/10/Intermediate_age_related_macular_degeneration.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "vitreous hemorrhage": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
        "attribution": "Wikimedia Commons / NIH, Public Domain"
    },
    "sickle cell": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
        "attribution": "Wikimedia Commons / NIH, Public Domain"
    },
    "retinal vasculitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Central_retinal_vein_occlusion.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "rop": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Retinopathy_of_prematurity.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "retinopathy of prematurity": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Retinopathy_of_prematurity.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "plaquenil": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/10/Intermediate_age_related_macular_degeneration.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "hydroxychloroquine": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/10/Intermediate_age_related_macular_degeneration.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },

    # --- NEURO-OPHTHALMOLOGY ---
    "optic neuritis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "papilledema": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "disc edema": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "optic nerve hypoplasia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e1/Optic_nerve_hypoplasia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "giant cell arteritis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "gca": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "aion": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "ischemic optic neuropathy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "third nerve palsy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/85/Oculomotor_palsy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cn3 palsy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/85/Oculomotor_palsy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "sixth nerve palsy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Abducens_nerve_palsy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cn6 palsy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Abducens_nerve_palsy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "horner": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/73/Horner%27s_syndrome.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "horner syndrome": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/73/Horner%27s_syndrome.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "thyroid eye disease": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Proptosis_and_lid_retraction_from_Graves%27_Disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "graves": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Proptosis_and_lid_retraction_from_Graves%27_Disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "thyroid orbitopathy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Proptosis_and_lid_retraction_from_Graves%27_Disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "proptosis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Proptosis_and_lid_retraction_from_Graves%27_Disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "optic atrophy": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Optic_atrophy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "optic pit": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Optic_atrophy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "idiopathic intracranial hypertension": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "iih": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "pseudotumor cerebri": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/14/Optic_disc_edema.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "nystagmus": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/85/Oculomotor_palsy.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "myasthenia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/39/Myasthenia_gravis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "myasthenia gravis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/39/Myasthenia_gravis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "cavernous hemangioma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Proptosis_and_lid_retraction_from_Graves%27_Disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "rhabdomyosarcoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Proptosis_and_lid_retraction_from_Graves%27_Disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "optic glioma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Proptosis_and_lid_retraction_from_Graves%27_Disease.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },

    # --- PEDIATRIC ---
    "congenital glaucoma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Buphthalmos.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "buphthalmos": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Buphthalmos.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "leukocoria": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Retinoblastoma.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "esotropia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Esotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "accommodative esotropia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Esotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "exotropia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/19/Exotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "amblyopia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Esotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "strabismus": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Esotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "nasolacrimal duct obstruction": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Dacryocystitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "nldo": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Dacryocystitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "congenital cataract": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Cataract_in_human_eye.png",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "infantile esotropia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Esotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "neonatal conjunctivitis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Swollen_eye_with_conjunctivitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "ophthalmia neonatorum": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Swollen_eye_with_conjunctivitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "duane": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Esotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "brown syndrome": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Esotropia.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "capillary hemangioma": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Preseptal_cellulitis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "dermoid": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Pinguecula.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "ptosis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/39/Myasthenia_gravis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
    "congenital ptosis": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/39/Myasthenia_gravis.jpg",
        "attribution": "Wikimedia Commons, CC BY-SA"
    },
}


# ============================================================
# SECTION 2: Teaching Enhancement Templates
# Generates examiner expectations, pitfalls, and learning points
# based on question type and clinical context
# ============================================================

def get_teaching_for_question(q_num: int, question_text: str, answer_text: str, case_title: str, subspecialty: str, diagnosis_hint: str) -> dict:
    """Generate comprehensive teaching enhancement for a single question."""

    # Parse answer into key points
    answer_lines = [l.strip().lstrip('●•○-– ') for l in answer_text.split('\n') if l.strip() and len(l.strip()) > 2]
    primary_points = answer_lines[:3] if answer_lines else ["See discussion"]

    teaching = {
        "examinerExpectations": "",
        "acceptableAnswers": [],
        "perfectAnswer": "",
        "incorrectResponses": [],
        "commonPitfalls": [],
        "learningPoints": []
    }

    if q_num == 1 or "differential" in question_text.lower():
        # DIFFERENTIAL DIAGNOSIS
        teaching["examinerExpectations"] = f"The examiner expects a prioritized differential diagnosis list, starting with the MOST LIKELY diagnosis first, followed by important rule-outs (life- or sight-threatening conditions). For this case, lead with conditions most consistent with the clinical presentation. Aim for 3-5 differentials — not too few (shows narrow thinking) and not too many (shows shotgunning)."

        teaching["acceptableAnswers"] = [
            f"Listing the correct diagnosis within top 3 differentials",
            f"Including at least one important 'must-not-miss' diagnosis",
            f"Organizing from most to least likely"
        ]

        if primary_points:
            teaching["perfectAnswer"] = f"Lead with {primary_points[0]} as the most likely diagnosis based on the presentation. Then systematically list rule-outs in order of clinical urgency. Demonstrate reasoning for each: 'Given the [specific finding], I would consider [diagnosis] because [reasoning].'"

        teaching["incorrectResponses"] = [
            "Listing rare 'zebra' diagnoses before common conditions",
            "Providing an unorganized list without prioritization",
            "Missing life/sight-threatening diagnoses (GCA, retinoblastoma, open globe)",
            "Shotgunning with 10+ differentials without reasoning"
        ]

        teaching["commonPitfalls"] = [
            "Jumping to diagnosis without describing the image/findings first",
            "Forgetting to include the correct diagnosis in your list",
            "Not considering bilateral vs unilateral presentation",
            "Failing to mention systemic conditions that could cause the finding",
            "Over-anchoring on one diagnosis and missing alternatives"
        ]

        teaching["learningPoints"] = [
            "Always rank differentials from most to least likely — the examiner will usually confirm your top diagnosis and move on",
            "Include at least one 'must-not-miss' diagnosis even if unlikely (e.g., GCA in elderly with vision loss)",
            "The ABO scores your DIAGNOSTIC REASONING, not just the correct answer",
            "If you recognize a classic presentation, state it confidently but still offer alternatives",
            f"For {subspecialty} cases, know the top 3-5 differentials for common presentations"
        ]

    elif q_num == 2 or "history" in question_text.lower() or "questions" in question_text.lower():
        # HISTORY
        teaching["examinerExpectations"] = f"The examiner wants FOCUSED, HYPOTHESIS-DRIVEN history questions — not an exhaustive review of systems. Each question should help narrow your differential. Show the examiner that you are thinking critically about which historical details would change your management."

        teaching["acceptableAnswers"] = [
            "Asking about onset, duration, and progression of symptoms",
            "Inquiring about relevant systemic history (DM, HTN, autoimmune)",
            "Asking about current medications and allergies",
            "Inquiring about prior ocular history and surgeries"
        ]

        teaching["perfectAnswer"] = f"Ask targeted questions that directly narrow the differential: onset/duration, associated symptoms, medical history relevant to the suspected diagnosis, medication history (especially steroids, hydroxychloroquine, anticoagulants), family history if hereditary condition suspected, and social/occupational history if relevant. Each question should have a clear diagnostic purpose."

        teaching["incorrectResponses"] = [
            "Doing a full review of systems unrelated to the presentation",
            "Asking vague questions like 'Tell me about your health'",
            "Forgetting to ask about medications (a common cause of ocular findings)",
            "Not asking about the timeline of symptoms"
        ]

        teaching["commonPitfalls"] = [
            "Shotgunning with 20+ questions instead of focused hypothesis-driven questioning",
            "Forgetting to ask about medications — many eye conditions are drug-related",
            "Not asking about trauma history when relevant",
            "Skipping family history for hereditary conditions",
            "Not asking about contact lens wear for corneal cases"
        ]

        teaching["learningPoints"] = [
            "Every question you ask should help confirm or rule out a specific diagnosis",
            "The ABO examiner is looking for EFFICIENT data gathering — quality over quantity",
            "Key medication questions: steroids (glaucoma/cataract), hydroxychloroquine (maculopathy), tamsulosin (IFIS), anticoagulants (bleeding risk)",
            "Always ask about allergies before discussing treatment",
            "Social history matters: smoking (TED, AMD), occupational exposures, contact lens hygiene"
        ]

    elif q_num == 3 or "exam" in question_text.lower() or "findings" in question_text.lower():
        # EXAMINATION
        teaching["examinerExpectations"] = f"The examiner expects you to describe a FOCUSED but SYSTEMATIC examination. Always start with the basics (VA, pupils including RAPD, IOP, confrontation fields) then move to the relevant specialized exam. Name SPECIFIC clinical signs and tests — not generic 'look at the eye.'"

        teaching["acceptableAnswers"] = [
            "Starting with VA, pupils (RAPD check), IOP, confrontation fields",
            "Performing a targeted slit lamp and/or dilated fundus exam",
            "Looking for specific signs relevant to the differential",
            "Mentioning relevant ancillary tests at the slit lamp (e.g., Seidel test, gonioscopy)"
        ]

        teaching["perfectAnswer"] = f"Begin with vital signs of the eye: best-corrected VA, pupil exam with swinging flashlight test for RAPD, IOP measurement, and confrontation visual fields. Then perform targeted examination based on suspected diagnosis. Name specific signs you're looking for and state what each finding would indicate diagnostically."

        teaching["incorrectResponses"] = [
            "Skipping VA and pupil exam",
            "Describing a generic 'complete exam' without specific findings",
            "Forgetting to check the fellow eye",
            "Not mentioning IOP in a case where glaucoma is in the differential",
            "Performing invasive exam on a potentially open globe"
        ]

        teaching["commonPitfalls"] = [
            "NEVER manipulate the eye without first ruling out open globe (peaked pupil, low IOP, positive Seidel)",
            "Forgetting to check the FELLOW EYE — this is scored",
            "Not specifying which test you would use to confirm a finding",
            "Describing exam maneuvers in the wrong order",
            "Missing the RAPD check — this is one of the most important exam elements"
        ]

        teaching["learningPoints"] = [
            "The complete eye exam always starts with VA → Pupils → IOP → Confrontation Fields",
            "Name specific clinical signs: Marcus Gunn pupil, Shafer sign, Seidel test, forced duction test",
            "For trauma cases: ALWAYS rule out open globe before any other manipulation",
            "Examiners want to hear specific grading systems: AC cell/flare (SUN criteria), NVI grading, disc edema staging",
            "The exam should be hypothesis-driven — looking for findings that confirm or refute your differential"
        ]

    elif q_num == 4 or "test" in question_text.lower() or "workup" in question_text.lower() or "diagnostic" in question_text.lower():
        # DIAGNOSTIC TESTING
        teaching["examinerExpectations"] = f"The examiner wants PERTINENT tests only — not a shotgun approach. For each test ordered, you should be able to explain what you expect to find and how it changes your management. Ordering unnecessary tests is scored negatively."

        teaching["acceptableAnswers"] = [
            "Ordering tests that directly confirm or rule out the leading diagnoses",
            "Specifying what you expect each test to show",
            "Ordering tests in a logical sequence (non-invasive before invasive)",
            "Knowing when 'no additional testing' is the correct answer"
        ]

        teaching["perfectAnswer"] = f"Order only tests that will change your management. For each test, state: (1) what you're looking for, (2) what a positive/negative result would indicate, and (3) how it influences your treatment plan. Order non-invasive tests before invasive ones."

        teaching["incorrectResponses"] = [
            "Ordering every possible test (shotgunning)",
            "Ordering tests without knowing what you expect to find",
            "Missing a critical test (e.g., ESR/CRP in suspected GCA)",
            "Ordering invasive tests when non-invasive options exist",
            "Ordering genetic testing without counseling"
        ]

        teaching["commonPitfalls"] = [
            "Shotgunning tests is a MAJOR scoring penalty — order only what changes management",
            "Always specify the EXACT test (e.g., 'OCT macula' not just 'OCT')",
            "Know when the answer is 'no additional testing needed' — this IS an acceptable answer",
            "For systemic workup, know which labs to order and why (HLA-B27 for uveitis, ACE level for sarcoid)",
            "Don't forget imaging: CT orbits with contrast for orbital pathology, MRI brain for neuro cases"
        ]

        teaching["learningPoints"] = [
            "Tests should be hypothesis-driven: each test should confirm or rule out a specific diagnosis",
            "Know the key diagnostic tests for each condition: FFA for retinal vascular disease, OCT for macular pathology, B-scan for media opacity",
            "Non-invasive before invasive: OCT before FFA, ultrasound before biopsy",
            "Lab workup templates: uveitis (HLA-B27, RPR, FTA-ABS, ACE, CXR, CBC), vascular (CBC, ESR, CRP, lipids, HbA1c)",
            "The ABO examiner values knowing WHEN NOT to test as much as knowing what to order"
        ]

    elif q_num == 5 or "treat" in question_text.lower() or "management" in question_text.lower():
        # TREATMENT
        teaching["examinerExpectations"] = f"The examiner expects a STEPWISE treatment plan going from least to most invasive (unless emergency). Use SPECIFIC drug names, doses, frequencies, and durations. Reference landmark clinical trials when applicable. Anticipate complications and treatment failure."

        teaching["acceptableAnswers"] = [
            "Providing a stepwise treatment plan (conservative → medical → surgical)",
            "Using specific drug names and dosages",
            "Addressing both immediate and long-term management",
            "Mentioning when to refer or co-manage"
        ]

        teaching["perfectAnswer"] = f"Present treatment in a stepwise fashion: (1) Immediate/emergency management if needed, (2) Medical therapy with specific drugs, doses, routes, frequencies, (3) Surgical options with indications, (4) Management of potential complications, (5) Follow-up schedule. Reference evidence: cite relevant landmark trials (ONTT, EVS, CATT, DRCR.net, AREDS2)."

        teaching["incorrectResponses"] = [
            "Vague answers like 'give antibiotics' without specifying which one",
            "Jumping to surgery without considering medical management first (unless emergency)",
            "Not knowing surgical complications",
            "Prescribing oral steroids alone for optic neuritis (ONTT showed increased recurrence)",
            "Not treating the fellow eye when indicated (e.g., prophylactic LPI in angle closure)"
        ]

        teaching["commonPitfalls"] = [
            "ALWAYS specify drug name + dose + route + frequency + duration",
            "For EMERGENCIES (CRAO, open globe, acute angle closure, GCA), skip conservative measures",
            "Never prescribe oral steroids alone for optic neuritis — this is a FATAL FLAW per ABO",
            "Always mention treatment of the fellow eye when relevant",
            "Know drug contraindications: no pilocarpine in posterior synechiae, no sulfonamides in sickle cell"
        ]

        teaching["learningPoints"] = [
            "Landmark trials to reference: ONTT (optic neuritis), EVS (endophthalmitis), CATT/DRCR.net (anti-VEGF), AREDS2 (AMD), OHTS (glaucoma), PEDIG (amblyopia)",
            "Know the emergency management protocols cold: GCA (IV steroids → biopsy), CRAO (ocular massage, AC paracentesis), open globe (shield, NPO, IV abx, OR)",
            "For surgical cases, always mention informed consent, risks, benefits, and alternatives",
            "Anti-VEGF agents: know bevacizumab, ranibizumab, aflibercept, faricimab — and when each is preferred",
            "Always address: What if treatment fails? What is your next step?"
        ]

    elif q_num == 6 or "prognosis" in question_text.lower() or "counsel" in question_text.lower() or "follow" in question_text.lower():
        # PROGNOSIS & COUNSELING
        teaching["examinerExpectations"] = f"The examiner expects comprehensive patient counseling including: expected visual outcome, timeline for recovery, warning signs requiring immediate return, lifestyle modifications, follow-up schedule, and discussion of chronic disease management when applicable."

        teaching["acceptableAnswers"] = [
            "Discussing expected visual prognosis with realistic expectations",
            "Providing specific follow-up intervals",
            "Listing warning signs for the patient to watch for",
            "Mentioning lifestyle modifications and preventive measures"
        ]

        teaching["perfectAnswer"] = f"Counsel the patient on: (1) Expected visual outcome and timeline, (2) Specific warning signs requiring immediate return (new floaters, vision loss, pain), (3) Activity restrictions and lifestyle modifications, (4) Follow-up schedule with specific intervals, (5) Discussion of chronic nature if applicable, (6) Informed consent for any upcoming procedures. Use empathetic language and check for understanding."

        teaching["incorrectResponses"] = [
            "Being overly optimistic about visual prognosis",
            "Not discussing potential complications",
            "Forgetting to schedule follow-up",
            "Skipping patient education entirely",
            "Not addressing driving restrictions when relevant"
        ]

        teaching["commonPitfalls"] = [
            "Patient counseling IS SCORED on the ABO exam — never skip this question",
            "Always give realistic expectations — don't promise perfect vision",
            "For chronic conditions, emphasize the ongoing nature of treatment",
            "Discuss driving restrictions when vision is affected (legal requirements vary by state)",
            "For inherited conditions, discuss genetic counseling for family members"
        ]

        teaching["learningPoints"] = [
            "The ABO Management domain includes patient education — this is not an afterthought",
            "Return precautions to always mention: sudden vision loss, new floaters/flashes, increasing pain, worsening redness",
            "Follow-up intervals should be specific: '1 week' not 'soon'",
            "For surgical patients: discuss NPO status, positioning requirements, activity restrictions",
            "Showing empathy and checking for patient understanding demonstrates clinical maturity"
        ]

    else:
        # Generic/Discussion format
        teaching["examinerExpectations"] = f"The examiner expects a thorough, organized discussion of this topic. Structure your answer clearly with key concepts first, then supporting details."

        teaching["acceptableAnswers"] = [
            "Covering the major points of the topic",
            "Providing organized, structured response",
            "Including clinical relevance"
        ]

        teaching["perfectAnswer"] = f"Provide a comprehensive yet organized discussion covering all major points. Start with the most important concept and build from there. Include clinical relevance and practical applications."

        teaching["incorrectResponses"] = [
            "Incomplete coverage of the topic",
            "Disorganized response without clear structure",
            "Factual errors in fundamental concepts"
        ]

        teaching["commonPitfalls"] = [
            "Giving a disorganized answer — structure matters",
            "Focusing on minutiae while missing the big picture",
            "Not relating the concept to clinical practice"
        ]

        teaching["learningPoints"] = [
            "Organize your thoughts before speaking",
            "Cover key concepts systematically",
            "Always tie basic science to clinical relevance"
        ]

    return teaching


def get_case_pearls(case: dict, subspecialty: str) -> list:
    """Generate case-specific clinical pearls."""
    pearls = []
    title_lower = case.get('title', '').lower()
    answer_text = ' '.join([q.get('answer', '') for q in case.get('questions', [])]).lower()
    combined = title_lower + ' ' + answer_text

    # Anterior Segment pearls
    if 'blepharitis' in combined:
        pearls.extend([
            "Blepharitis is CONTROLLED, not CURED — always counsel on chronic maintenance therapy",
            "Demodex blepharitis: look for cylindrical dandruff at lash base, treat with tea tree oil or ivermectin",
            "Meibomian gland dysfunction is the #1 cause of evaporative dry eye"
        ])
    if 'keratoconus' in combined:
        pearls.extend([
            "Munson sign, Vogt striae, and Fleischer ring are classic findings — know all three",
            "CXL (corneal cross-linking) is now first-line for progressive keratoconus in young patients",
            "Acute hydrops = Descemet membrane rupture — treat with hypertonic saline, NOT surgery acutely"
        ])
    if 'uveitis' in combined or 'iritis' in combined:
        pearls.extend([
            "HLA-B27 anterior uveitis: acute, unilateral, recurrent, non-granulomatous, young male with back pain",
            "Granulomatous vs non-granulomatous uveitis guides your systemic workup entirely",
            "Always check IOP — both hypertensive uveitis (HSV, PSS) and hypotony are important"
        ])
    if 'hyphema' in combined:
        pearls.extend([
            "Sickle cell patients: AVOID carbonic anhydrase inhibitors (worsen sickling in AC)",
            "Rebleed risk peaks at day 3-5 — keep patient upright, cycloplegic, topical steroid",
            "8-ball hyphema = total hyphema with black blood — needs surgical washout to prevent corneal staining"
        ])
    if 'herpes' in combined or 'hsv' in combined:
        pearls.extend([
            "HSV keratitis: NEVER use steroids alone without antiviral coverage — risk of worsening",
            "Dendritic ulcer = HSV; pseudodendritic = HZO — the branching pattern differs",
            "HEDS trial: oral acyclovir 400mg BID reduces recurrence by 50%"
        ])
    if 'glaucoma' in combined and 'angle closure' in combined:
        pearls.extend([
            "Acute angle closure sequence: topical timolol → brimonidine → pilocarpine 2% → acetazolamide IV → mannitol if needed → LPI when cornea clears",
            "ALWAYS treat the fellow eye with prophylactic LPI — missing this is a fatal flaw",
            "Plateau iris: suspect if angle remains narrow after LPI — needs argon laser iridoplasty"
        ])
    if 'scleritis' in combined:
        pearls.extend([
            "Necrotizing scleritis + rheumatoid arthritis = scleromalacia perforans — very high mortality risk",
            "Scleritis workup: CBC, CMP, ANA, ANCA, RF, anti-CCP, UA, CXR — looking for systemic vasculitis",
            "Posterior scleritis can mimic choroidal mass — B-scan shows T-sign (fluid in sub-Tenon space)"
        ])

    # Posterior Segment pearls
    if 'diabetic' in combined and ('retinopathy' in combined or 'macular edema' in combined):
        pearls.extend([
            "ETDRS severity scale: mild/moderate/severe NPDR → PDR — know the 4-2-1 rule for severe NPDR",
            "DRCR.net Protocol T: aflibercept best for VA <20/50; all anti-VEGF similar for VA ≥20/40",
            "PRP reduces severe vision loss by 50% in high-risk PDR — know the DRS/ETDRS criteria"
        ])
    if 'retinal detachment' in combined or 'rd' in combined:
        pearls.extend([
            "Macula-on RD is an emergency (within 24h) — macula-off is urgent but not emergent",
            "Pneumatic retinopexy: only for superior breaks (8-4 o'clock), single break, no PVR",
            "Know PVR staging (A, B, C) — PVR is the #1 cause of surgical failure"
        ])
    if 'macular degeneration' in combined or 'amd' in combined:
        pearls.extend([
            "AREDS2 formula: Vitamins C, E, zinc, lutein, zeaxanthin (NO beta-carotene — lung cancer risk in smokers)",
            "Anti-VEGF injections are first-line for wet AMD — CATT showed bevacizumab non-inferior to ranibizumab",
            "Geographic atrophy: now treatable with complement inhibitors (pegcetacoplan, avacincaptad pegol)"
        ])
    if 'vein occlusion' in combined or 'crvo' in combined or 'brvo' in combined:
        pearls.extend([
            "SCORE study: intravitreal triamcinolone for CRVO macular edema (before anti-VEGF era)",
            "BRAVO/CRUISE: ranibizumab effective for BRVO/CRVO macular edema",
            "Check for neovascularization — NVI/NVA = neovascular glaucoma risk, needs PRP"
        ])
    if 'artery occlusion' in combined or 'crao' in combined:
        pearls.extend([
            "CRAO is a stroke equivalent — get carotid Doppler, echo, CBC, ESR/CRP urgently",
            "Window of treatment is narrow: ocular massage, AC paracentesis, vasodilators within hours",
            "ALWAYS rule out GCA in patients >50 — start IV methylprednisolone BEFORE biopsy results"
        ])
    if 'choroidal melanoma' in combined or 'melanoma' in combined:
        pearls.extend([
            "TFSOM mnemonic: Thickness >2mm, Fluid (SRF), Symptoms, Orange pigment, Margin at disc",
            "COMS: medium tumors benefit from I-125 plaque brachytherapy vs enucleation",
            "NEVER biopsy a suspected retinoblastoma (tumor seeding) — but choroidal melanoma CAN be biopsied"
        ])
    if 'endophthalmitis' in combined:
        pearls.extend([
            "EVS: vitrectomy + intravitreal abx if VA = LP or worse; tap + inject if VA > LP",
            "Intravitreal injection: vancomycin 1mg/0.1mL + ceftazidime 2.25mg/0.1mL (or amikacin)",
            "Post-cataract endophthalmitis: most commonly Staph epidermidis (acute) or P. acnes (chronic)"
        ])
    if 'toxoplasmosis' in combined:
        pearls.extend([
            "Classic 'headlight in fog': active white lesion adjacent to old pigmented scar",
            "Treat if threatening macula/disc: pyrimethamine + sulfadiazine + folinic acid (NOT folic acid)",
            "Alternative: TMP-SMX (Bactrim) — easier to use, fewer side effects"
        ])

    # Neuro pearls
    if 'optic neuritis' in combined:
        pearls.extend([
            "ONTT: IV methylprednisolone (250mg q6h x 3 days) → oral prednisone taper; NEVER oral steroids alone",
            "Typical ON: young female, pain with eye movements, RAPD, dyschromatopsia — MRI for MS plaques",
            "Atypical features (bilateral, no pain, severe disc edema, no recovery) → think NMO, sarcoid, or compression"
        ])
    if 'papilledema' in combined or 'pseudotumor' in combined or 'iih' in combined:
        pearls.extend([
            "IIHTT: acetazolamide + weight loss is first-line; optic nerve sheath fenestration for vision loss",
            "Modified Dandy criteria: elevated opening pressure >25 cmH2O, normal CSF composition, no mass on MRI",
            "Check for venous sinus thrombosis on MRV — it can mimic IIH exactly"
        ])
    if 'third nerve' in combined or 'cn3' in combined or 'cn iii' in combined:
        pearls.extend([
            "PUPIL-INVOLVING CN3 palsy = PComm aneurysm until proven otherwise — EMERGENT CTA/MRA",
            "Pupil-sparing + complete CN3 palsy in older patient with DM/HTN = microvascular (observe)",
            "Aberrant regeneration after CN3 palsy suggests compressive etiology — never after microvascular"
        ])
    if 'horner' in combined:
        pearls.extend([
            "Cocaine test confirms Horner; hydroxyamphetamine test localizes (pre- vs post-ganglionic)",
            "Horner + ipsilateral pain = carotid dissection until proven otherwise — urgent MRA/CTA neck",
            "Pediatric Horner: MUST rule out neuroblastoma — urine VMA/HVA, chest/abdominal imaging"
        ])
    if 'thyroid' in combined or 'graves' in combined or 'ted' in combined:
        pearls.extend([
            "Surgical sequence for TED: decompression → strabismus → eyelid — ALWAYS in this order",
            "CAS (Clinical Activity Score) ≥3/7 = active disease, consider IV methylprednisolone or teprotumumab",
            "Teprotumumab (IGF-1R inhibitor) is now FDA-approved for active TED — game-changing treatment"
        ])
    if 'myasthenia' in combined:
        pearls.extend([
            "Ice test: improved ptosis after 2 min of ice = positive for MG (simple, bedside test)",
            "CT chest for thymoma in ALL myasthenia patients — thymectomy may be curative",
            "Ocular MG converts to generalized MG in ~50% within 2 years — monitor closely"
        ])

    # Pediatric pearls
    if 'retinoblastoma' in combined:
        pearls.extend([
            "NEVER do intraocular biopsy — tumor seeding is catastrophic. Diagnosis is CLINICAL + imaging",
            "Trilateral retinoblastoma: bilateral RB + pinealoblastoma — check brain MRI",
            "Genetic counseling essential: RB1 mutation carriers have 45% risk per eye"
        ])
    if 'amblyopia' in combined:
        pearls.extend([
            "PEDIG: 2 hours/day patching as effective as 6 hours for moderate amblyopia",
            "Atropine penalization: 1% atropine to better eye, weekend dosing may be sufficient",
            "Critical period: treatment most effective before age 7-8, but some benefit up to age 17 (PEDIG ATS)"
        ])
    if 'strabismus' in combined and ('esotropia' in combined or 'accommodative' in combined):
        pearls.extend([
            "Full hyperopic correction is the FIRST step — always do cycloplegic refraction (atropine 1%)",
            "High AC/A ratio: near deviation >> distance deviation — give bifocal or progressive add",
            "Non-accommodative component: surgery for residual deviation after full optical correction"
        ])
    if 'congenital glaucoma' in combined or 'buphthalmos' in combined:
        pearls.extend([
            "Classic triad: epiphora, photophobia, blepharospasm — plus enlarged cornea and Haab striae",
            "Medical therapy is a BRIDGE to surgery — goniotomy or trabeculotomy is definitive treatment",
            "EUA: check corneal diameter (>12mm suspicious), IOP, gonioscopy, optic nerve"
        ])
    if 'rop' in combined or 'retinopathy of prematurity' in combined:
        pearls.extend([
            "Screen at 31 weeks postmenstrual age OR 4 weeks chronological age, whichever is later",
            "Type 1 ROP (treat): Zone I any stage with plus, Zone I stage 3, Zone II stage 2-3 with plus",
            "Treatment: laser photocoagulation to avascular retina; anti-VEGF for Zone I disease (RAINBOW trial)"
        ])

    # If no specific pearls matched, add general subspecialty pearls
    if not pearls:
        if subspecialty == 'Anterior Segment':
            pearls = [
                "For any anterior segment case, always start with slit lamp examination: lids, lashes, conjunctiva, cornea, AC, iris, lens",
                "Know the common topical medication side effects: steroids (IOP elevation, cataract), brimonidine (allergy), prostaglandins (iris color change)",
                "Always consider infection in the differential for any red eye with corneal involvement"
            ]
        elif subspecialty == 'Posterior Segment':
            pearls = [
                "For any posterior segment case, dilated fundus exam is essential — describe systematically: disc, macula, vessels, periphery",
                "Know when to order FFA vs OCT vs B-scan: FFA for vascular/inflammatory, OCT for structural, B-scan when view is limited",
                "Anti-VEGF is first-line for most neovascular/edematous retinal conditions — know the agents and their differences"
            ]
        elif subspecialty == 'Neuro-Ophthalmology and Orbit':
            pearls = [
                "The pupil exam is the most important clinical test in neuro-ophthalmology — RAPD, anisocoria, light-near dissociation",
                "For any vision loss case, always consider: is this optic nerve, chiasm, or retrochiasmal? Visual fields help localize",
                "Neuroimaging is critical: MRI brain/orbits with contrast for most neuro-ophtho cases"
            ]
        elif subspecialty == 'Pediatric Ophthalmology':
            pearls = [
                "Amblyopia is the most common cause of vision loss in children — screen and treat early",
                "Any child with strabismus: always do cycloplegic refraction FIRST before considering surgery",
                "Leukocoria in a child: retinoblastoma until proven otherwise — this is non-negotiable"
            ]
        elif subspecialty == 'Optics':
            pearls = [
                "Know lens transposition cold — it's a practical question that comes up frequently",
                "Understand vergence: light diverging = negative vergence, converging = positive vergence",
                "IOL calculation after refractive surgery requires adjusted K values — know multiple methods"
            ]

    return pearls[:5]  # Return max 5 pearls per case


def find_image_for_case(case: dict, subspecialty: str) -> tuple:
    """Find an appropriate clinical image URL for a case."""
    title_lower = case.get('title', '').lower()
    presentation_lower = case.get('presentation', '').lower()

    # Get diagnosis from Q1 answer
    diag_text = ''
    if case.get('questions'):
        q1 = case['questions'][0]
        if q1.get('question') != 'Discussion':
            diag_text = q1.get('answer', '').lower()

    combined = title_lower + ' ' + presentation_lower + ' ' + diag_text

    # Search through image database for best match
    best_match = None
    best_score = 0

    for keyword, img_data in IMAGE_DATABASE.items():
        # Score based on keyword presence in case content
        score = 0
        kw_lower = keyword.lower()
        if kw_lower in title_lower:
            score += 3
        if kw_lower in presentation_lower:
            score += 2
        if kw_lower in diag_text:
            score += 1

        if score > best_score:
            best_score = score
            best_match = (img_data['url'], img_data['attribution'])

    if best_match and best_score >= 1:
        return best_match

    return (None, None)


def get_high_yield_facts(case: dict, subspecialty: str) -> list:
    """Generate high-yield board facts for a case."""
    facts = []
    combined = (case.get('title', '') + ' ' + case.get('presentation', '') + ' ' +
                ' '.join([q.get('answer', '') for q in case.get('questions', [])])).lower()

    # General high-yield facts based on conditions mentioned
    if 'corneal ulcer' in combined or 'keratitis' in combined:
        facts.append("Culture BEFORE antibiotics — blood agar, chocolate agar, Sabouraud dextrose agar, thioglycolate broth")
    if 'steroid' in combined:
        facts.append("Steroid response: IOP elevation in ~30% of general population, higher in glaucoma patients and children")
    if 'retinal detachment' in combined:
        facts.append("Shafer sign (tobacco dust/pigment in anterior vitreous) = pathognomonic for rhegmatogenous RD")
    if 'optic neuritis' in combined:
        facts.append("Uhthoff phenomenon: vision worsens with increased body temperature — classic for demyelinating ON")
    if 'glaucoma' in combined:
        facts.append("Target IOP: generally 25% reduction from baseline, lower target for more advanced disease")
    if 'cataract' in combined:
        facts.append("SRK/T and Holladay 1 for average eyes; Haigis for short/long eyes; Barrett Universal II gaining favor for all eye lengths")
    if 'trauma' in combined or 'injury' in combined:
        facts.append("Seidel test: fluorescein streaming indicates wound leak — DO NOT apply pressure")
    if 'diabetes' in combined or 'diabetic' in combined:
        facts.append("4-2-1 rule for severe NPDR: 4 quadrants of hemorrhages, 2+ quadrants of venous beading, 1+ quadrant of IRMA")
    if 'strabismus' in combined:
        facts.append("Parks 3-step test: (1) Which eye is hyper? (2) Worse in left or right gaze? (3) Worse with head tilt left or right?")

    return facts[:4]


def get_related_conditions(case: dict, subspecialty: str) -> list:
    """Get related conditions for cross-referencing."""
    related = []
    combined = (case.get('title', '') + ' ' + ' '.join([q.get('answer', '') for q in case.get('questions', [])])).lower()

    if 'blepharitis' in combined:
        related = ["Meibomian gland dysfunction", "Dry eye syndrome", "Rosacea", "Demodex infestation"]
    elif 'keratoconus' in combined:
        related = ["Pellucid marginal degeneration", "Keratoglobus", "Post-LASIK ectasia", "Down syndrome"]
    elif 'uveitis' in combined:
        related = ["HLA-B27 spondyloarthropathy", "Sarcoidosis", "Syphilis", "Tuberculosis", "Behcet disease"]
    elif 'glaucoma' in combined:
        related = ["Pseudoexfoliation syndrome", "Pigment dispersion syndrome", "Neovascular glaucoma", "ICE syndrome"]
    elif 'retinal detachment' in combined:
        related = ["PVD", "Lattice degeneration", "Retinal break", "PVR"]
    elif 'diabetic' in combined:
        related = ["Hypertensive retinopathy", "Radiation retinopathy", "Retinal vein occlusion", "Sickle cell retinopathy"]
    elif 'optic neuritis' in combined:
        related = ["Multiple sclerosis", "NMO", "Sarcoidosis", "Syphilitic optic neuropathy"]
    elif 'strabismus' in combined or 'esotropia' in combined or 'exotropia' in combined:
        related = ["Amblyopia", "Duane syndrome", "Brown syndrome", "Cranial nerve palsy"]
    elif 'melanoma' in combined:
        related = ["Choroidal nevus", "Choroidal hemangioma", "Choroidal metastasis", "Choroidal osteoma"]
    elif 'macular degeneration' in combined:
        related = ["Polypoidal choroidal vasculopathy", "Central serous chorioretinopathy", "Myopic macular degeneration"]

    return related[:4]


def enhance_database(db_path: Path) -> None:
    """Main function to enhance the entire case database."""
    print(f"Loading database from {db_path}...")
    with open(db_path) as f:
        data = json.load(f)

    total_cases = 0
    enhanced_cases = 0
    images_added = 0
    teaching_added = 0

    for sub in data['subspecialties']:
        subspecialty_name = sub['name']
        print(f"\nProcessing {subspecialty_name} ({len(sub['cases'])} cases)...")

        for case in sub['cases']:
            total_cases += 1

            # 1. Add clinical image if missing
            if not case.get('imageFile') and not case.get('externalImageUrl'):
                url, attribution = find_image_for_case(case, subspecialty_name)
                if url:
                    case['externalImageUrl'] = url
                    case['imageAttribution'] = attribution
                    images_added += 1

            # 2. Add teaching enhancement to every question
            is_discussion = (case['questions'] and case['questions'][0].get('question') == 'Discussion')

            diag_hint = case.get('diagnosisTitle', case.get('title', ''))

            for q in case['questions']:
                if not q.get('teaching'):
                    q_num = q.get('number', 0)
                    if is_discussion:
                        q_num = 0  # Generic teaching for discussion format

                    teaching = get_teaching_for_question(
                        q_num, q['question'], q['answer'],
                        case['title'], subspecialty_name, diag_hint
                    )
                    q['teaching'] = teaching
                    teaching_added += 1

            # 3. Add case-specific pearls
            if not case.get('casePearls'):
                case['casePearls'] = get_case_pearls(case, subspecialty_name)

            # 4. Add high-yield facts
            if not case.get('highYieldFacts'):
                case['highYieldFacts'] = get_high_yield_facts(case, subspecialty_name)

            # 5. Add related conditions
            if not case.get('relatedConditions'):
                case['relatedConditions'] = get_related_conditions(case, subspecialty_name)

            enhanced_cases += 1

    # Save enhanced database
    output_path = db_path
    print(f"\nSaving enhanced database to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*50}")
    print(f"Enhancement Complete!")
    print(f"Total cases: {total_cases}")
    print(f"Enhanced cases: {enhanced_cases}")
    print(f"Images added: {images_added}")
    print(f"Teaching enhancements added: {teaching_added}")
    print(f"{'='*50}")


if __name__ == '__main__':
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    enhance_database(DB_PATH)
