import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScenarioVisualization } from '../domains/journeys/components/ScenarioVisualization';

describe('ScenarioVisualization', () => {
  it('renders correctly', () => {
    render(<ScenarioVisualization rootTitle='원작 장면' currentTitle='바뀐 선택' isForked />);

    expect(screen.getByLabelText('시나리오 가지 흐름')).toBeInTheDocument();
    expect(screen.getByText('원작 장면')).toBeInTheDocument();
    expect(screen.getByText('바뀐 선택')).toBeInTheDocument();
    expect(screen.getByText('이어질 대화')).toBeInTheDocument();
    expect(screen.getByText('원본에서 한 번 더 갈라진 현재 해석입니다.')).toBeInTheDocument();
  });
});
