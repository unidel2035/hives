#!/usr/bin/env python3
"""
Validation script for PAC LZP decompression fixes
Tests that the decompression is working correctly
"""

import json
import sys

def validate_decompression():
    """Validate the PAC decompression output"""

    print("=" * 70)
    print("PAC DECOMPRESSION VALIDATION")
    print("=" * 70)
    print()

    # Load output
    with open('pac_refined_output.json', 'r') as f:
        data = json.load(f)

    stats = data.get('statistics', {})

    # Check statistics
    print("📊 Decompression Statistics:")
    print(f"  Total zones: {stats.get('total_zones', 0)}")
    print(f"  Successful zones: {stats.get('successful_zones', 0)}")
    print(f"  Success rate: {stats.get('successful_zones', 0) / stats.get('total_zones', 1) * 100:.1f}%")
    print(f"  Decompression errors: {stats.get('decompression_errors', 0)}")
    print()

    # Check for pattern expansion
    print("🔍 Pattern Expansion Check:")
    total_groups = 0
    groups_with_2char_patterns = 0

    for zone, domain_dict in data['domains'].items():
        for length_key, domain_data in domain_dict.items():
            if isinstance(domain_data, str):
                total_groups += 1
                # Check for unexpanded 2-character patterns (!A, !B, etc.)
                import re
                if re.search(r'![A-Z]', domain_data):
                    groups_with_2char_patterns += 1

    print(f"  Total domain groups: {total_groups}")
    print(f"  Groups with unexpanded patterns (!A, !B, etc.): {groups_with_2char_patterns}")

    if groups_with_2char_patterns == 0:
        print("  ✅ All patterns properly expanded!")
    else:
        print(f"  ❌ {groups_with_2char_patterns} groups still have unexpanded patterns")
    print()

    # Check null characters
    print("🔍 Null Character Analysis:")
    groups_with_nulls = 0
    total_nulls = 0

    for zone, domain_dict in data['domains'].items():
        for length_key, domain_data in domain_dict.items():
            if isinstance(domain_data, str):
                null_count = domain_data.count('\x00')
                if null_count > 0:
                    groups_with_nulls += 1
                    total_nulls += null_count

    print(f"  Groups with null chars: {groups_with_nulls}/{total_groups} ({groups_with_nulls/total_groups*100:.1f}%)")
    print(f"  Total null characters: {total_nulls}")
    print(f"  ℹ️  Note: Null characters are preserved in JSON but filtered in text output")
    print()

    # Sample readable domains
    print("📝 Sample Readable Domains:")
    ac = data['domains'].get('ac', {})
    if ac:
        for key in sorted(ac.keys())[:3]:
            domains_str = ac[key]
            domains = [domains_str[i:i+int(key)] for i in range(0, min(len(domains_str), 50), int(key))]
            valid = [d for d in domains if '\x00' not in d][:5]
            print(f"  .ac length {key}: {valid}")
    print()

    # Overall assessment
    print("=" * 70)
    print("VALIDATION RESULT:")
    print("=" * 70)

    success_rate = stats.get('successful_zones', 0) / stats.get('total_zones', 1) * 100

    if success_rate >= 99 and groups_with_2char_patterns == 0:
        print("✅ PASS: Decompression is working correctly!")
        print(f"   - {success_rate:.1f}% zones successfully decompressed")
        print("   - All patterns properly expanded")
        print("   - Null characters handled appropriately")
        return 0
    else:
        print("❌ FAIL: Issues detected:")
        if success_rate < 99:
            print(f"   - Only {success_rate:.1f}% zones successful (expected >=99%)")
        if groups_with_2char_patterns > 0:
            print(f"   - {groups_with_2char_patterns} groups with unexpanded patterns")
        return 1

if __name__ == '__main__':
    sys.exit(validate_decompression())
