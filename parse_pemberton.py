#!/usr/bin/env python3
"""
Parse Pemberton cases from OCR text and merge into existing cases_database.json.
"""

import json
import re
import sys

# Chapter to subspecialty mapping
CHAPTER_MAP = {
    1: {"subspecialty": "Anterior Segment", "id": "anterior-segment", "abbrev": "as"},
    2: {"subspecialty": "Optics", "id": "optics", "abbrev": "op"},
    3: {"subspecialty": "Posterior Segment", "id": "posterior-segment", "abbrev": "ps"},
    4: {"subspecialty": "Neuro-Ophthalmology and Orbit", "id": "neuro-ophthalmology", "abbrev": "no"},
    5: {"subspecialty": "Pediatric Ophthalmology", "id": "pediatric-ophthalmology", "abbrev": "pd"},
    6: {"subspecialty": "Anterior Segment", "id": "anterior-segment", "abbrev": "ed"},  # External Disease -> Anterior Segment
}

def clean_text(text):
    """Clean OCR artifacts from text."""
    # Remove stray OCR artifacts like lone letters, numbers at line boundaries
    text = re.sub(r'\n\d+\s*$', '', text, flags=re.MULTILINE)  # page numbers
    text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)  # standalone numbers
    # Remove OCR bullet artifacts
    text = re.sub(r'^[©@®]\s+', '- ', text, flags=re.MULTILINE)
    text = re.sub(r'^\[e[)\]}]\s*$', '', text, flags=re.MULTILINE)  # [e) artifacts
    text = re.sub(r'^fe[)\]}\s]*$', '', text, flags=re.MULTILINE)  # fe) artifacts
    text = re.sub(r'^\(e\)\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^e\)\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d{4}\s*$', '', text, flags=re.MULTILINE)  # OCR random 4-digit artifacts like 0000
    text = re.sub(r'^[>]\s+', '- ', text, flags=re.MULTILINE)  # > used as bullets
    text = re.sub(r'^©\s*', '- ', text, flags=re.MULTILINE)  # © as bullet
    # Clean up multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_bullet_points(text):
    """Extract key bullet points/terms from text for scoring keywords."""
    keywords = []
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Lines starting with bullet markers
        if line.startswith(('- ', '* ', '• ')):
            term = line.lstrip('-*• ').strip()
            if len(term) > 3:
                keywords.append(term)
        elif re.match(r'^[A-Z]', line) and len(line) < 200:
            # Capitalized short lines are likely key terms
            keywords.append(line)

    # If no bullets found, extract medical terms from text
    if not keywords:
        # Extract capitalized multi-word terms
        terms = re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+', text)
        keywords = [t for t in terms if len(t) > 5][:8]

    # If still nothing, just take first few meaningful sentences
    if not keywords:
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]
        keywords = sentences[:5]

    return keywords[:10]  # Cap at 10

def extract_key_medical_terms(text):
    """Extract key medical terms for scoring keywords."""
    keywords = []
    # Look for specific medical patterns
    patterns = [
        r'(?:treat|Treat)\s+with\s+([^.]+)',
        r'(?:prescribe|start|use)\s+([^.]+)',
        r'(?:perform|obtain|order)\s+([^.]+)',
    ]

    # Extract bullet-pointed items
    for line in text.split('\n'):
        line = line.strip()
        if line.startswith(('- ', '* ', '• ')):
            term = line.lstrip('-*• ').strip()
            if len(term) > 3 and len(term) < 200:
                keywords.append(term)

    if not keywords:
        keywords = extract_bullet_points(text)

    return keywords[:10]

def parse_standard_case(case_text, case_num, chapter_num):
    """Parse a standard case with sections I-VI."""
    info = CHAPTER_MAP[chapter_num]

    # Generate case ID
    # For chapter 6 (external disease), use "ed" prefix but map to anterior segment
    case_id = f"pb-{info['abbrev']}-{case_num}"

    # Extract presentation line - look for age/gender pattern near top of case
    presentation = ""
    # Try multiple patterns for presentation line
    pres_patterns = [
        r'^.*?(\d+[\s-]*year[\s-]*old\b.+?)(?:\n|$)',
        r'^.*?(\d+\s*yo\b.+?)(?:\n|$)',
        r'^.*?(\d+\s*y/o\b.+?)(?:\n|$)',
        r'^((?:A |An )?(?:young |elderly )?(?:child|patient|woman|man|female|male).+?)(?:\n|$)',
    ]
    for pat in pres_patterns:
        pres_match = re.search(pat, case_text[:500], re.MULTILINE | re.IGNORECASE)
        if pres_match:
            presentation = pres_match.group(1).strip()
            presentation = re.sub(r'\s+', ' ', presentation).strip()
            # Remove OCR artifacts
            presentation = re.sub(r'[|©®\[\]{}]', '', presentation).strip()
            break

    # Extract sections
    sections = {}

    # Section I: Image Description
    img_match = re.search(
        r'(?:I\s+)?Image\s+Description:\s*(.*?)(?=I{2,3}\s*[\s_]*(?:Differential|History)|Il\s+Differential|ll\s+Differential)',
        case_text, re.DOTALL | re.IGNORECASE
    )
    if img_match:
        sections['image_desc'] = clean_text(img_match.group(1))

    # Section II: Differential Diagnosis
    diff_match = re.search(
        r'(?:Il?l?\s+)?Differential\s+Diagnosis:?\s*(.*?)(?=I{2,3}\s*[\s_]*History|Il{1,2}\s*[\s_]*History|\(I\s*History|III?\s*History|History/Physical)',
        case_text, re.DOTALL | re.IGNORECASE
    )
    if diff_match:
        sections['differential'] = clean_text(diff_match.group(1))

    # Section III: History/Physical Exam/Evaluation
    hist_match = re.search(
        r'(?:Il{1,2}\s+|III?\s+|\(I\s+)?History/Physical\s+Exam/Evaluation:?\s*(.*?)(?=IV\s+Assessment|{Vv?\s+Assessment|1V\s+Assessment|Assessment:)',
        case_text, re.DOTALL | re.IGNORECASE
    )
    if hist_match:
        sections['history'] = clean_text(hist_match.group(1))

    # Section IV: Assessment
    assess_match = re.search(
        r'(?:IV\s+|{Vv?\s+|1V\s+)?Assessment:?\s*(.*?)(?=V[_\s]+Plan|Vv\s+Plan|Plan:)',
        case_text, re.DOTALL | re.IGNORECASE
    )
    if assess_match:
        sections['assessment'] = clean_text(assess_match.group(1))

    # Section V: Plan
    plan_match = re.search(
        r'(?:V[_\s]+|Vv\s+)?Plan:?\s*(.*?)(?=VI\s+Patient|V1\s+Patient|Vi\s+Patient|\|\s+Patient|Patient\s+Education:)',
        case_text, re.DOTALL | re.IGNORECASE
    )
    if plan_match:
        sections['plan'] = clean_text(plan_match.group(1))

    # Section VI: Patient Education
    edu_match = re.search(
        r'(?:VI\s+|V1\s+|Vi\s+|\|\s+)?Patient\s+Education:?\s*(.*?)$',
        case_text, re.DOTALL | re.IGNORECASE
    )
    if edu_match:
        sections['education'] = clean_text(edu_match.group(1))

    # Build the title from assessment
    title = sections.get('assessment', f'Case {case_num}')
    # Clean up the title - take first meaningful line
    title_lines = [l.strip() for l in title.split('\n') if l.strip()]
    if title_lines:
        title = title_lines[0]
    # Strip all common bullet/OCR prefixes
    title = re.sub(r'^[-•*oO©@®>5\s]+', '', title).strip()
    title = re.sub(r'^\d+\.\s*', '', title).strip()
    # Remove trailing periods
    title = title.rstrip('.')
    if not title or len(title) < 3:
        title = f'Case {case_num}'
    if len(title) > 100:
        title = title[:97] + "..."

    # Extract questions/answers for history section
    # Split history into "questions to ask" and "exam findings" and "tests"
    history_text = sections.get('history', '')

    # Try to identify question-asking parts vs exam parts
    questions_text = ""
    exam_text = ""
    tests_text = ""

    # Simple heuristic: sentences with "ask", "enquire", "history" -> questions
    # Sentences with "exam", "look for", "evaluate", "slit lamp" -> exam findings
    # Sentences with "test", "lab", "obtain", "order", "CT", "MRI" -> tests
    sentences = re.split(r'(?<=[.!])\s+', history_text)
    q_sentences = []
    e_sentences = []
    t_sentences = []

    for s in sentences:
        s_lower = s.lower()
        if any(w in s_lower for w in ['ask', 'enquire', 'inquire', 'history', 'would want to know']):
            q_sentences.append(s)
        elif any(w in s_lower for w in ['lab', 'test', 'obtain', 'order', 'ct ', 'mri', 'oct', 'hla', 'rpr', 'culture', 'biopsy', 'ffa', 'angiograph', 'b scan', 'ultrasound', 'topography', 'pachymetry', 'specular']):
            t_sentences.append(s)
        elif any(w in s_lower for w in ['exam', 'look for', 'looking for', 'evaluate', 'slit lamp', 'inspect', 'dilated', 'gonio', 'fundus', 'perform']):
            e_sentences.append(s)
        else:
            # Default to exam findings
            e_sentences.append(s)

    questions_text = ' '.join(q_sentences) if q_sentences else history_text
    exam_text = ' '.join(e_sentences) if e_sentences else history_text
    tests_text = ' '.join(t_sentences) if t_sentences else "Based on clinical findings"

    # Build questions array
    questions = [
        {
            "number": 1,
            "question": "What is your focused differential diagnosis?",
            "answer": sections.get('differential', ''),
            "keyPoints": extract_bullet_points(sections.get('differential', '')),
            "scoringKeywords": extract_key_medical_terms(sections.get('differential', ''))
        },
        {
            "number": 2,
            "question": "What questions do you want to ask the patient?",
            "answer": questions_text,
            "keyPoints": extract_bullet_points(questions_text),
            "scoringKeywords": extract_key_medical_terms(questions_text)
        },
        {
            "number": 3,
            "question": "What exam findings will you look for?",
            "answer": exam_text,
            "keyPoints": extract_bullet_points(exam_text),
            "scoringKeywords": extract_key_medical_terms(exam_text)
        },
        {
            "number": 4,
            "question": "What tests will rule in or rule out your #1 treating diagnosis?",
            "answer": tests_text,
            "keyPoints": extract_bullet_points(tests_text),
            "scoringKeywords": extract_key_medical_terms(tests_text)
        },
        {
            "number": 5,
            "question": "How are you going to treat your #1 diagnosis?",
            "answer": sections.get('plan', ''),
            "keyPoints": extract_bullet_points(sections.get('plan', '')),
            "scoringKeywords": extract_key_medical_terms(sections.get('plan', ''))
        },
        {
            "number": 6,
            "question": "What will you tell your patient about the natural history, prognosis and follow-up for treatment?",
            "answer": sections.get('education', ''),
            "keyPoints": extract_bullet_points(sections.get('education', '')),
            "scoringKeywords": extract_key_medical_terms(sections.get('education', ''))
        }
    ]

    subspecialty = info['subspecialty']

    return {
        "id": case_id,
        "caseNumber": case_num,
        "source": "Pemberton",
        "title": title,
        "subspecialty": subspecialty,
        "presentation": presentation,
        "imageFile": None,
        "imageFiles": [],
        "photoDescription": sections.get('image_desc', ''),
        "questions": questions
    }

def parse_optics_case(case_text, case_num):
    """Parse optics Q&A style case into best-fit format."""
    info = CHAPTER_MAP[2]
    case_id = f"pb-{info['abbrev']}-{case_num}"

    # For optics cases, the structure is: question then answer
    # Split at the second occurrence of CASE header (answer follows)
    lines = case_text.strip().split('\n')

    # Find the question (usually between first CASE header and page break or second CASE)
    question_part = ""
    answer_part = ""

    # Look for question text (after CASE X header, before second CASE X or answer)
    found_first_case = False
    found_second_case = False
    q_lines = []
    a_lines = []

    for line in lines:
        stripped = line.strip()
        if re.match(r'^CASE\s+\d+', stripped):
            if not found_first_case:
                found_first_case = True
                continue
            else:
                found_second_case = True
                continue

        if found_second_case:
            a_lines.append(line)
        elif found_first_case:
            q_lines.append(line)

    question_part = clean_text('\n'.join(q_lines))
    answer_part = clean_text('\n'.join(a_lines))

    # If no second case header found, try splitting differently
    if not answer_part:
        # Everything after the question line is the answer
        all_text = clean_text('\n'.join(lines))
        parts = all_text.split('\n', 2)
        if len(parts) > 1:
            question_part = parts[0] if parts[0] else parts[1] if len(parts) > 1 else ""
            answer_part = parts[-1] if len(parts) > 1 else ""

    # For optics, use the question as the title
    title = question_part[:100] if question_part else f"Optics Case {case_num}"
    if len(question_part) > 100:
        title = question_part[:97] + "..."

    # Optics cases get a simplified question structure
    questions = [
        {
            "number": 1,
            "question": question_part if question_part else f"Optics Case {case_num}",
            "answer": answer_part,
            "keyPoints": extract_bullet_points(answer_part),
            "scoringKeywords": extract_key_medical_terms(answer_part)
        }
    ]

    return {
        "id": case_id,
        "caseNumber": case_num,
        "source": "Pemberton",
        "title": title,
        "subspecialty": info['subspecialty'],
        "presentation": question_part,
        "imageFile": None,
        "imageFiles": [],
        "photoDescription": "",
        "questions": questions
    }

def split_into_chapters(text):
    """Split the full text into chapters."""
    chapter_pattern = r'={10,}\nChapter\s+(\d+):\s+(.+?)Cases\n.*?={10,}'

    chapters = {}
    splits = list(re.finditer(chapter_pattern, text, re.DOTALL))

    for i, match in enumerate(splits):
        ch_num = int(match.group(1))
        start = match.end()
        end = splits[i + 1].start() if i + 1 < len(splits) else len(text)
        chapters[ch_num] = text[start:end]

    return chapters

def split_into_cases(chapter_text, chapter_num):
    """Split chapter text into individual cases."""
    # Find all CASE N markers - also handle OCR artifacts like "CASE 7/4" -> 74
    case_pattern = r'^CASE\s+(\d+(?:/\d+)?)'
    case_starts = []

    for m in re.finditer(case_pattern, chapter_text, re.MULTILINE):
        raw_num = m.group(1)
        # Handle OCR artifacts like "7/4" -> "74"
        case_num = int(raw_num.replace('/', ''))
        # Avoid duplicate CASE headers (OCR often duplicates them on same/next page)
        if not case_starts or case_starts[-1][0] != case_num:
            case_starts.append((case_num, m.start()))

    cases = []
    for i, (case_num, start) in enumerate(case_starts):
        end = case_starts[i + 1][1] if i + 1 < len(case_starts) else len(chapter_text)
        # Include up to 5 lines of context before the CASE header for presentation line
        context_start = max(0, start - 300)
        pre_context = chapter_text[context_start:start]
        case_text = pre_context + chapter_text[start:end]
        cases.append((case_num, case_text))

    return cases

def main():
    # Read Pemberton text
    with open('/tmp/ophthalmology-boards/pemberton_cases.txt', 'r') as f:
        text = f.read()

    # Read existing database
    with open('/tmp/ophthalmology-boards/public/data/cases_database.json', 'r') as f:
        db = json.load(f)

    # Split into chapters
    chapters = split_into_chapters(text)

    print(f"Found {len(chapters)} chapters")
    for ch_num, ch_text in sorted(chapters.items()):
        print(f"  Chapter {ch_num}: {len(ch_text)} chars")

    # Parse all cases
    all_cases = {}  # subspecialty_id -> list of cases
    total_parsed = 0
    parse_errors = 0

    for ch_num in sorted(chapters.keys()):
        ch_text = chapters[ch_num]
        raw_cases = split_into_cases(ch_text, ch_num)

        info = CHAPTER_MAP[ch_num]
        subspec_id = info['id']

        if subspec_id not in all_cases:
            all_cases[subspec_id] = []

        print(f"\nChapter {ch_num} ({info['subspecialty']}): {len(raw_cases)} raw cases")

        for case_num, case_text in raw_cases:
            try:
                if ch_num == 2:
                    # Optics cases have Q&A format
                    parsed = parse_optics_case(case_text, case_num)
                else:
                    parsed = parse_standard_case(case_text, case_num, ch_num)

                all_cases[subspec_id].append(parsed)
                total_parsed += 1

                # Print brief info
                title_preview = parsed['title'][:60] if parsed['title'] else 'No title'
                print(f"  Case {case_num}: {title_preview}")

            except Exception as e:
                parse_errors += 1
                print(f"  ERROR parsing Case {case_num}: {e}", file=sys.stderr)

    # Merge into existing database
    print("\n" + "=" * 60)
    print("MERGE SUMMARY")
    print("=" * 60)

    # Count existing cases
    existing_counts = {}
    for subspec in db['subspecialties']:
        existing_counts[subspec['id']] = len(subspec['cases'])
        print(f"  {subspec['name']}: {len(subspec['cases'])} existing cases")

    # Add Pemberton cases
    added_counts = {}
    for subspec in db['subspecialties']:
        sid = subspec['id']
        if sid in all_cases:
            new_cases = all_cases[sid]
            # Check for ID conflicts
            existing_ids = {c['id'] for c in subspec['cases']}
            for nc in new_cases:
                if nc['id'] in existing_ids:
                    print(f"  WARNING: Duplicate ID {nc['id']}, skipping")
                    continue
                subspec['cases'].append(nc)
            added_counts[sid] = len(new_cases)

    print("\n--- Cases Added ---")
    total_added = 0
    for subspec in db['subspecialties']:
        sid = subspec['id']
        added = added_counts.get(sid, 0)
        total_added += added
        print(f"  {subspec['name']}: +{added} Pemberton cases (total now: {len(subspec['cases'])})")

    print(f"\nTotal Pemberton cases parsed: {total_parsed}")
    print(f"Total cases added to database: {total_added}")
    print(f"Parse errors: {parse_errors}")

    # Final totals
    grand_total = sum(len(s['cases']) for s in db['subspecialties'])
    print(f"\nFinal database total: {grand_total} cases across {len(db['subspecialties'])} subspecialties")

    # Update metadata
    db['metadata']['pembertonCasesAdded'] = total_added
    db['metadata']['lastUpdated'] = '2026-04-06'

    # Write merged database
    output_path = '/tmp/ophthalmology-boards/public/data/cases_database.json'
    with open(output_path, 'w') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

    print(f"\nMerged database written to: {output_path}")

    # Validation: spot check a few cases
    print("\n--- Spot Check ---")
    for subspec in db['subspecialties']:
        pemberton_cases = [c for c in subspec['cases'] if c.get('source') == 'Pemberton']
        if pemberton_cases:
            c = pemberton_cases[0]
            print(f"\n  [{subspec['name']}] First Pemberton case: {c['id']}")
            print(f"    Title: {c['title'][:80]}")
            print(f"    Presentation: {c['presentation'][:80]}")
            if c['questions']:
                q1 = c['questions'][0]
                ans_preview = q1['answer'][:80] if q1['answer'] else 'No answer'
                print(f"    Q1 answer preview: {ans_preview}")
                print(f"    Q1 keywords: {q1['scoringKeywords'][:3]}")

if __name__ == '__main__':
    main()
