'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { followUser, getFollowers, getFollowing, getUserByUsername, unfollowUser } from '@/api/socialApi';
import { LoadingState } from '@/components/LoadingState';
import type { UserSummary } from '@/domains/journeys/types/core';
import { useLocale } from '@/i18n/useLocale';

export function FollowListClient({ username, mode }: { username: string; mode: 'followers' | 'following' }) {
  const { t } = useLocale();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [viewer, setViewer] = useState<UserSummary | null>(null);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const profile = await getUserByUsername(username);
        if (!mounted) return;
        setViewer(profile);

        const response = mode === 'followers' ? await getFollowers(profile.id) : await getFollowing(profile.id);
        if (!mounted) return;

        const list = response.content ?? [];
        setUsers(list);
        setFollowingState(
          Object.fromEntries(list.map((user) => [user.id, mode === 'following']))
        );
      } catch {
        if (mounted) {
          setUsers([]);
          setError('팔로우 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
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
  }, [mode, username]);

  async function onFollowToggle(userId: string) {
    if (pendingUserId) return;

    const isFollowing = followingState[userId] ?? false;
    setPendingUserId(userId);
    setError(null);
    setFollowingState((prev) => ({ ...prev, [userId]: !isFollowing }));

    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch {
      setFollowingState((prev) => ({ ...prev, [userId]: isFollowing }));
      setError('팔로우 상태를 바꾸지 못했습니다. 다시 시도해주세요.');
    } finally {
      setPendingUserId(null);
    }
  }

  const title = useMemo(
    () => (mode === 'followers' ? `${username}님의 팔로워` : `${username}님의 팔로잉`),
    [mode, username]
  );

  const countLabel = `${users.length}명 ${mode === 'followers' ? '팔로워' : '팔로잉'}`;

  return (
    <main className='follow-page'>
      <header className='follow-page__header'>
        <h1>{title}</h1>
        <p>{countLabel}</p>
      </header>

      {error ? <div className='inline-error'>{error}</div> : null}

      {loading ? (
        <LoadingState
          compact
          className='follow-page__loading'
          title={t('common.loadingTitle', '이야기를 불러오는 중입니다')}
          description={t('common.loadingSubtitle', '잠시만 기다려주세요.')}
        />
      ) : null}

      {!loading && users.length === 0 ? (
        <section className='follow-empty'>
          <div className='follow-empty__icon'>{mode === 'followers' ? '👥' : '👤'}</div>
          <p>{mode === 'followers' ? '아직 팔로워가 없습니다' : '아직 팔로잉하는 사용자가 없습니다'}</p>
        </section>
      ) : null}

      {!loading && users.length > 0 ? (
        <ul className='follow-list'>
          {users.map((user) => (
            <li key={user.id}>
              <Link href={`/profile/${encodeURIComponent(user.username)}`}>{user.username}</Link>
              <button type='button' disabled={pendingUserId === user.id} onClick={() => void onFollowToggle(user.id)}>
                {pendingUserId === user.id ? '처리 중' : followingState[user.id] ? '팔로우 취소' : '팔로우'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {viewer ? <span className='sr-only'>viewer-{viewer.id}</span> : null}
    </main>
  );
}
