#!/usr/bin/env python3
"""
VC Firm Enrichment Script
Uses OpenAI to enrich firm data with investment stages, sectors, thesis, etc.
Cost: ~$0.001-0.01 per firm with gpt-4.1-mini
"""

import os
import sys
import pandas as pd
from enrichment import enrich

# ============================================================
# CONFIGURATION
# ============================================================

# Set your OpenAI API key here or as environment variable
# export OPENAI_API_KEY="sk-..."
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Model to use (gpt-4.1-mini is cheapest, gpt-4.1 is most accurate)
MODEL = "gpt-4.1-mini"

# ============================================================
# VC FIRM ENRICHMENT PROMPTS
# ============================================================

ENRICHMENT_FIELDS = {
    "investment_stages": {
        "prompt": """Based on the VC firm name and website, identify their primary investment stages.
Return ONLY a comma-separated list from these options: Pre-Seed, Seed, Series A, Series B, Series C, Growth, Late Stage.
If unknown, return "Unknown". No explanations.""",
        "description": "Investment stages (Seed, Series A, etc.)"
    },

    "sectors": {
        "prompt": """Based on the VC firm name and website, identify their primary investment sectors/focus areas.
Return ONLY a comma-separated list of 3-5 sectors (e.g., "SaaS, AI/ML, Fintech, Healthcare").
If unknown, return "Unknown". No explanations.""",
        "description": "Focus sectors (SaaS, AI, Fintech, etc.)"
    },

    "geographic_focus": {
        "prompt": """Based on the VC firm name and website, identify their geographic investment focus.
Return ONLY the regions (e.g., "US, Europe" or "Global" or "Bay Area focused").
If unknown, return "Unknown". No explanations.""",
        "description": "Geographic focus"
    },

    "check_size": {
        "prompt": """Based on the VC firm name, estimate their typical check size range.
Return ONLY a range like "$100K-$500K" or "$1M-$5M" or "$10M+".
If unknown, return "Unknown". No explanations.""",
        "description": "Typical check size"
    },

    "firm_description": {
        "prompt": """Write a 1-2 sentence description of this VC firm's investment thesis and focus.
Be concise and factual. If unknown, return "Unknown".""",
        "description": "Firm description/thesis"
    }
}


def load_firms(filepath):
    """Load firms from CSV or Excel file."""
    if filepath.endswith('.xlsx') or filepath.endswith('.xls'):
        df = pd.read_excel(filepath)
    else:
        df = pd.read_csv(filepath)

    # Normalize column names
    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    # Find the name column
    name_col = None
    for col in ['name', 'firm_name', 'firm', 'investor_name', 'company']:
        if col in df.columns:
            name_col = col
            break

    if not name_col:
        print(f"Error: Could not find name column. Available: {list(df.columns)}")
        sys.exit(1)

    # Find website column if exists
    website_col = None
    for col in ['website', 'url', 'site', 'domain']:
        if col in df.columns:
            website_col = col
            break

    return df, name_col, website_col


def create_input_column(df, name_col, website_col):
    """Create a combined input column for the AI."""
    if website_col:
        df['_enrichment_input'] = df.apply(
            lambda row: f"Firm: {row[name_col]}, Website: {row[website_col]}"
            if pd.notna(row[website_col]) else f"Firm: {row[name_col]}",
            axis=1
        )
    else:
        df['_enrichment_input'] = df[name_col].apply(lambda x: f"Firm: {x}")
    return df


def enrich_firms(df, fields_to_enrich=None, model=MODEL):
    """
    Enrich firm data with specified fields.

    Args:
        df: DataFrame with firms
        fields_to_enrich: List of field names to enrich (default: all)
        model: OpenAI model to use

    Returns:
        Enriched DataFrame
    """
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not set")
        print("Set it with: export OPENAI_API_KEY='sk-...'")
        sys.exit(1)

    if fields_to_enrich is None:
        fields_to_enrich = list(ENRICHMENT_FIELDS.keys())

    print(f"\nEnriching {len(df)} firms with {len(fields_to_enrich)} fields...")
    print(f"Model: {model}")
    print(f"Estimated cost: ${len(df) * len(fields_to_enrich) * 0.002:.2f} - ${len(df) * len(fields_to_enrich) * 0.01:.2f}")
    print()

    for field_name in fields_to_enrich:
        if field_name not in ENRICHMENT_FIELDS:
            print(f"Warning: Unknown field '{field_name}', skipping")
            continue

        field_config = ENRICHMENT_FIELDS[field_name]
        print(f"  Enriching: {field_config['description']}...")

        df = enrich(
            df,
            input_col='_enrichment_input',
            output_col=field_name,
            prompt=field_config['prompt'],
            model=model
        )

    # Clean up temp column
    df = df.drop(columns=['_enrichment_input'])

    return df


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Enrich VC firm data with AI')
    parser.add_argument('input_file', nargs='?', help='Input CSV or Excel file with firms')
    parser.add_argument('-o', '--output', help='Output file (default: enriched_<input>)')
    parser.add_argument('-f', '--fields', nargs='+',
                        choices=list(ENRICHMENT_FIELDS.keys()),
                        help='Specific fields to enrich (default: all)')
    parser.add_argument('-m', '--model', default=MODEL,
                        help=f'OpenAI model (default: {MODEL})')
    parser.add_argument('--list-fields', action='store_true',
                        help='List available enrichment fields')

    args = parser.parse_args()

    if args.list_fields:
        print("\nAvailable enrichment fields:")
        print("-" * 50)
        for name, config in ENRICHMENT_FIELDS.items():
            print(f"  {name}: {config['description']}")
        print()
        return

    if not args.input_file:
        parser.error("input_file is required (use --list-fields to see available fields)")

    # Load data
    print(f"Loading: {args.input_file}")
    df, name_col, website_col = load_firms(args.input_file)
    print(f"Found {len(df)} firms (name column: '{name_col}')")

    # Create input column
    df = create_input_column(df, name_col, website_col)

    # Enrich
    df = enrich_firms(df, fields_to_enrich=args.fields, model=args.model)

    # Save output
    output_file = args.output or f"enriched_{os.path.basename(args.input_file)}"
    if output_file.endswith('.xlsx'):
        df.to_excel(output_file, index=False)
    else:
        df.to_csv(output_file, index=False)

    print(f"\nSaved enriched data to: {output_file}")
    print(f"Added columns: {args.fields or list(ENRICHMENT_FIELDS.keys())}")


if __name__ == '__main__':
    main()
