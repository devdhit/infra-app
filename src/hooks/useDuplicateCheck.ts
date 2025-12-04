import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  message: string;
  duplicateInfo?: {
    id: string;
    type: string;
    dept: string;
  };
}

/**
 * Hook for checking duplicate barcodes between PC and Warehouse IT assets
 */
export function useDuplicateCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DuplicateCheckResult | null>(null);

  const checkForDuplicate = useCallback(async (
    tenantId: string,
    barcode: string,
    assetType: 'pc' | 'warehouse'
  ): Promise<DuplicateCheckResult> => {
    if (!barcode) {
      return { isDuplicate: false, message: '' };
    }

    setIsChecking(true);
    try {
      // In a real implementation, you would call an API endpoint to check for duplicates
      // For now, we'll simulate this with a simple check
      const response = await api.get<DuplicateCheckResult>(
        `/assets/check-duplicate?tenantId=${encodeURIComponent(tenantId)}&barcode=${encodeURIComponent(barcode)}&assetType=${assetType}`
      );
      
      setResult(response);
      return response;
    } catch (error) {
      logger.error('Error checking for duplicate:', error);
      const errorResult = { 
        isDuplicate: false, 
        message: 'Error checking for duplicates' 
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isChecking,
    result,
    checkForDuplicate,
    reset
  };
}