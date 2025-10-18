# IT Asset Management System (ITAMS) Wiki

Welcome to the IT Asset Management System (ITAMS) wiki! This wiki provides comprehensive documentation for developers, administrators, and users of the ITAMS application.

## Overview

The IT Asset Management System (ITAMS) is a comprehensive solution for organizations to track, manage, and optimize their IT assets. The system provides multi-tenant support, allowing different organizations to use the same instance while maintaining data isolation.

Built with modern technologies like Next.js 15, TypeScript, and Prisma ORM, ITAMS offers a responsive, performant interface with real-time data visualization and comprehensive asset tracking capabilities.

## Table of Contents

### For Developers
- [Architecture Overview](Architecture-Overview.md)
- [Project Structure](Project-Structure.md)
- [Development Setup](Development-Setup.md)
- [API Documentation](API-Documentation.md)
- [Database Schema](Database-Schema.md)
- [Coding Standards](Coding-Standards.md)
- [Testing Guide](Testing-Guide.md)

### For Administrators
- [Installation Guide](Installation-Guide.md)
- [Deployment Guide](Deployment-Guide.md)
- [Configuration](Configuration.md)
- [Backup and Recovery](Backup-and-Recovery.md)
- [Monitoring](Monitoring.md)
- [Troubleshooting](Troubleshooting.md)

### For Users
- [User Guide](User-Guide.md)
- [Asset Management](Asset-Management.md)
- [Custom Fields](Custom-Fields.md)
- [Reporting and Analytics](Reporting-and-Analytics.md)
- [Excel Import/Export](Excel-Import-Export.md)
- [Role-Based Access Control](Role-Based-Access-Control.md)

### Technical Documentation
- [Security Implementation](Security-Implementation.md)
- [Performance Optimizations](Performance-Optimizations.md)
- [Caching with Redis](Caching-with-Redis.md)
- [Internationalization](Internationalization.md)
- [Agent API](Agent-API.md)

## Key Features

### Core Modules

1. **User & Tenant Management**
   - Multi-tenant architecture with data isolation
   - Role-based access control (RBAC)
   - User authentication and authorization
   - Profile management

2. **IT Asset Management**
   - **PC Assets**: Track desktop computers with detailed specifications
   - **Laptop Assets**: Manage portable devices with warranty information
   - **Printer Assets**: Monitor printers and multifunction devices
   - **License Assets**: Track software licenses and compliance
   - **Warehouse IT**: Manage inventory in storage with barcode tracking
   - **Internet Assets**: Track internet connections and access permissions

3. **Excel Import/Export**
   - Template-based data import for all asset types
   - Bulk export functionality with department filtering
   - Data validation during import

4. **Custom Fields**
   - Tenant-specific custom fields
   - Support for various data types
   - Inline editing in asset lists

5. **Dashboard & Analytics**
   - Real-time asset overview with key metrics
   - Interactive charts for asset distribution
   - Custom field statistics visualization

6. **Audit Trail & History**
   - Complete audit trail for all changes
   - Change tracking for all assets
   - User activity monitoring

## Getting Started

To get started with ITAMS:

1. [Install the application](Installation-Guide.md)
2. [Configure your environment](Configuration.md)
3. [Set up your first tenant](User-Guide.md#tenant-setup)
4. [Add users and assign roles](Role-Based-Access-Control.md)
5. [Start managing assets](Asset-Management.md)

## Support

For issues, questions, or contributions, please:
- Check the [Troubleshooting](Troubleshooting.md) guide
- Review existing [issues](https://github.com/ddthien-coder/infra-app/issues)
- Create a new issue if needed
- Submit a pull request for improvements

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](https://github.com/ddthien-coder/infra-app/blob/main/CONTRIBUTING.md) for details on how to contribute to the project.