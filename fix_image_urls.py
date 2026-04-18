#!/usr/bin/env python3
"""
Fix broken external image URLs by looking up real Wikimedia Commons URLs via API.
"""
import json
import urllib.request
import urllib.parse
import time
import sys

DB_PATH = "public/data/cases_database.json"

# Map condition keywords to actual Wikimedia Commons file names (verified to exist)
VERIFIED_IMAGES = {
    "blepharitis": "File:Blepharitis_in_Left_eye.png",
    "vernal keratoconjunctivitis": "File:Vernal_conjunctivitis.jpg",
    "vkc": "File:Vernal_conjunctivitis.jpg",
    "vortex keratopathy": None,  # No good Commons image
    "corneal erosion": "File:Corneal_erosion.jpg",
    "recurrent corneal erosion": "File:Corneal_erosion.jpg",
    "keratoconus": "File:Keratoconus_eye.jpg",
    "anterior uveitis": "File:Anterior_uveitis.jpg",
    "uveitis": "File:Anterior_uveitis.jpg",
    "pigment dispersion": None,
    "pds": None,
    "salzmann": None,
    "dry eye": "File:Sjogren_syndrome_(2).jpg",
    "corneal edema": None,
    "viral conjunctivitis": "File:Swollen_eye_with_conjunctivitis.jpg",
    "conjunctivitis": "File:Swollen_eye_with_conjunctivitis.jpg",
    "blebitis": None,
    "fuchs": None,
    "fuchs dystrophy": None,
    "endothelial dystrophy": None,
    "marfan": "File:Ectopia_lentis_in_Marfan_syndrome.jpg",
    "subluxed lens": "File:Ectopia_lentis_in_Marfan_syndrome.jpg",
    "pseudoexfoliation": None,
    "hyphema": "File:Hyphema_-_occupying_half_of_anterior_chamber_of_eye.jpg",
    "traumatic hyphema": "File:Hyphema_-_occupying_half_of_anterior_chamber_of_eye.jpg",
    "microbial keratitis": "File:Corneal_ulcer.jpg",
    "corneal ulcer": "File:Corneal_ulcer.jpg",
    "fungal keratitis": "File:Corneal_ulcer.jpg",
    "scleritis": "File:Scleritis-left-eye.jpg",
    "chemical injury": None,
    "chemical burn": None,
    "chalazion": "File:Chalazion_(Hordeolum_Internum)_OD.jpg",
    "molluscum": "File:Molluscum_contagiosum_on_the_back.jpg",
    "squamous cell carcinoma": None,
    "cin": None,
    "pterygium": "File:Pterygium_(from_Michigan_Uni_site,_CC-BY).jpg",
    "pterygia": "File:Pterygium_(from_Michigan_Uni_site,_CC-BY).jpg",
    "melanosis": None,
    "primary acquired melanosis": None,
    "herpes zoster": "File:Herpes_zoster_ophthalmicus.jpg",
    "hzo": "File:Herpes_zoster_ophthalmicus.jpg",
    "lymphoma": None,
    "salmon patch": None,
    "dacryocystitis": "File:Dacryocystitis_of_the_lacrimal_sac_(Radiopaedia_29707-30196_D_1).jpeg",
    "ocp": None,
    "pemphigoid": None,
    "basal cell carcinoma": "File:Nodular_Basal_Cell_Carcinoma.jpg",
    "bcc": "File:Nodular_Basal_Cell_Carcinoma.jpg",
    "sebaceous cell carcinoma": None,
    "episcleritis": "File:Episcleritis_close_crop.jpg",
    "pinguecula": "File:Pinguecula.jpg",
    "entropion": "File:Entropion.jpg",
    "floppy eyelid": None,
    "band keratopathy": None,
    "interstitial keratitis": None,
    "preseptal cellulitis": "File:Periorbital_cellulitis.jpg",
    "orbital cellulitis": "File:Periorbital_cellulitis.jpg",
    "cellulitis": "File:Periorbital_cellulitis.jpg",
    "abmd": None,
    "basement membrane dystrophy": None,
    "mooren": None,
    "lasik": None,
    "acute angle closure": "File:Acute_Angle_Closure-glaucoma.jpg",
    "angle closure": "File:Acute_Angle_Closure-glaucoma.jpg",
    "glaucoma": "File:Glaucoma-patient.jpg",
    "cataract": "File:Cataract_in_human_eye.png",
    "macular degeneration": "File:Fundus_photograph-dry_age_related_macular_degeneration.jpg",
    "amd": "File:Fundus_photograph-dry_age_related_macular_degeneration.jpg",
    "wet amd": "File:Fundus_photograph-dry_age_related_macular_degeneration.jpg",
    "diabetic retinopathy": "File:Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
    "proliferative diabetic retinopathy": "File:Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
    "diabetic macular edema": "File:Fundus_photo_showing_scatter_laser_surgery_for_diabetic_retinopathy_EDA09.JPG",
    "retinal detachment": "File:Ultrasonography_of_retinal_detachment.jpg",
    "rhegmatogenous retinal detachment": "File:Ultrasonography_of_retinal_detachment.jpg",
    "central retinal vein occlusion": "File:Central_retinal_vein_occlusion.jpg",
    "crvo": "File:Central_retinal_vein_occlusion.jpg",
    "branch retinal vein occlusion": "File:Central_retinal_vein_occlusion.jpg",
    "brvo": "File:Central_retinal_vein_occlusion.jpg",
    "vein occlusion": "File:Central_retinal_vein_occlusion.jpg",
    "central retinal artery occlusion": "File:Central_retinal_artery_occlusion.jpg",
    "crao": "File:Central_retinal_artery_occlusion.jpg",
    "artery occlusion": "File:Central_retinal_artery_occlusion.jpg",
    "cherry red spot": "File:Central_retinal_artery_occlusion.jpg",
    "choroidal melanoma": None,
    "melanoma": None,
    "epiretinal membrane": None,
    "erm": None,
    "macular hole": None,
    "retinal tear": None,
    "lattice degeneration": None,
    "toxoplasmosis": None,
    "cmv retinitis": None,
    "endophthalmitis": "File:Anterior_uveitis.jpg",
    "retinoblastoma": "File:Retinoblastoma.jpg",
    "coats disease": None,
    "retinitis pigmentosa": "File:Fundus_of_patient_with_retinitis_pigmentosa,_mid_stage_(right_eye).jpg",
    "rp": "File:Fundus_of_patient_with_retinitis_pigmentosa,_mid_stage_(right_eye).jpg",
    "stargardt": None,
    "csr": None,
    "central serous": None,
    "vitreous hemorrhage": None,
    "sickle cell": None,
    "retinal vasculitis": None,
    "rop": None,
    "retinopathy of prematurity": None,
    "plaquenil": None,
    "hydroxychloroquine": None,
    "optic neuritis": "File:Papillitis_seen_on_OCT.jpg",
    "papilledema": "File:Papilledema.jpg",
    "disc edema": "File:Papilledema.jpg",
    "optic nerve hypoplasia": None,
    "giant cell arteritis": None,
    "gca": None,
    "aion": None,
    "ischemic optic neuropathy": None,
    "third nerve palsy": "File:Oculomotor_nerve_palsy.jpg",
    "cn3 palsy": "File:Oculomotor_nerve_palsy.jpg",
    "sixth nerve palsy": None,
    "cn6 palsy": None,
    "horner": None,
    "horner syndrome": None,
    "thyroid eye disease": "File:Proptosis.jpg",
    "graves": "File:Proptosis.jpg",
    "thyroid orbitopathy": "File:Proptosis.jpg",
    "proptosis": "File:Proptosis.jpg",
    "optic atrophy": None,
    "optic pit": None,
    "idiopathic intracranial hypertension": "File:Papilledema.jpg",
    "iih": "File:Papilledema.jpg",
    "pseudotumor cerebri": "File:Papilledema.jpg",
    "nystagmus": None,
    "myasthenia": None,
    "myasthenia gravis": None,
    "cavernous hemangioma": None,
    "rhabdomyosarcoma": None,
    "optic glioma": None,
    "congenital glaucoma": "File:Buphthalmos.JPG",
    "buphthalmos": "File:Buphthalmos.JPG",
    "leukocoria": "File:Retinoblastoma.jpg",
    "esotropia": "File:Esotropia.JPG",
    "accommodative esotropia": "File:Esotropia.JPG",
    "exotropia": "File:Exotropia.jpg",
    "amblyopia": None,
    "strabismus": "File:Esotropia.JPG",
    "nasolacrimal duct obstruction": None,
    "nldo": None,
    "congenital cataract": "File:Cataract_in_human_eye.png",
    "infantile esotropia": "File:Esotropia.JPG",
    "neonatal conjunctivitis": "File:Swollen_eye_with_conjunctivitis.jpg",
    "ophthalmia neonatorum": "File:Swollen_eye_with_conjunctivitis.jpg",
    "duane": None,
    "brown syndrome": None,
    "capillary hemangioma": None,
    "dermoid": None,
    "ptosis": "File:Ptosis-mild.jpg",
    "congenital ptosis": "File:Ptosis-mild.jpg",
}


def get_wikimedia_url(filename: str) -> str | None:
    """Look up actual CDN URL for a Wikimedia Commons file via API."""
    if not filename:
        return None
    try:
        encoded = urllib.parse.quote(filename)
        api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={encoded}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=600&format=json"
        req = urllib.request.Request(api_url, headers={"User-Agent": "OphthoBoard/1.0"})
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        resp = urllib.request.urlopen(req, timeout=10, context=ctx)
        data = json.loads(resp.read())
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            ii = page.get("imageinfo", [{}])[0]
            # Prefer thumbnail (smaller file), fall back to full URL
            return ii.get("thumburl") or ii.get("url")
    except Exception as e:
        print(f"  API error for {filename}: {e}", file=sys.stderr)
    return None


def main():
    print("Loading database...")
    with open(DB_PATH) as f:
        data = json.load(f)

    # Build lookup cache - look up all unique filenames via API
    unique_files = set(v for v in VERIFIED_IMAGES.values() if v)
    print(f"Looking up {len(unique_files)} unique Wikimedia filenames via API...")

    url_cache = {}
    for i, filename in enumerate(sorted(unique_files)):
        url = get_wikimedia_url(filename)
        if url:
            url_cache[filename] = url
            print(f"  [{i+1}/{len(unique_files)}] OK: {filename.replace('File:', '')} -> {url[:80]}...")
        else:
            print(f"  [{i+1}/{len(unique_files)}] MISS: {filename}")
        time.sleep(0.2)  # Rate limit

    print(f"\nResolved {len(url_cache)}/{len(unique_files)} images")

    # Now update cases
    updated = 0
    removed = 0
    for sub in data["subspecialties"]:
        for case in sub["cases"]:
            if case.get("externalImageUrl"):
                # Find what condition this case maps to
                title_lower = case.get("title", "").lower()
                presentation_lower = case.get("presentation", "").lower()
                diag_text = ""
                if case["questions"]:
                    diag_text = case["questions"][0].get("answer", "").lower()
                combined = title_lower + " " + presentation_lower + " " + diag_text

                # Find best matching condition
                best_file = None
                best_score = 0
                for keyword, filename in VERIFIED_IMAGES.items():
                    if not filename:
                        continue
                    score = 0
                    if keyword in title_lower:
                        score += 3
                    if keyword in presentation_lower:
                        score += 2
                    if keyword in diag_text:
                        score += 1
                    if score > best_score:
                        best_score = score
                        best_file = filename

                if best_file and best_file in url_cache and best_score >= 1:
                    case["externalImageUrl"] = url_cache[best_file]
                    case["imageAttribution"] = "Wikimedia Commons, CC BY-SA"
                    updated += 1
                else:
                    # Remove broken URL — better to show nothing than a broken image
                    del case["externalImageUrl"]
                    if "imageAttribution" in case:
                        del case["imageAttribution"]
                    removed += 1

    print(f"\nUpdated {updated} cases with verified URLs")
    print(f"Removed {removed} cases with unresolvable images")

    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Database saved!")


if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
