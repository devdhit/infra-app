import { useCallback } from 'react';
import logger from '@/lib/logger';

/**
 * Optimistic Update Hook
 * Updates local state immediately for instant UI feedback,
 * then syncs with server in the background
 */

export interface OptimisticUpdateOptions<T> {
  /**
   * Function to update server data
   */
  updateFn: (updatedItem: T) => Promise<T>;
  
  /**
   * Callback when update succeeds
   */
  onSuccess?: (data: T) => void;
  
  /**
   * Callback when update fails (for rollback)
   */
  onError?: (error: Error, rollbackData: T) => void;
  
  /**
   * Custom comparison function to find item in array
   */
  compareFn?: (item: T, targetId: string) => boolean;
}

export function useOptimisticUpdate<T extends { id: string }>() {
  /**
   * Optimistically update an item in an array
   * @param items - Current items array
   * @param itemId - ID of item to update
   * @param updates - Partial updates to apply
   * @param options - Update options including server sync function
   * @returns Updated items array
   */
  const optimisticUpdate = useCallback(
    async (
      items: T[],
      itemId: string,
      updates: Partial<T>,
      options: OptimisticUpdateOptions<T>
    ): Promise<T[]> => {
      const { updateFn, onSuccess, onError, compareFn } = options;
      
      // Find the item to update
      const itemIndex = items.findIndex(item => 
        compareFn ? compareFn(item, itemId) : item.id === itemId
      );
      
      if (itemIndex === -1) {
        logger.warn(`Item with id ${itemId} not found for optimistic update`);
        return items;
      }
      
      // Store original item for potential rollback
      const originalItem = items[itemIndex];
      
      // Create optimistically updated item
      const optimisticItem: T = { ...originalItem, ...updates } as T;
      
      // Create new array with updated item (immutable)
      const optimisticItems: T[] = [
        ...items.slice(0, itemIndex),
        optimisticItem,
        ...items.slice(itemIndex + 1)
      ];
      
      // Sync with server in background (don't await)
      updateFn(optimisticItem as T)
        .then((serverData) => {
          logger.debug('Optimistic update confirmed by server', { itemId });
          onSuccess?.(serverData);
        })
        .catch((error) => {
          logger.error('Optimistic update failed, rolling back', { 
            itemId, 
            error: error.message 
          });
          // Rollback will be handled by the component
          onError?.(error, originalItem as T);
        });
      
      // Return immediately with optimistic update
      return optimisticItems;
    },
    []
  );
  
  /**
   * Optimistically delete an item from an array
   * @param items - Current items array
   * @param itemId - ID of item to delete
   * @param deleteFn - Function to delete on server
   * @returns Updated items array
   */
  const optimisticDelete = useCallback(
    async <T extends { id: string }>(
      items: T[],
      itemId: string,
      deleteFn: (id: string) => Promise<void>,
      onError?: (error: Error, rollbackData: T[]) => void
    ): Promise<T[]> => {
      // Store original items for potential rollback
      const originalItems = [...items];
      
      // Remove item optimistically
      const optimisticItems = items.filter(item => item.id !== itemId);
      
      // Sync with server in background
      deleteFn(itemId)
        .then(() => {
          logger.debug('Optimistic delete confirmed by server', { itemId });
        })
        .catch((error) => {
          logger.error('Optimistic delete failed, rolling back', { 
            itemId, 
            error: error.message 
          });
          onError?.(error, originalItems);
        });
      
      return optimisticItems;
    },
    []
  );
  
  /**
   * Optimistically add an item to an array
   * @param items - Current items array
   * @param newItem - Item to add (without server-generated fields like id)
   * @param createFn - Function to create on server
   * @returns Updated items array
   */
  const optimisticCreate = useCallback(
    async <T extends { id: string }>(
      items: T[],
      newItem: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
      createFn: (item: any) => Promise<T>,
      onError?: (error: Error) => void
    ): Promise<T[]> => {
      // Create temporary optimistic item with temp ID
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: T = { 
        ...newItem, 
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as unknown as T;
      
      // Add optimistically
      const optimisticItems = [optimisticItem, ...items];
      
      // Create on server in background
      createFn(newItem)
        .then((serverItem) => {
          logger.debug('Optimistic create confirmed by server', { 
            tempId, 
            serverId: serverItem.id 
          });
          // The component should replace temp item with server item
        })
        .catch((error) => {
          logger.error('Optimistic create failed', { 
            tempId, 
            error: error.message 
          });
          onError?.(error);
        });
      
      return optimisticItems;
    },
    []
  );
  
  return {
    optimisticUpdate,
    optimisticDelete,
    optimisticCreate
  };
}
