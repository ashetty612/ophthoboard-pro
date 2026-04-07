#!/usr/bin/env python3
"""
Parse cases from Pemberton, Friedman, and Chern resources and merge into existing database.
"""

import json
import re
import os
from collections import defaultdict

# ─── Config ───────────────────────────────────────────────────────────────────
DB_PATH = "/tmp/ophthalmology-boards/public/data/cases_database.json"
PEMBERTON_PATH = "/tmp/ophthalmology-boards/pemberton_cases.txt"
FRIEDMAN_PATH = "/tmp/ophthalmology-boards/friedman_cases.txt"
CHERN_PATH = "/tmp/ophthalmology-boards/review_materials.txt"

# Subspecialty mappings
SUBSPECIALTY_MAP = {
    "anterior-segment": "Anterior Segment",
    "posterior-segment": "Posterior Segment",
    "neuro-ophthalmology": "Neuro-Ophthalmology and Orbit",
    "pediatric-ophthalmology": "Pediatric Ophthalmology",
    "optics": "Optics",
}

ID_PREFIX = {
    "anterior-segment": "as",
    "posterior-segment": "ps",
    "neuro-ophthalmology": "no",
    "pediatric-ophthalmology": "ped",
    "optics": "opt",
}

# Standard 6 questions for oral boards format
STANDARD_QUESTIONS = [
    "What is your focused differential diagnosis?",
    "What questions do you want to ask the patient?",
    "What exam findings will you look for?",
    "What tests will rule in or rule out your #1 treating diagnosis?",
    "How are you going to treat your #1 diagnosis?",
    "What will you tell your patient about the natural history, prognosis and follow-up for treatment?",
]


def extract_keywords(text):
    """Extract scoring keywords from answer text."""
    keywords = []
    lines = text.strip().split("\n")
    for line in lines:
        line = line.strip()
        # Remove bullet markers
        line = re.sub(r'^[\u25cf\u2022\-\*o>]\s*', '', line)
        line = re.sub(r'^\d+[\.\)]\s*', '', line)
        line = line.strip()
        if line and len(line) > 3 and not line.startswith("Downloaded") and not line.startswith("Copyright"):
            keywords.append(line)
    return keywords


def extract_key_points(text):
    """Extract key points from answer text."""
    points = []
    lines = text.strip().split("\n")
    for line in lines:
        line = line.strip()
        line = re.sub(r'^[\u25cf\u2022\-\*o>]\s*', '', line)
        line = re.sub(r'^\d+[\.\)]\s*', '', line)
        line = line.strip()
        if line and len(line) > 3 and not line.startswith("Downloaded") and not line.startswith("Copyright"):
            points.append(line)
    return points


def make_case(subspecialty_id, case_number, title, presentation, diagnosis_title,
              questions, source=""):
    """Create a case dict in the standard format."""
    prefix = ID_PREFIX[subspecialty_id]
    return {
        "id": f"{prefix}-{case_number}",
        "caseNumber": case_number,
        "source": "",
        "title": title,
        "subspecialty": SUBSPECIALTY_MAP[subspecialty_id],
        "presentation": presentation,
        "imageFile": "",
        "imageFiles": [],
        "photoDescription": "",
        "questions": questions,
        "diagnosisTitle": diagnosis_title,
    }


# ══════════════════════════════════════════════════════════════════════════════
# PEMBERTON PARSER
# ══════════════════════════════════════════════════════════════════════════════

def parse_pemberton():
    """Parse Pemberton cases from OCR text."""
    with open(PEMBERTON_PATH, "r") as f:
        text = f.read()

    # Split into chapters
    chapter_splits = re.split(r'={60,}\nChapter \d+:', text)

    # Chapter mapping
    chapter_subspecialty = {
        1: "anterior-segment",       # Ch1: Anterior Segment
        2: "optics",                 # Ch2: Optics
        3: "posterior-segment",      # Ch3: Posterior Segment
        4: "neuro-ophthalmology",    # Ch4: Neuro-Ophthalmology and Orbit
        5: "pediatric-ophthalmology",# Ch5: Pediatrics
        6: "anterior-segment",       # Ch6: External Disease -> Anterior Segment
    }

    cases_by_subspecialty = defaultdict(list)

    for ch_idx, ch_text in enumerate(chapter_splits):
        if ch_idx == 0:
            continue  # Header before Chapter 1

        ch_num = ch_idx
        if ch_num not in chapter_subspecialty:
            continue
        subspec = chapter_subspecialty[ch_num]

        # Find all CASE N markers
        case_pattern = re.compile(r'CASE\s+(\d+)\s*\n', re.IGNORECASE)
        case_matches = list(case_pattern.finditer(ch_text))

        # Group by case number (each case appears twice in the text - once as title, once as content)
        case_groups = defaultdict(list)
        for m in case_matches:
            case_num = int(m.group(1))
            case_groups[case_num].append(m.start())

        for case_num in sorted(case_groups.keys()):
            positions = case_groups[case_num]
            # Get the text between this case's first occurrence and the next case
            start = positions[0]

            # Find the start of the next case
            next_case_nums = [n for n in sorted(case_groups.keys()) if n > case_num]
            if next_case_nums:
                end = case_groups[next_case_nums[0]][0]
            else:
                end = len(ch_text)

            case_text = ch_text[start:end]

            # For Optics chapter (ch2), format is different - Q&A style, not sections I-VI
            if ch_num == 2:
                parsed = parse_pemberton_optics_case(case_num, case_text)
            else:
                parsed = parse_pemberton_standard_case(case_num, case_text)

            if parsed:
                parsed["subspecialty_id"] = subspec
                cases_by_subspecialty[subspec].append(parsed)

    return cases_by_subspecialty


def parse_pemberton_optics_case(case_num, case_text):
    """Parse an optics case from Pemberton (question/answer format)."""
    lines = case_text.strip().split("\n")

    # The first line after CASE N header is the question
    question_text = ""
    answer_text = ""
    found_answer = False

    # Remove the CASE N headers
    clean_lines = []
    skip_next = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if re.match(r'^CASE\s+\d+', stripped, re.IGNORECASE):
            skip_next = True
            continue
        if skip_next and (stripped == "" or re.match(r'^\d+$', stripped)):
            continue
        skip_next = False
        # Skip page numbers
        if re.match(r'^\d+\s*$', stripped):
            continue
        if stripped.startswith("--- Page"):
            continue
        if stripped.startswith("Photo courtesy"):
            continue
        clean_lines.append(stripped)

    # For optics: the question is the first substantial text, answer follows
    # Often: question on one "page", answer on next
    # Look for the second occurrence which has the answer
    # Simple approach: split at the midpoint or look for answer patterns

    if not clean_lines:
        return None

    # Find where the answer starts - look for patterns like explanation text
    # In optics cases, the question is short and the answer is longer
    # The question appears first, then the answer on the next "page"

    # Get question (first substantial block)
    q_lines = []
    a_lines = []
    in_answer = False

    for line in clean_lines:
        if not line:
            if q_lines and not in_answer:
                in_answer = True
            continue
        if not in_answer:
            q_lines.append(line)
        else:
            a_lines.append(line)

    question_text = " ".join(q_lines).strip()
    answer_text = "\n".join(a_lines).strip()

    if not question_text:
        return None

    # Create a short title from the question
    title = question_text[:80].strip()
    if len(question_text) > 80:
        title = title.rsplit(" ", 1)[0] + "..."

    # Build the single Q&A as our questions array
    key_points = extract_key_points(answer_text) if answer_text else []
    scoring_keywords = extract_keywords(answer_text) if answer_text else []

    questions = [{
        "number": 1,
        "question": question_text,
        "answer": answer_text if answer_text else "See discussion",
        "keyPoints": key_points[:10],
        "scoringKeywords": scoring_keywords[:10],
    }]

    # Diagnosis for optics is typically the topic itself
    diagnosis_title = question_text[:60] if len(question_text) < 60 else question_text[:60].rsplit(" ", 1)[0]

    return {
        "case_num": case_num,
        "title": title,
        "presentation": question_text,
        "diagnosis_title": diagnosis_title,
        "questions": questions,
    }


def parse_pemberton_standard_case(case_num, case_text):
    """Parse a standard Pemberton case with sections I-VI."""
    lines = case_text.strip().split("\n")

    # Extract the presentation line (usually right before or after CASE N)
    presentation = ""
    # Look for the age/gender line - search more broadly
    for line in lines[:40]:
        stripped = line.strip()
        if not stripped or len(stripped) < 10:
            continue
        if stripped.startswith("--- Page") or stripped.startswith("Photo courtesy"):
            continue
        if re.match(r'^(CASE|ASE)\s+\d+', stripped, re.IGNORECASE):
            continue
        if stripped in ["[e)", "(e)", "[e]", "[e}", "fe)", "fe}", "oO", "O", "(e}", "fe]"]:
            continue
        if re.match(r'^\d+\s*$', stripped):
            continue
        # Match age patterns
        if re.search(r'\d+[\-\s]year[\-\s]old', stripped, re.IGNORECASE):
            presentation = stripped
            break
        if re.search(r'\d+\s*yo\b', stripped, re.IGNORECASE):
            presentation = stripped
            break
        # Match patterns like "A patient with..." or other presentation text
        if re.search(r'(?:patient|presents|complain|vision|eye\s+pain|redness|swelling)', stripped, re.IGNORECASE) and len(stripped) > 20:
            presentation = stripped
            break

    # Extract sections I through VI
    sections = {}
    section_patterns = {
        "I": r'(?:I\s+)?Image\s*Description',
        "II": r'I{1,2}l?\s*Differential\s*Diagnosis',
        "III": r'I{2,3}l?\s*History/Physical|I{2,3}l?\s*History',
        "IV": r'IV\s*Assessment',
        "V": r'V[\s_]*Plan',
        "VI": r'VI\s*Patient\s*Education',
    }

    # Find section starts
    section_starts = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        for sec_name, pattern in section_patterns.items():
            if re.search(pattern, stripped, re.IGNORECASE):
                section_starts.append((i, sec_name))
                break

    # Extract section text
    for idx, (start_line, sec_name) in enumerate(section_starts):
        if idx + 1 < len(section_starts):
            end_line = section_starts[idx + 1][0]
        else:
            end_line = len(lines)

        sec_text_lines = []
        for j in range(start_line + 1, end_line):
            stripped = lines[j].strip()
            if re.match(r'^\d+\s*$', stripped):  # page numbers
                continue
            if stripped.startswith("--- Page"):
                continue
            if stripped.startswith("Photo courtesy"):
                continue
            if re.match(r'^(CASE|ASE)\s+\d+', stripped, re.IGNORECASE):
                continue
            # Skip OCR artifacts
            if stripped in ["[e)", "(e)", "[e]", "[e}", "fe)", "fe}", "oO", "O", "(e}", "fe]"]:
                continue
            sec_text_lines.append(stripped)

        sections[sec_name] = "\n".join(sec_text_lines).strip()

    # Map sections to standard 6 questions
    section_to_question = {
        "II": (1, "What is your focused differential diagnosis?"),
        "III": (2, "What questions do you want to ask and what exam findings will you look for?"),
        "IV": (3, "What is your assessment?"),
        "V": (4, "How are you going to treat this condition?"),
        "VI": (5, "What will you tell your patient about the natural history, prognosis and follow-up?"),
    }

    # Extract diagnosis from Assessment section (IV)
    diagnosis = ""
    if "IV" in sections:
        assessment = sections["IV"]
        for line in assessment.split("\n"):
            line = line.strip()
            # Remove bullet/OCR artifacts
            line = re.sub(r'^[\u25cf\u2022\-\*o>]\s*', '', line)
            line = re.sub(r'^[Oo]\s+', '', line)
            line = re.sub(r'^Assessment:?\s*', '', line, flags=re.IGNORECASE)
            line = line.strip()
            if line and len(line) > 3 and not line.startswith("I would") and not line.startswith("Given"):
                diagnosis = line
                break

    if not diagnosis and "II" in sections:
        # Take first item from differential (likely the top diagnosis)
        for line in sections["II"].split("\n"):
            line = line.strip()
            line = re.sub(r'^[\u25cf\u2022\-\*o>]\s*', '', line)
            line = re.sub(r'^\d+[\.\)]\s*', '', line)
            line = re.sub(r'^[Oo]\s+', '', line)
            line = re.sub(r'^Differential Diagnosis:?\s*', '', line, flags=re.IGNORECASE)
            line = line.strip()
            if line and len(line) > 3 and not line.startswith("Slit lamp") and not line.startswith("Anterior segment") and not line.startswith("Photo"):
                diagnosis = line
                break

    # Clean up diagnosis - remove trailing artifacts
    diagnosis = re.sub(r'\s*\(.*?courtesy.*?\)', '', diagnosis, flags=re.IGNORECASE)
    if len(diagnosis) > 100:
        diagnosis = diagnosis[:97].rsplit(" ", 1)[0] + "..."

    # Build chief complaint title
    if presentation:
        title = build_chief_complaint_title(presentation)
    else:
        if diagnosis:
            title = f"Patient - {diagnosis[:50]}"
        else:
            title = f"Case {case_num}"

    questions = []
    # Question 1: Image description + Differential
    if "I" in sections or "II" in sections:
        answer = ""
        if "I" in sections:
            answer += sections["I"]
        if "II" in sections:
            if answer:
                answer += "\n\nDifferential Diagnosis:\n"
            answer += sections["II"]
        kp = extract_key_points(answer)
        sk = extract_keywords(answer)
        questions.append({
            "number": 1,
            "question": "What is your focused differential diagnosis?",
            "answer": answer,
            "keyPoints": kp[:8],
            "scoringKeywords": sk[:8],
        })

    # Question 2: History/Physical/Eval
    if "III" in sections:
        answer = sections["III"]
        kp = extract_key_points(answer)
        sk = extract_keywords(answer)
        questions.append({
            "number": 2,
            "question": "What questions do you want to ask the patient and what exam findings will you look for?",
            "answer": answer,
            "keyPoints": kp[:8],
            "scoringKeywords": sk[:8],
        })

    # Question 3: Assessment
    if "IV" in sections:
        answer = sections["IV"]
        kp = extract_key_points(answer)
        sk = extract_keywords(answer)
        questions.append({
            "number": 3,
            "question": "What is your assessment?",
            "answer": answer,
            "keyPoints": kp[:6],
            "scoringKeywords": sk[:6],
        })

    # Question 4: Plan
    if "V" in sections:
        answer = sections["V"]
        # Clean up "V_ Plan:" type headers
        answer = re.sub(r'^[Vv][\s_]*Plan:?\s*\n?', '', answer).strip()
        kp = extract_key_points(answer)
        sk = extract_keywords(answer)
        questions.append({
            "number": 4,
            "question": "How are you going to treat your #1 diagnosis?",
            "answer": answer,
            "keyPoints": kp[:8],
            "scoringKeywords": sk[:8],
        })

    # Question 5: Patient Education
    if "VI" in sections:
        answer = sections["VI"]
        kp = extract_key_points(answer)
        sk = extract_keywords(answer)
        questions.append({
            "number": 5,
            "question": "What will you tell your patient about the natural history, prognosis and follow-up for treatment?",
            "answer": answer,
            "keyPoints": kp[:6],
            "scoringKeywords": sk[:6],
        })

    if not questions:
        return None

    return {
        "case_num": case_num,
        "title": title,
        "presentation": presentation if presentation else title,
        "diagnosis_title": diagnosis,
        "questions": questions,
    }


def build_chief_complaint_title(presentation):
    """Build a chief complaint title from presentation text.
    Format: [Age][Gender] - [Chief Complaint]
    """
    # Extract age and gender
    age_match = re.search(r'(\d+)[\-\s]*(?:year[\-\s]*old|yo)', presentation, re.IGNORECASE)
    age = age_match.group(1) if age_match else ""

    gender = ""
    if re.search(r'\b(?:female|woman|girl)\b', presentation, re.IGNORECASE):
        gender = "F"
    elif re.search(r'\b(?:male|man|boy)\b', presentation, re.IGNORECASE):
        gender = "M"

    # Extract chief complaint - everything after "with" or "complains of" or "presents with" etc.
    complaint = ""
    patterns = [
        r'(?:complain(?:s|ing)\s+of|c/o)\s+(.+)',
        r'(?:presents?\s+(?:with|for))\s+(.+)',
        r'(?:reports?|notices?|says?|has|having|experiencing)\s+(.+)',
        r'(?:with)\s+(.+?)(?:\.|$)',
    ]
    for pat in patterns:
        m = re.search(pat, presentation, re.IGNORECASE)
        if m:
            complaint = m.group(1).strip().rstrip(".")
            break

    if not complaint:
        # Use everything after the age/gender part
        remaining = re.sub(r'^\d+[\-\s]*(?:year[\-\s]*old|yo)\s*(?:female|male|woman|man|boy|girl)?\s*', '', presentation, flags=re.IGNORECASE)
        remaining = re.sub(r'^(?:who\s+)?(?:is\s+)?(?:with\s+)?', '', remaining, flags=re.IGNORECASE).strip()
        complaint = remaining.strip().rstrip(".")

    # Truncate if too long
    if len(complaint) > 60:
        complaint = complaint[:57].rsplit(" ", 1)[0] + "..."

    if age and gender:
        return f"{age}{gender} - {complaint}" if complaint else f"{age}{gender} - Eye Complaint"
    elif age:
        return f"{age} - {complaint}" if complaint else f"Patient - Eye Complaint"
    else:
        return complaint if complaint else "Eye Complaint"


# ══════════════════════════════════════════════════════════════════════════════
# FRIEDMAN PARSER
# ══════════════════════════════════════════════════════════════════════════════

def parse_friedman():
    """Parse Friedman case reviews."""
    with open(FRIEDMAN_PATH, "r") as f:
        text = f.read()

    # Split by subspecialty sections
    section_map = {
        "EXTERNAL/ADNEXA": "anterior-segment",
        "NEURO/ORBIT": "neuro-ophthalmology",
        "OPTICS": "optics",
        "PEDIATRICS": "pediatric-ophthalmology",
        "POSTERIOR SEGMENT": "posterior-segment",
    }

    cases_by_subspecialty = defaultdict(list)

    # Split into sections
    section_splits = re.split(r'={60,}\s*\n\s*FRIEDMAN\s*-\s*', text)

    for section_text in section_splits[1:]:  # Skip header
        # Determine subspecialty
        subspec_id = None
        for key, sid in section_map.items():
            if section_text.strip().startswith(key):
                subspec_id = sid
                break

        if not subspec_id:
            continue

        # Find case numbers and their question/answer blocks
        # Pattern: case number on its own line, then "CASE" header, then questions, then "ANSWERS Case N"
        case_blocks = re.split(r'\n---\s*Page\s+\d+\s*---\s*\n', section_text)

        # Collect pages into case/answer pairs
        current_case_num = None
        case_questions = {}
        case_answers = {}
        case_presentations = {}
        case_header_type = {}

        for block in case_blocks:
            block = block.strip()
            if not block:
                continue

            # Check if this is a case question page
            # Pattern: starts with a number (case number) followed by section-specific header
            case_q_match = re.match(r'^(\d+)\s*\n\s*(?:EXTERNAL|NEURO|OPTICS|PEDIATRIC|POSTERIOR)', block)
            if case_q_match:
                cnum = int(case_q_match.group(1))
                current_case_num = cnum
                # Extract presentation and questions
                lines = block.split("\n")
                # Find presentation (usually after the header line)
                pres_lines = []
                q_lines = []
                found_first_q = False
                header_passed = False
                for line in lines:
                    stripped = line.strip()
                    if not header_passed:
                        if "CASE" in stripped.upper() or stripped.startswith("EXTERNAL") or \
                           stripped.startswith("NEURO") or stripped.startswith("OPTICS") or \
                           stripped.startswith("PEDIATRIC") or stripped.startswith("POSTERIOR"):
                            header_passed = True
                            continue
                        if re.match(r'^\d+$', stripped):
                            continue
                        header_passed = True

                    if stripped.startswith("Downloaded") or stripped.startswith("For personal") or \
                       stripped.startswith("Copyright") or stripped.startswith("\u00a9"):
                        continue

                    if re.match(r'^\d+\.\s', stripped):
                        found_first_q = True
                        q_lines.append(stripped)
                    elif found_first_q:
                        q_lines.append(stripped)
                    elif stripped and not re.match(r'^\d+$', stripped):
                        pres_lines.append(stripped)

                presentation = " ".join(pres_lines).strip()
                # Remove "Additional information:" blocks from presentation
                presentation = re.split(r'Additional information:', presentation)[0].strip()
                # Only update if we have a better presentation
                if presentation and (cnum not in case_presentations or not case_presentations[cnum]):
                    case_presentations[cnum] = presentation
                elif cnum not in case_presentations:
                    case_presentations[cnum] = presentation
                # Merge questions (keep the first substantial set)
                if cnum not in case_questions or not case_questions[cnum].strip():
                    case_questions[cnum] = "\n".join(q_lines)
                continue

            # Check if this is an ANSWERS page
            ans_match = re.match(r'ANSWERS\s+Case\s+(\d+)', block)
            if ans_match:
                cnum = int(ans_match.group(1))
                case_answers[cnum] = block
                continue

        # Now build cases from matched question/answer pairs
        for cnum in sorted(case_questions.keys()):
            if cnum not in case_answers:
                continue

            presentation = case_presentations.get(cnum, "")
            q_text = case_questions[cnum]
            a_text = case_answers[cnum]

            parsed = parse_friedman_qa(cnum, presentation, q_text, a_text)
            if parsed:
                parsed["subspecialty_id"] = subspec_id
                cases_by_subspecialty[subspec_id].append(parsed)

    return cases_by_subspecialty


def parse_friedman_qa(case_num, presentation, q_text, a_text):
    """Parse a Friedman case's Q&A into structured format."""

    # Parse individual questions
    q_pattern = re.compile(r'(\d+)\.\s+(.+?)(?=\n\d+\.\s|\Z)', re.DOTALL)
    q_matches = list(q_pattern.finditer(q_text))

    # Parse individual answers
    # Remove "ANSWERS Case N" header and clean
    a_clean = re.sub(r'^ANSWERS\s+Case\s+\d+\s*\n?', '', a_text).strip()
    # Remove download/copyright notices
    a_clean = re.sub(r'Downloaded from.*?reserved\.', '', a_clean, flags=re.DOTALL)
    a_clean = re.sub(r'\d+\s*$', '', a_clean.strip())

    a_pattern = re.compile(r'(\d+)\.\s+(.+?)(?=\n\d+\.\s|\Z)', re.DOTALL)
    a_matches = list(a_pattern.finditer(a_clean))

    # Build answer lookup
    answers = {}
    for m in a_matches:
        num = int(m.group(1))
        ans = m.group(2).strip()
        # Clean up
        ans = re.sub(r'Downloaded from.*?reserved\.', '', ans, flags=re.DOTALL).strip()
        ans = re.sub(r'\d+\s*$', '', ans).strip()
        answers[num] = ans

    if not q_matches or not answers:
        return None

    # Extract diagnosis from answers
    # Look for specific diagnosis patterns: answer to "What is the diagnosis?"
    diagnosis = ""
    diag_q_nums = []
    for m in q_matches:
        qnum = int(m.group(1))
        qtxt = m.group(2).strip().lower()
        if "diagnosis" in qtxt and ("what is" in qtxt or "what are" in qtxt):
            diag_q_nums.append(qnum)

    for dq in diag_q_nums:
        if dq in answers:
            ans = answers[dq]
            first_line = ans.split("\n")[0].strip().rstrip(".")
            if 3 < len(first_line) < 120:
                diagnosis = first_line
                break

    if not diagnosis:
        for key in [3, 1]:
            if key in answers:
                ans = answers[key]
                first_line = ans.split("\n")[0].strip()
                first_item = re.split(r'[,;]', first_line)[0].strip().rstrip(".")
                if 3 < len(first_item) < 100:
                    diagnosis = first_item
                    break

    if not diagnosis and 1 in answers:
        diagnosis = answers[1].split("\n")[0][:80]

    # Build title from presentation
    title = build_chief_complaint_title(presentation) if presentation else f"Case {case_num}"

    # Build questions array
    questions = []
    for m in q_matches:
        qnum = int(m.group(1))
        q = m.group(2).strip()
        # Clean question text
        q = re.sub(r'Downloaded from.*?reserved\.', '', q, flags=re.DOTALL).strip()
        q = re.sub(r'\d+\s*$', '', q).strip()
        q = re.sub(r'Additional information:.*', '', q, flags=re.DOTALL).strip()

        ans = answers.get(qnum, "See discussion")
        kp = extract_key_points(ans)
        sk = extract_keywords(ans)

        questions.append({
            "number": qnum,
            "question": q,
            "answer": ans,
            "keyPoints": kp[:8],
            "scoringKeywords": sk[:8],
        })

    if not questions:
        return None

    return {
        "case_num": case_num,
        "title": title,
        "presentation": presentation if presentation else title,
        "diagnosis_title": diagnosis,
        "questions": questions,
    }


# ══════════════════════════════════════════════════════════════════════════════
# CHERN PARSER
# ══════════════════════════════════════════════════════════════════════════════

def parse_chern():
    """Parse high-yield Chern Q&A content. Focus on clinical scenario questions."""
    with open(CHERN_PATH, "r") as f:
        text = f.read()

    # Find the Chern section
    chern_start = text.find("CHERN Q&A REVIEW CONTENT")
    if chern_start < 0:
        print("WARNING: Could not find Chern section in review_materials.txt")
        return defaultdict(list)

    chern_text = text[chern_start:]

    # Chapter mappings for Chern
    chern_chapters = {
        "Optics": "optics",
        "Neuro-ophthalmology": "neuro-ophthalmology",
        "Pediatrics and Strabismus": "pediatric-ophthalmology",
        "Plastics": "anterior-segment",  # Oculoplastics -> Anterior Segment
        "Uveitis": "anterior-segment",
        "Glaucoma": "anterior-segment",
        "Cornea": "anterior-segment",
        "Lens/Cataract": "anterior-segment",
        "Retina and Vitreous": "posterior-segment",
        "Pathology": "posterior-segment",  # Mix, default to posterior
        "Fundamentals": None,  # Skip fundamentals
        "Embryology and Anatomy": None,  # Skip
    }

    cases_by_subspecialty = defaultdict(list)

    # Split into QUESTIONS and ANSWERS sections
    # Find chapter boundaries by looking for chapter headers
    # We look for clinical scenario questions (those with "year-old" or "patient presents")

    # Split the Chern text by QUESTIONS/ANSWERS markers
    q_sections = []

    # Find all QUESTIONS and ANSWERS markers
    markers = list(re.finditer(r'^(QUESTIONS|ANSWERS)\s*$', chern_text, re.MULTILINE))

    current_chapter = None

    for i, marker in enumerate(markers):
        # Determine the current chapter from preceding text
        pre_text = chern_text[max(0, marker.start()-500):marker.start()]
        for ch_name in chern_chapters:
            if ch_name in pre_text[-200:]:
                current_chapter = ch_name
                break

        if marker.group(1) == "QUESTIONS":
            # Find the matching ANSWERS section
            if i + 1 < len(markers) and markers[i+1].group(1) == "ANSWERS":
                q_start = marker.end()
                q_end = markers[i+1].start()
                a_start = markers[i+1].end()
                if i + 2 < len(markers):
                    a_end = markers[i+2].start()
                else:
                    a_end = len(chern_text)

                q_text = chern_text[q_start:q_end]
                a_text = chern_text[a_start:a_end]

                subspec = chern_chapters.get(current_chapter) if current_chapter else None
                if subspec:
                    q_sections.append((current_chapter, subspec, q_text, a_text))

    # For each Q/A section, extract clinical scenario questions
    case_counter = defaultdict(int)

    for chapter_name, subspec_id, q_text, a_text in q_sections:
        clinical_cases = extract_chern_clinical_cases(q_text, a_text, subspec_id)
        for case in clinical_cases:
            case["subspecialty_id"] = subspec_id
            cases_by_subspecialty[subspec_id].append(case)

    return cases_by_subspecialty


def extract_chern_clinical_cases(q_text, a_text, subspec_id):
    """Extract clinical scenario questions from Chern Q&A sections."""
    cases = []

    # Parse questions - numbered format "N. question text"
    # Questions span multiple lines until next numbered question
    q_pattern = re.compile(r'(?:^|\n)\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.\s|\n---\s*Page|\Z)', re.DOTALL)
    a_pattern = re.compile(r'(?:^|\n)\s*(\d+)\.\s+([A-D]\))\s+(.+?)(?=\n\s*\d+\.\s|\n---\s*Page|\Z)', re.DOTALL)

    q_matches = {int(m.group(1)): m.group(2).strip() for m in q_pattern.finditer(q_text)}

    # Parse answers - format is "N. A/B/C/D) explanation"
    a_matches = {}
    for m in a_pattern.finditer(a_text):
        num = int(m.group(1))
        letter = m.group(2)
        explanation = m.group(3).strip()
        # Clean up
        explanation = re.sub(r'Downloaded from.*?reserved\.', '', explanation, flags=re.DOTALL).strip()
        explanation = re.sub(r'\n---\s*Page.*', '', explanation).strip()
        a_matches[num] = f"{letter} {explanation}"

    # Select clinical scenario questions (those mentioning patients/ages)
    clinical_patterns = [
        r'\d+[\-\s]year[\-\s]old',
        r'patient\s+(?:presents|complain|report|notice|has\s+been)',
        r'(?:woman|man|boy|girl|child)\s+(?:presents|complain|report|with)',
    ]

    selected = []
    for qnum, q_text_item in q_matches.items():
        is_clinical = any(re.search(p, q_text_item, re.IGNORECASE) for p in clinical_patterns)
        if is_clinical and qnum in a_matches:
            # Clean the question text
            q_clean = re.sub(r'Downloaded from.*?reserved\.', '', q_text_item, flags=re.DOTALL).strip()
            q_clean = re.sub(r'\n---\s*Page.*', '', q_clean).strip()
            # Remove multiple choice options
            q_without_options = re.split(r'\n\s*[A-D]\)', q_clean)[0].strip()

            if len(q_without_options) > 20:
                selected.append((qnum, q_without_options, a_matches[qnum]))

    # Convert selected Q&A into case format
    for qnum, question, answer in selected[:25]:  # Limit per chapter
        # Build chief complaint title from the question
        title = build_chern_title(question)

        # Extract diagnosis from answer
        answer_clean = re.sub(r'^[A-D]\)\s*', '', answer).strip()
        diagnosis_line = answer_clean.split("\n")[0].split(". ")[0].strip()
        if len(diagnosis_line) > 80:
            diagnosis_line = diagnosis_line[:77] + "..."

        kp = extract_key_points(answer_clean)
        sk = extract_keywords(answer_clean)

        questions = [{
            "number": 1,
            "question": question,
            "answer": answer_clean,
            "keyPoints": kp[:8],
            "scoringKeywords": sk[:8],
        }]

        cases.append({
            "case_num": qnum,
            "title": title,
            "presentation": question,
            "diagnosis_title": diagnosis_line,
            "questions": questions,
        })

    return cases


def build_chern_title(question):
    """Build a chief complaint title from a Chern clinical question."""
    # Try to extract age/gender and complaint
    title = build_chief_complaint_title(question)
    if title and title != "Eye Complaint":
        # Truncate at reasonable length
        if len(title) > 70:
            title = title[:67].rsplit(" ", 1)[0] + "..."
        return title

    # Fallback: use first 60 chars of question
    short = question[:60].strip()
    if len(question) > 60:
        short = short.rsplit(" ", 1)[0] + "..."
    return short


# ══════════════════════════════════════════════════════════════════════════════
# MERGE
# ══════════════════════════════════════════════════════════════════════════════

def merge_into_database(pemberton_cases, friedman_cases, chern_cases):
    """Merge new cases into existing database."""
    with open(DB_PATH, "r") as f:
        db = json.load(f)

    # Track counts for summary
    summary = {
        "pemberton": defaultdict(int),
        "friedman": defaultdict(int),
        "chern": defaultdict(int),
        "existing": defaultdict(int),
        "final": defaultdict(int),
    }

    # Index existing subspecialties
    subspec_map = {}
    for s in db["subspecialties"]:
        subspec_map[s["id"]] = s
        summary["existing"][s["name"]] = len(s["cases"])

    # For each subspecialty, merge in new cases
    for subspec_id in SUBSPECIALTY_MAP:
        if subspec_id not in subspec_map:
            # Create new subspecialty entry
            subspec_map[subspec_id] = {
                "id": subspec_id,
                "name": SUBSPECIALTY_MAP[subspec_id],
                "cases": [],
            }
            db["subspecialties"].append(subspec_map[subspec_id])

        existing_cases = subspec_map[subspec_id]["cases"]
        next_num = max([c["caseNumber"] for c in existing_cases], default=0) + 1

        # Add Pemberton cases
        for parsed in pemberton_cases.get(subspec_id, []):
            case = make_case(
                subspec_id, next_num,
                parsed["title"],
                parsed["presentation"],
                parsed["diagnosis_title"],
                parsed["questions"],
            )
            existing_cases.append(case)
            summary["pemberton"][SUBSPECIALTY_MAP[subspec_id]] += 1
            next_num += 1

        # Add Friedman cases
        for parsed in friedman_cases.get(subspec_id, []):
            case = make_case(
                subspec_id, next_num,
                parsed["title"],
                parsed["presentation"],
                parsed["diagnosis_title"],
                parsed["questions"],
            )
            existing_cases.append(case)
            summary["friedman"][SUBSPECIALTY_MAP[subspec_id]] += 1
            next_num += 1

        # Add Chern cases
        for parsed in chern_cases.get(subspec_id, []):
            case = make_case(
                subspec_id, next_num,
                parsed["title"],
                parsed["presentation"],
                parsed["diagnosis_title"],
                parsed["questions"],
            )
            existing_cases.append(case)
            summary["chern"][SUBSPECIALTY_MAP[subspec_id]] += 1
            next_num += 1

        # Renumber all cases sequentially
        for i, case in enumerate(existing_cases):
            case["caseNumber"] = i + 1
            prefix = ID_PREFIX[subspec_id]
            case["id"] = f"{prefix}-{i + 1}"

        summary["final"][SUBSPECIALTY_MAP[subspec_id]] = len(existing_cases)

    return db, summary


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 70)
    print("PARSING AND MERGING OPHTHALMOLOGY BOARD REVIEW CASES")
    print("=" * 70)

    # Parse Pemberton
    print("\n[1/3] Parsing Pemberton cases...")
    pemberton_cases = parse_pemberton()
    pem_total = sum(len(v) for v in pemberton_cases.values())
    print(f"  Found {pem_total} Pemberton cases across {len(pemberton_cases)} subspecialties")
    for k, v in sorted(pemberton_cases.items()):
        print(f"    {SUBSPECIALTY_MAP[k]}: {len(v)} cases")

    # Parse Friedman
    print("\n[2/3] Parsing Friedman cases...")
    friedman_cases = parse_friedman()
    fri_total = sum(len(v) for v in friedman_cases.values())
    print(f"  Found {fri_total} Friedman cases across {len(friedman_cases)} subspecialties")
    for k, v in sorted(friedman_cases.items()):
        print(f"    {SUBSPECIALTY_MAP[k]}: {len(v)} cases")

    # Parse Chern
    print("\n[3/3] Parsing Chern Q&A cases...")
    chern_cases = parse_chern()
    chern_total = sum(len(v) for v in chern_cases.values())
    print(f"  Found {chern_total} Chern cases across {len(chern_cases)} subspecialties")
    for k, v in sorted(chern_cases.items()):
        print(f"    {SUBSPECIALTY_MAP[k]}: {len(v)} cases")

    # Merge
    print("\n[MERGE] Merging into existing database...")
    db, summary = merge_into_database(pemberton_cases, friedman_cases, chern_cases)

    # Write output
    # Backup original
    backup_path = DB_PATH + ".backup"
    if not os.path.exists(backup_path):
        with open(DB_PATH, "r") as f:
            with open(backup_path, "w") as bf:
                bf.write(f.read())
        print(f"  Backed up original to {backup_path}")

    with open(DB_PATH, "w") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    print(f"  Written merged database to {DB_PATH}")

    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)

    header = f"{'Subspecialty':<35} {'Existing':>8} {'Pemberton':>10} {'Friedman':>9} {'Chern':>6} {'Final':>6}"
    print(header)
    print("-" * len(header))

    total_existing = 0
    total_pemberton = 0
    total_friedman = 0
    total_chern = 0
    total_final = 0

    for subspec_id in ["anterior-segment", "posterior-segment", "neuro-ophthalmology",
                       "pediatric-ophthalmology", "optics"]:
        name = SUBSPECIALTY_MAP[subspec_id]
        ex = summary["existing"].get(name, 0)
        pe = summary["pemberton"].get(name, 0)
        fr = summary["friedman"].get(name, 0)
        ch = summary["chern"].get(name, 0)
        fi = summary["final"].get(name, 0)
        print(f"{name:<35} {ex:>8} {pe:>10} {fr:>9} {ch:>6} {fi:>6}")
        total_existing += ex
        total_pemberton += pe
        total_friedman += fr
        total_chern += ch
        total_final += fi

    print("-" * len(header))
    print(f"{'TOTAL':<35} {total_existing:>8} {total_pemberton:>10} {total_friedman:>9} {total_chern:>6} {total_final:>6}")
    print(f"\nNew cases added: {total_final - total_existing}")
    print(f"Final database total: {total_final} cases")


if __name__ == "__main__":
    main()
