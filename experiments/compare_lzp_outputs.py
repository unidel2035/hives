#!/usr/bin/env python3
"""
Compare JavaScript and Python LZP decompression
Extract the first decompression from both and compare
"""

import sys
import re
sys.path.insert(0, 'pac')

# Read the PAC file
with open('pac/pac.pac', 'r') as f:
    pac_content = f.read()

# Extract domains structure
domains_match = re.search(r'domains\s*=\s*\{(.*?)\};', pac_content, re.DOTALL)
domains_str = '{' + domains_match.group(1) + '}'
domains = eval(domains_str)

# Get first zone and first length requirement
first_zone = list(domains.keys())[0]
first_length_key = list(domains[first_zone].keys())[0]
first_count = domains[first_zone][first_length_key]

print(f"First zone: {first_zone}")
print(f"First length key: {first_length_key}")
print(f"First count (chars needed): {first_count}")
print()

# Extract domains_lzp and mask_lzp
domains_lzp_match = re.search(r'var\s+domains_lzp\s*=\s*"([^"]+)";', pac_content)
domains_lzp = domains_lzp_match.group(1)

mask_lzp_match = re.search(r'var\s+mask_lzp\s*=\s*"([^"]+)";', pac_content)
mask_lzp_encoded = mask_lzp_match.group(1)

print(f"domains_lzp length: {len(domains_lzp)}")
print(f"mask_lzp_encoded length: {len(mask_lzp_encoded)}")
print()

# Decode mask using Python
from pac_decompiler_fixed import FixedLZPDecompressor
decompressor = FixedLZPDecompressor()
mask_lzp_decoded = decompressor.a2b(decompressor.patternreplace(mask_lzp_encoded, lzpmask=True))

print(f"mask_lzp decoded length: {len(mask_lzp_decoded)}")
print()

# Decompress using Python
request_size = max(8192, first_count)
decompressed, data_used, mask_used = decompressor.unlzp(
    domains_lzp, mask_lzp_decoded, request_size
)

print("Python decompression:")
print(f"  Requested: {request_size}")
print(f"  Got: {len(decompressed)}")
print(f"  Data used: {data_used}")
print(f"  Mask used: {mask_used}")
print(f"  First {first_count} chars: {repr(decompressed[:first_count])}")
print(f"  Has null chars: {chr(0) in decompressed[:first_count]}")
print()

# Expand patterns
expanded = decompressor.patternexpand(decompressed[:first_count])
print(f"After pattern expansion: {repr(expanded)}")
print(f"Has null chars after expansion: {chr(0) in expanded}")

# Check for common characters
import string
printable_count = sum(1 for c in expanded if c in string.printable)
print(f"Printable chars: {printable_count}/{len(expanded)} ({printable_count/len(expanded)*100:.1f}%)")
null_count = expanded.count(chr(0))
print(f"Null chars: {null_count}")
