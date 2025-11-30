#!/usr/bin/env node
/**
 * Test JavaScript LZP decompression from the actual PAC file
 */

const fs = require('fs');

// Read the PAC file
const pacContent = fs.readFileSync('pac/pac.pac', 'utf8');

// Extract and execute the necessary functions
eval(pacContent.match(/function patternreplace[\s\S]*?^}/m)[0]);
eval(pacContent.match(/function a2b[\s\S]*?^}/m)[0]);
eval(pacContent.match(/var TABLE_LEN_BITS[\s\S]*?function unlzp[\s\S]*?^}/m)[0]);

// Extract the data
const domainsMatch = pacContent.match(/domains\s*=\s*\{([\s\S]*?)\};/);
const domains = eval('({' + domainsMatch[1] + '})');

const domainsLzpMatch = pacContent.match(/var\s+domains_lzp\s*=\s*"([^"]+)";/);
let domains_lzp = domainsLzpMatch[1];

const maskLzpMatch = pacContent.match(/var\s+mask_lzp\s*=\s*"([^"]+)";/);
let mask_lzp = maskLzpMatch[1];

// Decode the mask (same as in PAC file)
mask_lzp = a2b(patternreplace(mask_lzp, true));

console.log('Decompressing domains...');

let leftover = '';
let zoneCount = 0;
let zonesWithNulls = [];

for (let dmn in domains) {
    zoneCount++;

    for (let dcnt in domains[dmn]) {
        const dmnl = domains[dmn][dcnt];

        if (leftover.length < dmnl) {
            const reqd = (dmnl <= 8192 ? 8192 : dmnl);
            const u = unlzp(domains_lzp, mask_lzp, reqd);
            domains_lzp = domains_lzp.slice(u[1]);
            mask_lzp = mask_lzp.slice(u[2]);
            leftover += u[0];
        }

        const domainData = leftover.slice(0, dmnl);
        leftover = leftover.slice(dmnl);

        domains[dmn][dcnt] = domainData;

        // Check for null characters
        if (domainData.indexOf('\x00') !== -1) {
            const nullCount = (domainData.match(/\x00/g) || []).length;
            zonesWithNulls.push({ zone: dmn, length: dcnt, nulls: nullCount, total: domainData.length });

            if (zonesWithNulls.length <= 5) {
                console.log(`\nZone .${dmn}, length ${dcnt}: ${nullCount} nulls in ${domainData.length} chars`);
                const nullPos = domainData.indexOf('\x00');
                const start = Math.max(0, nullPos - 20);
                const end = Math.min(domainData.length, nullPos + 20);
                const context = domainData.substring(start, end);
                console.log(`  Context: ${JSON.stringify(context)}`);
            }
        }
    }

    // Check .tv zone specifically
    if (dmn === 'tv') {
        console.log(`\n.tv zone processed (zone #${zoneCount})`);
        console.log(`Length 5 data: ${JSON.stringify(domains['tv']['5'].substring(0, 50))}`);
        break;  // Stop after .tv
    }

    if (zoneCount > 100) break;  // Safety limit
}

console.log(`\nTotal zones checked: ${zoneCount}`);
console.log(`Zones with nulls: ${zonesWithNulls.length}`);
