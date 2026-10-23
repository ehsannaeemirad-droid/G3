export class ReviewRunner {
  constructor(items, { onRender, onComplete }) {
    this.items = items;
    this.index = 0;
    this.results = new Map();
    this.onRender = onRender;
    this.onComplete = onComplete;
    this.startTime = Date.now();
  }

  render() { this.onRender(this); }

  current() { return this.items[this.index]; }

  markSolved(result) {
    // itemId alone collides across lessons (every lesson has "s1-0"), so key by lesson too
    const { lessonId, itemId } = this.current();
    this.results.set(`${lessonId}/${itemId}`, result);
    setTimeout(() => {
      if (this.index < this.items.length - 1) {
        this.index += 1;
        this.render();
      } else {
        this.onComplete(this);
      }
    }, result === 'skipped' ? 1800 : 1200);
  }

  finish() { this.onComplete(this); }

  getStats() {
    let correct = 0;
    const total = this.items.length;
    this.results.forEach(r => { if (r === 'correct') correct += 1; });
    return {
      correct,
      total,
      elapsedMs: Date.now() - this.startTime,
      results: Object.fromEntries(this.results),
    };
  }
}
