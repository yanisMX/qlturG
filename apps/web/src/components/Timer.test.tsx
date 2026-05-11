import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Timer from './Timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche 10 secondes au départ', () => {
    const endsAt = new Date(Date.now() + 10_000).toISOString();
    render(<Timer endsAt={endsAt} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('appelle onExpire quand le timer atteint 0', async () => {
    const onExpire = vi.fn();
    const endsAt = new Date(Date.now() + 500).toISOString();

    render(<Timer endsAt={endsAt} onExpire={onExpire} />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('affiche 0 quand le temps est écoulé', async () => {
    const endsAt = new Date(Date.now() - 1000).toISOString();
    render(<Timer endsAt={endsAt} />);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
