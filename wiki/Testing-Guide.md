# Testing Guide

This document provides comprehensive guidance on testing the IT Asset Management System (ITAMS), including testing strategies, tools, and best practices.

## Testing Philosophy

The ITAMS project follows a comprehensive testing approach that includes:

1. **Unit Testing**: Testing individual functions and components in isolation
2. **Integration Testing**: Testing interactions between components and services
3. **End-to-End Testing**: Testing complete user workflows
4. **Performance Testing**: Ensuring the application meets performance requirements
5. **Security Testing**: Verifying security measures are effective

## Testing Tools

### Jest
Jest is the primary testing framework for unit and integration tests. It provides:

- Test runner with watch mode
- Built-in assertion library
- Mocking capabilities
- Code coverage reporting

### Testing Library
Testing Library is used for component testing with a focus on:

- Testing from the user's perspective
- Avoiding implementation details
- Encouraging accessible markup

### Supertest
Supertest is used for API integration testing to:

- Test HTTP endpoints
- Validate request/response handling
- Simulate real API interactions

## Test Structure

### Directory Organization
Tests are organized to mirror the source code structure:

```
__tests__/
├── components/
│   ├── assets/
│   ├── dashboard/
│   └── ...
├── lib/
│   ├── api/
│   ├── asset-api/
│   └── ...
├── utils/
└── integration/
```

### Test File Naming
Test files follow the naming convention:
- Source file: `asset-service.ts`
- Test file: `asset-service.test.ts`

## Unit Testing

### Testing Components

#### Basic Component Test
```typescript
import { render, screen } from '@testing-library/react';
import AssetCard from '@/components/assets/asset-card';

describe('AssetCard', () => {
  const mockAsset = {
    id: '1',
    name: 'Test Asset',
    status: 'active',
    createdAt: new Date()
  };

  it('renders asset information correctly', () => {
    render(<AssetCard asset={mockAsset} />);
    
    expect(screen.getByText('Test Asset')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('handles edit action', () => {
    const mockEdit = jest.fn();
    render(<AssetCard asset={mockAsset} onEdit={mockEdit} />);
    
    const editButton = screen.getByRole('button', { name: 'Edit' });
    editButton.click();
    
    expect(mockEdit).toHaveBeenCalledWith(mockAsset);
  });
});
```

#### Testing Hooks
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAssetSearch } from '@/hooks/use-asset-search';

describe('useAssetSearch', () => {
  it('initializes with empty query', () => {
    const { result } = renderHook(() => useAssetSearch());
    
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('updates query when setQuery is called', () => {
    const { result } = renderHook(() => useAssetSearch());
    
    act(() => {
      result.current.setQuery('test');
    });
    
    expect(result.current.query).toBe('test');
  });
});
```

### Testing Services

#### API Service Testing
```typescript
import { assetService } from '@/lib/asset-service';
import { db } from '@/lib/db';

jest.mock('@/lib/db');

describe('AssetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssetById', () => {
    it('returns asset when found', async () => {
      const mockAsset = { id: '1', name: 'Test Asset' };
      (db.asset.findUnique as jest.Mock).mockResolvedValue(mockAsset);

      const result = await assetService.getAssetById('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAsset);
      expect(db.asset.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('returns error when asset not found', async () => {
      (db.asset.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await assetService.getAssetById('999');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });
});
```

#### Utility Function Testing
```typescript
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1000)).toBe('-$1,000.00');
  });

  it('handles zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

## Integration Testing

### API Endpoint Testing
```typescript
import request from 'supertest';
import { app } from '@/server'; // Your Next.js app instance
import { db } from '@/lib/db';

jest.mock('@/lib/db');

describe('Asset API', () => {
  describe('GET /api/assets/:id', () => {
    it('returns asset when found', async () => {
      const mockAsset = { id: '1', name: 'Test Asset' };
      (db.asset.findUnique as jest.Mock).mockResolvedValue(mockAsset);

      const response = await request(app)
        .get('/api/assets/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAsset);
    });

    it('returns 404 when asset not found', async () => {
      (db.asset.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/assets/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
```

### Database Integration Testing
```typescript
import { db } from '@/lib/db';
import { createAsset } from '@/lib/asset-service';

describe('Asset Creation', () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates asset in database', async () => {
    const assetData = {
      name: 'Test Asset',
      status: 'active',
      tenantId: 'tenant-1'
    };

    const result = await createAsset(assetData);

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Test Asset');
    
    // Verify asset was created in database
    const dbAsset = await db.asset.findUnique({
      where: { id: result.data.id }
    });
    
    expect(dbAsset).toBeDefined();
    expect(dbAsset?.name).toBe('Test Asset');
  });
});
```

## End-to-End Testing

### Playwright Setup
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
  ],
});
```

### Authentication Flow Test
```typescript
// e2e/auth.test.ts
import { test, expect } from '@playwright/test';

test('user can login and access dashboard', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill login form
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome to ITAMS')).toBeVisible();
  
  // Verify user menu is present
  await expect(page.getByRole('button', { name: 'User Menu' })).toBeVisible();
});
```

### Asset Management Test
```typescript
// e2e/asset-management.test.ts
import { test, expect } from '@playwright/test';

test('user can create and view asset', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Navigate to assets
  await page.getByRole('link', { name: 'Assets' }).click();
  await page.getByRole('link', { name: 'PC' }).click();
  
  // Create new asset
  await page.getByRole('button', { name: 'Create PC' }).click();
  await page.getByLabel('PC Name').fill('Test-PC-001');
  await page.getByLabel('Department').fill('IT');
  await page.getByLabel('Status').selectOption('working');
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Verify asset was created
  await expect(page.getByText('Test-PC-001')).toBeVisible();
  await expect(page.getByText('IT')).toBeVisible();
});
```

## Performance Testing

### Load Testing with Artillery
```yaml
# load-test.yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 20
  defaults:
    headers:
      authorization: "Bearer {{ auth_token }}"

scenarios:
  - name: "Get Assets"
    flow:
      - get:
          url: "/api/assets/pc"
          qs:
            page: 1
            limit: 20
```

### Performance Monitoring
```typescript
// __tests__/performance/asset-api.perf.test.ts
import { performance } from 'perf_hooks';
import { assetService } from '@/lib/asset-service';

describe('Asset API Performance', () => {
  it('should return assets within 500ms', async () => {
    const start = performance.now();
    const result = await assetService.getAssets({ page: 1, limit: 20 });
    const end = performance.now();
    
    const duration = end - start;
    expect(duration).toBeLessThan(500);
    
    console.log(`Asset API response time: ${duration}ms`);
  });
});
```

## Security Testing

### Authentication Testing
```typescript
import request from 'supertest';
import { app } from '@/server';

describe('Authentication Security', () => {
  it('rejects invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('rejects requests without authentication', async () => {
    const response = await request(app)
      .get('/api/assets')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
  });
});
```

### Input Validation Testing
```typescript
describe('Input Validation', () => {
  it('rejects malformed asset data', async () => {
    const invalidData = {
      name: '', // Required field
      status: 'invalid-status' // Invalid enum value
    };

    const response = await request(app)
      .post('/api/assets')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toHaveLength(2);
  });
});
```

## Test Execution

### Running Tests

#### Unit and Integration Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- asset-service.test.ts
```

#### End-to-End Tests
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed
```

#### Performance Tests
```bash
# Run performance tests
npm run test:perf

# Run load tests
npx artillery run load-test.yaml
```

### Test Configuration

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Test Environment Setup
```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Redis
jest.mock('@/lib/redis-cache', () => ({
  redisCache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));
```

## Code Coverage

### Coverage Requirements

The project maintains the following coverage requirements:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Coverage Reports

Coverage reports are generated in multiple formats:

1. **Text Summary**: Console output during test runs
2. **HTML Report**: Detailed interactive report in `coverage/` directory
3. **JSON Report**: Machine-readable report for CI/CD integration

### Improving Coverage

To improve test coverage:

1. **Identify Gaps**: Review coverage reports to find untested code
2. **Write Missing Tests**: Create tests for uncovered branches and functions
3. **Refactor Complex Code**: Simplify complex logic to make it more testable
4. **Mock External Dependencies**: Isolate code under test from external services

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:6
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Best Practices

### Test Design

1. **AAA Pattern**: Arrange, Act, Assert for clear test structure
2. **Single Responsibility**: Each test should verify one behavior
3. **Descriptive Names**: Use clear, descriptive test names
4. **Isolation**: Tests should not depend on each other
5. **Realistic Data**: Use realistic test data that matches production scenarios

### Mocking Strategy

1. **Mock External Services**: Database, API calls, file system operations
2. **Use Realistic Mocks**: Mocks should behave like real implementations
3. **Reset Mocks**: Clear mock state between tests
4. **Verify Interactions**: Check that expected calls were made

### Test Maintenance

1. **Regular Review**: Periodically review and update tests
2. **Remove Flaky Tests**: Identify and fix or remove unreliable tests
3. **Update with Changes**: Keep tests in sync with code changes
4. **Refactor Tests**: Apply the same refactoring principles to tests

### Performance Considerations

1. **Fast Tests**: Keep unit tests fast (< 100ms each)
2. **Parallel Execution**: Run tests in parallel when possible
3. **Database Seeding**: Use efficient database seeding strategies
4. **Mock Heavy Operations**: Mock expensive operations in unit tests

## Troubleshooting

### Common Issues

#### 1. Test Timeout Errors
```bash
# Increase Jest timeout
jest.setTimeout(30000);

# Or set timeout for specific test
it('should handle slow operation', async () => {
  // Test implementation
}, 30000);
```

#### 2. Database Connection Issues
```bash
# Ensure test database is running
# Check DATABASE_URL in test environment
# Verify Prisma schema and migrations
```

#### 3. Mock Not Working
```typescript
// Ensure mocks are set up before importing the module under test
jest.mock('@/lib/db');
import { assetService } from '@/lib/asset-service';
```

#### 4. Coverage Gaps
```bash
# Generate detailed coverage report
npm run test:coverage -- --coverageReporters=text-summary --coverageReporters=html
# Review uncovered lines in the HTML report
```

## Conclusion

A comprehensive testing strategy is essential for maintaining code quality and reliability in the ITAMS project. By following these guidelines and best practices, developers can ensure their code is well-tested, maintainable, and robust.

Regular testing not only catches bugs early but also provides confidence when making changes and refactoring code. The investment in thorough testing pays dividends in reduced debugging time, fewer production issues, and higher overall code quality.