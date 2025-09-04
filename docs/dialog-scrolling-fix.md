# Dialog Scrolling Fix

## Problem Description

When importing Excel files with a large number of column mappings, the import dialog would become too tall for the screen, making it impossible to access the action buttons at the bottom of the dialog. This was particularly problematic when users had many custom fields that needed to be mapped.

## Root Cause

The dialog content was not scrollable, so when the content exceeded the viewport height, the footer buttons would be pushed off-screen and become inaccessible.

## Solution

We implemented a better scrolling solution that:

1. **Keeps action buttons visible** by moving them to a fixed footer outside the scrollable area
2. **Makes only the column mapping section scrollable** when it exceeds a reasonable height
3. **Maintains a clean visual hierarchy** with proper separation between sections

## Changes Made

### 1. Restructured Dialog Layout

We reorganized the dialog to have a clear structure:
- Fixed header (DialogHeader)
- Scrollable main content area
- Fixed footer with action buttons

### 2. Column Mapping Section Scrolling

We made only the column mapping section scrollable when it gets too tall:

```jsx
<div className="space-y-3 border rounded-md p-4 max-h-[400px] overflow-y-auto">
  {/* Column mapping content */}
</div>
```

### 3. Fixed Footer for Action Buttons

We moved the import and close buttons to a fixed footer outside the scrollable area:

```jsx
<div className="border-t p-4">
  <div className="flex flex-col gap-3">
    <Button
      onClick={handleImport}
      disabled={isImporting || selectedFiles.length === 0}
      className="w-full"
    >
      {/* Import button content */}
    </Button>
    <Button type="button" variant="outline" onClick={handleClose} className="w-full">
      {t('common.close', 'Close')}
    </Button>
  </div>
</div>
```

### 4. CSS Classes Explanation

- `max-h-[400px]`: Limits the column mapping section height to 400px
- `overflow-y-auto`: Enables vertical scrolling only when content exceeds 400px
- `border-t`: Adds a top border to visually separate the footer
- `fixed footer structure`: Keeps buttons visible regardless of content height

## Benefits

1. **Guaranteed Button Visibility**: Import and close buttons are always accessible
2. **Focused Scrolling**: Only the column mapping section scrolls when needed
3. **Better User Experience**: Users can access controls without scrolling to the bottom
4. **Clean Visual Design**: Clear separation between sections with proper borders
5. **Responsive Behavior**: Works well on different screen sizes

## Testing

We verified the solution by:

1. **Simulating large datasets**: Created test data with 100+ column mappings
2. **Checking layout structure**: Verified the fixed footer approach
3. **Confirming scroll behavior**: Ensured only the column mapping section scrolls

## Verification

To verify the fix works correctly:

1. Open the Excel import dialog
2. Select a file with many columns or manually add many column mappings
3. Confirm that when the column mapping section exceeds 400px, a scrollbar appears
4. Verify that you can scroll within the column mapping section
5. Confirm that the import and close buttons remain visible and accessible at all times

The improved scrolling functionality ensures that users can work with large datasets in the Excel import dialog without ever losing access to important controls.