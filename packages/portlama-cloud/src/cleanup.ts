/**
 * Cleanup stack — maintains a LIFO queue of rollback actions.
 *
 * On error, runs all registered cleanup actions in reverse order.
 * Individual failures are swallowed to ensure all cleanups are attempted.
 */

type CleanupAction = () => Promise<void>;

export class CleanupStack {
  readonly actions: Array<{ label: string; fn: CleanupAction }> = [];

  push(label: string, fn: CleanupAction): void {
    this.actions.push({ label, fn });
  }

  clear(): void {
    this.actions.length = 0;
  }

  async runAll(): Promise<boolean> {
    let allSucceeded = true;
    // Run in reverse order
    for (let i = this.actions.length - 1; i >= 0; i--) {
      try {
        await this.actions[i]!.fn();
      } catch {
        allSucceeded = false;
      }
    }
    return allSucceeded;
  }
}
