# Archive Feature - User Guide

## What Changed?

The **Delete Case** button has been replaced with an **Archive Case** feature. Instead of permanently deleting cases, you can now archive them to keep your active cases list clean while preserving all investigation data.

## Why Archive Instead of Delete?

### Benefits
- 🛡️ **Data Safety** - No risk of accidentally losing important evidence
- 📋 **Compliance** - Meets legal requirements for data retention
- 🔍 **Searchable** - Archived cases remain searchable
- ♻️ **Reversible** - Restore archived cases anytime
- 📊 **Better Organization** - Focus on active investigations

### What's Preserved
When you archive a case, **everything** is kept:
- ✅ All evidence files (screenshots, documents, recordings)
- ✅ Officer notes and observations
- ✅ Timeline events
- ✅ Extracted entities (phone numbers, UPI IDs, etc.)
- ✅ Fraud analysis and risk scores
- ✅ CrimeGPT chat history
- ✅ Investigation reports
- ✅ Cross-case links and relationships
- ✅ OCR results from documents

**Nothing is deleted** - the case is simply moved to the archived section.

## How to Archive a Case

### Step 1: Navigate to Cases Page
1. Click **Cases** in the main navigation
2. You'll see the list of active cases

### Step 2: Find the Case
Use the search and filters to locate the case you want to archive.

### Step 3: Click Archive
1. Find the case in the table
2. In the **Actions** column, click the **Archive icon** (📦)
3. A confirmation dialog will appear

### Step 4: Confirm Archiving
The dialog shows:
```
Archive this case?

This case will no longer appear in active investigations. 
All evidence, notes, reports, timeline, entities, and AI 
analysis will be preserved. You can restore it anytime 
from the archived cases view.

[Cancel]  [Archive Case]
```

Click **Archive Case** to confirm.

### Step 5: Verification
- The case disappears from the active cases list
- A success message may appear (browser-dependent)
- The case count updates automatically

## How to View Archived Cases

### Method 1: Toggle Button
1. Go to **Cases** page
2. Click **Show Archived** button in the top-right corner
3. The page title changes to "Archived Cases"
4. All archived cases are displayed

### Method 2: URL Parameter
Visit: `http://your-domain/cases?archived=true`

### What You'll See
- Page title: "Archived Cases"
- All archived cases in table format
- Same columns as active cases
- Search and filters work normally

## How to Unarchive (Restore) a Case

### Step 1: View Archived Cases
Click **Show Archived** button on Cases page

### Step 2: Find the Case
Search or browse for the case you want to restore

### Step 3: Click Unarchive
In the Actions column, click the **Unarchive icon** (📂↑)

### Step 4: Automatic Restoration
- No confirmation needed for unarchiving
- Case immediately moves back to active list
- Click **Show Active** to see it in the active cases view

## Searching for Archived Cases

### How It Works
Archived cases are **fully searchable** just like active cases.

### Search Options
1. **Case Number**: `CC-2026-000001`
2. **Case Title**: Type any part of the title
3. **Victim Name**: Search by victim name
4. **Filters**: Use fraud type, status, priority filters

### Example Searches
```
Search: "CC-2026-000001"  → Finds specific archived case
Search: "investment"      → Finds all investment scam cases
Search: "John Doe"        → Finds cases with victim John Doe
```

## Common Scenarios

### Scenario 1: Closed Investigation
**Situation**: Case is resolved and closed

**Action**:
1. Update case status to "Closed"
2. Add final officer note with outcome
3. Generate final investigation report
4. Archive the case

**Result**: Case removed from active list, all data preserved for future reference

### Scenario 2: False Report
**Situation**: Complaint determined to be false or fraudulent

**Action**:
1. Update case status appropriately
2. Add officer note explaining why
3. Archive the case

**Result**: Case hidden from active investigations but evidence preserved for legal purposes

### Scenario 3: Duplicate Case
**Situation**: Case accidentally created twice

**Action**:
1. Merge relevant information into correct case
2. Add note to duplicate explaining it's a duplicate
3. Archive the duplicate case

**Result**: Active list stays clean, duplicate accessible if needed

### Scenario 4: Old Case - New Evidence
**Situation**: New evidence emerges for an archived case

**Action**:
1. View archived cases
2. Find the case
3. Click Unarchive
4. Add new evidence and continue investigation

**Result**: Case back in active list, all old data intact

### Scenario 5: Audit or Review
**Situation**: Need to review old cases for training or audit

**Action**:
1. Click "Show Archived"
2. Search for cases from specific time period
3. Review case details, evidence, reports

**Result**: All historical cases accessible without cluttering active list

## Best Practices

### When to Archive
✅ **Do Archive:**
- Closed/resolved cases
- Cases with no activity for 6+ months
- False complaints after verification
- Duplicate cases
- Cases transferred to other jurisdictions
- Test cases (after testing complete)

❌ **Don't Archive:**
- Cases under active investigation
- Cases pending evidence review
- Cases waiting for court dates
- Recent cases (less than 30 days old)

### Before Archiving
1. ✅ Ensure all evidence is uploaded
2. ✅ Add final officer notes
3. ✅ Generate investigation report
4. ✅ Update case status to "Closed" or appropriate status
5. ✅ Verify no pending actions
6. ✅ Check for cross-case links

### Documentation
When archiving, add a final note explaining:
- Why the case is being archived
- Final outcome or status
- Any important references
- Date archived

**Example Note:**
```
Note Type: Case Closure
Officer: Inspector Rajesh Kumar
Date: 2026-06-29

Case closed and archived. 
Outcome: Victim recovered funds through bank freezing action.
Suspect arrested and charged under IT Act Section 66D.
All evidence preserved for court proceedings.
```

## Frequently Asked Questions

### Q: Can I permanently delete a case?
**A:** No. The delete function has been replaced with archive. This is intentional to prevent data loss and maintain compliance with legal requirements.

### Q: Who can archive cases?
**A:** Any authenticated user with access to the Cases page. (Note: Permissions may be customized by your administrator)

### Q: Can I archive multiple cases at once?
**A:** Not currently. You need to archive cases one at a time. This prevents accidental bulk archiving.

### Q: What happens to linked cases when I archive?
**A:** Cross-case links are preserved. Related cases will still show the connection even if one case is archived.

### Q: Can I edit archived cases?
**A:** Yes. Archived cases can still be viewed and edited. Navigate to the case detail page normally.

### Q: Do archived cases appear in statistics?
**A:** No. Dashboard statistics and reports only include active cases. This gives accurate counts for current investigations.

### Q: How do I know if a case is archived?
**A:** In the API response or database, archived cases have `archived: 1`. In the UI, they only appear when you click "Show Archived".

### Q: Can I search for both active and archived cases at once?
**A:** No. You view either active OR archived cases. Toggle between views using the button.

### Q: What if I accidentally archive a case?
**A:** Simply click "Show Archived", find the case, and click Unarchive. It's immediately restored.

### Q: Is there a limit to how many cases I can archive?
**A:** No limit. Archive as many cases as needed. Database handles millions of records.

### Q: Will archived cases be deleted after some time?
**A:** No. Archived cases remain in the database indefinitely unless manually purged by an administrator (which requires special access).

## Keyboard Shortcuts

Currently, there are no keyboard shortcuts for archiving. Use the UI buttons.

**Future Enhancement**: Consider requesting keyboard shortcuts from your administrator:
- `Ctrl+Shift+A` - Archive selected case
- `Ctrl+Shift+U` - Unarchive selected case

## Mobile Usage

The archive feature works on mobile devices:
- Archive icon appears in actions column
- Confirmation dialog is mobile-friendly
- Toggle button accessible on mobile
- All functionality preserved

## Troubleshooting

### Problem: Can't find "Archive" button
**Solution**: 
- Ensure you're on the Cases page
- Look in the Actions column (rightmost column)
- Icon looks like 📦

### Problem: Archive button doesn't work
**Solution**:
1. Check internet connection
2. Refresh the page
3. Check browser console for errors
4. Contact system administrator

### Problem: Case still appears after archiving
**Solution**:
- Refresh the page (F5)
- Clear browser cache
- Verify case was actually archived (check "Show Archived")

### Problem: Can't unarchive a case
**Solution**:
- Ensure you're in archived cases view
- Look for unarchive icon (📂↑)
- Check permissions with administrator

### Problem: Confirmation dialog won't close
**Solution**:
- Click outside the dialog
- Press Escape key
- Refresh page if stuck

## Integration with Other Features

### CrimeGPT
- Archived cases can still be selected in CrimeGPT
- Chat history preserved
- AI analysis remains accessible

### Reports
- Archived cases included in report generation
- Historical reports remain accessible
- Can generate new reports for archived cases

### Evidence
- All evidence files remain downloadable
- OCR results preserved
- File paths unchanged

### Timeline
- All timeline events preserved
- Can add events to archived cases
- Historical timeline intact

## Tips & Tricks

### Tip 1: Batch Processing
Archive multiple closed cases in one session:
1. Filter by Status = "Closed"
2. Archive each case
3. Repeat until list is clean

### Tip 2: Quarterly Archives
Establish a routine:
- Archive closed cases every quarter
- Keeps active list manageable
- Regular data hygiene

### Tip 3: Use Status First
Before archiving:
1. Change status to "Closed"
2. Then archive
3. Makes filtering easier

### Tip 4: Note Before Archive
Always add a final note before archiving. Future reference will thank you.

### Tip 5: Export Before Archive
For important cases:
1. Generate investigation report
2. Download as PDF/HTML
3. Then archive

## Summary

**Archive** replaces **Delete** for safety and compliance:
- ✅ No data loss
- ✅ Reversible
- ✅ Searchable
- ✅ Keeps active list clean
- ✅ Preserves evidence

**Remember**: Archiving is not deleting. It's organizing. All your data is safe and accessible whenever you need it.

For support or questions, contact your system administrator or refer to the technical documentation.
