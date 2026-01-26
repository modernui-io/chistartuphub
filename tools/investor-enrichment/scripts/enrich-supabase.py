#!/usr/bin/env python3
"""
Direct Supabase VC Firm Enrichment Script
Fetches firms missing descriptions, enriches with DeepSeek AI, updates Supabase directly.
"""

import os
import sys
import json
import time
from openai import OpenAI
from supabase import create_client, Client

# ============================================================
# CONFIGURATION
# ============================================================

SUPABASE_URL = "https://fbgxeinarhbrqatrsuoj.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

# DeepSeek API (OpenAI-compatible)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# Model configuration
MODEL = "deepseek-chat"  # DeepSeek's main model - very cheap
BATCH_SIZE = 10  # Process in batches to avoid rate limits
DELAY_BETWEEN_BATCHES = 1  # seconds

# ============================================================
# ENRICHMENT PROMPT
# ============================================================

ENRICHMENT_PROMPT = """You are a VC research assistant. Given a venture capital firm's name and website, write a concise 1-2 sentence description of their investment focus and thesis.

Firm: {name}
Website: {website}
Sectors: {sectors}
Stages: {stages}

Write a professional description that would appear on a VC database. Be factual and concise. If you don't have enough information, write a generic but professional description based on their name and any available data.

Description:"""


def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    if not SUPABASE_KEY:
        print("Error: SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY not set")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_ai_client() -> OpenAI:
    """Initialize DeepSeek client (OpenAI-compatible)."""
    if not DEEPSEEK_API_KEY:
        print("Error: DEEPSEEK_API_KEY not set")
        print("Get your API key at: https://platform.deepseek.com/")
        sys.exit(1)
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def fetch_firms_missing_descriptions(supabase: Client, table: str, limit: int = 100):
    """Fetch firms that need enrichment."""
    # Different schemas for different tables
    if table == 'investors':
        fields = "id, canonical_name, website, sectors, stage_focus"
    else:
        fields = "id, name, website, sectors, stage"

    response = supabase.table(table).select(fields).or_(
        "description.is.null,description.eq."
    ).limit(limit).execute()

    # Normalize field names
    data = response.data
    if table == 'investors':
        for firm in data:
            firm['name'] = firm.pop('canonical_name', None)
            firm['stage'] = firm.pop('stage_focus', None)

    return data


def enrich_firm(openai_client: OpenAI, firm: dict) -> str:
    """Generate description for a single firm."""
    prompt = ENRICHMENT_PROMPT.format(
        name=firm.get('name', 'Unknown'),
        website=firm.get('website', 'N/A'),
        sectors=', '.join(firm.get('sectors', [])) if firm.get('sectors') else 'General',
        stages=', '.join(firm.get('stage', [])) if firm.get('stage') else 'Various'
    )

    try:
        response = openai_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"  Error enriching {firm.get('name')}: {e}")
        return None


def update_firm_description(supabase: Client, table: str, firm_id: str, description: str):
    """Update firm description in database."""
    try:
        supabase.table(table).update(
            {"description": description}
        ).eq("id", firm_id).execute()
        return True
    except Exception as e:
        print(f"  Error updating {firm_id}: {e}")
        return False


def enrich_table(table: str, limit: int = 100):
    """Enrich all firms missing descriptions in a table."""
    print(f"\n{'='*60}")
    print(f"Enriching table: {table}")
    print(f"{'='*60}")

    supabase = get_supabase_client()
    ai_client = get_ai_client()

    # Fetch firms needing enrichment
    firms = fetch_firms_missing_descriptions(supabase, table, limit)
    total = len(firms)

    if total == 0:
        print("No firms need enrichment!")
        return

    print(f"Found {total} firms missing descriptions")
    print(f"Estimated cost: ${total * 0.001:.2f} - ${total * 0.005:.2f}")
    print()

    enriched = 0
    failed = 0

    for i, firm in enumerate(firms):
        name = firm.get('name', 'Unknown')
        print(f"[{i+1}/{total}] Enriching: {name}...", end=" ", flush=True)

        # Generate description
        description = enrich_firm(ai_client, firm)

        if description:
            # Update database
            if update_firm_description(supabase, table, firm['id'], description):
                print("✓")
                enriched += 1
            else:
                print("✗ (update failed)")
                failed += 1
        else:
            print("✗ (generation failed)")
            failed += 1

        # Rate limiting
        if (i + 1) % BATCH_SIZE == 0 and i + 1 < total:
            time.sleep(DELAY_BETWEEN_BATCHES)

    print(f"\nComplete! Enriched: {enriched}, Failed: {failed}")
    return enriched, failed


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Enrich VC firms with AI-generated descriptions')
    parser.add_argument('--table', choices=['funding_opportunities', 'investors', 'both'],
                        default='both', help='Table to enrich')
    parser.add_argument('--limit', type=int, default=100,
                        help='Max firms to enrich per table (default: 100)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show what would be enriched without making changes')

    args = parser.parse_args()

    if args.dry_run:
        supabase = get_supabase_client()
        for table in ['funding_opportunities', 'investors']:
            if args.table == 'both' or args.table == table:
                firms = fetch_firms_missing_descriptions(supabase, table, args.limit)
                print(f"\n{table}: {len(firms)} firms would be enriched")
                for firm in firms[:5]:
                    print(f"  - {firm.get('name')}")
                if len(firms) > 5:
                    print(f"  ... and {len(firms) - 5} more")
        return

    total_enriched = 0
    total_failed = 0

    if args.table in ['funding_opportunities', 'both']:
        e, f = enrich_table('funding_opportunities', args.limit)
        total_enriched += e
        total_failed += f

    if args.table in ['investors', 'both']:
        e, f = enrich_table('investors', args.limit)
        total_enriched += e
        total_failed += f

    print(f"\n{'='*60}")
    print(f"TOTAL: Enriched {total_enriched} firms, {total_failed} failed")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
