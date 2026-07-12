import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

@Injectable()
export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  static run(context: RequestContext, callback: () => void): void {
    this.storage.run(context, callback);
  }

  static get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
    const store = this.storage.getStore();
    return store ? store[key] : undefined;
  }

  static getStore(): RequestContext | undefined {
    return this.storage.getStore();
  }

  static set<T extends keyof RequestContext>(key: T, value: RequestContext[T]): void {
    const store = this.storage.getStore();
    if (store) {
      store[key] = value;
    }
  }
}
