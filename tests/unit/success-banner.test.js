// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('success-banner', () => {
  var showBanner, hideBanner;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    var mod = await import('../../components/success-banner.js');
    showBanner = mod.showBanner;
    hideBanner = mod.hideBanner;
  });

  describe('strip variant', () => {
    it('injects element into body', () => {
      showBanner({ buttons: [] });
      expect(document.body.children.length).toBe(1);
    });

    it('slides in on show', () => {
      showBanner({ buttons: [] });
      expect(document.body.children[0].style.transform).toBe('translateY(0)');
    });

    it('slides out on hide', () => {
      showBanner({ buttons: [] });
      hideBanner();
      expect(document.body.children[0].style.transform).toBe('translateY(100%)');
    });

    it('shows default text', () => {
      showBanner({ buttons: [] });
      expect(document.body.textContent).toContain('Well done!');
    });

    it('shows custom text', () => {
      showBanner({ text: 'Amazing!', buttons: [] });
      expect(document.body.textContent).toContain('Amazing!');
    });

    it('renders button with given label', () => {
      showBanner({ buttons: [{ label: 'Go!', onClick: vi.fn() }] });
      expect(document.querySelector('button').textContent).toBe('Go!');
    });

    it('calls button onClick', () => {
      var fn = vi.fn();
      showBanner({ buttons: [{ label: 'Go', onClick: fn }] });
      document.querySelector('button').click();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('reuses same element on repeated calls', () => {
      showBanner({ buttons: [] });
      showBanner({ buttons: [] });
      expect(document.body.children.length).toBe(1);
    });
  });

  describe('fullscreen variant', () => {
    it('shows with display flex', () => {
      showBanner({ fullscreen: true, buttons: [] });
      expect(document.body.children[0].style.display).toBe('flex');
    });

    it('hides with display none', () => {
      showBanner({ fullscreen: true, buttons: [] });
      hideBanner();
      expect(document.body.children[0].style.display).toBe('none');
    });

    it('shows icon when provided', () => {
      showBanner({ fullscreen: true, icon: '\u2705', buttons: [] });
      expect(document.body.textContent).toContain('\u2705');
    });

    it('recreates element when switching from strip to fullscreen', () => {
      showBanner({ buttons: [] });
      var first = document.body.children[0];
      showBanner({ fullscreen: true, buttons: [] });
      expect(document.body.children[0]).not.toBe(first);
    });
  });

  describe('window.showBanner compat', () => {
    it('sets window.showBanner', () => {
      expect(typeof window.showBanner).toBe('function');
    });

    it('sets window.hideBanner', () => {
      expect(typeof window.hideBanner).toBe('function');
    });

    it('shows banner with Next label', () => {
      window.showBanner(vi.fn());
      expect(document.querySelector('button').textContent).toBe('Next \u2192');
    });

    it('calls onNext when Next clicked', () => {
      var fn = vi.fn();
      window.showBanner(fn);
      document.querySelector('button').click();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('hides banner before calling onNext', () => {
      var hiddenWhenCalled = false;
      window.showBanner(function() {
        hiddenWhenCalled = document.body.children[0].style.transform === 'translateY(100%)';
      });
      document.querySelector('button').click();
      expect(hiddenWhenCalled).toBe(true);
    });

    it('window.hideBanner hides the banner', () => {
      window.showBanner(vi.fn());
      window.hideBanner();
      expect(document.body.children[0].style.transform).toBe('translateY(100%)');
    });
  });
});
