# Cases Management Table - User Guide

## What's New?

The Cases Management table has been upgraded with powerful new features to help you work faster and more efficiently.

## 1. Click Anywhere to Open Cases

### How It Works
**Before**: You had to click a small "View" button to open a case.

**Now**: Click anywhere on a case row to open it instantly!

### Visual Feedback
- **Hover over a row** - Background changes to light cyan
- **Cursor changes** - Shows a hand pointer when you hover
- **Actions appear** - View, Edit, and Archive buttons fade in on hover

### Pro Tip
The entire row is clickable except for the Actions column. This means you can click on the case number, title, victim name, or any other field to open the case.

## 2. Sort Your Cases

### Sortable Columns
You can now sort cases by clicking these column headers:

1. **Case Number** - Sorts alphanumerically (CC-2026-000001, CC-2026-000002...)
2. **Updated** - Sorts by last update date (newest first or oldest first)
3. **Amount** - Sorts by amount lost (highest to lowest or vice versa)
4. **Priority** - Sorts by priority level (Critical, High, Medium, Low)
5. **Status** - Sorts alphabetically by status

### How to Sort
1. Click a column header to sort
2. Click again to reverse the sort order
3. Look for the arrow icon:
   - ↕ No sort applied to this column
   - ↑ Sorted ascending (A-Z, 0-9, oldest-newest)
   - ↓ Sorted descending (Z-A, 9-0, newest-oldest)

### Examples

**Find cases by priority:**
1. Click "Priority" header
2. Critical cases appear at top
3. Click again to see Low priority first

**Find highest-value fraud:**
1. Click "Amount" header  
2. Cases with largest losses appear first
3. Quickly identify high-impact cases

**See recent activity:**
1. Click "Updated" header
2. Most recently modified cases at top
3. Stay on top of active investigations

## 3. Enhanced Search

### What You Can Search
The search now looks through **8 different fields**:

1. **Case Number** - CC-2026-000001
2. **Victim Name** - Full name or partial
3. **Fraud Type** - Investment Scam, UPI Fraud, etc.
4. **Officer Name** - Inspector Rajesh Kumar
5. **Phone Number** - 9876543210
6. **Email Address** - victim@example.com
7. **UPI ID** - Found in case details (victim@upi)
8. **Telegram Handle** - Found in case details (@username)

### How to Search
1. Type in the search box at the top
2. Results update as you type
3. Search is case-insensitive ("john" finds "John", "JOHN", "john")
4. Partial matches work ("invest" finds "Investment Scam")

### Search Examples

**Find by phone number:**
```
Type: 9876543210
Finds: All cases with this phone number (victim or mentioned in complaint)
```

**Find by UPI ID:**
```
Type: victim@paytm
Finds: Cases mentioning this UPI ID
```

**Find by victim name:**
```
Type: Sharma
Finds: All cases with victims named Sharma
```

**Find by fraud type:**
```
Type: investment
Finds: All Investment Scam cases
```

## 4. Highlighted Search Results

### Visual Matching
When you search, the matched text is **highlighted in yellow** in the table. This helps you quickly confirm you found the right case.

**Example:**
- Search: "Sharma"
- Result: Victim name shows "Rahul **Sharma**" (with yellow background)

### Where Highlighting Appears
- Case Number
- Case Title
- Victim Name
- Fraud Category
- Officer Name

## 5. Loading States

### Professional Loading
When the page is loading cases, you'll see:
- Animated skeleton rows (5 gray placeholder rows)
- Smooth pulsing animation
- Realistic table structure
- No more blank screen!

This gives you immediate feedback that cases are being loaded.

## 6. Empty States

### No Cases Found
If no cases match your search or filters, you'll see:

**Icon**: Empty folder icon
**Message**: "No investigations found"
**Explanation**: Context-specific help text
**Action**: "Create New Case" button (when appropriate)

### Context-Aware Messages

**When no cases exist:**
> "Get started by creating your first case"
> [Create New Case button appears]

**When search finds nothing:**
> "Try adjusting your search query or filters"

**When archived is empty:**
> "No archived cases yet"

**When all filtered out:**
> "Try adjusting your search query or filters"

## Common Tasks

### Task 1: Find a Case by Victim Phone Number
1. Click in search box
2. Type the phone number (e.g., "9876543210")
3. See cases with matching phone highlighted
4. Click the row to open the case

### Task 2: Review High-Priority Cases
1. Click "Priority" column header
2. Critical and High priority cases appear at top
3. Click any row to investigate
4. Actions appear on hover if needed

### Task 3: Find Your Own Cases
1. Type your name in search (e.g., "Rajesh Kumar")
2. Cases assigned to you appear
3. Officer name is highlighted in results
4. Click row to open

### Task 4: Sort by Amount to Find Big Cases
1. Click "Amount" column header once
2. Highest fraud amounts appear first
3. Scan the list
4. Click any row to investigate

### Task 5: Check Recent Updates
1. Click "Updated" column header
2. Most recently updated cases at top
3. This is the default sort
4. Click again to see oldest updates

## Tips & Tricks

### Tip 1: Combine Search and Sort
1. Search for "UPI Fraud"
2. Click "Amount" to sort by value
3. Now see UPI fraud cases sorted by amount
4. Very powerful for focused investigations

### Tip 2: Quick Navigation
- Don't bother aiming for the "View" button
- Just click anywhere on the row
- Much faster!

### Tip 3: Use Partial Searches
- Type "invest" instead of "Investment Scam"
- Type "Sharma" instead of full name
- Saves time and still finds everything

### Tip 4: Actions on Hover
- Hover over a row to see actions
- Edit, Archive buttons appear
- No clutter when you don't need them

### Tip 5: Reset Sort
- Click the sorted column header again
- Toggles between ascending/descending
- Click a different column to sort by that instead

## Keyboard Shortcuts

While there are no custom keyboard shortcuts, standard navigation works:

- **Tab** - Move between search box and table
- **Enter** - Activate links/buttons
- **Arrows** - Scroll the page
- **Ctrl+F** - Browser's find (searches page source)

## Frequently Asked Questions

### Q: Why doesn't clicking Actions open the case?
**A**: The Actions column is designed to NOT trigger navigation. This lets you edit or archive without opening the case first.

### Q: Can I sort by multiple columns?
**A**: Not yet. You can sort by one column at a time. Click a different header to change the sort.

### Q: Does the sort persist after I leave the page?
**A**: No. The default sort (Updated Date, newest first) is applied each time you visit the page.

### Q: Why isn't my search finding anything?
**A**: 
- Check spelling
- Try partial matches ("Sharma" instead of "Rahul Sharma")
- Ensure the case actually contains that information
- Clear any active filters (Fraud Type, Status, Priority)

### Q: Can I search archived cases?
**A**: Yes! Click "Show Archived" then use search normally. Search works the same way.

### Q: How do I clear a search?
**A**: Delete the text in the search box or click the X (if your browser shows one). Results appear immediately.

### Q: What's the fastest way to find a case?
**A**:
1. Type case number (e.g., CC-2026-000001)
2. Or type victim name
3. Click the highlighted result

### Q: Can I see more cases per page?
**A**: Currently shows 8 cases per page. Use the pagination at the bottom to see more.

## Before and After Comparison

### Navigation Speed
| Action | Before | After |
|--------|--------|-------|
| Open case | Find and click tiny button | Click anywhere on row |
| Time | 2-3 seconds | < 1 second |

### Search Capabilities
| Feature | Before | After |
|---------|--------|-------|
| Searchable fields | 4 | 8 |
| Visual confirmation | None | Yellow highlight |
| Finds phone numbers | No | Yes |
| Finds UPI IDs | No | Yes |

### Organization
| Feature | Before | After |
|---------|--------|-------|
| Sort options | None | 5 columns |
| Sort indicators | N/A | Visual arrows |
| Priority review | Scroll through all | Sort and focus |

## Summary

The upgraded table helps you:
- ✅ **Work faster** - Click anywhere to open cases
- ✅ **Find easier** - Search 8 fields with highlighting
- ✅ **Organize better** - Sort by priority, amount, date
- ✅ **See clearly** - Loading skeletons and empty states
- ✅ **Focus better** - Actions appear only when needed

## Need Help?

If you encounter issues or have suggestions:
1. Check this guide first
2. Try refreshing the page
3. Clear browser cache if problems persist
4. Contact your system administrator

---

**Pro Tip**: Bookmark this page and reference it when you need to remind yourself of all the powerful features available!
