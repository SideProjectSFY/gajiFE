'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, GitBranch, ListTree, MessageCircle, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { createConversation } from '@/api/conversationApi';
import { LoadingState } from '@/components/LoadingState';
import { deleteScenario, getScenario, getScenarioTree } from '@/domains/journeys/services/scenarioApi';
import type { Scenario, ScenarioTreeResponse } from '@/domains/journeys/types/core';
import {
  canMutateOwnedResource,
  getCurrentUserFromToken,
  type CurrentUser
} from '@/domains/journeys/utils/currentUser';
import { useLocale } from '@/i18n/useLocale';
import { ScenarioVisualization } from './ScenarioVisualization';

type ScenarioDetailModel = Scenario & {
  parentScenarioId?: string | null;
  parent_scenario_id?: string | null;
  bookTitle?: string | null;
  book_title?: string | null;
  novelTitle?: string | null;
  novel_title?: string | null;
  characterName?: string | null;
  character_name?: string | null;
  character?: string | null;
  originalScene?: string | null;
  original_scene?: string | null;
  whatIfQuestion?: string | null;
  what_if_question?: string | null;
};

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem('accessToken') || window.localStorage.getItem('token'));
}

function readScenarioDetailText(
  scenario: ScenarioDetailModel | null,
  keys: string[],
  fallback: string
): string {
  if (!scenario) return fallback;
  const record = scenario as ScenarioDetailModel & Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

export function ScenarioDetailClient({ scenarioId }: { scenarioId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [scenario, setScenario] = useState<ScenarioDetailModel | null>(null);
  const [tree, setTree] = useState<ScenarioTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ userId: null, username: null });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setCurrentUser(getCurrentUserFromToken());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [scenarioData, treeData] = await Promise.all([getScenario(scenarioId), getScenarioTree(scenarioId)]);
        if (!mounted) return;
        setScenario(scenarioData as ScenarioDetailModel);
        setTree(treeData);
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError(t('scenario.loadErrorDescription', '지금은 이 가지의 정보를 확인하지 못했습니다.'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [scenarioId, t, retryToken]);

  const canManageScenario = scenario
    ? canMutateOwnedResource({ userId: scenario.userId, username: scenario.username }, currentUser)
    : false;

  const isForkedScenario = useMemo(
    () => Boolean(scenario?.parentScenarioId || scenario?.parent_scenario_id),
    [scenario]
  );

  const scenarioChangeSummary = useMemo(() => ({
    sourceScene: tree?.root?.title && tree.root.title !== scenario?.title
      ? tree.root.title
      : readScenarioDetailText(
        scenario,
        ['originalScene', 'original_scene', 'bookTitle', 'book_title', 'novelTitle', 'novel_title'],
        '원작의 중요한 선택이 놓인 장면'
      ),
    changedAssumption: readScenarioDetailText(
      scenario,
      ['whatIfQuestion', 'what_if_question', 'description'],
      '원작과 다른 선택 하나에서 이야기가 갈라집니다.'
    ),
    characterName: readScenarioDetailText(
      scenario,
      ['characterName', 'character_name', 'character'],
      '대화할 인물'
    ),
    conversationDirection: scenario?.description
      ? '이 변화가 인물의 감정, 관계, 다음 선택을 어떻게 흔드는지 질문하며 이어갑니다.'
      : '장면의 선택과 인물의 이유를 묻는 첫 대화로 이어갑니다.'
  }), [scenario, tree]);

  const rootPathLabel = tree?.root?.title ? `시작점 · ${tree.root.title}` : '시작점 정리 중';

  function goLoginWithRedirect() {
    const current = pathname || `/scenarios/${scenarioId}`;
    router.push(`/login?redirect=${encodeURIComponent(current)}`);
  }

  async function onDelete() {
    if (!scenario) return;
    if (!canManageScenario) {
      setError('이 시나리오는 작성자만 삭제할 수 있습니다.');
      return;
    }
    
    if (!confirm('이 시나리오를 삭제할까요? 삭제하면 되돌릴 수 없습니다.')) return;

    try {
      await deleteScenario(scenario.id);
      router.push('/scenarios');
    } catch {
      setError('시나리오를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  async function onStartConversation() {
    if (!scenario) return;
    if (!hasAuthToken()) {
      goLoginWithRedirect();
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const created = await createConversation({ scenarioId: scenario.id });
      router.push(`/conversations/${created.id}`);
    } catch {
      setError('대화를 열지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setWorking(false);
    }
  }

  function onForkScenario() {
    if (!scenario) return;
    if (!hasAuthToken()) {
      goLoginWithRedirect();
      return;
    }
    if (isForkedScenario) {
      setError('이미 갈라진 가지에서는 다시 새 가지를 만들 수 없습니다.');
      return;
    }
    router.push(`/scenarios/new?forkFrom=${scenario.id}`);
  }

  if (loading) {
    return (
      <div className='scenario-detail-page'>
        <LoadingState
          compact
          className='scenario-detail-loading'
          title={t('common.loadingTitle', '이야기를 불러오는 중입니다')}
          description={t('common.loadingSubtitle', '잠시만 기다려주세요.')}
        />
      </div>
    );
  }
  
  if (error) return (
    <ScenarioRecoveryState
      title='시나리오를 열 수 없습니다'
      description={error}
      onRetry={() => setRetryToken((prev) => prev + 1)}
    />
  );

  if (!scenario) return (
    <ScenarioRecoveryState
      title='시나리오를 찾을 수 없습니다'
      description='링크가 바뀌었거나 아직 공개되지 않은 가지일 수 있어요.'
      onRetry={() => setRetryToken((prev) => prev + 1)}
    />
  );

  return (
    <main className='scenario-detail-page'>
      <article className='scenario-detail-card'>
        <div className='scenario-detail-card__header'>
          <span>{isForkedScenario ? '갈라진 가지' : '원본 가지'}</span>
          <h1>{scenario.title}</h1>
          <p>{scenario.description || '원작의 한 선택을 다르게 놓고 이어지는 가정형 가지입니다.'}</p>
        </div>

        <section className='scenario-change-summary' aria-labelledby='scenario-change-title'>
          <div className='scenario-change-summary__head'>
            <span>가지 요약</span>
            <h2 id='scenario-change-title'>이 가지가 바꾸는 것</h2>
          </div>
          <dl>
            <div>
              <dt>원작 장면</dt>
              <dd>{scenarioChangeSummary.sourceScene}</dd>
            </div>
            <div>
              <dt>바뀐 가정</dt>
              <dd>{scenarioChangeSummary.changedAssumption}</dd>
            </div>
            <div>
              <dt>대화할 인물</dt>
              <dd>{scenarioChangeSummary.characterName}</dd>
            </div>
            <div>
              <dt>예상 대화 방향</dt>
              <dd>{scenarioChangeSummary.conversationDirection}</dd>
            </div>
          </dl>
        </section>

        <div className='scenario-detail-actions'>
            <button 
                onClick={onStartConversation} 
                disabled={working}
                className='scenario-action scenario-action--primary'
            >
              <MessageCircle size={17} strokeWidth={2.25} aria-hidden='true' />
              {working ? '대화를 여는 중입니다' : t('scenario.start', '이 가지에서 대화 시작')}
            </button>

            {!isForkedScenario && (
              <button 
                onClick={onForkScenario}
                className='scenario-action scenario-action--fork'
              >
                <GitBranch size={17} strokeWidth={2.25} aria-hidden='true' />
                {t('scenario.fork', '새 가지 만들기')}
              </button>
            )}

            {canManageScenario && (
              <>
                <Link 
                    href={`/scenarios/${scenario.id}/edit`}
                    className='scenario-action scenario-action--neutral'
                >
                    <Pencil size={17} strokeWidth={2.25} aria-hidden='true' />
                    편집
                </Link>
                <button 
                    onClick={onDelete}
                    className='scenario-action scenario-action--danger'
                >
                  <Trash2 size={17} strokeWidth={2.25} aria-hidden='true' />
                  삭제
                </button>
              </>
            )}
        </div>
      </article>

      <section className='scenario-detail-tree'>
        <div className='scenario-detail-tree__header'>
          <div>
            <h2>가지 흐름</h2>
            <p>원본에서 현재 가지까지의 흐름을 확인합니다.</p>
          </div>
          <span>{rootPathLabel}</span>
        </div>
        <div className='scenario-detail-visual'>
            <ScenarioVisualization
              rootTitle={tree?.root?.title}
              currentTitle={scenario.title}
              isForked={isForkedScenario}
            />
        </div>
      </section>

      <div className='scenario-detail-foot'>
        <Link href={`/conversations?scenarioId=${scenario.id}`}>
            이 가지의 대화 보기
        </Link>
      </div>
    </main>
  );
}

function ScenarioRecoveryState({
  title,
  description,
  onRetry
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <main className='scenario-detail-page scenario-detail-page--recovery'>
      <section className='scenario-recovery-card' aria-labelledby='scenario-recovery-title'>
        <div className='scenario-recovery-card__copy'>
          <span className='scenario-recovery-card__eyebrow'>가지가 잠시 닫혔어요</span>
          <h1 id='scenario-recovery-title'>{title}</h1>
          <p>{description}</p>
        </div>

        <div className='scenario-recovery-card__actions'>
          <button type='button' onClick={onRetry} className='scenario-recovery-card__primary'>
            <RefreshCw size={17} strokeWidth={2.25} aria-hidden='true' />
            다시 시도
          </button>
          <Link href='/scenarios'>
            <ListTree size={17} strokeWidth={2.25} aria-hidden='true' />
            시나리오 둘러보기
          </Link>
          <Link href='/books'>
            <BookOpen size={17} strokeWidth={2.25} aria-hidden='true' />
            책에서 다시 시작
          </Link>
        </div>

        <div className='scenario-recovery-card__notes' aria-label='확인해볼 내용'>
          <span>확인해볼 것</span>
          <ul>
            <li>시나리오가 삭제되었거나 비공개로 바뀌었을 수 있어요.</li>
            <li>서버 응답이 잠시 늦어졌다면 다시 시도하면 열릴 수 있어요.</li>
            <li>원하는 작품에서 다른 공개 가지를 바로 찾아볼 수 있어요.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
