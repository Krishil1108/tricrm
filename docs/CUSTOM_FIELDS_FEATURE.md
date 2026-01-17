# Custom Percentage Fields Feature

## ✨ Overview

The **Custom Percentage Fields** feature allows users to add unlimited custom expense categories beyond the default percentage fields (Profit Margin, Drawing, Documents, Site Visit, Marketing & Misc, Office Management).

## 🚀 How to Use

### 1. Access Configuration
1. Go to the **Projects** tab in Finance Management
2. Click the **⚙️ Configure Percentages** button
3. The Configure Expense Percentages modal will open

### 2. Add Custom Fields
1. In the modal, scroll down to the **🔧 Custom Fields** section
2. Click the **+ Add Field** button
3. Enter a descriptive name for your custom field (e.g., "Travel Expenses", "Legal Fees", "Insurance")
4. Set the desired percentage value
5. Add more fields as needed

### 3. Remove Custom Fields
- Click the **×** button next to any custom field to remove it
- Removed fields will no longer appear in project forms

### 4. Save Configuration
- Click **Save Configuration** to apply the changes
- Custom fields will now appear in all new projects

## 📋 Features

### ✅ Dynamic Field Management
- **Add unlimited custom fields** with descriptive names
- **Remove fields** that are no longer needed
- **Automatic field naming** for backend compatibility
- **Real-time total calculation** including custom fields

### ✅ Form Integration
- Custom fields automatically appear in the **Add/Edit Project** form
- Each custom field shows both **percentage** and **calculated amount**
- **Auto-calculation** based on finalized fees
- **Consistent styling** with existing expense fields

### ✅ Data Persistence
- Custom field configurations are **saved locally**
- **Backward compatibility** with existing projects
- **Automatic loading** when accessing the page

### ✅ Validation
- **Total percentage validation** (cannot exceed 100%)
- **Visual feedback** for total percentages
- **Error handling** for invalid configurations

## 🎯 Example Use Cases

### Construction Company
```
Default Fields:
- Profit Margin: 12%
- Drawing: 11%
- Documents: 5%
- Site Visit: 25%
- Marketing & Misc: 12%
- Office Management: 15%

Custom Fields:
- Travel Expenses: 8%
- Equipment Rental: 7%
- Safety Compliance: 5%
Total: 100%
```

### Consulting Firm
```
Default Fields:
- Profit Margin: 15%
- Drawing: 10%
- Documents: 8%
- Marketing & Misc: 10%
- Office Management: 20%

Custom Fields:
- Research & Development: 12%
- Client Entertainment: 5%
- Professional Training: 8%
- Technology Infrastructure: 7%
- Legal & Compliance: 5%
Total: 100%
```

## 🔧 Technical Implementation

### Data Structure
```javascript
customFields: [
  {
    name: "Travel Expenses",
    fieldName: "customField1Percent",
    percentage: 8
  },
  {
    name: "Legal Fees", 
    fieldName: "customField2Percent",
    percentage: 5
  }
]
```

### Form Field Generation
- **Percentage field**: `customField1Percent` (readonly, configured value)
- **Amount field**: `customField1` (editable, auto-calculated)
- **Display**: Both percentage and calculated amount shown

### Storage
- Configuration stored in `localStorage` as `finance-percentage-config`
- Custom fields included in project data when saved
- Automatic migration for existing configurations

## 💡 Best Practices

### Field Naming
- Use **descriptive names** that clearly identify the expense category
- Keep names **concise** for better form display
- Use **consistent terminology** across your organization

### Percentage Allocation
- Ensure **total doesn't exceed 100%**
- Consider **seasonal variations** in expense allocation
- **Review periodically** to ensure accuracy

### Field Management
- **Remove unused fields** to keep forms clean
- **Group related expenses** into single fields when appropriate
- **Document field purposes** for team understanding

## 🚨 Important Notes

1. **Percentage Limit**: Total of all percentages (default + custom + associates) cannot exceed 100%
2. **Field Persistence**: Custom fields are saved locally and will persist across browser sessions
3. **Project Forms**: Custom fields only appear in projects created after configuration
4. **Field Removal**: Removing a custom field doesn't affect existing projects with that field
5. **Backward Compatibility**: Existing projects without custom fields will continue to work normally

## 🔄 Migration Guide

### From Previous Versions
1. Existing percentage configurations will be **automatically migrated**
2. No action required for existing projects
3. Custom fields can be added to existing configurations
4. Default field behavior remains unchanged

### Data Export/Import
- Custom fields are included in **Excel exports**
- **Bulk import** supports projects with custom fields
- Field names are preserved in exported data