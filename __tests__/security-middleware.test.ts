import { NextRequest } from 'next/server';
import { securityMiddleware } from '../src/lib/security-middleware';
import { sqlInjectionMiddleware } from '../src/lib/sql-injection-middleware';

// Mock NextRequest
const createMockRequest = (url: string, headers: Record<string, string> = {}, body?: any) => {
  return {
    url,
    headers: {
      get: (name: string) => headers[name] || null
    },
    json: async () => body || {}
  } as unknown as NextRequest;
};

describe('Security Middleware', () => {
  describe('SQL Injection Protection', () => {
    it('should block requests with SQL injection patterns in query parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?param=SELECT * FROM users');
      const result = await sqlInjectionMiddleware(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });

    it('should allow requests without SQL injection patterns', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?param=normal_value');
      const result = await sqlInjectionMiddleware(request);
      expect(result).toBeNull();
    });

    it('should block requests with SQL injection patterns in JSON body', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/test', 
        { 'content-type': 'application/json' },
        { field: 'DROP TABLE users' }
      );
      const result = await sqlInjectionMiddleware(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(400);
    });

    it('should allow requests with clean JSON body', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/test', 
        { 'content-type': 'application/json' },
        { field: 'normal_value' }
      );
      const result = await sqlInjectionMiddleware(request);
      expect(result).toBeNull();
    });
  });

  describe('XSS Protection', () => {
    it('should block requests with XSS patterns in query parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?param=<script>alert("xss")</script>');
      const result = await securityMiddleware(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should allow requests without XSS patterns', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?param=normal_value');
      const result = await securityMiddleware(request);
      expect(result).toBeNull();
    });
  });

  describe('Suspicious User Agent Detection', () => {
    it('should block requests with suspicious user agents', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/test',
        { 'user-agent': 'sqlmap/1.0' }
      );
      const result = await securityMiddleware(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should allow requests with normal user agents', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/test',
        { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      );
      const result = await securityMiddleware(request);
      expect(result).toBeNull();
    });
  });
});