import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5; // Open after 5 consecutive failures
  private readonly timeout = 60000; // Reset after 60 seconds

  isOpen(): boolean {
    const now = Date.now();
    if (now - this.lastFailureTime > this.timeout) {
      // Reset if timeout has passed
      this.reset();
      return false;
    }
    return this.failureCount >= this.threshold;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.logger.warn(
      `Circuit breaker failure recorded. Count: ${this.failureCount}/${this.threshold}`,
    );
  }

  recordSuccess(): void {
    if (this.failureCount > 0) {
      this.logger.log(
        `Circuit breaker reset after success. Previous failures: ${this.failureCount}`,
      );
    }
    this.reset();
  }

  private reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
