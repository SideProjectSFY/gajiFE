'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, FileText, GitBranch, Globe2, Loader2, Lock, MessageSquareText, Sparkles } from 'lucide-react';
import { LoadingState } from '@/components/LoadingState';
import { createScenario, getScenario, updateScenario } from '@/domains/journeys/services/scenarioApi';
import type { Scenario } from '@/domains/journeys/types/core';
import { canMutateOwnedResource, getCurrentUserFromToken, type CurrentUser } from '@/domains/journeys/utils/currentUser';

const scenarioTemplates = [
  {
    title: '주인공이 첫 선택을 거절한다면',
    description: '원작에서 가장 큰 전환점이 된 선택을 뒤집고, 그 결정이 인물 관계와 결말의 방향을 어떻게 바꾸는지 따라갑니다.'
  },
  {
    title: '숨겨진 편지가 더 일찍 발견된다면',
    description: '중요한 정보가 늦게 드러나는 대신 초반에 공개됩니다. 인물들이 서로를 의심하거나 신뢰하는 방식이 달라집니다.'
  },
  {
    title: '조력자가 반대편에 선다면',
    description: '원작에서 도움을 주던 인물이 다른 이해관계를 갖게 됩니다. 대화는 설득, 오해, 새로운 동맹 가능성에 집중합니다.'
  }
];

type ScenarioSourceContext = {
  scenarioTitle: string;
  bookTitle: string;
  characterName: string;
  ownerName: string;
  visibilityLabel: string;
};

type ScenarioDraft = {
  title: string;
  description: string;
  visibility: string;
  path: string;
  sourceTitle?: string;
  sourceContext?: ScenarioSourceContext | null;
  updatedAt: string;
};

const SCENARIO_DRAFT_PREFIX = 'gaji:scenario-draft:';

function readScenarioText(scenario: Scenario, keys: string[], fallback: string): string {
  const record = scenario as Scenario & Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function getScenarioSourceContext(scenario: Scenario, fallbackTitle: string): ScenarioSourceContext {
  return {
    scenarioTitle: scenario.title || fallbackTitle,
    bookTitle: readScenarioText(scenario, ['bookTitle', 'book_title', 'novelTitle', 'novel_title'], '책 정보 확인 중'),
    characterName: readScenarioText(scenario, ['characterName', 'character_name', 'character'], '대화 인물'),
    ownerName: scenario.username || '작성자 정보 없음',
    visibilityLabel: scenario.visibility === 'PRIVATE' ? '비공개 가지' : '공개 가지'
  };
}

export function ScenarioFormClient({
  scenarioId,
  forkFromScenarioId
}: {
  scenarioId?: string;
  forkFromScenarioId?: string;
}) {
  const isEdit = Boolean(scenarioId);
  const isFork = Boolean(!scenarioId && forkFromScenarioId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(Boolean(scenarioId || forkFromScenarioId));
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ userId: null, username: null });
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceContext, setSourceContext] = useState<ScenarioSourceContext | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [userTouchedDraft, setUserTouchedDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const draftKey = useMemo(() => {
    if (scenarioId) return `${SCENARIO_DRAFT_PREFIX}edit:${scenarioId}`;
    if (forkFromScenarioId) return `${SCENARIO_DRAFT_PREFIX}fork:${forkFromScenarioId}`;
    return `${SCENARIO_DRAFT_PREFIX}new`;
  }, [forkFromScenarioId, scenarioId]);

  const draftPath = useMemo(() => {
    if (scenarioId) return `/scenarios/${scenarioId}/edit`;
    if (forkFromScenarioId) return `/scenarios/new?forkFrom=${encodeURIComponent(forkFromScenarioId)}`;
    return '/scenarios/new';
  }, [forkFromScenarioId, scenarioId]);

  useEffect(() => {
    setCurrentUser(getCurrentUserFromToken());
  }, []);

  useEffect(() => {
    setDraftReady(false);
    setDraftRestored(false);
    setUserTouchedDraft(false);
    setDraftSavedAt(null);
  }, [draftKey]);

  useEffect(() => {
    if (!forkFromScenarioId || isEdit) return;

    let mounted = true;
    setLoadingInitial(true);
    getScenario(forkFromScenarioId)
      .then((scenario) => {
        if (!mounted) return;
        setSourceTitle(scenario.title ?? '');
        setSourceContext(getScenarioSourceContext(scenario, scenario.title ?? '원본 가지'));
        setTitle(scenario.title ? `${scenario.title}에서 갈라진 가지` : '새로운 가지');
        setDescription(
          scenario.description
            ? `${scenario.description}\n\n여기에서 바꾸고 싶은 선택, 관계, 결말의 방향을 덧붙여보세요.`
            : ''
        );
      })
      .catch(() => {
        if (mounted) setError('원본 가지를 불러오지 못했습니다. 링크를 확인하거나 목록에서 다시 선택해주세요.');
      })
      .finally(() => {
        if (mounted) setLoadingInitial(false);
      });

    return () => {
      mounted = false;
    };
  }, [forkFromScenarioId, isEdit]);

  useEffect(() => {
    if (!scenarioId) return;

    let mounted = true;
    setLoadingInitial(true);
    getScenario(scenarioId)
      .then((scenario) => {
        if (!mounted) return;
        setTitle(scenario.title ?? '');
        setDescription(scenario.description ?? '');
        setVisibility(scenario.visibility ?? 'PUBLIC');
        setSourceContext(getScenarioSourceContext(scenario, scenario.title ?? '현재 가지'));
        const allowed = canMutateOwnedResource(
          { userId: scenario.userId, username: scenario.username },
          currentUser
        );
        setCanEdit(allowed);
        if (!allowed) {
          setError('이 시나리오는 작성자만 수정할 수 있습니다.');
        }
      })
      .catch(() => {
        if (mounted) setError('시나리오를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (mounted) setLoadingInitial(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser, scenarioId]);

  const pageCopy = useMemo(() => {
    if (isEdit) {
      return {
        eyebrow: '가지 다듬기',
        title: '시나리오를 더 읽기 좋게 정리해보세요',
        description: '독자가 바로 대화를 시작할 수 있도록 바뀐 선택, 인물의 목표, 이어질 장면을 또렷하게 적어주세요.'
      };
    }

    if (isFork) {
      return {
        eyebrow: '가지에서 새 가지 만들기',
        title: '기존 해석에서 다른 가능성으로 뻗어보세요',
        description: '원본의 좋은 맥락은 살리고, 이번 가지에서 달라질 선택 하나를 분명하게 잡아주세요.'
      };
    }

    return {
      eyebrow: '새 시나리오',
      title: '책의 한 장면을 다른 선택으로 열어보세요',
      description: '원작의 어떤 순간이 달라지는지 적으면, 그 장면을 바탕으로 대화를 시작할 수 있습니다.'
    };
  }, [isEdit, isFork]);

  useEffect(() => {
    if (loadingInitial || draftReady) return;

    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<ScenarioDraft>;
        if (typeof draft.title === 'string') setTitle(draft.title);
        if (typeof draft.description === 'string') setDescription(draft.description);
        if (draft.visibility === 'PUBLIC' || draft.visibility === 'PRIVATE') setVisibility(draft.visibility);
        if (typeof draft.sourceTitle === 'string') setSourceTitle(draft.sourceTitle);
        if (draft.sourceContext) setSourceContext(draft.sourceContext);
        if (typeof draft.updatedAt === 'string') setDraftSavedAt(draft.updatedAt);
        setDraftRestored(true);
      }
    } catch {
      window.localStorage.removeItem(draftKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey, draftReady, loadingInitial]);

  useEffect(() => {
    if (!draftReady || (!userTouchedDraft && !draftRestored)) return;

    const hasContent = Boolean(title.trim() || description.trim());
    if (!hasContent) {
      window.localStorage.removeItem(draftKey);
      setDraftSavedAt(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      const updatedAt = new Date().toISOString();
      const draft: ScenarioDraft = {
        title,
        description,
        visibility,
        path: draftPath,
        sourceTitle,
        sourceContext,
        updatedAt
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
      setDraftSavedAt(updatedAt);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [
    description,
    draftKey,
    draftPath,
    draftReady,
    draftRestored,
    sourceContext,
    sourceTitle,
    title,
    userTouchedDraft,
    visibility
  ]);

  useEffect(() => {
    if (!userTouchedDraft || saving) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [saving, userTouchedDraft]);

  const draftStatus = useMemo(() => {
    if (saving) return '저장 중입니다';
    if (draftSavedAt && (userTouchedDraft || draftRestored)) {
      return draftRestored && !userTouchedDraft ? '저장된 초안을 복구했습니다' : '초안이 이 브라우저에 저장되었습니다';
    }
    return '작성 중인 내용은 이 브라우저에 자동 저장됩니다';
  }, [draftRestored, draftSavedAt, saving, userTouchedDraft]);

  function applyTemplate(template: typeof scenarioTemplates[number]) {
    setUserTouchedDraft(true);
    setTitle(template.title);
    setDescription(template.description);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEdit && !canEdit) {
      setError('이 시나리오는 작성자만 수정할 수 있습니다.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      description,
      visibility,
      forkedFromScenarioId: isFork ? forkFromScenarioId : null
    };

    try {
      const response = isEdit && scenarioId ? await updateScenario(scenarioId, payload) : await createScenario(payload);
      window.localStorage.removeItem(draftKey);
      setUserTouchedDraft(false);
      setDraftRestored(false);
      window.location.href = `/scenarios/${response.id}`;
    } catch {
      setError('시나리오를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className='scenario-form-page'>
      <section className='scenario-form-hero' aria-labelledby='scenario-form-heading'>
        <div>
          <span className='scenario-form-hero__eyebrow'>
            <Sparkles size={15} strokeWidth={2.25} aria-hidden='true' />
            {pageCopy.eyebrow}
          </span>
          <h1 id='scenario-form-heading'>{pageCopy.title}</h1>
          <p>{pageCopy.description}</p>
        </div>
        {isFork ? (
          <div className='scenario-form-source'>
            <GitBranch size={18} strokeWidth={2.25} aria-hidden='true' />
            <span>원본 가지</span>
            <strong>{sourceTitle || forkFromScenarioId}</strong>
          </div>
        ) : (
          <div className='scenario-form-source'>
            <BookOpen size={18} strokeWidth={2.25} aria-hidden='true' />
            <span>시작점</span>
            <strong>책의 장면 하나</strong>
          </div>
        )}
      </section>

      {loadingInitial ? (
        <LoadingState
          compact
          className='scenario-form-loading'
          title='시나리오 정보를 준비하고 있습니다'
          description='작성 화면에 필요한 맥락을 정리하고 있어요.'
        />
      ) : null}

      {sourceContext ? (
        <section className='scenario-origin-summary' aria-label='작성 맥락 요약'>
          <div className='scenario-origin-summary__title'>
            <span>{isFork ? '원본 맥락' : '현재 맥락'}</span>
            <strong>{sourceContext.scenarioTitle}</strong>
          </div>
          <dl>
            <div>
              <dt>책</dt>
              <dd>{sourceContext.bookTitle}</dd>
            </div>
            <div>
              <dt>인물</dt>
              <dd>{sourceContext.characterName}</dd>
            </div>
            <div>
              <dt>작성자</dt>
              <dd>{sourceContext.ownerName}</dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>{sourceContext.visibilityLabel}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div className='scenario-form-layout'>
        <form className='scenario-form-panel' onSubmit={onSubmit}>
          {error ? <p className='scenario-form-error' role='alert'>{error}</p> : null}
          <p className='scenario-draft-status' role='status'>{draftStatus}</p>

          <div className='scenario-field scenario-field--title'>
            <div className='scenario-field__head'>
              <label htmlFor='scenario-title'>가지 제목</label>
              <span>{title.trim().length}/80</span>
            </div>
            <div className='scenario-input-shell'>
              <FileText size={18} strokeWidth={2.25} aria-hidden='true' />
              <input
                id='scenario-title'
                value={title}
                onChange={(event) => {
                  setUserTouchedDraft(true);
                  setTitle(event.target.value);
                }}
                placeholder='예: 편지가 하루 먼저 도착한다면'
                maxLength={80}
                required
                disabled={loadingInitial}
              />
            </div>
            <p className='scenario-field__hint'>독자가 목록에서 바로 이해할 수 있도록 바뀐 선택을 제목에 담아주세요.</p>
          </div>

          <div className='scenario-field scenario-field--description'>
            <div className='scenario-field__head'>
              <label htmlFor='scenario-description'>달라지는 장면</label>
              <span>{description.trim().length}자</span>
            </div>
            <div className='scenario-textarea-shell'>
              <textarea
                id='scenario-description'
                value={description}
                onChange={(event) => {
                  setUserTouchedDraft(true);
                  setDescription(event.target.value);
                }}
                placeholder='원작에서 어떤 선택이 바뀌고, 인물들이 어떤 긴장이나 목표를 갖게 되는지 적어주세요.'
                disabled={loadingInitial}
              />
              <div className='scenario-textarea-tools' aria-hidden='true'>
                <span>
                  <MessageSquareText size={14} strokeWidth={2.25} />
                  선택
                </span>
                <span>감정</span>
                <span>다음 질문</span>
              </div>
            </div>
            <p className='scenario-field__hint'>한 번에 완성하려 하기보다, “무엇이 바뀌는지”와 “누가 흔들리는지”만 선명하면 충분합니다.</p>
          </div>

          <fieldset className='scenario-visibility-options'>
            <legend>공개 범위</legend>
            <button
              type='button'
              className={visibility === 'PUBLIC' ? 'is-selected' : ''}
              onClick={() => {
                setUserTouchedDraft(true);
                setVisibility('PUBLIC');
              }}
              disabled={loadingInitial}
            >
              <Globe2 size={17} strokeWidth={2.25} aria-hidden='true' />
              <span>
                <strong>공개 가지</strong>
                다른 독자도 발견하고 대화를 시작할 수 있어요.
              </span>
            </button>
            <button
              type='button'
              className={visibility === 'PRIVATE' ? 'is-selected' : ''}
              onClick={() => {
                setUserTouchedDraft(true);
                setVisibility('PRIVATE');
              }}
              disabled={loadingInitial}
            >
              <Lock size={17} strokeWidth={2.25} aria-hidden='true' />
              <span>
                <strong>비공개 가지</strong>
                나만 볼 수 있게 초안을 정리합니다.
              </span>
            </button>
          </fieldset>

          <button className={`scenario-form-submit${saving ? ' is-saving' : ''}`} type='submit' disabled={saving || loadingInitial || (isEdit && !canEdit)}>
            {saving ? <Loader2 size={17} strokeWidth={2.25} aria-hidden='true' /> : <GitBranch size={17} strokeWidth={2.25} aria-hidden='true' />}
            {saving ? '저장 중입니다' : isEdit ? '변경 저장' : '가지 만들기'}
          </button>
        </form>

        <aside className='scenario-form-guidance' aria-label='시나리오 작성 가이드'>
          <section>
            <h2>빠른 시작</h2>
            <div className='scenario-template-list'>
              {scenarioTemplates.map((template) => (
                <button key={template.title} type='button' onClick={() => applyTemplate(template)}>
                  <span>{template.title}</span>
                  <small>{template.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className='scenario-form-checklist'>
            <h2>좋은 가지의 기준</h2>
            <ul>
              <li>
                <CheckCircle2 size={16} strokeWidth={2.25} aria-hidden='true' />
                바뀌는 선택이 한 문장으로 보입니다.
              </li>
              <li>
                <CheckCircle2 size={16} strokeWidth={2.25} aria-hidden='true' />
                대화할 인물의 감정이나 목표가 드러납니다.
              </li>
              <li>
                <CheckCircle2 size={16} strokeWidth={2.25} aria-hidden='true' />
                결말을 닫지 않고 다음 질문을 남깁니다.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
