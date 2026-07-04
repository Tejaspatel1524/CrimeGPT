# SentinelAI Case Number User Guide

## What Changed?

SentinelAI now uses **human-readable Case Numbers** instead of UUID strings throughout the application. This makes it easier to reference, search, and communicate about cases.

## Case Number Format

Every case now has a unique Case Number in the format:

```
CC-2026-000001
```

Breaking down the format:
- **CC**: Prefix for "Cyber Crime"
- **2026**: Year the case was created
- **000001**: Sequential 6-digit number (unique within the year)

## Where You'll See Case Numbers

### 1. Cases List Page
- The first column now shows **Case Number** instead of UUID
- Example: `CC-2026-000001` instead of `6861565e...`
- Click on the case number to open case details

### 2. Case Detail Page
- **Header**: Shows case number prominently at the top
- **Timeline**: References case number in events
- **Cross-Case Intelligence**: Displays case numbers for related cases
- **Graph View**: Node labels use case numbers

### 3. CrimeGPT Chat
- **Case Selector**: Dropdown shows case numbers
- **Active Case**: Header displays the selected case number
- **Chat Context**: AI responses reference the case number

### 4. Reports
- **Report Cards**: Display associated case number
- **Generate Dialog**: Shows case numbers when selecting cases
- **Downloaded Reports**: Filenames include case numbers
- **Report Content**: Uses case numbers instead of UUIDs

### 5. Dashboard
- **Recent Activities**: Shows case numbers for new registrations
- **Priority Cases**: Lists cases with their case numbers

## How to Use Case Numbers

### Searching for Cases

You can now search using:
1. **Full Case Number**: `CC-2026-000001`
2. **Partial Case Number**: `2026-000001`
3. **Year Only**: `2026` (finds all cases from 2026)
4. **UUID** (still works): `6861565e-fe88-41f9-9d65-87925c1fe4b3`

Example searches:
```
Search: "CC-2026-000001"  ✅ Finds exact case
Search: "2026-000001"     ✅ Finds the same case
Search: "CC-2026"         ✅ Finds all 2026 cases
```

### Referencing Cases

**In Reports:**
- Old: "Refer to case 6861565e-fe88-41f9-9d65-87925c1fe4b3"
- New: "Refer to case CC-2026-000001"

**In Communication:**
- Old: "Check UUID 6861565e..."
- New: "Check case CC-2026-000001"

**In Documentation:**
- Old: Case ID: 6861565e-fe88-41f9-9d65-87925c1fe4b3
- New: Case Number: CC-2026-000001

## API Usage

If you're using the API directly:

### Getting a Case
Both methods work:

```bash
# Using UUID (still works)
GET /cases/6861565e-fe88-41f9-9d65-87925c1fe4b3

# Using Case Number (new)
GET /cases/CC-2026-000001
```

### Response Format
All API responses now include both identifiers:

```json
{
  "case_id": "6861565e-fe88-41f9-9d65-87925c1fe4b3",
  "case_number": "CC-2026-000001",
  "title": "Investment Scam",
  ...
}
```

## Benefits

### 1. Easier Communication
- **Before**: "Check case six-eight-six-one-five-six-five-e..."
- **After**: "Check case CC-2026-000001"

### 2. Better Organization
- Cases are grouped by year
- Sequential numbering makes tracking easier
- Professional case reference system

### 3. Quick Identification
- Glance at the case number to know the year
- Sequential numbers show case volume
- Easy to spot patterns across cases

### 4. Improved Searchability
- Type fewer characters to find cases
- Year-based filtering is intuitive
- No more copying long UUIDs

## FAQs

### Q: What happened to UUIDs?
**A:** UUIDs are still used internally for database operations and API routing. They're just not displayed in the user interface anymore.

### Q: Can I still use UUIDs in the API?
**A:** Yes! All API endpoints accept both UUIDs and Case Numbers.

### Q: What if two cases have the same number?
**A:** Case Numbers are unique. The system ensures no duplicates can exist.

### Q: How are case numbers assigned to old cases?
**A:** All existing cases were automatically assigned sequential case numbers based on their creation date.

### Q: Can I customize the case number format?
**A:** The format is standardized as `CC-YYYY-NNNNNN`. Contact your system administrator if you need custom formatting.

### Q: What happens in the year 2027?
**A:** The sequence resets to 000001. Cases will be numbered `CC-2027-000001`, `CC-2027-000002`, etc.

### Q: Can I search by partial case number?
**A:** Yes! You can search by any part of the case number: year, prefix, or sequence number.

## Examples

### Example 1: Finding a Specific Case
**Scenario**: You need to review case CC-2026-000003

1. Go to Cases page
2. Type "CC-2026-000003" in search box
3. Click on the case to open details

### Example 2: Finding All Cases from 2026
**Scenario**: You want to see all cases filed this year

1. Go to Cases page
2. Type "2026" in search box
3. All 2026 cases will appear

### Example 3: Generating a Report
**Scenario**: You need to generate a report for case CC-2026-000001

1. Go to Reports page
2. Click "Generate Report"
3. Select "CC-2026-000001" from the dropdown
4. Click "Generate"
5. Report filename will be: `Report_CC-2026-000001_xxxxx.html`

### Example 4: Using CrimeGPT
**Scenario**: You want to chat about case CC-2026-000002

1. Go to CrimeGPT page
2. Click case selector dropdown
3. Select "CC-2026-000002"
4. Ask questions about the case
5. AI responses will reference "CC-2026-000002"

## Best Practices

### Do's ✅
- Use case numbers in all communications
- Include case number in reports and documentation
- Reference case numbers in officer notes
- Use case numbers when discussing cases with colleagues

### Don'ts ❌
- Don't share UUIDs in external communications
- Don't copy case numbers manually (use search instead)
- Don't assume case numbers from different years are related
- Don't modify case numbers in the database

## Support

If you encounter any issues with case numbers:
1. Check that you're using the correct format
2. Verify the case exists (try searching by UUID)
3. Contact your system administrator
4. Report bugs through the issue tracking system

## Summary

Case Numbers make SentinelAI more user-friendly and professional. You can now:
- ✅ Quickly reference cases
- ✅ Easily search and filter
- ✅ Communicate clearly about cases
- ✅ Track cases by year
- ✅ Generate professional reports

**Remember**: Case Numbers are for display and communication. The system still uses UUIDs internally for data integrity.
