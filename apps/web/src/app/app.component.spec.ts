import { describe, it, expect } from 'vitest';
import { AppComponent } from './app.component.js';

describe('AppComponent', () => {
  it('should initialize with zoneless configuration', () => {
    const app = new AppComponent();
    expect(app.title).toBe('Skyra Business Suite');
    expect(app.isZoneless).toBe(true);
    expect(app.getAppInfo()).toContain('Zoneless: true');
  });
});
