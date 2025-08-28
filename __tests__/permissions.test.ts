import { hasPermission, hasAnyPermission, getRolePermissions } from '../src/lib/permissions';

describe('Permissions System', () => {
  describe('hasPermission', () => {
    it('should allow admin to perform all actions on users', () => {
      expect(hasPermission('admin', 'users', 'view')).toBe(true);
      expect(hasPermission('admin', 'users', 'create')).toBe(true);
      expect(hasPermission('admin', 'users', 'edit')).toBe(true);
      expect(hasPermission('admin', 'users', 'delete')).toBe(true);
      expect(hasPermission('admin', 'users', 'bulkDelete')).toBe(true);
    });

    it('should only allow user to view users', () => {
      expect(hasPermission('user', 'users', 'view')).toBe(true);
      expect(hasPermission('user', 'users', 'create')).toBe(false);
      expect(hasPermission('user', 'users', 'edit')).toBe(false);
      expect(hasPermission('user', 'users', 'delete')).toBe(false);
      expect(hasPermission('user', 'users', 'bulkDelete')).toBe(false);
    });

    it('should allow admin to perform all actions on tenants', () => {
      expect(hasPermission('admin', 'tenants', 'view')).toBe(true);
      expect(hasPermission('admin', 'tenants', 'create')).toBe(true);
      expect(hasPermission('admin', 'tenants', 'edit')).toBe(true);
      expect(hasPermission('admin', 'tenants', 'delete')).toBe(true);
      expect(hasPermission('admin', 'tenants', 'bulkDelete')).toBe(true);
    });

    it('should only allow user to view tenants', () => {
      expect(hasPermission('user', 'tenants', 'view')).toBe(true);
      expect(hasPermission('user', 'tenants', 'create')).toBe(false);
      expect(hasPermission('user', 'tenants', 'edit')).toBe(false);
      expect(hasPermission('user', 'tenants', 'delete')).toBe(false);
      expect(hasPermission('user', 'tenants', 'bulkDelete')).toBe(false);
    });

    it('should allow admin to perform all actions on assets', () => {
      expect(hasPermission('admin', 'assets', 'view')).toBe(true);
      expect(hasPermission('admin', 'assets', 'create')).toBe(true);
      expect(hasPermission('admin', 'assets', 'edit')).toBe(true);
      expect(hasPermission('admin', 'assets', 'delete')).toBe(true);
      expect(hasPermission('admin', 'assets', 'bulkDelete')).toBe(true);
    });

    it('should allow user to view, create, edit, and delete assets but not bulk delete', () => {
      expect(hasPermission('user', 'assets', 'view')).toBe(true);
      expect(hasPermission('user', 'assets', 'create')).toBe(true);
      expect(hasPermission('user', 'assets', 'edit')).toBe(true);
      expect(hasPermission('user', 'assets', 'delete')).toBe(true);
      expect(hasPermission('user', 'assets', 'bulkDelete')).toBe(false);
    });

    it('should return false for unknown roles or actions', () => {
      expect(hasPermission('unknown' as any, 'users', 'view')).toBe(false);
      expect(hasPermission('admin', 'unknown' as any, 'view')).toBe(false);
      expect(hasPermission('admin', 'users', 'unknown' as any)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the specified permissions', () => {
      expect(hasAnyPermission('user', 'assets', ['view', 'create', 'edit'])).toBe(true);
      expect(hasAnyPermission('user', 'users', ['view', 'create'])).toBe(true);
    });

    it('should return false if user has none of the specified permissions', () => {
      expect(hasAnyPermission('user', 'users', ['create', 'edit', 'delete'])).toBe(false);
      expect(hasAnyPermission('user', 'tenants', ['create', 'edit', 'delete'])).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for admin role', () => {
      const adminPermissions = getRolePermissions('admin');
      expect(adminPermissions.length).toBeGreaterThan(0);
      expect(adminPermissions.some(p => p.resource === 'users' && p.actions.includes('create'))).toBe(true);
    });

    it('should return limited permissions for user role', () => {
      const userPermissions = getRolePermissions('user');
      expect(userPermissions.length).toBeGreaterThan(0);
      expect(userPermissions.some(p => p.resource === 'users' && p.actions.includes('view'))).toBe(true);
      expect(userPermissions.some(p => p.resource === 'users' && p.actions.includes('create'))).toBe(false);
    });
  });
});