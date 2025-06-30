interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimit {
  private prefix: string;
  private window: number; // in seconds
  private maxRequests: number;

  constructor(options: {
    prefix?: string;
    window?: number; // in seconds
    limit?: number;
  } = {}) {
    this.prefix = options.prefix ?? 'ratelimit';
    this.window = options.window ?? 3600; // 1 hour default
    this.maxRequests = options.limit ?? 100; // 100 requests per hour default
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / (this.window * 1000)) * this.window * 1000;
    const windowEnd = windowStart + (this.window * 1000);

    try {
      // Use in-memory storage
      return this.memoryLimit(identifier, windowEnd);
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request but log it
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: windowEnd,
      };
    }
  }

  private inMemoryStore = new Map<string, { count: number; resetTime: number }>();

  private memoryLimit(identifier: string, windowEnd: number): RateLimitResult {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    
    let data = this.inMemoryStore.get(key);
    
    // Reset if window has passed
    if (!data || data.resetTime <= now) {
      data = { count: 0, resetTime: windowEnd };
    }
    
    data.count++;
    this.inMemoryStore.set(key, data);
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }
    
    return {
      success: data.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - data.count),
      reset: data.resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, data] of this.inMemoryStore) {
      if (data.resetTime <= now) {
        this.inMemoryStore.delete(key);
      }
    }
  }
}

// Default rate limiter for video script generation
export const ratelimit = new RateLimit({
  prefix: 'video-script-gen',
  window: 3600, // 1 hour
  limit: 50, // 50 script generations per hour per user
});

// Different rate limiters for different use cases
export const createRateLimit = (options: {
  prefix?: string;
  window?: number;
  limit?: number;
}) => new RateLimit(options);

// Specialized rate limiters
export const streamingRateLimit = new RateLimit({
  prefix: 'video-script-streaming',
  window: 300, // 5 minutes
  limit: 10, // 10 streaming requests per 5 minutes
});

export const variationRateLimit = new RateLimit({
  prefix: 'video-script-variations',
  window: 3600, // 1 hour
  limit: 20, // 20 variation requests per hour
}); 