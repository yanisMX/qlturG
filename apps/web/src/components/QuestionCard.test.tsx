import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionCard from './QuestionCard';

const choices = ['486', '496', '508', '511'];

describe('QuestionCard', () => {
  it('affiche la question et les 4 choix', () => {
    render(
      <QuestionCard
        text="En quelle année Clovis fut-il baptisé ?"
        choices={choices}
        selectedIndex={null}
        disabled={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('En quelle année Clovis fut-il baptisé ?')).toBeInTheDocument();
    choices.forEach((c) => expect(screen.getByText(c)).toBeInTheDocument());
  });

  it('appelle onSelect avec le bon index au clic', () => {
    const onSelect = vi.fn();
    render(
      <QuestionCard
        text="Question test"
        choices={choices}
        selectedIndex={null}
        disabled={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText('496'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('désactive les boutons quand disabled=true', () => {
    const onSelect = vi.fn();
    render(
      <QuestionCard
        text="Question test"
        choices={choices}
        selectedIndex={null}
        disabled={true}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText('486'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
