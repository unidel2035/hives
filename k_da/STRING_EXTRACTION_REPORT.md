# K_DA String Extraction Report

Generated: 2025-11-27T11:36:16.730Z

## Summary

This report documents all strings, URLs, and content extracted from the k_da source code
to ensure complete deobfuscation and proper configuration externalization.

## Statistics

- **Unicode Escape Sequences Converted**: 17638
- **HTTP URLs Found**: 2
- **HTTPS URLs Found**: 13
- **HTML Blocks Found**: 0
- **SVG Blocks Found**: 0
- **Environment Variables Used**: 52

## File Changes

- **Input File**: /tmp/gh-issue-solver-1764243147281/k_da/src/04-app-code.js
- **Original Size**: 1224.82 KB
- **New Size**: 1138.70 KB
- **Size Change**: -86.12 KB

## Extracted URLs

### HTTP URLs (2)

1. `http://localhost:8877`
2. `http://localhost:8877;`

### HTTPS URLs (13)

1. `https://github.com/vadimdemedes/ink/#israwmodesupported`
2. `https://kodacode.ru`
3. `https://github.com/login/device/code`
4. `https://github.com/login/oauth/access_token`
5. `https://t.me/kodacommunity`
6. `https://docs.kodacode.ru/koda-cli/`
7. `https://cli-companion.kodacode.ru/`
8. `https://github.com/yargs/yargs-parser#supported-nodejs-versions`
9. `https://www.youtube.com/watch?v=xvFZjo5PgG0`
10. `https://cloud.google.com/terms/service-terms`
11. `https://cloud.google.com/terms/services`
12. `https://policies.google.com/privacy`
13. `https://api.kodacode.ru`

## URL Configuration Status

The following URLs should be configurable via environment variables:

| URL | Environment Variable | Status |
|-----|---------------------|--------|
| `https://kodacode.ru` | `KODA_SITE_URL` | ⚠️ Needs config |
| `https://github.com/login/device/code` | `GITHUB_DEVICE_CODE_URL` | ⚠️ Needs config |
| `https://github.com/login/oauth/access_token` | `GITHUB_OAUTH_TOKEN_URL` | ⚠️ Needs config |
| `https://docs.kodacode.ru/koda-cli/` | `KODA_DOCS_URL` | ⚠️ Needs config |
| `https://cli-companion.kodacode.ru/` | `KODA_IDE_COMPANION_URL` | ⚠️ Needs config |
| `https://api.kodacode.ru` | `KODA_API_BASE` | ✅ Configured |

## HTML/SVG Content

*(No HTML content found)*

*(No SVG content found)*

## Environment Variables

The following 52 environment variables are used in the code:

1. `BUILD_SANDBOX`
2. `CLOUD_SHELL`
3. `COLORTERM`
4. `DEBUG`
5. `DEBUG_PORT`
6. `EDITOR`
7. `GEMINI_CLI_IDE_SERVER_PORT`
8. `GEMINI_CLI_IDE_WORKSPACE_PATH`
9. `GEMINI_CLI_INTEGRATION_TEST`
10. `GEMINI_CLI_SYSTEM_SETTINGS_PATH`
11. `GEMINI_DEFAULT_AUTH_TYPE`
12. `GEMINI_MODEL`
13. `GEMINI_SANDBOX`
14. `GEMINI_SANDBOX_IMAGE`
15. `GEMINI_SANDBOX_PROXY_COMMAND`
16. `GITHUB_SCOPES`
17. `GITHUB_TOKEN`
18. `GOOGLE_API_KEY`
19. `GOOGLE_APPLICATION_CREDENTIALS`
20. `GOOGLE_CLOUD_LOCATION`
21. `GOOGLE_CLOUD_PROJECT`
22. `GOOGLE_GENAI_USE_GCA`
23. `GOOGLE_GENAI_USE_VERTEXAI`
24. `HTTPS_PROXY`
25. `HTTP_PROXY`
26. `KODA_API_BASE`
27. `KODA_API_KEY`
28. `KODA_CLI_IDE_SERVER_PORT`
29. `KODA_CLI_IDE_WORKSPACE_PATH`
30. `KODA_CLI_NO_RELAUNCH`
31. `KODA_GITHUB_EXCHANGE_URL`
32. `KODA_GITHUB_TOKEN`
33. `KODA_RESPONSE_LANGUAGE`
34. `LOGIN_WITH_GITHUB`
35. `NODE_ENV`
36. `NODE_OPTIONS`
37. `NO_PROXY`
38. `PASTE_WORKAROUND`
39. `PATH`
40. `PYTHONPATH`
41. `SANDBOX`
42. `SANDBOX_ENV`
43. `SANDBOX_FLAGS`
44. `SANDBOX_MOUNTS`
45. `SANDBOX_PORTS`
46. `SANDBOX_SET_UID_GID`
47. `SEATBELT_PROFILE`
48. `TERM`
49. `VIRTUAL_ENV`
50. `VISUAL`
51. `XDG_CONFIG_HOME`
52. `YARGS_MIN_NODE_VERSION`

## Recommendations

### 1. Unicode Conversion
✅ **Completed**: Converted 17638 Unicode escape sequences to readable characters.

### 2. URL Configuration
⚠️ **Review needed**: Found 13 hardcoded URLs. Ensure all service URLs are configurable via environment variables.

### 3. HTML/SVG Extraction
✅ **No action needed**: No embedded HTML/SVG content found.

### 4. Configuration Externalization
- Ensure all service URLs have fallback defaults
- Document all environment variables in .env.example
- Add validation for required environment variables
- Consider using a configuration module for better organization

## Next Steps

1. ✅ Unicode escape sequences converted to readable characters
2. ⏳ Verify all URLs are properly configurable
3. ⏳ Review environment variable usage
4. ⏳ Update .env.example with any missing variables
5. ⏳ Test the build with different configurations

## Verification

To verify the extraction was successful:

```bash
# Check for remaining Unicode escapes
grep -c "\\\\u[0-9a-fA-F]" k_da/src/04-app-code.js

# Check for hardcoded URLs
grep -n "https://" k_da/src/04-app-code.js | grep -v "process.env"

# Rebuild and test
cd k_da
node build.js
node k_da.js --help
```

---

*This report was generated automatically by the string extraction script.*
