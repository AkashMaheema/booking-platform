import { RequestIdMiddleware, RequestWithId } from '../request-id.middleware';
import { Response, NextFunction } from 'express';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('should use existing request id if provided', () => {
    const req = { headers: { 'x-request-id': 'custom-id' } } as unknown as RequestWithId;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.id).toBe('custom-id');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'custom-id');
    expect(next).toHaveBeenCalled();
  });

  it('should generate a new request id if not provided', () => {
    const req = { headers: {} } as unknown as RequestWithId;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.id).toBeDefined();
    expect(typeof req.id).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.id);
    expect(next).toHaveBeenCalled();
  });
});
