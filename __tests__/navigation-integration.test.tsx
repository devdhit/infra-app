// Integration test to verify navigation changes
import { render, screen, waitFor } from '@testing-library/react'
import { Header } from './header'
import { ProtectedLayout } from './protected-layout'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock hooks
jest.mock('@/hooks/useApi', () => ({
  useCurrentUser: () => ({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      role: { name: 'admin' }
    },
    isLoading: false,
    error: null
  }),
  useLogout: () => ({
    logout: jest.fn(),
  })
}))

jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    canViewUsers: () => true,
    canViewTenants: () => true,
    canViewRoles: () => true,
    canViewSettings: () => true,
    canViewAssets: () => true,
    canViewPC: () => true,
    canViewLaptop: () => true,
    canViewPrinter: () => true,
    canViewLicense: () => true,
    canViewWarehouse: () => true,
    canViewInternet: () => true,
    canViewAuditLogs: () => true,
    canViewAgents: () => true
  })
}))

// Mock other dependencies
jest.mock('@/lib/api/application', () => ({
  getApplicationSettings: () => Promise.resolve({
    applicationName: 'Test App',
    shortName: 'TA'
  })
}))

jest.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

describe('Navigation Integration', () => {
  test('Header navigation renders correctly', async () => {
    render(<Header />)
    
    // Check that the header renders
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument()
    
    // Check that user info is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  test('ProtectedLayout uses header navigation', async () => {
    render(
      <ProtectedLayout>
        <div>Test Content</div>
      </ProtectedLayout>
    )
    
    // Check that navigation is in the header
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument()
    
    // Check that the content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})