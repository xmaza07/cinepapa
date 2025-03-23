
class RateLimiter {
  private maxRequests: number;
  private interval: number;
  private requestCount: number;
  private lastResetTime: number;

  constructor(maxRequests: number, interval: number) {
    this.maxRequests = maxRequests;
    this.interval = interval;
    this.requestCount = 0;
    this.lastResetTime = Date.now();
  }

  public async tryAcquire(): Promise<boolean> {
    this.resetIfNeeded();
    
    if (this.requestCount < this.maxRequests) {
      this.requestCount++;
      return true;
    }
    
    return false;
  }

  public getRemaining(): number {
    this.resetIfNeeded();
    return Math.max(0, this.maxRequests - this.requestCount);
  }

  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastResetTime >= this.interval) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
  }
}

export default RateLimiter;
