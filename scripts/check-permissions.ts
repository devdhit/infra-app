/**
 * Script to verify user, tenant, roles and permissions configuration
 * Run with: npx ts-node scripts/check-permissions.ts
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

interface RolePermissions {
  [resource: string]: string[];
}

async function checkPermissions() {
  console.log('🔍 Checking User, Tenant, Roles, and Permissions Configuration\n');
  console.log('='.repeat(80));

  try {
    // 1. Check Tenants
    console.log('\n📊 TENANTS:');
    console.log('-'.repeat(80));
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            roles: true,
          }
        }
      }
    });

    if (tenants.length === 0) {
      console.log('❌ No tenants found in database!');
    } else {
      tenants.forEach((tenant, index) => {
        console.log(`\n${index + 1}. Tenant: ${tenant.name}`);
        console.log(`   ID: ${tenant.id}`);
        console.log(`   Description: ${tenant.description || 'N/A'}`);
        console.log(`   Users: ${tenant._count.users}`);
        console.log(`   Roles: ${tenant._count.roles}`);
        console.log(`   Created: ${tenant.createdAt.toISOString()}`);
      });
    }

    // 2. Check Roles
    console.log('\n\n🎭 ROLES:');
    console.log('-'.repeat(80));
    const roles = await prisma.role.findMany({
      include: {
        tenant: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: [
        { tenantId: 'asc' },
        { name: 'asc' }
      ]
    });

    if (roles.length === 0) {
      console.log('❌ No roles found in database!');
    } else {
      roles.forEach((role, index) => {
        console.log(`\n${index + 1}. Role: ${role.name}`);
        console.log(`   ID: ${role.id}`);
        console.log(`   Tenant: ${role.tenant.name}`);
        console.log(`   Description: ${role.description || 'N/A'}`);
        console.log(`   Users assigned: ${role._count.users}`);
        
        // Parse and display permissions
        const permissions = role.permissions as RolePermissions;
        console.log(`   Permissions:`);
        
        if (!permissions || Object.keys(permissions).length === 0) {
          console.log('      ⚠️  No permissions defined!');
        } else {
          Object.entries(permissions).forEach(([resource, actions]) => {
            if (Array.isArray(actions) && actions.length > 0) {
              console.log(`      - ${resource}: [${actions.join(', ')}]`);
            }
          });
        }
      });
    }

    // 3. Check Users
    console.log('\n\n👥 USERS:');
    console.log('-'.repeat(80));
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { tenantId: 'asc' },
        { email: 'asc' }
      ]
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User: ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Tenant: ${user.tenant.name} (${user.tenant.id})`);
        console.log(`   Role: ${user.role?.name || '❌ NO ROLE ASSIGNED'}`);
        console.log(`   Role ID: ${user.roleId || 'N/A'}`);
        console.log(`   Failed Login Attempts: ${user.failedLoginAttempts}`);
        console.log(`   Locked: ${user.lockedAt ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
      });
    }

    // 4. Check for issues
    console.log('\n\n⚠️  POTENTIAL ISSUES:');
    console.log('-'.repeat(80));
    
    let issueCount = 0;

    // Users without roles
    const usersWithoutRoles = users.filter(u => !u.roleId);
    if (usersWithoutRoles.length > 0) {
      issueCount++;
      console.log(`\n${issueCount}. Users without roles (${usersWithoutRoles.length}):`);
      usersWithoutRoles.forEach(u => {
        console.log(`   - ${u.email} (${u.name})`);
      });
    }

    // Users with invalid role references
    const usersWithInvalidRoles = users.filter(u => u.roleId && !u.role);
    if (usersWithInvalidRoles.length > 0) {
      issueCount++;
      console.log(`\n${issueCount}. Users with invalid role references (${usersWithInvalidRoles.length}):`);
      usersWithInvalidRoles.forEach(u => {
        console.log(`   - ${u.email}: roleId=${u.roleId} (role not found)`);
      });
    }

    // Roles without permissions
    const rolesWithoutPermissions = roles.filter(r => {
      const perms = r.permissions as RolePermissions;
      return !perms || Object.keys(perms).length === 0;
    });
    if (rolesWithoutPermissions.length > 0) {
      issueCount++;
      console.log(`\n${issueCount}. Roles without permissions (${rolesWithoutPermissions.length}):`);
      rolesWithoutPermissions.forEach(r => {
        console.log(`   - ${r.name} (Tenant: ${r.tenant.name})`);
      });
    }

    // Roles with no users
    const rolesWithNoUsers = roles.filter(r => r._count.users === 0);
    if (rolesWithNoUsers.length > 0) {
      issueCount++;
      console.log(`\n${issueCount}. Roles with no users assigned (${rolesWithNoUsers.length}):`);
      rolesWithNoUsers.forEach(r => {
        console.log(`   - ${r.name} (Tenant: ${r.tenant.name})`);
      });
    }

    // Tenants without users
    const tenantsWithoutUsers = tenants.filter(t => t._count.users === 0);
    if (tenantsWithoutUsers.length > 0) {
      issueCount++;
      console.log(`\n${issueCount}. Tenants without users (${tenantsWithoutUsers.length}):`);
      tenantsWithoutUsers.forEach(t => {
        console.log(`   - ${t.name}`);
      });
    }

    // Tenants without roles
    const tenantsWithoutRoles = tenants.filter(t => t._count.roles === 0);
    if (tenantsWithoutRoles.length > 0) {
      issueCount++;
      console.log(`\n${issueCount}. Tenants without roles (${tenantsWithoutRoles.length}):`);
      tenantsWithoutRoles.forEach(t => {
        console.log(`   - ${t.name}`);
      });
    }

    if (issueCount === 0) {
      console.log('\n✅ No issues found! All configurations look correct.');
    }

    // 5. Summary
    console.log('\n\n📈 SUMMARY:');
    console.log('-'.repeat(80));
    console.log(`Total Tenants: ${tenants.length}`);
    console.log(`Total Roles: ${roles.length}`);
    console.log(`Total Users: ${users.length}`);
    console.log(`Users with roles: ${users.filter(u => u.roleId).length}`);
    console.log(`Users without roles: ${usersWithoutRoles.length}`);
    console.log(`Admin users: ${users.filter(u => u.role?.name === 'admin').length}`);
    console.log(`Regular users: ${users.filter(u => u.role?.name === 'user').length}`);

    // 6. Test permission for each user
    console.log('\n\n🔐 PERMISSION TEST (Example checks):');
    console.log('-'.repeat(80));
    
    for (const user of users) {
      if (!user.role) {
        console.log(`\n❌ ${user.email}: Cannot check permissions (no role)`);
        continue;
      }

      const permissions = user.role.permissions as RolePermissions;
      console.log(`\n✅ ${user.email} (${user.role.name}):`);
      
      // Test common permissions
      const testsToRun = [
        { resource: 'users', action: 'view' },
        { resource: 'users', action: 'create' },
        { resource: 'tenants', action: 'view' },
        { resource: 'assets', action: 'edit' },
        { resource: 'roles', action: 'delete' },
      ];

      testsToRun.forEach(test => {
        const resourcePermissions = permissions[test.resource];
        const hasPermission = user.role?.name === 'admin' || 
          (resourcePermissions && Array.isArray(resourcePermissions) && resourcePermissions.includes(test.action));
        const status = hasPermission ? '✓' : '✗';
        console.log(`   ${status} ${test.resource}:${test.action}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Permission check complete!\n');

  } catch (error) {
    console.error('\n❌ Error checking permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkPermissions()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
