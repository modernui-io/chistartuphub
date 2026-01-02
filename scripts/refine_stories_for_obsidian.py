#!/usr/bin/env python3
"""
Refine founder stories - better structure, formatting, and organization.
Creates clean, well-organized notes with:
- Founder Background
- The Inciting Moment
- Growth Journey
- Competitive Moat Analysis
- Key Takeaways
- Links
"""

import csv
import os
import re
import json
from datetime import datetime

# Paths
CSV_PATH = "/Users/billyndizeye/Downloads/stories_rows.csv"
OBSIDIAN_VAULT = "/Users/billyndizeye/Library/Mobile Documents/iCloud~md~obsidian/Documents/new obsidian/the start"
OUTPUT_FOLDER = os.path.join(OBSIDIAN_VAULT, "Business", "Founder-Stories")

# Tag mappings for filtering
SECTOR_TAGS = {
    'FoodTech': ['foodtech', 'consumer', 'cpg'],
    'SaaS': ['saas', 'b2b', 'enterprise'],
    'FinTech': ['fintech', 'payments', 'lending'],
    'HealthTech': ['healthtech', 'healthcare'],
    'Logistics Tech': ['logistics', 'supply-chain', 'b2b'],
    'Logistics': ['logistics', 'supply-chain'],
    'InsurTech': ['insurtech', 'fintech'],
    'B2B SaaS': ['saas', 'b2b', 'enterprise'],
    'Consumer Tech': ['consumer', 'marketplace'],
    'HR Tech/SaaS': ['saas', 'hr-tech', 'enterprise'],
    'LegalTech': ['legaltech', 'enterprise', 'saas'],
    'AI/ML': ['ai', 'machine-learning', 'data'],
    'PropTech': ['proptech', 'real-estate'],
    'E-commerce': ['ecommerce', 'consumer', 'retail'],
    'Media': ['media', 'consumer'],
    'Enterprise': ['enterprise', 'b2b'],
}

# Stage tags based on funding
def get_stage_tags(funding, valuation, is_unicorn):
    tags = []

    # Check if unicorn based on valuation, funding, or flag
    is_unicorn_actual = is_unicorn

    # Check both valuation AND funding fields for billion-dollar indicators
    for field in [valuation, funding]:
        if field and not is_unicorn_actual:
            # Look for patterns like $2.7B, $1.2B, $12.7B, or "billion"
            match = re.search(r'\$?([\d.]+)\s*[Bb](?:illion)?', field, re.IGNORECASE)
            if match:
                try:
                    val_num = float(match.group(1))
                    if val_num >= 1.0:
                        is_unicorn_actual = True
                except:
                    pass
            # Also check for written out billion
            if 'billion' in field.lower():
                is_unicorn_actual = True

    if is_unicorn_actual:
        tags.append('unicorn')

    if funding:
        funding_lower = funding.lower()
        if 'billion' in funding_lower or re.search(r'\$[\d.]+\s*[Bb]', funding):
            tags.append('growth-stage')
        elif 'million' in funding_lower:
            tags.append('funded')
        if 'acquired' in funding_lower or 'exit' in funding_lower:
            tags.append('exit')

    return tags, is_unicorn_actual

def clean_filename(name):
    """Convert company name to valid filename."""
    clean = re.sub(r'[^\w\s-]', '', name)
    clean = re.sub(r'\s+', '-', clean)
    return clean

def parse_json_array(value):
    """Parse JSON array string to list."""
    if not value or value == '[]':
        return []
    try:
        # Handle various formats
        cleaned = value.strip()
        if cleaned.startswith('[') and cleaned.endswith(']'):
            return json.loads(cleaned.replace("'", '"'))
        return [cleaned]
    except:
        return [value] if value else []

def clean_text(text):
    """Clean and format text properly."""
    if not text:
        return ""

    # Fix common issues
    text = text.strip()

    # Fix ". ." paragraph separators - replace with clean paragraph break
    text = re.sub(r'\s*\.\s+\.\s*', '. ', text)  # ". ." becomes single period + space

    # Fix quotes
    text = text.replace('""', '"')
    text = text.replace("''", "'")

    # Normalize whitespace
    text = re.sub(r' +', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()

def split_into_sections(description):
    """
    Intelligently split the description into structured sections.
    Returns dict with: background, inciting_moment, growth, analysis
    """
    if not description:
        return {'background': '', 'inciting_moment': '', 'growth': '', 'analysis': ''}

    # Split on double periods (common separator in the data)
    paragraphs = re.split(r'\.\s*\.\s*', description)
    paragraphs = [clean_text(p) for p in paragraphs if p.strip()]

    sections = {
        'background': '',
        'inciting_moment': '',
        'growth': '',
        'analysis': ''
    }

    if len(paragraphs) == 0:
        return sections

    if len(paragraphs) == 1:
        sections['background'] = paragraphs[0]
        return sections

    if len(paragraphs) == 2:
        sections['background'] = paragraphs[0]
        sections['growth'] = paragraphs[1]
        return sections

    # For 3+ paragraphs, distribute intelligently
    # First paragraph usually has founding story
    sections['background'] = paragraphs[0]

    # Look for inciting moment keywords
    for i, p in enumerate(paragraphs[1:], 1):
        p_lower = p.lower()
        if any(keyword in p_lower for keyword in ['insight', 'recognized', 'saw', 'realized', 'frustrat', 'problem', 'pain point', 'opportunity']):
            if not sections['inciting_moment']:
                sections['inciting_moment'] = p
                continue

        if any(keyword in p_lower for keyword in ['raised', 'funding', 'grew', 'scaled', 'acquired', 'ipo', 'revenue', 'customer']):
            sections['growth'] += p + '\n\n'
            continue

        if any(keyword in p_lower for keyword in ['moat', 'competitive', 'strategy', 'position', 'advantage']):
            sections['analysis'] += p + '\n\n'
            continue

        # Default: add to growth if early, analysis if later
        if i < len(paragraphs) // 2:
            sections['growth'] += p + '\n\n'
        else:
            sections['analysis'] += p + '\n\n'

    # Clean up
    for key in sections:
        sections[key] = sections[key].strip()

    return sections

def get_external_link(company, website):
    """Get the best external link for a company."""
    if website and website.strip():
        url = website.strip()
        # Don't add https:// if already has protocol
        if url.startswith('http://') or url.startswith('https://'):
            return url
        return f"https://{url}"

    # Fallback to Wikipedia search
    company_slug = company.replace(' ', '_')
    return f"https://en.wikipedia.org/wiki/{company_slug}"

def create_refined_markdown(row):
    """Create well-structured Obsidian markdown from CSV row."""
    company = row.get('company_name', 'Unknown')
    sector = row.get('sector', 'Unknown')
    description = row.get('description', '').strip()
    founders = parse_json_array(row.get('founders', '[]'))
    founded_year = row.get('founded_year', '')
    funding = row.get('funding_raised', '')
    valuation = row.get('valuation', '')
    is_unicorn = row.get('is_unicorn', 'false').lower() == 'true'
    moat = row.get('competitive_moat', '')
    moat_description = clean_text(row.get('moat_description', ''))
    website = row.get('website', '')
    linkedin = row.get('linkedin', '')
    tagline = row.get('tagline', '')

    # Parse sections from description
    sections = split_into_sections(description)

    # Build tags
    tags = ['founder-story', 'chicago']
    tags.extend(SECTOR_TAGS.get(sector, [sector.lower().replace(' ', '-')]))
    stage_tags, is_unicorn = get_stage_tags(funding, valuation, is_unicorn)
    tags.extend(stage_tags)

    # Clean founders list
    founders_clean = []
    for f in founders:
        # Split on comma if multiple founders in one string
        if ',' in f:
            founders_clean.extend([x.strip() for x in f.split(',')])
        else:
            founders_clean.append(f.strip())
    founders_clean = [f for f in founders_clean if f]

    # Build markdown
    md = []

    # Frontmatter
    md.append("---")
    md.append(f"company: \"{company}\"")
    md.append(f"sector: \"{sector}\"")
    if founded_year:
        md.append(f"founded: {founded_year}")
    if funding:
        md.append(f"funding: \"{funding}\"")
    if valuation:
        md.append(f"valuation: \"{valuation}\"")
    md.append(f"unicorn: {str(is_unicorn).lower()}")
    if founders_clean:
        md.append(f"founders:")
        for f in founders_clean:
            md.append(f"  - \"{f}\"")
    if website:
        md.append(f"website: \"{website}\"")
    if moat:
        md.append(f"primary_moat: \"{moat}\"")
    md.append(f"tags: {json.dumps(tags)}")
    md.append(f"created: {datetime.now().strftime('%Y-%m-%d')}")
    md.append("---")
    md.append("")

    # Title
    md.append(f"# {company}")
    md.append("")

    # Status badges
    badges = []
    if is_unicorn:
        badges.append("🦄 Unicorn")
    if funding and ('acquired' in funding.lower() or 'exit' in funding.lower()):
        badges.append("💰 Exit")
    if badges:
        md.append(f"> {' | '.join(badges)}")
        md.append("")

    # Quick Facts
    md.append("## Quick Facts")
    md.append("")
    md.append(f"| | |")
    md.append(f"|:--|:--|")
    md.append(f"| **Sector** | {sector} |")
    if founded_year:
        md.append(f"| **Founded** | {founded_year} |")
    if founders_clean:
        md.append(f"| **Founder(s)** | {', '.join(founders_clean)} |")
    if funding:
        md.append(f"| **Funding** | {funding} |")
    if valuation:
        md.append(f"| **Valuation** | {valuation} |")
    if moat:
        md.append(f"| **Primary Moat** | {moat} |")
    md.append("")

    # The Story sections
    if sections['background']:
        md.append("## The Origin Story")
        md.append("")
        md.append(sections['background'])
        md.append("")

    if sections['inciting_moment']:
        md.append("## The Inciting Moment")
        md.append("")
        md.append(sections['inciting_moment'])
        md.append("")

    if sections['growth']:
        md.append("## Growth & Milestones")
        md.append("")
        md.append(sections['growth'])
        md.append("")

    # Competitive Moat (from moat_description field)
    if moat_description:
        md.append("## Competitive Moat Analysis")
        md.append("")
        if moat:
            md.append(f"**Primary Moat Type:** {moat}")
            md.append("")
        # Split moat description into paragraphs
        moat_paragraphs = re.split(r'\.\s*\.\s*', moat_description)
        for p in moat_paragraphs:
            p = clean_text(p)
            if p:
                md.append(p)
                md.append("")
    elif sections['analysis']:
        md.append("## Analysis")
        md.append("")
        md.append(sections['analysis'])
        md.append("")

    # Key Takeaways
    md.append("## Key Takeaways")
    md.append("")
    takeaways = []
    if moat:
        takeaways.append(f"- **Moat:** {moat} - defensibility through specialized positioning")
    if is_unicorn:
        takeaways.append(f"- **Scale:** Achieved unicorn status ($1B+ valuation)")
    if founded_year and founded_year.isdigit():
        years = 2025 - int(founded_year)
        takeaways.append(f"- **Timeline:** ~{years} years from founding to current status")
    if sector:
        takeaways.append(f"- **Market:** Operates in {sector} vertical")

    if takeaways:
        md.extend(takeaways)
    else:
        md.append("- Story demonstrates importance of founder-market fit")
        md.append("- Chicago ecosystem provided early support")
    md.append("")

    # Links
    md.append("## Learn More")
    md.append("")
    primary_link = get_external_link(company, website)
    if website:
        # Clean display text (remove protocol for cleaner look)
        display_url = website.strip()
        display_url = re.sub(r'^https?://', '', display_url)
        md.append(f"- **Website:** [{display_url}]({primary_link})")
    else:
        md.append(f"- **Wikipedia:** [Search]({primary_link})")

    if linkedin:
        md.append(f"- **LinkedIn:** [{linkedin}]({linkedin})")

    # Add Crunchbase as secondary source
    company_slug = company.lower().replace(' ', '-')
    md.append(f"- **Crunchbase:** [Profile](https://www.crunchbase.com/organization/{company_slug})")
    md.append("")

    # Tags for filtering
    md.append("---")
    md.append("")
    md.append(f"**Tags:** {' '.join(['#' + t for t in tags])}")
    md.append("")
    md.append(f"*Last updated: {datetime.now().strftime('%Y-%m-%d')}*")

    return '\n'.join(md)

def main():
    # Create output folder
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    # Read CSV and process
    stories_count = 0
    companies = []

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            company = row.get('company_name', 'Unknown')
            if not company:
                continue

            # Create markdown content
            markdown = create_refined_markdown(row)

            # Write to file
            filename = clean_filename(company) + '.md'
            filepath = os.path.join(OUTPUT_FOLDER, filename)

            with open(filepath, 'w', encoding='utf-8') as out:
                out.write(markdown)

            stories_count += 1
            # Determine unicorn status based on valuation
            valuation = row.get('valuation', '')
            is_unicorn_flag = row.get('is_unicorn', 'false').lower() == 'true'
            funding = row.get('funding_raised', '')
            _, is_unicorn_actual = get_stage_tags(funding, valuation, is_unicorn_flag)
            companies.append({
                'name': company,
                'sector': row.get('sector', ''),
                'unicorn': is_unicorn_actual,
                'funding': funding,
                'valuation': valuation
            })
            print(f"✓ Refined: {filename}")

    # Update MOC
    create_moc(companies)

    print(f"\n✅ Refined {stories_count} founder stories")
    print(f"📁 Location: {OUTPUT_FOLDER}")

def create_moc(companies):
    """Create updated Map of Content."""
    # Group by sector
    by_sector = {}
    unicorns = []
    exits = []

    # Known exits (acquired companies)
    known_exits = ['braintree', 'grubhub', 'simple mills', 'cleversafe', 'fieldglass', 'tock', 'bonobos', 'vilagemd']

    for c in companies:
        sector = c['sector'] or 'Other'
        if sector not in by_sector:
            by_sector[sector] = []
        by_sector[sector].append(c['name'])

        if c['unicorn']:
            unicorns.append(c['name'])

        # Check for exits - look at funding text or known exits
        funding_lower = (c.get('funding', '') or '').lower()
        name_lower = c['name'].lower()
        if ('acquired' in funding_lower or
            'exit' in funding_lower or
            name_lower in known_exits or
            any(keyword in funding_lower for keyword in ['paypal', 'ibm', 'sap', 'walmart', 'squarespace', 'flowers'])):
            exits.append(c['name'])

    md = []
    md.append("---")
    md.append("tags: [MOC, founder-stories, chicago]")
    md.append(f"created: {datetime.now().strftime('%Y-%m-%d')}")
    md.append("---")
    md.append("")
    md.append("# Chicago Founder Stories")
    md.append("")
    md.append("> Lessons from founders who built successful companies in Chicago.")
    md.append("")
    md.append(f"**Total Stories:** {len(companies)} | **Unicorns:** {len(unicorns)} | **Notable Exits:** {len(exits)}")
    md.append("")

    if unicorns:
        md.append("## 🦄 Unicorns")
        md.append("")
        for u in unicorns:
            md.append(f"- [[{clean_filename(u)}|{u}]]")
        md.append("")

    if exits:
        md.append("## 💰 Notable Exits")
        md.append("")
        for e in exits:
            md.append(f"- [[{clean_filename(e)}|{e}]]")
        md.append("")

    md.append("## 📂 By Sector")
    md.append("")
    for sector in sorted(by_sector.keys()):
        md.append(f"### {sector}")
        md.append("")
        for company in sorted(by_sector[sector]):
            md.append(f"- [[{clean_filename(company)}|{company}]]")
        md.append("")

    md.append("---")
    md.append("")
    md.append("## 🏷️ Filter by Tag")
    md.append("")
    md.append("- `#unicorn` - Billion-dollar valuations")
    md.append("- `#exit` - Acquired or IPO'd")
    md.append("- `#fintech` - Financial technology")
    md.append("- `#saas` - Software as a Service")
    md.append("- `#healthtech` - Healthcare technology")
    md.append("- `#consumer` - Consumer-facing products")
    md.append("- `#b2b` - Business-to-business")
    md.append("")
    md.append(f"*Last updated: {datetime.now().strftime('%Y-%m-%d')}*")

    moc_path = os.path.join(OUTPUT_FOLDER, "Founder Stories MOC.md")
    with open(moc_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))

    print("✓ Updated: Founder Stories MOC.md")

if __name__ == "__main__":
    main()
