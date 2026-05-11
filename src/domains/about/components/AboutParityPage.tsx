'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '@/i18n/useLocale';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type AboutMotionProfile = {
  heroTravel: number;
  heroBoxOpacityDrop: number;
  heroBoxTranslate: number;
  heroBoxRotate: number;
  subtitleTranslate: number;
  subtitleScaleBoost: number;
  heroBgScaleBoost: number;
  heroBgRotate: number;
  cueFadeMultiplier: number;
  missionTravelMultiplier: number;
  guideTravelMultiplier: number;
  missionHeadTranslate: number;
  guideHeadTranslate: number;
  missionBgShift: number;
  guideBgShift: number;
  missionDelayStep: number;
  guideDelayStep: number;
  observerThreshold: number;
};

function getAboutMotionProfile(viewportWidth: number): AboutMotionProfile {
  if (viewportWidth <= 360) {
    return {
      heroTravel: 320,
      heroBoxOpacityDrop: 0.54,
      heroBoxTranslate: 18,
      heroBoxRotate: 0.75,
      subtitleTranslate: 26,
      subtitleScaleBoost: 0.045,
      heroBgScaleBoost: 0.032,
      heroBgRotate: 1.4,
      cueFadeMultiplier: 0.9,
      missionTravelMultiplier: 0.84,
      guideTravelMultiplier: 0.82,
      missionHeadTranslate: 14,
      guideHeadTranslate: 12,
      missionBgShift: 16,
      guideBgShift: 12,
      missionDelayStep: 54,
      guideDelayStep: 50,
      observerThreshold: 0.16
    };
  }

  if (viewportWidth <= 378) {
    return {
      heroTravel: 335,
      heroBoxOpacityDrop: 0.57,
      heroBoxTranslate: 20,
      heroBoxRotate: 0.82,
      subtitleTranslate: 29,
      subtitleScaleBoost: 0.05,
      heroBgScaleBoost: 0.036,
      heroBgRotate: 1.6,
      cueFadeMultiplier: 0.95,
      missionTravelMultiplier: 0.87,
      guideTravelMultiplier: 0.85,
      missionHeadTranslate: 15,
      guideHeadTranslate: 13,
      missionBgShift: 18,
      guideBgShift: 14,
      missionDelayStep: 58,
      guideDelayStep: 54,
      observerThreshold: 0.165
    };
  }

  if (viewportWidth <= 393) {
    return {
      heroTravel: 350,
      heroBoxOpacityDrop: 0.6,
      heroBoxTranslate: 22,
      heroBoxRotate: 0.9,
      subtitleTranslate: 32,
      subtitleScaleBoost: 0.055,
      heroBgScaleBoost: 0.04,
      heroBgRotate: 1.8,
      cueFadeMultiplier: 1,
      missionTravelMultiplier: 0.9,
      guideTravelMultiplier: 0.88,
      missionHeadTranslate: 16,
      guideHeadTranslate: 14,
      missionBgShift: 20,
      guideBgShift: 16,
      missionDelayStep: 62,
      guideDelayStep: 58,
      observerThreshold: 0.17
    };
  }

  if (viewportWidth <= 430) {
    return {
      heroTravel: 380,
      heroBoxOpacityDrop: 0.66,
      heroBoxTranslate: 26,
      heroBoxRotate: 1.1,
      subtitleTranslate: 38,
      subtitleScaleBoost: 0.07,
      heroBgScaleBoost: 0.05,
      heroBgRotate: 2.2,
      cueFadeMultiplier: 1.1,
      missionTravelMultiplier: 0.95,
      guideTravelMultiplier: 0.92,
      missionHeadTranslate: 18,
      guideHeadTranslate: 16,
      missionBgShift: 24,
      guideBgShift: 18,
      missionDelayStep: 70,
      guideDelayStep: 65,
      observerThreshold: 0.18
    };
  }

  return {
    heroTravel: 420,
    heroBoxOpacityDrop: 0.78,
    heroBoxTranslate: 36,
    heroBoxRotate: 1.8,
    subtitleTranslate: 56,
    subtitleScaleBoost: 0.12,
    heroBgScaleBoost: 0.08,
    heroBgRotate: 4,
    cueFadeMultiplier: 1.35,
    missionTravelMultiplier: 1.05,
    guideTravelMultiplier: 1,
    missionHeadTranslate: 24,
    guideHeadTranslate: 20,
    missionBgShift: 38,
    guideBgShift: 30,
    missionDelayStep: 90,
    guideDelayStep: 85,
    observerThreshold: 0.25
  };
}

function getSectionProgress(
  section: HTMLElement | null,
  scrollY: number,
  viewportHeight: number,
  travelMultiplier = 1
): number {
  if (!section) {
    return 0;
  }

  const start = section.offsetTop - viewportHeight * 0.72;
  const travel = Math.max(420, viewportHeight * travelMultiplier);
  return clamp((scrollY - start) / travel, 0, 1);
}

export function AboutParityPage() {
  const { t } = useLocale();
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const missionRef = useRef<HTMLElement | null>(null);
  const guideRef = useRef<HTMLElement | null>(null);
  const [missionVisible, setMissionVisible] = useState<number[]>([]);
  const [guideVisible, setGuideVisible] = useState<number[]>([]);

  useEffect(() => {
    const onMeasure = () => {
      setScrollY(window.scrollY);
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };

    onMeasure();
    window.addEventListener('scroll', onMeasure, { passive: true });
    window.addEventListener('resize', onMeasure);
    return () => {
      window.removeEventListener('scroll', onMeasure);
      window.removeEventListener('resize', onMeasure);
    };
  }, []);

  const motionProfile = useMemo(() => getAboutMotionProfile(viewportWidth), [viewportWidth]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.index || '-1');
          const group = (entry.target as HTMLElement).dataset.group;
          if (!entry.isIntersecting || Number.isNaN(index)) {
            return;
          }

          if (group === 'mission') {
            setMissionVisible((prev) => (prev.includes(index) ? prev : [...prev, index]));
          }
          if (group === 'guide') {
            setGuideVisible((prev) => (prev.includes(index) ? prev : [...prev, index]));
          }
        });
      },
      { threshold: motionProfile.observerThreshold }
    );

    const missionItems = missionRef.current?.querySelectorAll<HTMLElement>('[data-group="mission"]') || [];
    const guideItems = guideRef.current?.querySelectorAll<HTMLElement>('[data-group="guide"]') || [];

    missionItems.forEach((item) => observer.observe(item));
    guideItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [motionProfile.observerThreshold]);

  const heroMotion = useMemo(() => {
    const progress = clamp(scrollY / motionProfile.heroTravel, 0, 1);

    return {
      boxOpacity: 1 - progress * motionProfile.heroBoxOpacityDrop,
      boxTranslate: progress * -motionProfile.heroBoxTranslate,
      boxRotate: progress * motionProfile.heroBoxRotate,
      subtitleOpacity: 1 - progress,
      subtitleTranslate: progress * -motionProfile.subtitleTranslate,
      subtitleScale: 1 + progress * motionProfile.subtitleScaleBoost,
      heroBgScale: 1 + progress * motionProfile.heroBgScaleBoost,
      heroBgRotate: progress * motionProfile.heroBgRotate,
      cueOpacity: 1 - progress * motionProfile.cueFadeMultiplier
    };
  }, [motionProfile, scrollY]);

  const missionMotion = useMemo(() => {
    const progress = getSectionProgress(
      missionRef.current,
      scrollY,
      viewportHeight,
      motionProfile.missionTravelMultiplier
    );
    return {
      progress,
      headOpacity: clamp(0.4 + progress * 0.6, 0, 1),
      headTranslate: (1 - progress) * motionProfile.missionHeadTranslate
    };
  }, [motionProfile, scrollY, viewportHeight]);

  const guideMotion = useMemo(() => {
    const progress = getSectionProgress(
      guideRef.current,
      scrollY,
      viewportHeight,
      motionProfile.guideTravelMultiplier
    );
    return {
      progress,
      headOpacity: clamp(0.36 + progress * 0.64, 0, 1),
      headTranslate: (1 - progress) * motionProfile.guideHeadTranslate
    };
  }, [motionProfile, scrollY, viewportHeight]);

  const missionStyle = useMemo(
    () =>
      ({
        backgroundPositionY: `${-missionMotion.progress * motionProfile.missionBgShift}px`
      }) satisfies CSSProperties,
    [missionMotion.progress, motionProfile.missionBgShift]
  );

  const guideStyle = useMemo(
    () =>
      ({
        backgroundPositionY: `${-guideMotion.progress * motionProfile.guideBgShift}px`
      }) satisfies CSSProperties,
    [guideMotion.progress, motionProfile.guideBgShift]
  );

  const missionItems = useMemo(
    () => [
      { icon: '📚', title: t('about.mission.preserve.title'), text: t('about.mission.preserve.description') },
      { icon: '👥', title: t('about.mission.community.title'), text: t('about.mission.community.description') },
      { icon: '💬', title: t('about.mission.enhance.title'), text: t('about.mission.enhance.description') },
      { icon: '💡', title: t('about.mission.innovate.title'), text: t('about.mission.innovate.description') }
    ],
    [t]
  );

  const guideSteps = useMemo(
    () => [
      {
        icon: '🔍',
        label: t('about.getStarted.step1.label'),
        title: t('about.getStarted.step1.title'),
        text: t('about.getStarted.step1.description')
      },
      {
        icon: '💬',
        label: t('about.getStarted.step2.label'),
        title: t('about.getStarted.step2.title'),
        text: t('about.getStarted.step2.description')
      },
      {
        icon: '🌳',
        label: t('about.getStarted.step3.label'),
        title: t('about.getStarted.step3.title'),
        text: t('about.getStarted.step3.description')
      },
      {
        icon: '🔗',
        label: t('about.getStarted.step4.label'),
        title: t('about.getStarted.step4.title'),
        text: t('about.getStarted.step4.description')
      }
    ],
    [t]
  );

  return (
    <div className='about-parity'>
      <section className='about-parity__hero'>
        <div
          className='about-parity__hero-bg'
          aria-hidden='true'
          style={{
            transform: `scale(${heroMotion.heroBgScale}) rotate(${heroMotion.heroBgRotate}deg)`
          }}
        />

        <div
          className='about-parity__hero-box'
          style={{
            opacity: heroMotion.boxOpacity,
            transform: `translateY(${heroMotion.boxTranslate}px) rotate(${heroMotion.boxRotate}deg)`
          }}
        >
          <div style={{ animation: 'float-idle-1 6s ease-in-out infinite' }}>
            <h1>{t('about.whatIsGaji.title', '"GAJI"의 의미는? 🌿')}</h1>
            <p
              dangerouslySetInnerHTML={{
                __html: t(
                  'about.whatIsGaji.description',
                  '"Gaji" (가지)는 한국어로 <strong>"가지"</strong>를 의미합니다. 나무가 많은 가지를 뻗듯이, 각 이야기는 당신의 선택과 대화에 따라 무수히 많은 방향으로 갈라질 수 있습니다.'
                )
              }}
            />
          </div>
        </div>

        <p
          className='about-parity__subtitle'
          style={{
            opacity: heroMotion.subtitleOpacity,
            transform: `translateY(${heroMotion.subtitleTranslate}px) scale(${heroMotion.subtitleScale})`
          }}
        >
          {t(
            'about.subtitle',
            '고전 문학과 현대 기술의 간극을 메우며, Gaji는 AI 기반 대화를 통해 사랑받는 캐릭터들을 생생하게 되살립니다.'
          )}
        </p>

        <button
          type='button'
          className='about-parity__scroll-cue'
          style={{ opacity: heroMotion.cueOpacity }}
          onClick={() => missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <span>{t('about.scrollCue', '아래로 스크롤')}</span>
          <strong aria-hidden='true'>↓</strong>
        </button>
      </section>

      <section ref={missionRef} className='about-parity__mission' style={missionStyle}>
        <div
          className='about-parity__mission-head'
          style={{
            opacity: missionMotion.headOpacity,
            transform: `translateY(${missionMotion.headTranslate}px)`
          }}
        >
          <h2>{t('about.mission.title', '우리의 미션')}</h2>
          <p>
            {t(
              'about.mission.description',
              '혁신적인 AI 기술을 통해 고전 문학을 현대 독자들에게 접근 가능하고, 매력적이며, 상호작용 가능하게 만드는 것입니다.'
            )}
          </p>
        </div>

        <div className='about-parity__mission-grid'>
          {missionItems.map((item, index) => (
            <article
              key={item.title}
              data-group='mission'
              data-index={index}
              className={`about-parity__mission-card ${missionVisible.includes(index) ? 'is-visible' : ''}`}
              style={{ transitionDelay: `${index * motionProfile.missionDelayStep}ms` }}
            >
              <div className='about-parity__mission-icon'>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section ref={guideRef} className='about-parity__guide' style={guideStyle}>
        <div className='about-parity__guide-stage' aria-hidden='true' />
        <div
          className='about-parity__guide-content'
          style={{
            opacity: guideMotion.headOpacity,
            transform: `translateY(${guideMotion.headTranslate}px)`
          }}
        >
          <h2>{t('about.getStarted.title', '4가지 간단한 단계로 시작하기')}</h2>
          {guideSteps.map((step, index) => (
            <article
              key={step.title}
              data-group='guide'
              data-index={index}
              className={`about-parity__guide-step ${guideVisible.includes(index) ? 'is-visible' : ''}`}
              style={{ transitionDelay: `${index * motionProfile.guideDelayStep}ms` }}
            >
              <div className='about-parity__guide-icon'>{step.icon}</div>
              <div>
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
