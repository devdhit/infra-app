# Development Setup

This guide will help you set up your development environment for the IT Asset Management System (ITAMS).

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js 18+** - JavaScript runtime
- **npm 8+** - Package manager (comes with Node.js)
- **PostgreSQL 17** - Database server
- **Redis** - Caching server
- **Git** - Version control system
- **VS Code** (recommended) or your preferred code editor

## System Requirements

### Minimum Requirements
- RAM: 8GB
- Disk Space: 2GB free space
- Processor: Dual-core 2GHz+

### Recommended Requirements
- RAM: 16GB or more
- Disk Space: 5GB free space
- Processor: Quad-core 3GHz+

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd infra-app
```

### 2. Install Dependencies

```bash
npm install
```

This will install all the required dependencies listed in `package.json`.

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:Abcd_2025@localhost:5432/infrasys_db?schema=public"

# Authentication
JWT_SECRET="your-secret-key-change-this-in-production"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Application Configuration
NODE_ENV="development"
PORT=3001
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Optional Features
ENABLE_CACHE=true
LOG_LEVEL="debug"
```

### 4. Set Up the Database

#### Install PostgreSQL
If you haven't already installed PostgreSQL, follow the official installation guide for your operating system.

#### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE infrasys_db;
\q
```

#### Run Prisma Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Set Up Redis

#### Install Redis
Follow the official Redis installation guide for your operating system.

#### Start Redis Server
```bash
redis-server
```

### 6. Seed the Database (Optional)

```bash
npm run seed
```

This will populate the database with sample data for development.

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

This command will:
1. Build the server-side TypeScript files
2. Start the Next.js development server
3. Watch for file changes and reload automatically

The application will be available at `http://localhost:3001`.

### Building the Application

```bash
# Build for production
npm run build:production

# Build only the frontend
npm run build

# Build only the server
npm run build:server
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## IDE Setup

### VS Code Recommended Extensions

1. **ESLint** - JavaScript/TypeScript linting
2. **Prettier** - Code formatting
3. **Prisma** - Prisma schema syntax highlighting
4. **Tailwind CSS IntelliSense** - Tailwind CSS autocomplete
5. **GitLens** - Enhanced Git capabilities
6. **Auto Rename Tag** - HTML tag renaming
7. **Bracket Pair Colorizer** - Visual bracket matching

### VS Code Settings

Create `.vscode/settings.json` with the following configuration:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Debugging Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (.+)",
        "uriFormat": "%s",
        "action": "debugWithExternalUri"
      }
    },
    {
      "name": "Next.js: debug client-side",
      "type": "pwa-chrome",
      "request": "launch",
      "url": "http://localhost:3001"
    }
  ]
}
```

## Code Quality Tools

### ESLint

The project uses ESLint for code linting. Configuration is in `eslint.config.mjs`.

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix
```

### Prettier

The project uses Prettier for code formatting. Configuration is in `.prettierrc`.

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

### TypeScript

The project uses TypeScript for type checking. Configuration is in `tsconfig.json`.

```bash
# Check for type errors
npm run type-check
```

## Database Development

### Prisma Studio

Prisma Studio provides a visual interface for your database:

```bash
npx prisma studio
```

Access at `http://localhost:5555`.

### Database Migrations

When making changes to the database schema:

1. Update `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name migration_name
   ```
3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

### Seeding Data

To seed the database with sample data:

```bash
npm run seed
```

## Testing

### Unit Tests

Unit tests are written using Jest and Testing Library. Test files are located in the `__tests__` directory.

```bash
# Run all tests
npm test

# Run tests for a specific file
npm test -- fileName.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests should follow these patterns:
- Place test files in `__tests__` directory
- Name test files with `.test.ts` or `.test.tsx` extension
- Use descriptive test names
- Test one behavior per test
- Mock external dependencies

### Component Testing

For React components:
- Use Testing Library for DOM assertions
- Test user interactions
- Test different states (loading, error, success)
- Use mock data for consistent tests

## Common Development Tasks

### Adding a New Asset Type

1. Update the Prisma schema in `prisma/schema.prisma`
2. Create a new handler in `src/lib/asset-api/`
3. Create API routes in `src/app/api/assets/`
4. Create UI components in `src/components/assets/`
5. Add navigation items in `src/components/layout/navigation.tsx`
6. Update type definitions in `src/types/`

### Adding a New Custom Field Type

1. Update the CustomField model in `prisma/schema.prisma`
2. Update validation logic in `src/lib/custom-fields.ts`
3. Update UI components to handle the new field type
4. Update Excel import/export functionality if needed

### Creating Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name descriptive_migration_name

# Apply migrations to database
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database credentials
- Check firewall settings

#### 2. Redis Connection Issues
- Ensure Redis server is running
- Check REDIS_URL in `.env`
- Verify Redis is accessible on the specified port

#### 3. Port Conflicts
- Change PORT in `.env`
- Check for processes using the port:
  ```bash
  # Linux/Mac
  lsof -i :3001
  
  # Windows
  netstat -ano | findstr :3001
  ```

#### 4. Dependency Installation Issues
- Clear npm cache:
  ```bash
  npm cache clean --force
  ```
- Delete node_modules and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

#### 5. TypeScript Errors
- Check type definitions in `src/types/`
- Ensure all required fields are provided
- Run type checking:
  ```bash
  npm run type-check
  ```

### Development Tips

1. **Use TypeScript**: Take advantage of type safety to catch errors early
2. **Follow Conventions**: Stick to the established naming and structure conventions
3. **Write Tests**: Add tests for new functionality
4. **Commit Often**: Make small, focused commits with descriptive messages
5. **Use ESLint**: Let ESLint catch common errors and enforce style
6. **Check Types**: Regularly run type checking to catch issues early
7. **Document Code**: Add JSDoc comments for complex functions
8. **Performance**: Consider performance implications of changes