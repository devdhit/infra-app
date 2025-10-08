import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse,
  validationErrorResponse
} from '@/lib/api-utils';
import logger from '@/lib/logger';
import { ApiError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError } from '@/types/errors';
import { BaseAssetApiHandler } from '@/lib/asset-api/base-asset-handler';

// Define the structure for API route handlers
export interface ApiRouteHandlerConfig<T> {
  handler: BaseAssetApiHandler<T>;
  resourceName: string;
  createSchema?: (data: any) => T;
  updateSchema?: (data: any) => Partial<T>;
}

// Generic API route handler class
export class ApiRouteHandler<T> {
  constructor(private config: ApiRouteHandlerConfig<T>) {}

  /**
   * Handle GET requests to fetch all assets
   */
  async handleGet(request: NextRequest) {
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }

      const queryParams = getQueryParams(request);
      return await this.config.handler.getAll(user, queryParams);
    } catch (error: any) {
      logger.error(`Error in ${this.config.resourceName} GET route:`, { 
        error: error.message || error.toString(), 
        stack: error.stack || new Error().stack 
      });
      
      return this.handleError(error, 'fetch', this.config.resourceName);
    }
  }

  /**
   * Handle GET requests to fetch a single asset by ID
   */
  async handleGetById(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }

      return await this.config.handler.getById(user, id);
    } catch (error: any) {
      logger.error(`Error in ${this.config.resourceName} GET by ID route:`, { 
        error: error.message || error.toString(), 
        stack: error.stack || new Error().stack 
      });
      
      return this.handleError(error, 'fetch', this.config.resourceName);
    }
  }

  /**
   * Handle POST requests to create a new asset
   */
  async handlePost(request: NextRequest) {
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }

      const body = await parseRequestBody<any>(request);
      
      // Validate and transform data if schema is provided
      const validatedData = this.config.createSchema ? this.config.createSchema(body) : body;
      
      return await this.config.handler.create(user, validatedData);
    } catch (error: any) {
      logger.error(`Error in ${this.config.resourceName} POST route:`, { 
        error: error.message || error.toString(), 
        stack: error.stack || new Error().stack 
      });
      
      return this.handleError(error, 'create', this.config.resourceName);
    }
  }

  /**
   * Handle PUT requests to update an existing asset
   */
  async handlePut(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }

      const body = await parseRequestBody<any>(request);
      
      // Validate and transform data if schema is provided
      const validatedData = this.config.updateSchema ? this.config.updateSchema(body) : body;
      
      return await this.config.handler.update(user, id, validatedData);
    } catch (error: any) {
      logger.error(`Error in ${this.config.resourceName} PUT route:`, { 
        error: error.message || error.toString(), 
        stack: error.stack || new Error().stack 
      });
      
      return this.handleError(error, 'update', this.config.resourceName);
    }
  }

  /**
   * Handle DELETE requests to delete an asset
   */
  async handleDelete(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }

      return await this.config.handler.delete(user, id);
    } catch (error: any) {
      logger.error(`Error in ${this.config.resourceName} DELETE route:`, { 
        error: error.message || error.toString(), 
        stack: error.stack || new Error().stack 
      });
      
      return this.handleError(error, 'delete', this.config.resourceName);
    }
  }

  /**
   * Handle DELETE requests to bulk delete assets
   */
  async handleBulkDelete(request: NextRequest) {
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }

      const body = await parseRequestBody<{ ids: string[] }>(request);
      return await this.config.handler.bulkDelete(user, body.ids);
    } catch (error: any) {
      logger.error(`Error in ${this.config.resourceName} bulk DELETE route:`, { 
        error: error.message || error.toString(), 
        stack: error.stack || new Error().stack 
      });
      
      return this.handleError(error, 'delete', this.config.resourceName);
    }
  }

  /**
   * Handle errors consistently across all routes
   */
  private handleError(error: any, action: string, resourceName: string) {
    // Handle custom error types
    if (error instanceof ApiError) {
      switch (error.constructor) {
        case ValidationError:
          return validationErrorResponse((error as ValidationError).validationErrors);
        case AuthenticationError:
          return errorResponse(error.message, 401);
        case AuthorizationError:
          return errorResponse(error.message, 403);
        case NotFoundError:
          return errorResponse(error.message, 404);
        case ConflictError:
          return errorResponse(error.message, 409);
        default:
          return errorResponse(error.message, error.status);
      }
    }

    // Handle common error cases
    if (error.message && error.message.includes('Invalid JSON')) {
      return errorResponse('Invalid request body. Please ensure the request is valid JSON.', 400);
    }
    
    if (error.code === 'P2002') {
      return errorResponse(`A ${resourceName} with this identifier already exists.`, 409);
    }
    
    if (error.message && error.message.includes('Validation')) {
      return errorResponse(error.message, 400);
    }
    
    // Default error response
    const actionMap: Record<string, string> = {
      'fetch': 'fetch',
      'create': 'create',
      'update': 'update',
      'delete': 'delete'
    };
    
    const actionWord = actionMap[action] || 'perform operations on';
    return errorResponse(`Failed to ${actionWord} ${resourceName}. Please try again later.`);
  }
}