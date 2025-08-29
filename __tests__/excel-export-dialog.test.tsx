import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExcelExportDialog } from '@/components/assets/excel-export-dialog'
import * as api from '@/lib/api'
import { toast } from 'sonner'
import '@testing-library/jest-dom'

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn()
  }
}))

// Mock the toast module
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock the useTranslation hook
jest.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string, ...args: any[]) => {
      if (args.length > 0) {
        return fallback.replace('{0}', args[0])
      }
      return fallback
    },
    loading: false
  })
}))

describe('ExcelExportDialog', () => {
  const defaultProps = {
    assetType: 'pc',
    title: 'PC',
    isOpen: true,
    onClose: jest.fn(),
    selectedAssetIds: ['1', '2', '3']
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render the dialog with correct title and description', () => {
    render(<ExcelExportDialog {...defaultProps} />)
    
    expect(screen.getByText('Export PC')).toBeInTheDocument()
    expect(screen.getByText('Export pc data to an Excel file')).toBeInTheDocument()
  })

  test('should display export options', () => {
    render(<ExcelExportDialog {...defaultProps} />)
    
    expect(screen.getByText('Export Options')).toBeInTheDocument()
    expect(screen.getByLabelText('All pc')).toBeInTheDocument()
    expect(screen.getByLabelText('3 selected items')).toBeInTheDocument()
  })

  test('should disable selected items option when no items are selected', () => {
    render(<ExcelExportDialog {...defaultProps} selectedAssetIds={[]} />)
    
    const selectedOption = screen.getByLabelText('0 selected items (no items selected)')
    expect(selectedOption).toBeDisabled()
  })

  test('should enable export button by default (export all)', () => {
    render(<ExcelExportDialog {...defaultProps} />)
    
    const exportButton = screen.getByRole('button', { name: 'Export Data' })
    expect(exportButton).toBeEnabled()
  })

  test('should disable export button when exporting selected items with no selection', () => {
    render(<ExcelExportDialog {...defaultProps} selectedAssetIds={[]} />)
    
    // Select the "selected items" option
    const selectedRadio = screen.getByLabelText('0 selected items (no items selected)')
    fireEvent.click(selectedRadio)
    
    const exportButton = screen.getByRole('button', { name: 'Export Data' })
    expect(exportButton).toBeDisabled()
  })

  test('should call API with correct parameters when exporting all items', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    ;(api.api.get as jest.Mock).mockResolvedValue(mockBlob)
    
    render(<ExcelExportDialog {...defaultProps} />)
    
    const exportButton = screen.getByRole('button', { name: 'Export Data' })
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(api.api.get).toHaveBeenCalledWith(
        '/assets/excel/export?assetType=pc',
        { responseType: 'blob' }
      )
    })
  })

  test('should call API with selected IDs when exporting selected items', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    ;(api.api.get as jest.Mock).mockResolvedValue(mockBlob)
    
    render(<ExcelExportDialog {...defaultProps} />)
    
    // Select the "selected items" option
    const selectedRadio = screen.getByLabelText('3 selected items')
    fireEvent.click(selectedRadio)
    
    const exportButton = screen.getByRole('button', { name: 'Export Data' })
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(api.api.get).toHaveBeenCalledWith(
        '/assets/excel/export?assetType=pc&selectedIds=["1","2","3"]',
        { responseType: 'blob' }
      )
    })
  })

  test('should show success toast on successful export', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    ;(api.api.get as jest.Mock).mockResolvedValue(mockBlob)
    
    render(<ExcelExportDialog {...defaultProps} />)
    
    const exportButton = screen.getByRole('button', { name: 'Export Data' })
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('PC export completed')
    })
  })

  test('should show error toast on export failure', async () => {
    ;(api.api.get as jest.Mock).mockRejectedValue(new Error('Export failed'))
    
    render(<ExcelExportDialog {...defaultProps} />)
    
    const exportButton = screen.getByRole('button', { name: 'Export Data' })
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to export assets')
    })
  })
})