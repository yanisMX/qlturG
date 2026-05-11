import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Scoreboard from './Scoreboard';

const players = [
  { id: 'p1', nickname: 'Alice', score: 2000 },
  { id: 'p2', nickname: 'Bob', score: 3500 },
  { id: 'p3', nickname: 'Charlie', score: 1000 },
];

describe('Scoreboard', () => {
  it('trie les joueurs par score décroissant', () => {
    render(<Scoreboard players={players} myPlayerId={null} />);
    const names = screen.getAllByText(/Alice|Bob|Charlie/).map((el) => el.textContent);
    expect(names).toEqual(['Bob', 'Alice', 'Charlie']);
  });

  it('affiche le score quand compact=false', () => {
    render(<Scoreboard players={players} myPlayerId={null} />);
    expect(screen.getByText('3 500')).toBeInTheDocument();
    expect(screen.getByText('2 000')).toBeInTheDocument();
  });

  it('masque le score en mode compact', () => {
    render(<Scoreboard players={players} myPlayerId={null} compact />);
    expect(screen.queryByText('3 500')).not.toBeInTheDocument();
    expect(screen.queryByText('2 000')).not.toBeInTheDocument();
  });

  it('met en surbrillance le joueur courant', () => {
    const { container } = render(<Scoreboard players={players} myPlayerId="p2" />);
    const highlighted = container.querySelector('.bg-navy-50');
    expect(highlighted).toBeInTheDocument();
    expect(highlighted?.textContent).toContain('Bob');
  });

  it('affiche le badge delta quand revealScores fourni et delta > 0', () => {
    const revealScores = [
      { playerId: 'p1', deltaThisRound: 850 },
      { playerId: 'p2', deltaThisRound: 0 },
      { playerId: 'p3', deltaThisRound: 1000 },
    ];
    render(<Scoreboard players={players} myPlayerId={null} revealScores={revealScores} />);
    expect(screen.getByText('+850')).toBeInTheDocument();
    expect(screen.getByText('+1 000')).toBeInTheDocument();
    expect(screen.queryByText('+0')).not.toBeInTheDocument();
  });

  it("n'affiche pas de badge delta sans revealScores", () => {
    render(<Scoreboard players={players} myPlayerId={null} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});
