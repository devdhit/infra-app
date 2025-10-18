# User Guide

This document provides comprehensive guidance for using the IT Asset Management System (ITAMS), including system navigation, asset management, and administrative functions.

## Getting Started

### System Access

1. **Login to ITAMS**
   - Open your web browser and navigate to your ITAMS URL
   - Enter your email address and password
   - Click "Login"

2. **Password Requirements**
   - Minimum 12 characters
   - Must include uppercase and lowercase letters
   - Must include at least one number
   - Must include at least one special character

3. **First-Time Login**
   - Upon first login, you may be prompted to change your password
   - Follow the password requirements
   - Set up any additional profile information as requested

### Navigation

The ITAMS interface consists of several key areas:

1. **Main Navigation Menu** (left sidebar)
   - Dashboard
   - Assets
   - Settings
   - Administration (admin users only)

2. **Top Toolbar**
   - User profile menu
   - Notifications
   - Language selector
   - Theme selector (light/dark mode)

3. **Main Content Area**
   - Displays the current page content
   - Shows asset lists, forms, and reports

## Dashboard Overview

### Accessing the Dashboard

The dashboard is the first page you see after logging in. It provides an overview of your IT assets and key metrics.

### Dashboard Components

1. **Asset Summary**
   - Total count of each asset type
   - Status distribution (working, repair, leave)
   - Quick links to asset management pages

2. **Recent Activity**
   - Recently added or modified assets
   - System notifications
   - Upcoming maintenance tasks

3. **Quick Actions**
   - Create new assets
   - Import assets from Excel
   - View reports

## Asset Management

### Asset Types

ITAMS supports management of several asset types:

1. **PC** - Desktop computers
2. **Laptop** - Portable computers
3. **Printer** - Printing devices
4. **License** - Software licenses
5. **Warehouse** - Storage inventory items
6. **Internet** - Internet connections

### Viewing Assets

1. **Navigate to Asset List**
   - Click "Assets" in the main navigation
   - Select the asset type you want to view

2. **Asset List Features**
   - **Search**: Filter assets by name, user, department, or other fields
   - **Filter**: Apply filters by status, department, or date range
   - **Sort**: Click column headers to sort by that field
   - **Columns**: Show/hide columns using the column visibility menu
   - **Pagination**: Navigate through pages of assets

3. **Asset Details**
   - Click any asset row to view detailed information
   - The detail view shows all asset properties and custom fields

### Creating Assets

1. **Create New Asset**
   - Navigate to the appropriate asset type list
   - Click the "Create" button (plus icon)
   - Fill in the required fields in the asset form
   - Click "Save"

2. **Required Fields**
   - Each asset type has specific required fields
   - These are marked with an asterisk (*)
   - The form will validate required fields before saving

3. **Custom Fields**
   - Your organization may have added custom fields
   - These appear in the "Custom Fields" section of the form
   - Follow any specific formatting requirements for custom fields

### Editing Assets

1. **Edit Existing Asset**
   - Navigate to the asset list
   - Find the asset you want to edit
   - Click the "Edit" button (pencil icon) in the actions column
   - Or click the asset row and then click "Edit" in the detail view

2. **Making Changes**
   - Modify the fields you need to update
   - The system will automatically save a history record of changes
   - Click "Save" to apply changes

### Deleting Assets

1. **Delete Single Asset**
   - Navigate to the asset list
   - Find the asset you want to delete
   - Click the "Delete" button (trash icon) in the actions column
   - Confirm the deletion in the confirmation dialog

2. **Bulk Delete**
   - Select multiple assets using the checkboxes
   - Click the "Delete" button that appears above the asset list
   - Confirm the bulk deletion

### Asset Status

Assets can have the following statuses:

1. **Working** - Asset is operational and in use
2. **Repair** - Asset is being repaired or maintained
3. **Leave** - Asset is not currently in use (e.g., employee on leave)

## Excel Import/Export

### Exporting Assets

1. **Export to Excel**
   - Navigate to any asset list
   - Click the "Export" button
   - Choose export options:
     - Export all items
     - Export current page only
     - Export selected items (if any are selected)
     - Export by department
   - Click "Export" to download the Excel file

2. **Excel Template**
   - The exported file uses a template with proper formatting
   - Column headers match the field names in ITAMS
   - Custom fields are included as additional columns

### Importing Assets

1. **Import from Excel**
   - Navigate to any asset list
   - Click the "Import" button
   - Download the template if needed
   - Prepare your data in the template format
   - Click "Choose File" and select your Excel file
   - Review the import preview
   - Click "Import" to process the file

2. **Import Requirements**
   - Use the provided template
   - Required fields must be filled in
   - Date formats should match: YYYY-MM-DD
   - Text fields should not exceed maximum lengths
   - Custom fields should match the configured types

3. **Import Results**
   - The system will show import progress
   - Successful imports will be listed
   - Any errors will be displayed with details
   - You can download a report of the import results

## Custom Fields

### Managing Custom Fields

1. **Access Custom Fields**
   - Navigate to "Settings" in the main menu
   - Click "Custom Fields"

2. **Custom Field Types**
   - **Text**: Single line of text
   - **Textarea**: Multi-line text area
   - **Number**: Numeric values
   - **Date**: Date values
   - **Boolean**: Yes/No values
   - **Select**: Dropdown with predefined options

3. **Creating Custom Fields**
   - Click "Add Custom Field"
   - Enter the field name
   - Select the field type
   - Choose which asset type this field applies to
   - Mark as required if necessary
   - For select fields, enter the options (comma-separated)
   - Click "Create"

4. **Editing Custom Fields**
   - Find the custom field in the list
   - Click "Edit" in the actions column
   - Make your changes
   - Click "Update"

5. **Deleting Custom Fields**
   - Find the custom field in the list
   - Click "Delete" in the actions column
   - Confirm the deletion
   - Note: This will remove the field from all assets

### Using Custom Fields

1. **In Asset Forms**
   - Custom fields appear in the "Custom Fields" section
   - Required custom fields are marked with an asterisk
   - Follow any specific formatting requirements

2. **In Asset Lists**
   - Custom fields appear as columns in asset lists
   - You can show/hide custom field columns
   - You can sort by custom field values
   - You can filter by custom field values

3. **Inline Editing**
   - Click on a custom field value in the asset list
   - A modal will appear with the appropriate input for the field type
   - Make your changes
   - Click "Save" to apply changes

## Reporting and Analytics

### Dashboard Reports

1. **Asset Overview**
   - Shows total counts by asset type
   - Displays status distribution
   - Provides quick insights into asset health

2. **Asset Growth**
   - Shows historical asset acquisition trends
   - Helps with capacity planning
   - Identifies growth patterns

3. **Custom Field Statistics**
   - Shows distribution of values in custom fields
   - Helps identify common configurations
   - Supports data-driven decision making

### Exporting Reports

1. **Excel Reports**
   - All asset lists can be exported to Excel
   - Reports include all relevant data
   - Formatting is preserved for professional presentation

2. **Filtered Reports**
   - Apply filters before exporting
   - Export only the data you need
   - Save time and storage space

## User Management

### Profile Settings

1. **Accessing Profile**
   - Click your user icon in the top right
   - Select "Profile" from the dropdown menu

2. **Profile Information**
   - Update your name and email address
   - Change your password
   - Set your preferred language
   - Choose light or dark theme

### Password Management

1. **Changing Password**
   - Navigate to Profile Settings
   - Click "Change Password"
   - Enter your current password
   - Enter and confirm your new password
   - Click "Update Password"

2. **Password Requirements**
   - Minimum 12 characters
   - Include uppercase and lowercase letters
   - Include at least one number
   - Include at least one special character

## Administration

### Tenant Management

1. **Accessing Tenants** (Admin only)
   - Navigate to "Administration" in the main menu
   - Click "Tenants"

2. **Tenant Information**
   - View all tenants in the system
   - See tenant details and statistics
   - Manage tenant configurations

3. **Creating Tenants** (Admin only)
   - Click "Add Tenant"
   - Enter tenant name and description
   - Click "Create"

### User Management

1. **Accessing Users**
   - Navigate to "Administration" in the main menu
   - Click "Users"

2. **User List**
   - View all users in your tenant
   - See user roles and last login times
   - Search and filter users

3. **Creating Users**
   - Click "Add User"
   - Enter user details (name, email)
   - Assign a role
   - The user will receive an email to set their password

4. **Editing Users**
   - Find the user in the list
   - Click "Edit" in the actions column
   - Update user information
   - Click "Update"

5. **Deleting Users**
   - Find the user in the list
   - Click "Delete" in the actions column
   - Confirm the deletion

### Role Management

1. **Accessing Roles**
   - Navigate to "Administration" in the main menu
   - Click "Roles"

2. **Role Types**
   - **Admin**: Full access to all features
   - **User**: Standard user access
   - Custom roles can be created with specific permissions

3. **Creating Roles**
   - Click "Add Role"
   - Enter role name and description
   - Configure permissions
   - Click "Create"

## Best Practices

### Data Management

1. **Regular Updates**
   - Keep asset information current
   - Update status changes promptly
   - Add new assets as they are acquired

2. **Data Accuracy**
   - Verify information before saving
   - Use consistent naming conventions
   - Fill in all relevant fields

3. **Backup and Export**
   - Regularly export important data
   - Keep local copies of critical information
   - Use Excel exports for reporting

### Security

1. **Password Security**
   - Use strong, unique passwords
   - Change passwords regularly
   - Enable two-factor authentication if available

2. **Access Control**
   - Only share login credentials with authorized personnel
   - Report suspicious activity immediately
   - Log out when finished using the system

### Collaboration

1. **Team Communication**
   - Coordinate with team members on asset assignments
   - Share important updates and changes
   - Use the system's history tracking for accountability

2. **Training**
   - Ensure all users are properly trained
   - Provide refresher training as needed
   - Share tips and best practices with team members

## Getting Help

### Support Resources

1. **Documentation**
   - This user guide
   - In-app help tooltips
   - Video tutorials (if available)

2. **Contact Support**
   - Email: support@your-domain.com
   - Phone: [support phone number]
   - In-app support ticket system

3. **Community**
   - User forums
   - Knowledge base articles
   - Best practices sharing

### Reporting Issues

1. **When to Report**
   - System errors or crashes
   - Incorrect data or missing features
   - Performance issues
   - Security concerns

2. **How to Report**
   - Include detailed description of the issue
   - Provide steps to reproduce the problem
   - Include screenshots if helpful
   - Mention your browser and device information

## Conclusion

The IT Asset Management System is designed to help you efficiently manage your organization's IT assets. By following this guide and best practices, you can maximize the system's benefits and maintain accurate, up-to-date asset information.

Regular use and proper data management will help you get the most value from ITAMS. If you have any questions or need assistance, don't hesitate to reach out to your system administrator or support team.