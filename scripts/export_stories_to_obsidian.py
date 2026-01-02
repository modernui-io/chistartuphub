#!/usr/bin/env python3
"""
Export founder stories from CSV to Obsidian markdown files.
Creates clean, well-formatted notes for each founder story.
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

def clean_filename(name):
    """Convert company name to valid filename."""
    # Remove special characters, keep alphanumeric and spaces
    clean = re.sub(r'[^\w\s-]', '', name)
    # Replace spaces with hyphens
    clean = re.sub(r'\s+', '-', clean)
    return clean

def parse_json_array(value):
    """Parse JSON array string to list."""
    if not value or value == '[]':
        return []
    try:
        return json.loads(value.replace("'", '"'))
    except:
        return [value] if value else []

def format_currency(value):
    """Format funding/valuation values."""
    if not value:
        return "Undisclosed"
    return value

def create_markdown(row):
    """Create Obsidian markdown content from CSV row."""
    company = row.get('company_name', 'Unknown')
    sector = row.get('sector', 'Unknown')
    description = row.get('description', '').strip()
    founders = parse_json_array(row.get('founders', '[]'))
    founded_year = row.get('founded_year', '')
    funding = format_currency(row.get('funding_raised', ''))
    valuation = format_currency(row.get('valuation', ''))
    is_unicorn = row.get('is_unicorn', 'false').lower() == 'true'
    moat = row.get('competitive_moat', '')
    moat_description = row.get('moat_description', '').strip()
    website = row.get('website', '')
    linkedin = row.get('linkedin', '')
    tagline = row.get('tagline', '')

    # Build markdown
    md = []

    # Frontmatter
    md.append("---")
    md.append(f"company: \"{company}\"")
    md.append(f"sector: \"{sector}\"")
    md.append(f"founded: {founded_year}")
    md.append(f"funding: \"{funding}\"")
    if valuation:
        md.append(f"valuation: \"{valuation}\"")
    md.append(f"unicorn: {str(is_unicorn).lower()}")
    if founders:
        md.append(f"founders: {json.dumps(founders)}")
    if website:
        md.append(f"website: \"{website}\"")
    md.append(f"tags: [founder-story, {sector.lower().replace(' ', '-')}, chicago-startup]")
    md.append(f"created: {datetime.now().strftime('%Y-%m-%d')}")
    md.append("---")
    md.append("")

    # Title
    md.append(f"# {company}")
    md.append("")

    # Quick info
    if tagline:
        md.append(f"> **{tagline}**")
        md.append("")

    md.append("## Overview")
    md.append("")
    md.append(f"| | |")
    md.append(f"|---|---|")
    md.append(f"| **Sector** | {sector} |")
    md.append(f"| **Founded** | {founded_year} |")
    md.append(f"| **Founders** | {', '.join(founders) if founders else 'Unknown'} |")
    md.append(f"| **Funding Raised** | {funding} |")
    if valuation:
        md.append(f"| **Valuation** | {valuation} |")
    if is_unicorn:
        md.append(f"| **Status** | 🦄 Unicorn |")
    if website:
        md.append(f"| **Website** | [{website}](https://{website}) |")
    md.append("")

    # Story
    if description:
        md.append("## The Story")
        md.append("")
        # Split description into paragraphs
        paragraphs = description.split('. .')
        for p in paragraphs:
            clean_p = p.strip()
            if clean_p:
                # Ensure proper sentence ending
                if not clean_p.endswith('.'):
                    clean_p += '.'
                md.append(clean_p)
                md.append("")

    # Competitive Moat
    if moat or moat_description:
        md.append("## Competitive Moat")
        md.append("")
        if moat:
            md.append(f"**Primary Moat:** {moat}")
            md.append("")
        if moat_description:
            # Split moat description into paragraphs
            moat_paragraphs = moat_description.split('. .')
            for p in moat_paragraphs:
                clean_p = p.strip()
                if clean_p:
                    if not clean_p.endswith('.'):
                        clean_p += '.'
                    md.append(clean_p)
                    md.append("")

    # Links
    md.append("## Links")
    md.append("")
    if website:
        md.append(f"- [Website](https://{website})")
    if linkedin:
        md.append(f"- [LinkedIn]({linkedin})")
    md.append("")

    # Footer
    md.append("---")
    md.append(f"*Imported from ChiStartupHub on {datetime.now().strftime('%Y-%m-%d')}*")

    return '\n'.join(md)

def main():
    # Create output folder
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    # Read CSV
    stories_count = 0
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            company = row.get('company_name', 'Unknown')
            if not company:
                continue

            # Create markdown content
            markdown = create_markdown(row)

            # Write to file
            filename = clean_filename(company) + '.md'
            filepath = os.path.join(OUTPUT_FOLDER, filename)

            with open(filepath, 'w', encoding='utf-8') as out:
                out.write(markdown)

            stories_count += 1
            print(f"✓ Created: {filename}")

    print(f"\n✅ Exported {stories_count} founder stories to Obsidian")
    print(f"📁 Location: {OUTPUT_FOLDER}")

if __name__ == "__main__":
    main()
