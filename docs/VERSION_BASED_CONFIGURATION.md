# Version-Based Configuration System

## Overview
The version-based configuration system ensures that changes to expense field configurations only apply to projects created after the configuration change, maintaining backward compatibility and data integrity.

## Key Features

### 1. **Automatic Version Tracking**
- Every configuration change creates a new version
- Each version is timestamped with `appliedFrom` and `appliedTo` dates
- Projects store the configuration version they were created with

### 2. **Configuration Snapshot**
- Each project stores a complete snapshot of the configuration at creation time
- Includes:
  - Default expense field percentages
  - Field visibility settings
  - Custom fields
  - Associate configurations

### 3. **Non-Retroactive Changes**
- Changes to configuration never affect existing projects
- Example: Adding "Food" field after Project 5
  - Projects 1-5: No "Food" field
  - Projects 6+: "Food" field appears

### 4. **Field Removal Tracking**
- Removing/unchecking fields creates a new version
- Example: Removing "Food" after Project 10
  - Projects 1-5: No "Food" field (never had it)
  - Projects 6-10: "Food" field visible
  - Projects 11+: No "Food" field

## Architecture

### Backend Components

#### 1. **ConfigurationVersion Model** (`backend/models/ConfigurationVersion.js`)
```javascript
{
  version: Number,           // Incremental version number
  configuration: Object,     // Complete configuration snapshot
  appliedFrom: Date,         // When this version became active
  appliedTo: Date,          // When this version was replaced (null = current)
  changeDescription: String, // Auto-generated change log
  createdBy: ObjectId       // User who made the change
}
```

#### 2. **FinanceProject Model Updates**
```javascript
{
  configVersion: Number,     // Version number when project was created
  configSnapshot: Object,    // Complete configuration at creation time
  // ... other project fields
}
```

#### 3. **ConfigurationVersionService** (`backend/services/ConfigurationVersionService.js`)
- `getCurrentVersion()` - Get active configuration
- `saveNewVersion()` - Create new version with change tracking
- `getVersionByNumber()` - Retrieve specific version
- `getVersionAtDate()` - Get configuration active at a specific date
- `getAllVersions()` - Retrieve version history

#### 4. **API Routes** (`backend/routes/configurationVersions.js`)
- `GET /api/configuration-versions/current` - Current active config
- `POST /api/configuration-versions/save` - Save new version
- `GET /api/configuration-versions/version/:versionNumber` - Specific version
- `GET /api/configuration-versions/history` - Version history
- `GET /api/configuration-versions/all` - All versions

### Frontend Components

#### 1. **ConfigurationVersionService** (`frontend/src/services/ConfigurationVersionService.js`)
- Frontend API wrapper for configuration version endpoints
- Handles communication with backend version service

#### 2. **ProjectPage Updates**
- `loadPercentageConfig()` - Loads from version service (fallback to localStorage)
- `savePercentageConfig()` - Saves new version and tracks changes
- Configuration modal shows current version badge
- Warning message about non-retroactive changes

#### 3. **YearlyDistributionTable Updates**
- Uses project's `configSnapshot` if available
- Falls back to current configuration for display
- Ensures correct fields are shown for each project

## Usage Flow

### Creating a New Project
1. User clicks "Add Project"
2. System fetches current configuration version
3. Project is created with:
   - `configVersion` = current version number
   - `configSnapshot` = complete configuration object
4. Project fields and distributions use snapshot configuration

### Modifying Configuration
1. User opens "Configure Percentages" modal
2. System shows current version (e.g., v3)
3. User makes changes (add field, change percentage, toggle visibility)
4. User clicks "Save Configuration"
5. System:
   - Compares with previous version
   - Creates new version if changed
   - Generates automatic change description
   - Increments version number (v3 → v4)
6. New version becomes active for future projects
7. Existing projects retain their original configuration

### Viewing Project Distribution
1. User selects project to view distribution
2. `YearlyDistributionTable` component:
   - Checks for `project.configSnapshot`
   - Uses snapshot configuration if available
   - Falls back to current config (for legacy projects)
3. Only fields that existed when project was created are displayed
4. Percentages match the values at creation time

## Example Scenarios

### Scenario 1: Adding a New Field
**Initial State (v1):**
- Fields: Profit Margin, Drawing, Documents
- Projects 1-5 created

**Action:** Add "Site Visit" field (v2)
- Projects 1-5: Show only original 3 fields
- Projects 6+: Show all 4 fields including "Site Visit"

### Scenario 2: Removing a Field
**State (v2):**
- Fields: Profit Margin, Drawing, Documents, Site Visit
- Projects 1-10 created

**Action:** Uncheck "Documents" field (v3)
- Projects 1-5: Show Profit Margin, Drawing (original)
- Projects 6-10: Show all 4 fields (created with v2)
- Projects 11+: Show Profit Margin, Drawing, Site Visit (v3)

### Scenario 3: Changing Percentages
**State (v3):**
- Profit Margin: 10%
- Drawing: 15%
- Projects 1-15 created

**Action:** Change Profit Margin to 12% (v4)
- Projects 1-15: Use 10% profit margin (their original value)
- Projects 16+: Use 12% profit margin (new value)

### Scenario 4: Adding Custom Field
**State (v4):**
- Default fields + percentages
- Projects 1-20 created

**Action:** Add custom field "Food" at 5% (v5)
- Projects 1-20: No "Food" field
- Projects 21+: "Food" field appears with 5%

## Benefits

1. **Data Integrity**: Historical data remains accurate and consistent
2. **Audit Trail**: Complete history of configuration changes
3. **Flexibility**: Add/remove fields without breaking existing data
4. **Compliance**: Configuration changes are tracked with timestamps and user info
5. **Backward Compatibility**: Old projects work exactly as they did when created
6. **Forward Compatibility**: New projects get latest configuration automatically

## Migration Notes

### For Existing Projects
- Projects without `configVersion` will use version 1 (initial)
- Projects without `configSnapshot` will use current configuration
- System is backward compatible with existing data

### Initial Setup
1. System creates version 1 on first configuration save
2. All subsequent changes increment the version
3. Each change is logged with description and timestamp

## Monitoring

### Version History View
Access via: `/api/configuration-versions/history`
Shows:
- Version number
- Date applied
- User who made change
- Change description
- Duration version was active

### Change Descriptions
Auto-generated descriptions include:
- Field additions/removals
- Percentage changes
- Visibility toggles
- Custom field modifications

## Best Practices

1. **Descriptive Changes**: System auto-generates descriptions, but you can provide custom ones
2. **Test Before Save**: Review changes in modal before saving new version
3. **Version Review**: Check version history periodically for audit purposes
4. **Backup**: Configuration versions are stored in database, no additional backup needed
5. **Communication**: Inform users that configuration changes only affect new projects

## Technical Details

### Database Indexes
- `version`: Unique index for fast version lookup
- `appliedFrom, appliedTo`: Compound index for date-based queries
- `configVersion` in projects: Index for filtering projects by version

### Performance
- Configuration loading: Single database query
- Project creation: Minimal overhead (snapshot stored as object)
- Version comparison: In-memory JSON comparison
- Historical queries: Optimized with indexes

### Error Handling
- Fallback to localStorage if version service unavailable
- Graceful degradation for legacy projects
- Automatic retry on network failures
- User-friendly error messages

## Future Enhancements

Potential improvements:
1. Version diff view in UI
2. Configuration rollback capability
3. Bulk project version migration tool
4. Export/import configuration versions
5. Configuration templates
6. Version comparison in admin panel
