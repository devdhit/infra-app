# Coding Standards

This document outlines the coding standards and best practices for the IT Asset Management System (ITAMS) project. Following these standards ensures code consistency, maintainability, and quality across the codebase.

## TypeScript Standards

### Type Safety

1. **Strict Mode**: TypeScript is configured with strict mode enabled
   - `strict: true` in `tsconfig.json`
   - No implicit any types
   - Strict null checks enabled

2. **Explicit Typing**: Always specify types explicitly
   ```typescript
   // Good
   const userName: string = "john.doe";
   const userCount: number = 5;
   
   // Avoid
   const userName = "john.doe";
   const userCount = 5;
   ```

3. **Interface vs Type**: Use interfaces for object shapes, types for unions and primitives
   ```typescript
   // Interfaces for objects
   interface User {
     id: string;
     name: string;
     email: string;
   }
   
   // Types for unions
   type Status = "active" | "inactive" | "pending";
   ```

4. **Generic Types**: Use generics for reusable, type-safe components
   ```typescript
   // Good
   class BaseApiHandler<T> {
     async getById(id: string): Promise<T> {
       // Implementation
     }
   }
   
   // Avoid
   class BaseApiHandler {
     async getById(id: string): Promise<any> {
       // Implementation
     }
   }
   ```

### Naming Conventions

1. **Variables and Functions**: Use camelCase
   ```typescript
   const userCount: number = 10;
   function getUserById(id: string): Promise<User> {
     // Implementation
   }
   ```

2. **Interfaces and Classes**: Use PascalCase
   ```typescript
   interface AssetResponse {
     success: boolean;
     data: Asset[];
   }
   
   class AssetApiHandler {
     // Implementation
   }
   ```

3. **Constants**: Use UPPER_SNAKE_CASE
   ```typescript
   const MAX_RETRY_ATTEMPTS = 3;
   const DEFAULT_PAGE_SIZE = 20;
   ```

4. **File Names**: Use kebab-case
   ```
   asset-api-handler.ts
   user-service.ts
   ```

### Functions and Methods

1. **Single Responsibility**: Functions should do one thing well
   ```typescript
   // Good
   function validateUser(user: User): boolean {
     return user.email && user.name;
   }
   
   function saveUser(user: User): Promise<User> {
     // Save logic
   }
   
   // Avoid
   function processUser(user: User): Promise<User> {
     // Validation, saving, logging, and other logic mixed together
   }
   ```

2. **Pure Functions**: Prefer pure functions when possible
   ```typescript
   // Good - Pure function
   function calculateAssetAge(purchaseDate: Date): number {
     return new Date().getFullYear() - purchaseDate.getFullYear();
   }
   
   // Avoid - Side effects
   function calculateAssetAge(purchaseDate: Date): number {
     console.log("Calculating asset age"); // Side effect
     return new Date().getFullYear() - purchaseDate.getFullYear();
   }
   ```

3. **Async/Await**: Use async/await instead of promises for better readability
   ```typescript
   // Good
   async function getAssetById(id: string): Promise<Asset | null> {
     try {
       const asset = await db.asset.findUnique({ where: { id } });
       return asset;
     } catch (error) {
       logger.error("Error fetching asset", error);
       return null;
     }
   }
   
   // Avoid
   function getAssetById(id: string): Promise<Asset | null> {
     return db.asset.findUnique({ where: { id } })
       .catch(error => {
         logger.error("Error fetching asset", error);
         return null;
       });
   }
   ```

## React/Next.js Standards

### Component Structure

1. **Functional Components**: Use functional components with hooks
   ```tsx
   // Good
   import { useState } from 'react';
   
   interface AssetListProps {
     assets: Asset[];
   }
   
   export default function AssetList({ assets }: AssetListProps) {
     const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
     
     return (
       <div>
         {/* Component implementation */}
       </div>
     );
   }
   ```

2. **Component Naming**: Use PascalCase for component names
   ```tsx
   // File: asset-list.tsx
   export default function AssetList() {
     // Implementation
   }
   ```

3. **Props Interface**: Define props interface above the component
   ```tsx
   interface AssetCardProps {
     asset: Asset;
     onEdit: (asset: Asset) => void;
     onDelete: (id: string) => void;
   }
   
   export default function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
     // Implementation
   }
   ```

### Hooks Usage

1. **Custom Hooks**: Extract reusable logic into custom hooks
   ```typescript
   // Good
   import { useState, useEffect } from 'react';
   
   export function useAssetSearch(initialQuery: string = '') {
     const [query, setQuery] = useState(initialQuery);
     const [results, setResults] = useState<Asset[]>([]);
     const [loading, setLoading] = useState(false);
     
     useEffect(() => {
       if (query) {
         setLoading(true);
         searchAssets(query).then(results => {
           setResults(results);
           setLoading(false);
         });
       }
     }, [query]);
     
     return { query, setQuery, results, loading };
   }
   ```

2. **Hook Rules**: Follow React hooks rules
   ```tsx
   // Good
   export default function AssetList() {
     const [assets, setAssets] = useState<Asset[]>([]);
     const { data, loading, error } = useApi<Asset[]>('/api/assets');
     
     // Hooks called at top level
     useEffect(() => {
       if (data) {
         setAssets(data);
       }
     }, [data]);
     
     // Rest of component
   }
   ```

### State Management

1. **Local State**: Use useState for simple local state
   ```tsx
   export default function AssetForm() {
     const [formData, setFormData] = useState<Partial<Asset>>({});
     const [errors, setErrors] = useState<Record<string, string>>({});
     
     // Implementation
   }
   ```

2. **Complex State**: Use useReducer for complex state logic
   ```tsx
   type AssetState = {
     assets: Asset[];
     loading: boolean;
     error: string | null;
     filters: Record<string, any>;
   };
   
   type AssetAction =
     | { type: 'SET_ASSETS'; payload: Asset[] }
     | { type: 'SET_LOADING'; payload: boolean }
     | { type: 'SET_ERROR'; payload: string | null }
     | { type: 'SET_FILTERS'; payload: Record<string, any> };
   
   function assetReducer(state: AssetState, action: AssetAction): AssetState {
     switch (action.type) {
       case 'SET_ASSETS':
         return { ...state, assets: action.payload, loading: false };
       case 'SET_LOADING':
         return { ...state, loading: action.payload };
       // Other cases
       default:
         return state;
     }
   }
   ```

## API Standards

### Error Handling

1. **Consistent Error Format**: Use standardized error responses
   ```typescript
   interface ApiError {
     success: false;
     error: {
       code: string;
       message: string;
       details?: any;
     };
   }
   
   // Implementation
   export function handleApiError(error: any): ApiError {
     return {
       success: false,
       error: {
         code: error.code || 'INTERNAL_ERROR',
         message: error.message || 'An unexpected error occurred',
         details: error.details
       }
     };
   }
   ```

2. **Try-Catch Blocks**: Always wrap async operations in try-catch
   ```typescript
   export async function getAssetById(id: string): Promise<ApiResponse<Asset>> {
     try {
       const asset = await db.asset.findUnique({
         where: { id }
       });
       
       if (!asset) {
         return {
           success: false,
           error: {
             code: 'NOT_FOUND',
             message: 'Asset not found'
           }
       };
     }
       
       return {
         success: true,
         data: asset
       };
     } catch (error) {
       logger.error('Error fetching asset', { id, error });
       return handleApiError(error);
     }
   }
   ```

### Response Format

1. **Standardized Responses**: Use consistent response structure
   ```typescript
   interface SuccessResponse<T> {
     success: true;
     data: T;
     message?: string;
   }
   
   interface ErrorResponse {
     success: false;
     error: {
       code: string;
       message: string;
       details?: any;
     };
   }
   
   type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
   ```

### Validation

1. **Input Validation**: Validate all API inputs
   ```typescript
   import { z } from 'zod';
   
   const createAssetSchema = z.object({
     name: z.string().min(1).max(100),
     status: z.enum(['active', 'inactive', 'maintenance']),
     purchaseDate: z.date().optional()
   });
   
   export async function createAsset(request: Request): Promise<ApiResponse<Asset>> {
     try {
       const body = await request.json();
       const validatedData = createAssetSchema.parse(body);
       
       // Process validated data
     } catch (error) {
       if (error instanceof z.ZodError) {
         return {
           success: false,
           error: {
             code: 'VALIDATION_ERROR',
             message: 'Invalid input data',
             details: error.errors
           }
         };
       }
       
       // Handle other errors
     }
   }
   ```

## Database Standards

### Prisma Usage

1. **Selective Field Retrieval**: Only select needed fields
   ```typescript
   // Good
   const assets = await db.asset.findMany({
     where: { status: 'active' },
     select: {
       id: true,
       name: true,
       status: true,
       createdAt: true
     }
   });
   
   // Avoid selecting all fields unless necessary
   const assets = await db.asset.findMany({
     where: { status: 'active' }
   });
   ```

2. **Transaction Usage**: Use transactions for related operations
   ```typescript
   export async function updateAssetWithHistory(
     assetId: string, 
     updateData: Partial<Asset>, 
     userId: string
   ): Promise<ApiResponse<Asset>> {
     try {
       return await db.$transaction(async (tx) => {
         // Update asset
         const updatedAsset = await tx.asset.update({
           where: { id: assetId },
           data: updateData
         });
         
         // Create history record
         await tx.history.create({
           data: {
             assetId,
             userId,
             action: 'UPDATE',
             before: originalAsset,
             after: updatedAsset
           }
         });
         
         return {
           success: true,
           data: updatedAsset
         };
       });
     } catch (error) {
       return handleApiError(error);
     }
   }
   ```

## Security Standards

### Authentication

1. **JWT Handling**: Secure JWT implementation
   ```typescript
   import jwt from 'jsonwebtoken';
   
   interface JwtPayload {
     userId: string;
     tenantId: string;
     roleId: string;
   }
   
   export function generateToken(payload: JwtPayload): string {
     return jwt.sign(payload, process.env.JWT_SECRET!, {
       expiresIn: '24h',
       issuer: 'itams',
       audience: 'itams-users'
     });
   }
   
   export function verifyToken(token: string): JwtPayload | null {
     try {
       return jwt.verify(token, process.env.JWT_SECRET!, {
         issuer: 'itams',
         audience: 'itams-users'
       }) as JwtPayload;
     } catch (error) {
       logger.warn('Invalid token', { error });
       return null;
     }
   }
   ```

### Input Sanitization

1. **Data Sanitization**: Sanitize user inputs
   ```typescript
   import sanitizeHtml from 'sanitize-html';
   
   export function sanitizeInput(input: string): string {
     return sanitizeHtml(input, {
       allowedTags: [],
       allowedAttributes: {}
     });
   }
   
   export function sanitizeAssetData(assetData: Partial<Asset>): Partial<Asset> {
     return {
       ...assetData,
       name: assetData.name ? sanitizeInput(assetData.name) : undefined,
       description: assetData.description ? sanitizeInput(assetData.description) : undefined
     };
   }
   ```

## Testing Standards

### Unit Tests

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
   ```typescript
   describe('AssetService', () => {
     describe('getAssetById', () => {
       it('should return asset when found', async () => {
         // Arrange
         const mockAsset = { id: '1', name: 'Test Asset' };
         jest.spyOn(db.asset, 'findUnique').mockResolvedValue(mockAsset);
         
         // Act
         const result = await assetService.getAssetById('1');
         
         // Assert
         expect(result.success).toBe(true);
         expect(result.data).toEqual(mockAsset);
       });
     });
   });
   ```

2. **Mocking**: Use proper mocking techniques
   ```typescript
   // Good - Mock specific methods
   jest.spyOn(db.asset, 'findUnique').mockResolvedValue(mockAsset);
   
   // Avoid - Mock entire modules when not necessary
   jest.mock('@/lib/db');
   ```

## Documentation Standards

### JSDoc Comments

1. **Function Documentation**: Document all public functions
   ```typescript
   /**
    * Creates a new asset in the database
    * @param assetData - The data for the new asset
    * @param tenantId - The ID of the tenant
    * @returns The created asset or an error response
    * @throws {ValidationError} When asset data is invalid
    * @throws {DatabaseError} When database operation fails
    */
   export async function createAsset(
     assetData: CreateAssetInput, 
     tenantId: string
   ): Promise<ApiResponse<Asset>> {
     // Implementation
   }
   ```

2. **Interface Documentation**: Document complex interfaces
   ```typescript
   /**
    * Represents an IT asset in the system
    * @property id - Unique identifier for the asset
    * @property name - Name of the asset
    * @property status - Current status of the asset
    * @property tenantId - ID of the tenant that owns this asset
    * @property customFields - Tenant-specific custom fields
    */
   interface Asset {
     id: string;
     name: string;
     status: AssetStatus;
     tenantId: string;
     customFields?: Record<string, any>;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

## Performance Standards

### Optimization Techniques

1. **Memoization**: Use memoization for expensive computations
   ```typescript
   import { useMemo } from 'react';
   
   export default function AssetList({ assets }: { assets: Asset[] }) {
     const processedAssets = useMemo(() => {
       return assets.map(asset => ({
         ...asset,
         displayName: `${asset.name} (${asset.status})`
       }));
     }, [assets]);
     
     // Implementation
   }
   ```

2. **Lazy Loading**: Implement lazy loading for large components
   ```tsx
   import { lazy, Suspense } from 'react';
   
   const AssetDetailModal = lazy(() => import('./asset-detail-modal'));
   
   export default function AssetList() {
     const [showDetail, setShowDetail] = useState(false);
     
     return (
       <div>
         {/* Other components */}
         {showDetail && (
           <Suspense fallback={<div>Loading...</div>}>
             <AssetDetailModal />
           </Suspense>
         )}
       </div>
     );
   }
   ```

## Code Review Standards

### Review Checklist

When reviewing code, check for:

1. **Type Safety**: Proper typing and no implicit any
2. **Error Handling**: Proper error handling and logging
3. **Security**: Input validation, sanitization, and authentication
4. **Performance**: Efficient algorithms and database queries
5. **Test Coverage**: Adequate unit tests for new functionality
6. **Documentation**: Proper JSDoc comments and README updates
7. **Naming**: Clear, descriptive variable and function names
8. **Consistency**: Follows established patterns and conventions
9. **Accessibility**: Proper ARIA attributes and semantic HTML
10. **Internationalization**: Proper i18n implementation

## Tools and Automation

### ESLint Configuration

The project uses ESLint with the following key rules:

1. **@typescript-eslint/no-unused-vars**: Prevent unused variables
2. **@typescript-eslint/explicit-function-return-type**: Require explicit return types
3. **@typescript-eslint/no-explicit-any**: Prevent use of any type
4. **react-hooks/rules-of-hooks**: Ensure hooks are used correctly
5. **react-hooks/exhaustive-deps**: Prevent missing dependencies in useEffect

### Prettier Configuration

Prettier ensures consistent code formatting with:

1. **Semicolons**: Required at end of statements
2. **Single Quotes**: Use single quotes for strings
3. **Trailing Commas**: Use trailing commas in multi-line objects/arrays
4. **Indentation**: 2 spaces for indentation
5. **Line Width**: 100 characters maximum line length

### Pre-commit Hooks

The project uses Husky with lint-staged to:

1. **Format Code**: Automatically format staged files
2. **Lint Code**: Check for linting errors
3. **Type Check**: Verify TypeScript types
4. **Run Tests**: Execute relevant tests for changed files

## Continuous Integration

### CI Pipeline

The CI pipeline includes:

1. **Build**: Compile TypeScript and Next.js application
2. **Lint**: Run ESLint and Prettier checks
3. **Test**: Execute unit and integration tests
4. **Security**: Scan for security vulnerabilities
5. **Deploy**: Deploy to staging/production environments

### Quality Gates

Quality gates ensure code quality:

1. **Test Coverage**: Minimum 80% test coverage
2. **Code Climate**: Maintain A grade code quality
3. **Security Scans**: No critical security issues
4. **Performance**: Meet performance benchmarks
5. **Accessibility**: WCAG 2.1 AA compliance

## Best Practices Summary

### Do's

1. ✅ Use TypeScript for type safety
2. ✅ Write unit tests for new functionality
3. ✅ Document public APIs and complex logic
4. ✅ Follow established patterns and conventions
5. ✅ Handle errors gracefully with proper logging
6. ✅ Validate and sanitize all inputs
7. ✅ Use environment variables for configuration
8. ✅ Implement proper authentication and authorization
9. ✅ Optimize database queries with selective field retrieval
10. ✅ Use consistent naming conventions

### Don'ts

1. ❌ Use `any` type unless absolutely necessary
2. ❌ Ignore TypeScript errors or warnings
3. ❌ Skip error handling or logging
4. ❌ Hardcode sensitive information
5. ❌ Make database queries without indexes
6. ❌ Use console.log for debugging in production
7. ❌ Create overly complex components or functions
8. ❌ Duplicate code instead of creating reusable utilities
9. ❌ Ignore accessibility requirements
10. ❌ Commit code without tests or documentation