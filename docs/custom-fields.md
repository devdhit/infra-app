# Custom Fields Documentation

## Overview

Custom fields allow you to extend the default asset properties with additional fields specific to your organization's needs. These fields can be added to any asset type (PC, Laptop, Printer, License, WarehouseIT) and can be of various types including text, number, date, boolean, and select.

## Features

1. **CRUD Operations**: Create, read, update, and delete custom fields
2. **Type Support**: Text, number, date, boolean, and select field types
3. **Asset Type Association**: Associate custom fields with specific asset types
4. **Required Fields**: Mark custom fields as required for asset creation/update
5. **Inline Editing**: Edit custom field values directly in asset lists
6. **Form Integration**: Custom fields automatically appear in asset creation/edit forms

## Managing Custom Fields

### Accessing Custom Fields Management

1. Navigate to **Settings** in the main navigation
2. Click on **Custom Fields** card
3. Or directly navigate to `/settings/custom-fields`

### Creating a Custom Field

1. Click the **Add Custom Field** button
2. Fill in the form:
   - **Name**: The display name for the field
   - **Type**: Select the data type (text, number, date, boolean, select)
   - **Model Type**: Choose which asset type this field applies to
   - **Required**: Toggle if this field must be filled when creating/updating assets
3. Click **Create**

### Editing a Custom Field

1. Find the custom field in the list
2. Click the **Edit** option from the actions dropdown
3. Modify the field properties
4. Click **Update**

### Deleting a Custom Field

1. Find the custom field in the list
2. Click the **Delete** option from the actions dropdown
3. Confirm the deletion

## Using Custom Fields in Assets

### In Asset Forms

When creating or editing an asset, any custom fields associated with that asset type will automatically appear in a dedicated "Custom Fields" section of the form. Required custom fields will be marked with an asterisk (*).

### In Asset Lists

Custom fields appear as columns in asset lists when they are configured for that asset type. You can edit custom field values directly in the table by clicking on the cell value, which will open an inline editing modal.

### Inline Editing

To edit a custom field value directly in the asset list:

1. Click on the cell containing the custom field value
2. A modal will appear with the appropriate input for the field type
3. Make your changes
4. Click **Save** to apply the changes or **Cancel** to discard

## Best Practices

1. **Naming**: Use clear, descriptive names for custom fields
2. **Types**: Choose the appropriate data type for your field to ensure proper validation
3. **Required Fields**: Only mark fields as required if they are truly necessary for all assets of that type
4. **Organization**: Create custom fields that are specific to your organization's workflow and needs
5. **Consistency**: Maintain consistent naming conventions across similar custom fields

## API Endpoints

### Custom Fields

- `GET /api/custom-fields` - Get all custom fields (with optional modelType filter)
- `POST /api/custom-fields` - Create a new custom field
- `GET /api/custom-fields/[id]` - Get a specific custom field
- `PUT /api/custom-fields/[id]` - Update a custom field
- `DELETE /api/custom-fields/[id]` - Delete a custom field

### Asset Custom Fields

- `GET /api/assets/custom-fields/[id]?assetType=[type]` - Get custom field values for an asset
- `PUT /api/assets/custom-fields/[id]?assetType=[type]` - Update custom field values for an asset

## Implementation Details

### Data Storage

Custom fields are stored in the database as separate records in the `CustomField` table, which is associated with tenants. Asset-specific custom field values are stored in a JSONB column called `customFields` on each asset model.

### Frontend Integration

The frontend automatically fetches custom fields for each asset type and integrates them into:
- Asset creation/edit forms
- Asset list tables
- Inline editing components

### Validation

Custom fields are validated both on the client and server side:
- Type validation (ensuring values match the field type)
- Required field validation
- Format validation (e.g., date format for date fields)