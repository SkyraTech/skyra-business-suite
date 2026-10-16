import { describe, it, expect } from 'vitest';
import { AppComponent } from './app.component.js';

describe('AppComponent', () => {
  it('should initialize with application title', () => {
    const app = new AppComponent();
    expect(app.title).toBe('Skyra Business Suite');
  });
});
