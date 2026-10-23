export class LessonRunner {
  constructor(lesson, opts = {}) {
    this.lesson = lesson;
    const max = Math.max(0, lesson.steps.length - 1);
    this.step = Math.min(Math.max(0, opts.initialStep || 0), max);
    this.mode = 'teach';
    this.item = 0;
    this.outcomes = { ...(opts.initialOutcomes || {}) };
    this.solved = new Set(Object.keys(this.outcomes));
    this.startTime = opts.startTime || Date.now();
    this.onRender = opts.onRender || (() => {});
    this.onComplete = opts.onComplete || (() => {});
    this.onOutcomeSaved = opts.onOutcomeSaved || null;
  }

  render() {
    this.onRender(this);
  }

  startPractice() {
    this.mode = 'item';
    this.item = 0;
    this.render();
  }

  markSolved(result) {
    const key = `s${this.step}-${this.item}`;
    // Already solved before a reload: keep the earlier outcome but still advance,
    // otherwise resuming a half-done step would leave the learner stuck.
    if (!this.solved.has(key)) {
      this.solved.add(key);
      this.outcomes[key] = result;
      this.onOutcomeSaved?.(this.outcomes);
    }

    const total = this.lesson.steps[this.step].items.length;
    setTimeout(() => {
      if (this.item + 1 < total) {
        this.item += 1;
        this.render();
      } else {
        this.mode = 'complete';
        this.render();
      }
    }, result === 'skipped' ? 1800 : 1200);
  }

  nextStep() {
    if (this.step + 1 >= this.lesson.steps.length) {
      this.onComplete(this);
      return;
    }
    this.step += 1;
    this.mode = 'teach';
    this.item = 0;
    this.render();
  }

  skipStage() {
    const step = this.lesson.steps[this.step];
    step.items.forEach((_, i) => {
      const key = `s${this.step}-${i}`;
      if (!this.solved.has(key)) {
        this.solved.add(key);
        this.outcomes[key] = 'skipped';
      }
    });
    this.onOutcomeSaved?.(this.outcomes);
    this.onComplete(this);
  }

  getStats() {
    const byTag = {};
    Object.entries(this.outcomes).forEach(([key, outcome]) => {
      const m = key.match(/^s(\d+)-(\d+)$/);
      if (!m) return;
      const item = this.lesson.steps[+m[1]].items[+m[2]];
      const tag = item.tag || 'other';
      if (!byTag[tag]) byTag[tag] = { t: 0, c: 0 };
      byTag[tag].t += 1;
      if (outcome === 'correct') byTag[tag].c += 1;
    });
    const totalSolved = Object.keys(this.outcomes).length;
    return { byTag, totalSolved, elapsedMs: Date.now() - this.startTime };
  }
}
