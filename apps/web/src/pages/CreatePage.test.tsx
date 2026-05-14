import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../store/gameStore', () => ({
  useGameStore: (sel: (s: { setGameState: () => void }) => unknown) =>
    sel({ setGameState: vi.fn() }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ token: null, user: null }),
}));

vi.mock('../lib/api', () => ({
  api: { createGame: vi.fn() },
}));

vi.mock('../socket/socket', () => ({
  getSocket: () => ({ connect: vi.fn(), emit: vi.fn(), once: vi.fn(), on: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/PageTransition', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CreatePage from './CreatePage';

const ALL_TOPICS = [
  { label: 'Histoire',     id: 'HISTOIRE' },
  { label: 'Géographie',   id: 'GEOGRAPHIE' },
  { label: 'Géopolitique', id: 'GEOPOLITIQUE' },
  { label: 'Cinéma',       id: 'CINEMA' },
  { label: 'Philosophie',  id: 'PHILOSOPHIE' },
  { label: 'Littérature',  id: 'LITTERATURE' },
  { label: 'Animaux',      id: 'ANIMAUX' },
  { label: 'Informatique', id: 'INFORMATIQUE' },
] as const;

// Récupère le bouton déclencheur du dropdown (il contient le label courant)
const getTrigger = () => screen.getByTestId('topic-trigger');

const renderPage = () =>
  render(<MemoryRouter><CreatePage /></MemoryRouter>);

const openDropdown = () => fireEvent.click(getTrigger());

// ── Ouverture / fermeture ────────────────────────────────────────────────────

describe('Topic dropdown — ouverture', () => {
  beforeEach(renderPage);

  it('affiche "Mixte (tous)" par défaut', () => {
    expect(getTrigger().textContent).toContain('Mixte (tous)');
  });

  it('ouvre la liste des topics au clic', () => {
    openDropdown();
    expect(screen.getByTestId('topic-list')).toBeInTheDocument();
  });

  it('ferme la liste au second clic sur le déclencheur', () => {
    openDropdown();
    openDropdown();
    expect(screen.queryByTestId('topic-list')).not.toBeInTheDocument();
  });

  it('ferme la liste au clic extérieur', () => {
    openDropdown();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('topic-list')).not.toBeInTheDocument();
  });

  it('expose les 8 topics', () => {
    openDropdown();
    const list = screen.getByTestId('topic-list');
    expect(within(list).getAllByRole('button').length).toBeGreaterThanOrEqual(ALL_TOPICS.length);
  });
});

// ── Sélection individuelle — le bon topic pour chaque label ─────────────────

describe('Topic dropdown — sélection individuelle', () => {
  ALL_TOPICS.forEach(({ label }) => {
    it(`cliquer sur "${label}" affiche "${label}" dans le déclencheur`, () => {
      renderPage();
      openDropdown();
      fireEvent.click(screen.getByTestId(`topic-option-${label}`));
      expect(getTrigger().textContent).toContain(label);
    });

    it(`cliquer sur "${label}" n'affiche pas d'autre topic dans le déclencheur`, () => {
      renderPage();
      openDropdown();
      fireEvent.click(screen.getByTestId(`topic-option-${label}`));
      const triggerText = getTrigger().textContent ?? '';
      ALL_TOPICS.filter((t) => t.label !== label).forEach(({ label: other }) => {
        expect(triggerText).not.toContain(other);
      });
    });
  });
});

// ── Multi-sélection ───────────────────────────────────────────────────────────

describe('Topic dropdown — multi-sélection', () => {
  it('peut sélectionner plusieurs topics', () => {
    renderPage();
    openDropdown();
    fireEvent.click(screen.getByTestId('topic-option-Histoire'));
    fireEvent.click(screen.getByTestId('topic-option-Cinéma'));
    const text = getTrigger().textContent ?? '';
    expect(text).toContain('Histoire');
    expect(text).toContain('Cinéma');
  });

  it('désélectionner un topic coché le retire du déclencheur', () => {
    renderPage();
    openDropdown();
    fireEvent.click(screen.getByTestId('topic-option-Géopolitique')); // select
    fireEvent.click(screen.getByTestId('topic-option-Géopolitique')); // deselect
    expect(getTrigger().textContent).toContain('Mixte (tous)');
  });

  it('"Tout décocher" remet le déclencheur à "Mixte (tous)"', () => {
    renderPage();
    openDropdown();
    fireEvent.click(screen.getByTestId('topic-option-Animaux'));
    fireEvent.click(screen.getByTestId('topic-option-Informatique'));
    fireEvent.click(screen.getByTestId('topic-clear'));
    expect(getTrigger().textContent).toContain('Mixte (tous)');
  });
});

// ── Cohérence ordre affiché ↔ ID sélectionné ─────────────────────────────────

describe('Topic dropdown — cohérence ordre affiché ↔ ID', () => {
  it('chaque topic produit un label unique dans le déclencheur', () => {
    renderPage();
    const seen = new Set<string>();
    ALL_TOPICS.forEach(({ label }) => {
      openDropdown();                                                    // ouvre
      fireEvent.click(screen.getByTestId(`topic-option-${label}`));    // sélectionne
      seen.add(getTrigger().textContent ?? '');
      fireEvent.click(screen.getByTestId(`topic-option-${label}`));    // désélectionne (dropdown encore ouvert)
      openDropdown();                                                    // ferme
    });
    expect(seen.size).toBe(ALL_TOPICS.length);
  });
});
