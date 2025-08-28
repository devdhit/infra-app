'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TenantsTable } from "@/components/tenants/tenants-table"
import { UsersTable } from "@/components/users/users-table"
import { Tenant, User } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"

// Mock data for demonstration
const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    description: 'A leading technology company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      users: 25,
      pcs: 50,
      laptops: 30,
      printers: 5,
      licenses: 100
    }
  },
  {
    id: '2',
    name: 'Globex Inc.',
    description: 'Innovation in every product',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      users: 15,
      pcs: 20,
      laptops: 15,
      printers: 3,
      licenses: 50
    }
  },
  {
    id: '3',
    name: 'Wayne Enterprises',
    description: 'Building a better tomorrow',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      users: 40,
      pcs: 80,
      laptops: 60,
      printers: 10,
      licenses: 200
    }
  }
]

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    tenantId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'user',
    tenantId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'user',
    tenantId: '2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const mockTenantsList: Tenant[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    description: 'A leading technology company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      users: 25,
      pcs: 50,
      laptops: 30,
      printers: 5,
      licenses: 100
    }
  },
  {
    id: '2',
    name: 'Globex Inc.',
    description: 'Innovation in every product',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      users: 15,
      pcs: 20,
      laptops: 15,
      printers: 3,
      licenses: 50
    }
  }
]

export default function TablesDemoPage() {
  const { t } = useTranslation()
  const [tenants] = useState<Tenant[]>(mockTenants)
  const [users] = useState<User[]>(mockUsers)
  
  const handleEditTenant = (tenant: Tenant | null) => {
    console.log('Edit tenant:', tenant)
  }
  
  const handleDeleteTenant = (id: string) => {
    console.log('Delete tenant:', id)
  }
  
  const handleEditUser = (user: User | null) => {
    console.log('Edit user:', user)
  }
  
  const handleDeleteUser = (id: string) => {
    console.log('Delete user:', id)
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tables Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates the refactored table components using the new DataTable component.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tenants Table</CardTitle>
          <CardDescription>
            A demonstration of the refactored TenantsTable component using the new DataTable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantsTable 
            tenants={mockTenantsList}
            onEdit={handleEditTenant}
            onDelete={handleDeleteTenant}
            isDeleting={false}
            deletingTenantId={null}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Users Table</CardTitle>
          <CardDescription>
            A demonstration of the refactored UsersTable component using the new DataTable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable 
            users={users}
            tenants={mockTenants}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            isDeleting={false}
            deletingUserId={null}
          />
        </CardContent>
      </Card>
    </div>
  )
}