class RateLimiter {
  private lastExecution: number;
  private interval: number;

  constructor(interval: number) {
    this.lastExecution = 0;
    this.interval = interval;
  }

  public canExecute(): boolean {
    const now = Date.now();
    if (now - this.lastExecution >= this.interval) {
      this.lastExecution = now;
      return true;
    }
    return false;
  }
}

export default RateLimiter;