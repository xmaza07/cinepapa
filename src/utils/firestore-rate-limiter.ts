
import RateLimiter from '@/utils/rate-limiter';

// Create rate limiters for different Firestore operations
const READ_LIMIT = 50000;
const WRITE_LIMIT = 20000;
const DELETE_LIMIT = 20000;
const INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class FirestoreRateLimiter {
  private static instance: FirestoreRateLimiter;
  private readLimiter: RateLimiter;
  private writeLimiter: RateLimiter;
  private deleteLimiter: RateLimiter;

  private constructor() {
    this.readLimiter = new RateLimiter(READ_LIMIT, INTERVAL);
    this.writeLimiter = new RateLimiter(WRITE_LIMIT, INTERVAL);
    this.deleteLimiter = new RateLimiter(DELETE_LIMIT, INTERVAL);
  }

  public static getInstance(): FirestoreRateLimiter {
    if (!FirestoreRateLimiter.instance) {
      FirestoreRateLimiter.instance = new FirestoreRateLimiter();
    }
    return FirestoreRateLimiter.instance;
  }

  public async checkRead(): Promise<boolean> {
    return this.readLimiter.tryAcquire();
  }

  public async checkWrite(): Promise<boolean> {
    return this.writeLimiter.tryAcquire();
  }

  public async checkDelete(): Promise<boolean> {
    return this.deleteLimiter.tryAcquire();
  }

  public getRemainingReads(): number {
    return this.readLimiter.getRemaining();
  }

  public getRemainingWrites(): number {
    return this.writeLimiter.getRemaining();
  }

  public getRemainingDeletes(): number {
    return this.deleteLimiter.getRemaining();
  }
}

export default FirestoreRateLimiter;
