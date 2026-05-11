'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AuthThreeStage, type AuthStageVariant } from './AuthThreeStage';

type AuthStage = {
  id: number;
  title: string;
  description: string;
};

type AuthScrollytellingProps = {
  stages: AuthStage[];
  form: ReactNode;
  variant: AuthStageVariant;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function AuthScrollytelling({ stages, form, variant }: AuthScrollytellingProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(900);

  const expansionHeight = viewportHeight * 0.5;
  const takeover = clamp(scrollTop / expansionHeight, 0, 1);
  const showBackToTop = scrollTop > 100;
  const activeStage = clamp(Math.round(scrollTop / viewportHeight), 0, stages.length - 1);
  const stageScroll = Math.max(0, scrollTop - expansionHeight);
  const stageProgress = clamp(stageScroll / Math.max(1, viewportHeight * (stages.length - 1)), 0, 1);
  const stagePosition = stageProgress * stages.length;
  const blendedStage = clamp(Math.floor(stagePosition), 0, stages.length - 1);
  const stageBlend = clamp(stagePosition - blendedStage, 0, 1);

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);

    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  const scrollDown = () => {
    scrollerRef.current?.scrollBy({ top: viewportHeight * 0.8, behavior: 'smooth' });
  };

  const scrollToStage = (stageId: number) => {
    scrollerRef.current?.scrollTo({ top: stageId * viewportHeight, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className='auth-live-shell'>
      <div
        ref={scrollerRef}
        className='auth-live-left'
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{ width: `calc(50vw + ${takeover * 50}vw)` }}
      >
        <div className='auth-live-content'>
          {stages.map((stage) => (
            <section className='auth-live-section' data-active={stage.id === activeStage} key={stage.id}>
              <div className='auth-live-copy'>
                <h2 className='auth-live-title'>{stage.title}</h2>
                <p className='auth-live-description'>{stage.description}</p>
              </div>

              <div className='auth-live-scene' aria-hidden='true'>
                <div className='auth-live-stage-model' key={`${variant}-${stage.id}`}>
                  <AuthThreeStage
                    variant={variant}
                    stageId={stage.id}
                    stageBlend={stage.id === blendedStage ? stageBlend : 0}
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        <nav className='auth-live-progress' aria-label='Auth story progress'>
          {stages.map((stage) => (
            <button
              aria-current={stage.id === activeStage ? 'step' : undefined}
              aria-label={`${stage.title} 단계로 이동`}
              className='auth-live-progress__dot'
              key={stage.id}
              onClick={() => scrollToStage(stage.id)}
              title={stage.title}
              type='button'
            />
          ))}
        </nav>
      </div>

      <div
        className='auth-live-right'
        style={{
          width: `calc(50vw - ${takeover * 50}vw)`,
          opacity: 1 - takeover,
          pointerEvents: takeover >= 1 ? 'none' : 'auto'
        }}
      >
        {form}
      </div>

      {showBackToTop ? (
        <button className='auth-live-top' type='button' onClick={scrollToTop}>
          ↑ Top
        </button>
      ) : (
        <button className='auth-live-scroll' type='button' aria-label='Scroll Down' onClick={scrollDown}>
          <span aria-hidden='true' />
        </button>
      )}
    </main>
  );
}
