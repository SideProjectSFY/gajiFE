'use client';

type ScenarioVisualizationProps = {
  rootTitle?: string | null;
  currentTitle?: string | null;
  isForked?: boolean;
};

export function ScenarioVisualization({
  rootTitle,
  currentTitle,
  isForked = false
}: ScenarioVisualizationProps) {
  return (
    <div className='scenario-map' aria-label='시나리오 가지 흐름'>
      <div className='scenario-map__rail' aria-hidden='true' />
      <div className='scenario-map__node scenario-map__node--base'>
        <span>원본</span>
        <strong>{rootTitle || '원작의 선택'}</strong>
        <p>이야기가 갈라지기 전의 기준점입니다.</p>
      </div>
      <div className='scenario-map__node scenario-map__node--active'>
        <span>현재</span>
        <strong>{currentTitle || '현재 가지'}</strong>
        <p>{isForked ? '원본에서 한 번 더 갈라진 현재 해석입니다.' : '원작의 선택을 다르게 놓은 현재 가지입니다.'}</p>
      </div>
      <div className='scenario-map__node scenario-map__node--leaf'>
        <span>다음</span>
        <strong>이어질 대화</strong>
        <p>대화 중 마음에 드는 지점에서 새 가지로 이어갈 수 있어요.</p>
      </div>
    </div>
  );
}
