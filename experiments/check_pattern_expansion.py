#!/usr/bin/env python3
"""
Check if pattern expansion is working correctly
"""

import sys
sys.path.insert(0, 'pac')

from pac_decompiler_fixed import FixedLZPDecompressor

# Test cases from the issue
test_cases = [
    ('sV', 'sex'),      # s + V->ex
    ('mI', 'mon'),      # m + I->on
    ('@gw', 'kagw'),    # @->ka + g + w
    ('!A', 'porn'),     # !A->porn
    ('Nhc', 'ashc'),    # N->as + h + c
    ('!gwkr', 'pornkino'),  # Wait, this might be wrong
]

decompressor = FixedLZPDecompressor()

print("Testing pattern expansion:")
print("=" * 60)

for input_str, expected in test_cases:
    result = decompressor.patternexpand(input_str)
    status = "✓" if result == expected else "✗"
    print(f"{status} Input: '{input_str}' -> '{result}' (expected: '{expected}')")

print("\n" + "=" * 60)

# Load actual output and check first few domains
import json

with open('pac/pac_fixed_output.json', 'r') as f:
    data = json.load(f)

print("\nChecking actual .ac zone output:")
print("=" * 60)

ac_zone = data.get('domains', {}).get('ac', {})
for length_key in sorted(ac_zone.keys())[:3]:
    value = ac_zone[length_key]
    if isinstance(value, str) and len(value) <= 100:
        print(f"Length {length_key}: {value[:100]}")
        # Check for unexpanded patterns
        has_patterns = any(c in value for c in ['!', '@', '#', '$', '%', '^', '&', '*'])
        has_uppercase = any(c.isupper() for c in value)
        print(f"  Has patterns (!,@,etc): {has_patterns}")
        print(f"  Has uppercase: {has_uppercase}")
