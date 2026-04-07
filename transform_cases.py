#!/usr/bin/env python3
"""Transform cases_database.json: remove sources, fix titles, renumber, remove empty cases."""

import json
import re

INPUT = "/tmp/ophthalmology-boards/public/data/cases_database.json"

with open(INPUT) as f:
    data = json.load(f)

total_before = sum(len(s["cases"]) for s in data["subspecialties"])

# Track transformations for reporting
title_changes = []
removed_cases = []

def make_patient_title(presentation):
    """Convert presentation like '50 yo female with eye irritation OU' to '50F - Eye Irritation OU'."""
    p = presentation.strip()
    if not p:
        return None

    # Try to extract age and gender from presentation
    # Patterns: "50 yo female", "24 yo woman", "65 y/o male", "11-year-old male", "28-year-old male"
    age = None
    gender = None
    complaint = None

    # Pattern 1: "XX yo/y/o female/male/woman/man with ..."
    m = re.match(
        r'(\d+)[\s-]*(?:yo|y/o|year[\s-]*old)[\s-]*(female|male|woman|man|girl|boy|[MF])\b',
        p, re.IGNORECASE
    )
    if not m:
        # Pattern 2: "XX-year-old adjective? gender? ..." e.g. "65-year-old hypertensive man"
        m2 = re.match(
            r'(\d+)[\s-]*(?:year[\s-]*old)\s+(?:\w+\s+)?(female|male|woman|man|girl|boy|patient|child|infant)',
            p, re.IGNORECASE
        )
        if m2:
            age = m2.group(1)
            g = m2.group(2).lower()
            if g in ("female", "woman", "girl"):
                gender = "F"
            elif g in ("male", "man", "boy"):
                gender = "M"
            else:
                gender = ""  # patient/child/infant - no gender
            rest = p[m2.end():].strip()
        else:
            # Pattern 3: "Newborn baby/infant with..."
            m3 = re.match(r'(Newborn|Infant)\s*(?:baby|infant|child)?\s*(.*)', p, re.IGNORECASE)
            if m3:
                age = "Newborn"
                gender = ""
                rest = m3.group(2).strip()
            else:
                # Pattern 4: "Mother brings in X year old child..." or "Parents of X year old..."
                m4 = re.match(r'(?:Mother|Parents?|Father)\s+(?:brings? in|of)\s+(\d+)\s*(?:year[\s-]*old|month[\s-]*old|yo)\s*(female|male|girl|boy|child|infant|baby|son|daughter)?', p, re.IGNORECASE)
                if m4:
                    age = m4.group(1)
                    g = (m4.group(2) or "").lower()
                    if g in ("female", "girl", "daughter"):
                        gender = "F"
                    elif g in ("male", "boy", "son"):
                        gender = "M"
                    else:
                        gender = ""
                    rest = p[m4.end():].strip()
                else:
                    # Pattern 5: "X month old female/male..."
                    m5 = re.match(r'(\d+)\s*month[\s-]*old\s*(female|male|girl|boy|child|infant|baby)?', p, re.IGNORECASE)
                    if m5:
                        age = m5.group(1) + "mo"
                        g = (m5.group(2) or "").lower()
                        if g in ("female", "girl"):
                            gender = "F"
                        elif g in ("male", "boy"):
                            gender = "M"
                        else:
                            gender = ""
                        rest = p[m5.end():].strip()
    if m and not age:
        age = m.group(1)
        g = m.group(2).lower()
        if g in ("female", "woman", "girl", "f"):
            gender = "F"
        elif g in ("male", "man", "boy", "m"):
            gender = "M"
        else:
            gender = ""
        rest = p[m.end():].strip()

    if age is not None and rest is not None:
        # Extract chief complaint after "with", "complaining of", "presents with", etc.
        cm = re.match(
            r'(?:with|complaining of|complains of|complains? that|who (?:is|has|presents? with|noticed)|presenting with|presents? (?:with|for)|having|s/p .{5,40}? with|,?\s*(?:has|had)|comes? in (?:complaining of|with)|(?:with )?concern(?:ed)? (?:that |about ))\s*(.+)',
            rest, re.IGNORECASE
        )
        if cm:
            complaint = cm.group(1)
        elif "without complaint" in rest.lower() or "routine" in rest.lower():
            complaint = "Routine Exam"
        elif rest and not re.match(r'^[\s.;,i]+$', rest):
            # Only use rest if it has meaningful content (not just OCR garbage)
            complaint = rest.lstrip(", ")
        else:
            complaint = None

    if age and complaint:
        # Clean up and shorten the complaint
        complaint = shorten_complaint(complaint)
        tag = f"{age}{gender}" if gender else age
        return f"{tag} - {complaint}"
    elif age:
        # Have age but no meaningful complaint
        tag = f"{age}{gender}" if gender else age
        return f"{tag} - Clinical Presentation"

    return None

def shorten_complaint(c):
    """Shorten a complaint to a reasonable title length."""
    # Remove trailing periods
    c = c.rstrip(". ")
    # Remove leading articles
    c = re.sub(r'^(?:a |an |the )\s*', '', c, flags=re.IGNORECASE)
    # Capitalize first letter of each major word
    c = title_case_complaint(c)
    # Truncate if too long
    if len(c) > 50:
        # Try to cut at a natural break
        for sep in [",", " and ", " with ", " for "]:
            idx = c.find(sep)
            if 10 < idx < 50:
                c = c[:idx]
                break
        else:
            c = c[:50].rsplit(" ", 1)[0]
    return c.strip(", ")

def title_case_complaint(s):
    """Title case but keep small words lowercase."""
    small = {"a","an","and","as","at","but","by","for","in","of","on","or","the","to","with","is","was","s/p","2/2","yo","y/o"}
    words = s.split()
    result = []
    for i, w in enumerate(words):
        if w.lower() in small and i > 0:
            result.append(w.lower())
        elif w.isupper() and len(w) <= 4:
            result.append(w)  # Keep abbreviations like OU, OD, OS
        else:
            result.append(w[0].upper() + w[1:] if w else w)
    return " ".join(result)

def make_optics_title(title):
    """For optics questions without patient presentations, shorten the question."""
    t = title.strip()
    # Already short enough
    if len(t) <= 55:
        return t
    # Try to shorten
    t = t.rstrip("?. ")
    if len(t) > 55:
        # Cut at a natural break
        for sep in [" - ", ", ", " and ", " with "]:
            idx = t.find(sep)
            if 10 < idx < 55:
                t = t[:idx]
                break
        else:
            t = t[:55].rsplit(" ", 1)[0]
    return t.strip()

def clean_source_refs(text):
    """Remove references to Loma Linda, Pemberton, Osler from text."""
    if not text:
        return text
    text = re.sub(r'\b(?:Loma Linda|Pemberton|Osler)\b', '', text, flags=re.IGNORECASE)
    # Clean up any resulting double spaces or orphaned punctuation
    text = re.sub(r'\s{2,}', ' ', text).strip()
    return text

# ---- TRANSFORM ----

for subspec in data["subspecialties"]:
    is_optics = subspec["name"] == "Optics"

    # Filter out cases with 0 questions
    kept = []
    for case in subspec["cases"]:
        if len(case.get("questions", [])) == 0:
            removed_cases.append(f'{subspec["name"]} #{case["caseNumber"]}: {case["title"][:60]} (source={case.get("source","")})')
            continue
        kept.append(case)

    # Process kept cases
    for case in kept:
        old_title = case["title"]
        presentation = case.get("presentation", "")

        # Store original title as diagnosisTitle
        case["diagnosisTitle"] = old_title

        # Generate new title
        new_title = None
        if not is_optics:
            new_title = make_patient_title(presentation)

        if new_title is None:
            # Optics or fallback: use shortened version of title/presentation as question
            if is_optics:
                new_title = make_optics_title(old_title)
            else:
                # No parseable presentation; use a generic cleaned version
                if presentation and presentation != old_title:
                    new_title = shorten_complaint(presentation)
                else:
                    new_title = make_optics_title(old_title)

        case["title"] = new_title
        title_changes.append((old_title, new_title))

        # Clear source
        case["source"] = ""

        # Clean source refs from all text fields
        for field in ["title", "presentation", "photoDescription", "diagnosisTitle"]:
            if field in case and case[field]:
                case[field] = clean_source_refs(case[field])

    # Renumber sequentially
    for i, case in enumerate(kept, 1):
        prefix = case["id"].rsplit("-", 1)[0]  # e.g. "as"
        case["id"] = f"{prefix}-{i}"
        case["caseNumber"] = i

    subspec["cases"] = kept

# Update metadata
data["metadata"]["source"] = ""
if "pembertonCasesAdded" in data["metadata"]:
    del data["metadata"]["pembertonCasesAdded"]
# Clean any source refs from metadata
for key in list(data["metadata"].keys()):
    if isinstance(data["metadata"][key], str):
        data["metadata"][key] = clean_source_refs(data["metadata"][key])

total_after = sum(len(s["cases"]) for s in data["subspecialties"])

# ---- REPORT ----
print(f"Total cases BEFORE: {total_before}")
print(f"Total cases AFTER:  {total_after}")
print(f"Cases removed:      {total_before - total_after}")
print()
print("=== Removed cases (0-question placeholders) ===")
for r in removed_cases:
    print(f"  - {r}")
print()
print("=== Sample title transformations (5) ===")
import random
random.seed(42)
samples = random.sample(title_changes, min(10, len(title_changes)))
for old, new in samples[:5]:
    print(f'  OLD: "{old[:70]}"')
    print(f'  NEW: "{new[:70]}"')
    print()

# Verify subspecialty counts
print("=== Final subspecialty counts ===")
for s in data["subspecialties"]:
    print(f"  {s['name']}: {len(s['cases'])} cases (numbered 1-{len(s['cases'])})")

# Save
with open(INPUT, "w") as f:
    json.dump(data, f, indent=2)

print(f"\nSaved to {INPUT}")
