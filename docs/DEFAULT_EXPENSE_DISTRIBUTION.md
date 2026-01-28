# Default Expense Distribution Implementation

## Overview
This feature automatically applies default expense distribution percentages to projects that don't have expense distribution configured.

## Default Percentages
The following default percentages are applied:
- **Profit Margin**: 40%
- **Drawing**: 30%
- **Documents**: 2%
- **Site Visit**: 10%
- **Marketing and Misc**: 3%
- **Office Management**: 15%
- **Total**: 100%

## How It Works

### Backend Components

#### 1. Script: `applyDefaultPercentages.js`
Location: `backend/scripts/applyDefaultPercentages.js`

This script:
- Identifies projects where all percentage fields are 0 (not configured)
- Applies the default percentages to those projects
- Automatically calculates the expense amounts based on the received fees
- Takes into account associate allocations before calculating expenses
- Can be run standalone via command line or imported as a module

**Standalone Usage:**
```bash
cd backend
node scripts/applyDefaultPercentages.js
```

#### 2. API Endpoint
Route: `POST /api/finance/projects/apply-default-percentages`

Authentication: Required

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 5,
    "projects": [
      {
        "projectNumber": "P001",
        "projectName": "Project Name",
        "totalReceivedFees": 100000,
        "amountForExpenses": 80000
      }
    ],
    "defaultPercentages": {
      "profitMarginPercent": 40,
      "drawingPercent": 30,
      "documentsPercent": 2,
      "siteVisitPercent": 10,
      "marketingAndMiscPercent": 3,
      "officeManagementPercent": 15
    }
  },
  "message": "Successfully applied default percentages to 5 project(s)"
}
```

### Frontend Components

#### 1. Service Method
Location: `frontend/src/services/FinanceService.js`

Method: `applyDefaultPercentages()`

This method calls the backend API endpoint to apply default percentages.

#### 2. UI Button
Location: Project Management Page

A new "Apply Defaults" button has been added next to the "Configure" button.

**Features:**
- Only visible to users with `canConfigurePercentagesGranular` permission
- Shows a confirmation dialog before applying defaults
- Displays the default percentages in the confirmation message
- Shows success/error toast notifications
- Automatically refreshes the project list and statistics after application

## Calculation Logic

When default percentages are applied to a project:

1. **Get Total Received Fees**: The sum of all payments for the project
2. **Deduct Associate Allocations**: Calculate total associate share based on their percentages
3. **Calculate Remaining Amount**: `Amount for Expenses = Total Received Fees - Associate Allocations`
4. **Apply Percentages**: Each expense category is calculated as a percentage of the remaining amount

**Example:**
```
Total Received Fees: ₹1,00,000
Associate Share (20%): ₹20,000
Amount for Expenses: ₹80,000

Profit Margin (40%): ₹32,000
Drawing (30%): ₹24,000
Documents (2%): ₹1,600
Site Visit (10%): ₹8,000
Marketing & Misc (3%): ₹2,400
Office Management (15%): ₹12,000
```

## When to Use

Use this feature when:
- You have projects imported from Excel without percentage configuration
- You forgot to configure expense distribution for new projects
- You want to quickly apply standard percentages to multiple projects
- You're setting up the system for the first time with existing project data

## Important Notes

1. **Only Affects Unconfigured Projects**: The script only updates projects where ALL percentage fields are 0
2. **Preserves Existing Configurations**: Projects with any configured percentage (even if just one field is non-zero) are not modified
3. **Automatic Calculation**: The system automatically calculates expense amounts from percentages using the pre-save hooks
4. **Associate Allocation Priority**: Associate shares are deducted from total received fees before expense distribution
5. **Confirmation Required**: The UI requires user confirmation before applying defaults

## Permission Required

To access this feature, users must have the `canConfigurePercentagesGranular` permission, which is typically granted to:
- Admin users
- Finance managers
- Users with "Configure Percentages" permission in the Finance Project module

## Files Modified

### Backend
- `backend/scripts/applyDefaultPercentages.js` (New)
- `backend/routes/finance.js` (Modified)

### Frontend
- `frontend/src/services/FinanceService.js` (Modified)
- `frontend/src/ProjectPage.js` (Modified)

## Testing

To test the implementation:

1. Create a project without configuring expense distribution percentages
2. Navigate to the Finance Project Management page
3. Click the "Apply Defaults" button
4. Confirm the action in the dialog
5. Verify that the project now has the default percentages applied
6. Check that the expense amounts are correctly calculated

## Future Enhancements

Potential improvements for future versions:
- Allow customization of default percentages per organization
- Add option to select specific projects for default application
- Provide bulk update with preview before applying
- Add audit trail for percentage changes
