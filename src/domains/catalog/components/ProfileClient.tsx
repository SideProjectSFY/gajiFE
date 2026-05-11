'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock3, GitBranch, Heart, MessageCircle, PenLine, Sparkles, UserPlus, Users } from 'lucide-react';
import { LoadingState } from '@/components/LoadingState';

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  avatarUrl: string;
}

interface Book {
  id: string | number;
  title: string;
  author: string;
  cover: string;
}

interface Conversation {
  id: string | number;
  title: string;
  book: string;
  character: string;
  preview: string;
  likeCount: number;
  timestamp: string;
  cover: string;
}

interface FollowUser {
  id: string;
  username: string;
  avatar: string;
}

interface Modal {
  type: 'likedBooks' | 'likedConversations' | 'following' | 'followers' | 'myConversations' | null;
}

interface ProfileClientProps {
  username: string;
  currentUsername?: string;
}

const BASE_URL = '/api';

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {};
}

function asRecords(value: unknown): ApiRecord[] {
  const data = asRecord(value);
  const candidate = Array.isArray(value) ? value : data.content;
  return Array.isArray(candidate) ? candidate.map(asRecord) : [];
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function profileInitial(username: string): string {
  const trimmed = username.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'G';
}

export function ProfileClient({ username, currentUsername }: ProfileClientProps) {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    username,
    bio: '',
    avatarUrl: '👤',
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [followFeedback, setFollowFeedback] = useState<string | null>(null);

  const [likedBooks, setLikedBooks] = useState<Book[]>([]);
  const [likedConversations, setLikedConversations] = useState<Conversation[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [myConversations, setMyConversations] = useState<Conversation[]>([]);

  const [totalLikedBooks, setTotalLikedBooks] = useState(0);
  const [totalLikedConversations, setTotalLikedConversations] = useState(0);
  const [totalFollowing, setTotalFollowing] = useState(0);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [totalMyConversations, setTotalMyConversations] = useState(0);

  const [modal, setModal] = useState<Modal>({ type: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUsername === username;

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch user profile
      const userResp = await fetch(`${BASE_URL}/users?username=${encodeURIComponent(username)}`);
      let userId: string = username;
      if (userResp.ok) {
        const userData = await userResp.json();
        userId = userData.id ?? username;
        setUserProfile({
          id: userId,
          username: userData.username ?? username,
          bio: userData.bio ?? '',
          avatarUrl: '👤',
        });
      }

      // Parallel data fetch
      const results = await Promise.allSettled([
        fetch(`${BASE_URL}/books/liked?userId=${userId}&page=0&size=5`),
        fetch(`${BASE_URL}/conversations?userId=${userId}&filter=liked&size=20`),
        fetch(`${BASE_URL}/users/${userId}/following`),
        fetch(`${BASE_URL}/users/${userId}/followers`),
        fetch(`${BASE_URL}/conversations?userId=${userId}&size=20`),
      ]);

      // Liked Books
      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const data = await results[0].value.json();
        const items: Book[] = asRecords(data).map((b) => ({
          id: readString(b.id, 'book'),
          title: readString(b.title, '제목 없는 책'),
          author: readString(b.author, '작가 정보 없음'),
          cover: readString(b.coverUrl, '📚'),
        }));
        setLikedBooks(items.slice(0, 5));
        setTotalLikedBooks(readNumber(asRecord(data).totalElements, items.length));
      }

      // Liked Conversations
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const data = await results[1].value.json();
        const items: Conversation[] = asRecords(data).map((c) => ({
          id: readString(c.id, 'conversation'),
          title: readString(c.title, '제목 없는 대화'),
          book: readString(c.bookTitle, '책 정보 없음'),
          character: readString(c.characterName),
          preview: readString(c.scenarioDescription, '소개가 아직 없습니다.'),
          likeCount: readNumber(c.likeCount),
          timestamp: c.createdAt ? new Date(String(c.createdAt)).toLocaleDateString('ko-KR') : '',
          cover: '📘',
        }));
        setLikedConversations(items.slice(0, 3));
        setTotalLikedConversations(items.length);
      }

      // Following
      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const data = await results[2].value.json();
        const items: FollowUser[] = asRecords(data).map((u) => ({
          id: readString(u.id, 'user'),
          username: readString(u.username, 'reader'),
          avatar: '👤',
        }));
        setFollowing(items);
        setTotalFollowing(items.length);
      }

      // Followers
      if (results[3].status === 'fulfilled' && results[3].value.ok) {
        const data = await results[3].value.json();
        const items: FollowUser[] = asRecords(data).map((u) => ({
          id: readString(u.id, 'user'),
          username: readString(u.username, 'reader'),
          avatar: '👤',
        }));
        setFollowers(items);
        setTotalFollowers(items.length);
      }

      // My Conversations
      if (results[4].status === 'fulfilled' && results[4].value.ok) {
        const data = await results[4].value.json();
        const items: Conversation[] = asRecords(data).map((c) => ({
          id: readString(c.id, 'conversation'),
          title: readString(c.title, '제목 없는 대화'),
          book: readString(c.bookTitle, '책 정보 없음'),
          character: readString(c.characterName),
          preview: readString(c.scenarioDescription, '소개가 아직 없습니다.'),
          likeCount: readNumber(c.likeCount),
          timestamp: c.createdAt ? new Date(String(c.createdAt)).toLocaleDateString('ko-KR') : '',
          cover: '📘',
        }));
        setMyConversations(items.slice(0, 3));
        setTotalMyConversations(items.length);
      }
    } catch (err) {
      console.error('[Profile] Failed to load profile data:', err);
      setError('프로필을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  const toggleFollow = async () => {
    if (followPending) return;

    const previous = isFollowing;
    setFollowPending(true);
    setFollowFeedback(null);
    setIsFollowing(!previous);

    try {
      const response = previous
        ? await fetch(`${BASE_URL}/users/${userProfile.id}/unfollow`, { method: 'POST' })
        : await fetch(`${BASE_URL}/users/${userProfile.id}/follow`, { method: 'POST' });

      if (!response.ok) {
        throw new Error('follow failed');
      }

      setFollowFeedback(previous ? '팔로우를 취소했습니다.' : '팔로우했습니다.');
    } catch (err) {
      setIsFollowing(previous);
      setFollowFeedback('팔로우 상태를 바꾸지 못했습니다. 다시 시도해주세요.');
      console.error('[Profile] Follow toggle failed:', err);
    } finally {
      setFollowPending(false);
      window.setTimeout(() => setFollowFeedback(null), 2600);
    }
  };

  const goToConversation = (id: string | number) => {
    void router.push(`/conversations/${id}`);
  };

  const openModal = (type: Modal['type']) => setModal({ type });
  const closeModal = () => setModal({ type: null });

  const activityItems = [
    myConversations[0]
      ? {
          id: `conversation-${myConversations[0].id}`,
          type: 'conversation',
          title: `${myConversations[0].character || myConversations[0].book}와 대화를 이어갔습니다`,
          meta: myConversations[0].timestamp || '최근 활동',
          href: `/conversations/${myConversations[0].id}`
        }
      : null,
    likedConversations[0]
      ? {
          id: `liked-conversation-${likedConversations[0].id}`,
          type: 'like',
          title: '흥미로운 대화를 저장했습니다',
          meta: likedConversations[0].title,
          href: `/conversations/${likedConversations[0].id}`
        }
      : null,
    likedBooks[0]
      ? {
          id: `book-${likedBooks[0].id}`,
          type: 'book',
          title: '새 책을 서재에 담았습니다',
          meta: likedBooks[0].title,
          href: `/books/${likedBooks[0].id}`
        }
      : null,
    following[0]
      ? {
          id: `follow-${following[0].id}`,
          type: 'follow',
          title: `${following[0].username}님의 가지를 팔로우합니다`,
          meta: '독자 관계',
          href: `/profile/${encodeURIComponent(following[0].username)}`
        }
      : null
  ].filter((item): item is {
    id: string;
    type: 'conversation' | 'like' | 'book' | 'follow';
    title: string;
    meta: string;
    href: string;
  } => Boolean(item));

  if (loading) {
    return (
      <main className='profile-page'>
        <LoadingState compact className='profile-loading' title='프로필을 불러오는 중입니다' description='활동과 대화 기록을 정리하고 있어요.' />
      </main>
    );
  }

  if (error) {
    return (
      <main className='profile-page'>
        <div className='profile-error'>{error}</div>
      </main>
    );
  }

  return (
    <>
      <main className='profile-page' aria-label='프로필 페이지'>
        <section className='profile-hero' aria-labelledby='profile-heading'>
          <div className='profile-hero__identity'>
            <div className='profile-hero__avatar' aria-hidden='true'>
              {profileInitial(userProfile.username)}
            </div>
            <div className='profile-hero__copy'>
              <p className='profile-hero__eyebrow'>
                <Sparkles size={15} strokeWidth={2.25} aria-hidden='true' />
                독자 프로필
              </p>
              <h1 id='profile-heading'>{userProfile.username}</h1>
              <p className='profile-hero__username'>@{userProfile.username}</p>
              <p className='profile-hero__bio'>
                {userProfile.bio || '아직 소개가 없습니다. 이 독자가 어떤 이야기의 가지를 탐험하는지 곧 채워질 거예요.'}
              </p>
            </div>
          </div>

          <div className='profile-hero__actions'>
            {isOwnProfile ? (
              <Link href='/profile/edit' className='profile-edit-btn'>
                <PenLine size={16} strokeWidth={2.25} aria-hidden='true' />
                프로필 편집
              </Link>
            ) : (
              <button
                type='button'
                className={`profile-follow-btn${isFollowing ? ' profile-follow-btn--following' : ''}`}
                disabled={followPending}
                onClick={() => void toggleFollow()}
              >
                <UserPlus size={16} strokeWidth={2.25} aria-hidden='true' />
                {followPending ? '처리 중' : isFollowing ? '팔로잉' : '팔로우'}
              </button>
            )}
          </div>

          {followFeedback ? (
            <p className='profile-follow-feedback' role='status'>
              {followFeedback}
            </p>
          ) : null}

          <div className='profile-stat-strip' aria-label='프로필 활동 요약'>
            <button type='button' onClick={() => openModal('likedBooks')}>
              <BookOpen size={18} strokeWidth={2.25} aria-hidden='true' />
              <span>좋아요한 책</span>
              <strong>{totalLikedBooks}</strong>
            </button>
            <button type='button' onClick={() => openModal('likedConversations')}>
              <Heart size={18} strokeWidth={2.25} aria-hidden='true' />
              <span>좋아요한 대화</span>
              <strong>{totalLikedConversations}</strong>
            </button>
            <Link href={`/profile/${encodeURIComponent(username)}/following`}>
              <Users size={18} strokeWidth={2.25} aria-hidden='true' />
              <span>팔로잉</span>
              <strong>{totalFollowing}</strong>
            </Link>
            <Link href={`/profile/${encodeURIComponent(username)}/followers`}>
              <Users size={18} strokeWidth={2.25} aria-hidden='true' />
              <span>팔로워</span>
              <strong>{totalFollowers}</strong>
            </Link>
            <button type='button' onClick={() => openModal('myConversations')}>
              <MessageCircle size={18} strokeWidth={2.25} aria-hidden='true' />
              <span>대화</span>
              <strong>{totalMyConversations}</strong>
            </button>
          </div>
        </section>

        <div className='profile-insight-grid'>
          <section className='profile-overview-panel profile-overview-panel--books'>
            <div className='profile-overview-panel__header'>
              <div>
                <span className='profile-section-kicker'>서재</span>
                <h2 className='profile-overview-panel__title'>좋아요한 책</h2>
              </div>
              <button type='button' className='profile-viewall-btn' onClick={() => openModal('likedBooks')}>
                전체 보기
              </button>
            </div>
            <div className='profile-overview-panel__list'>
              {likedBooks.length === 0 ? (
                <p className='profile-overview-panel__empty'>아직 좋아요한 책이 없습니다.</p>
              ) : (
                likedBooks.map((book) => (
                  <div key={book.id} className='profile-book-item'>
                    <div className='profile-book-item__cover'>{book.cover}</div>
                    <div>
                      <p className='profile-book-item__title'>{book.title}</p>
                      <p className='profile-book-item__author'>{book.author}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className='profile-overview-panel profile-overview-panel--liked-conversations'>
            <div className='profile-overview-panel__header'>
              <div>
                <span className='profile-section-kicker'>저장한 가지</span>
                <h2 className='profile-overview-panel__title'>좋아요한 대화</h2>
              </div>
              <button type='button' className='profile-viewall-btn' onClick={() => openModal('likedConversations')}>
                전체 보기
              </button>
            </div>
            <div className='profile-overview-panel__list'>
              {likedConversations.length === 0 ? (
                <p className='profile-overview-panel__empty'>아직 좋아요한 대화가 없습니다.</p>
              ) : (
                likedConversations.map((conv) => (
                  <button key={conv.id} className='profile-conv-item' onClick={() => goToConversation(conv.id)} type='button'>
                    <span className='profile-conv-item__cover'>{conv.cover}</span>
                    <span>
                      <strong className='profile-conv-item__title'>{conv.title}</strong>
                      <span className='profile-conv-item__book'>{conv.book}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className='profile-overview-panel profile-overview-panel--network'>
            <div className='profile-overview-panel__header'>
              <div>
                <span className='profile-section-kicker'>독자 관계</span>
                <h2 className='profile-overview-panel__title'>관계</h2>
              </div>
            </div>
            <div className='profile-network-columns'>
              <div>
                <Link href={`/profile/${encodeURIComponent(username)}/following`} className='profile-network-heading'>
                  팔로잉 <strong>{totalFollowing}</strong>
                </Link>
                <div className='profile-overview-panel__list profile-overview-panel__list--users'>
                  {following.length === 0 ? (
                    <p className='profile-overview-panel__empty'>팔로잉하는 사용자가 없습니다.</p>
                  ) : (
                    following.slice(0, 4).map((user) => (
                      <Link key={user.id} href={`/profile/${encodeURIComponent(user.username)}`} className='profile-user-item'>
                        <span className='profile-user-item__avatar'>{profileInitial(user.username)}</span>
                        <span className='profile-user-item__name'>{user.username}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Link href={`/profile/${encodeURIComponent(username)}/followers`} className='profile-network-heading'>
                  팔로워 <strong>{totalFollowers}</strong>
                </Link>
                <div className='profile-overview-panel__list profile-overview-panel__list--users'>
                  {followers.length === 0 ? (
                    <p className='profile-overview-panel__empty'>팔로워가 없습니다.</p>
                  ) : (
                    followers.slice(0, 4).map((user) => (
                      <Link key={user.id} href={`/profile/${encodeURIComponent(user.username)}`} className='profile-user-item'>
                        <span className='profile-user-item__avatar'>{profileInitial(user.username)}</span>
                        <span className='profile-user-item__name'>{user.username}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className='profile-activity-panel' aria-labelledby='profile-activity-heading'>
          <div className='profile-activity-panel__header'>
            <div>
              <span className='profile-section-kicker'>활동 신호</span>
              <h2 id='profile-activity-heading'>최근 움직임</h2>
            </div>
            <Clock3 size={20} strokeWidth={2.25} aria-hidden='true' />
          </div>
          {activityItems.length === 0 ? (
            <p className='profile-activity-panel__empty'>아직 보여줄 활동이 없습니다. 첫 대화를 시작하면 이곳에 기록됩니다.</p>
          ) : (
            <div className='profile-activity-list'>
              {activityItems.map((item) => (
                <Link key={item.id} href={item.href} className='profile-activity-item'>
                  <span className='profile-activity-item__icon' aria-hidden='true'>
                    {item.type === 'conversation' ? <MessageCircle size={17} strokeWidth={2.25} /> : null}
                    {item.type === 'like' ? <Heart size={17} strokeWidth={2.25} /> : null}
                    {item.type === 'book' ? <BookOpen size={17} strokeWidth={2.25} /> : null}
                    {item.type === 'follow' ? <GitBranch size={17} strokeWidth={2.25} /> : null}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* My Conversations */}
        <section className='profile-conversation-panel'>
          <div className='profile-conversation-panel__header'>
            <div>
              <span className='profile-section-kicker'>대화 기록</span>
              <h2 className='profile-conversation-panel__title'>내 대화</h2>
            </div>
            <button
              type='button'
              className='profile-viewall-btn'
              onClick={() => openModal('myConversations')}
            >
              전체 보기
            </button>
          </div>
          <div className='profile-conversation-panel__grid'>
            {myConversations.length === 0 ? (
              <p className='profile-conversation-panel__empty'>아직 대화가 없습니다.</p>
            ) : (
              myConversations.map((conv) => (
                <div
                  key={conv.id}
                  className='profile-conv-card'
                  onClick={() => goToConversation(conv.id)}
                  role='button'
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') goToConversation(conv.id); }}
                >
                  <div className='profile-conv-card__top'>
                    <div className='profile-conv-card__cover' aria-hidden='true'>{conv.cover}</div>
                    <div className='profile-conv-card__info'>
                      {conv.character ? (
                        <div className='profile-conv-card__character'>
                          <span className='profile-conv-card__character-dot' />
                          <span>{conv.character}</span>
                        </div>
                      ) : null}
                      <h4 className='profile-conv-card__title'>{conv.title}</h4>
                      <p className='profile-conv-card__book'>{conv.book}</p>
                    </div>
                  </div>
                  <p className='profile-conv-card__preview'>{conv.preview}</p>
                  <div className='profile-conv-card__footer'>
                    <span className='profile-conv-card__likes'>♥ {conv.likeCount}</span>
                    <span className='profile-conv-card__time'>{conv.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      {modal.type === 'likedBooks' && (
        <ProfileModal
          title={`좋아요한 책 (${totalLikedBooks})`}
          onClose={closeModal}
        >
          <div className='profile-modal-list'>
            {likedBooks.length === 0 ? (
              <p className='profile-modal-empty'>좋아요한 책이 없습니다.</p>
            ) : (
              likedBooks.map((book) => (
                <div key={book.id} className='profile-modal-book-item'>
                  <span className='profile-modal-book-item__cover'>{book.cover}</span>
                  <div>
                    <p className='profile-modal-book-item__title'>{book.title}</p>
                    <p className='profile-modal-book-item__author'>{book.author}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ProfileModal>
      )}

      {modal.type === 'likedConversations' && (
        <ProfileModal
          title={`좋아요한 대화 (${totalLikedConversations})`}
          onClose={closeModal}
        >
          <div className='profile-modal-list'>
            {likedConversations.length === 0 ? (
              <p className='profile-modal-empty'>좋아요한 대화가 없습니다.</p>
            ) : (
              likedConversations.map((conv) => (
                <div key={conv.id} className='profile-modal-conv-item' onClick={() => { closeModal(); goToConversation(conv.id); }}>
                  <span className='profile-modal-conv-item__cover'>{conv.cover}</span>
                  <div>
                    <p className='profile-modal-conv-item__title'>{conv.title}</p>
                    <p className='profile-modal-conv-item__book'>{conv.book}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ProfileModal>
      )}

      {modal.type === 'following' && (
        <ProfileModal
          title={`팔로잉 (${totalFollowing})`}
          onClose={closeModal}
        >
          <div className='profile-modal-list'>
            {following.length === 0 ? (
              <p className='profile-modal-empty'>팔로잉하는 사용자가 없습니다.</p>
            ) : (
              following.map((user) => (
                <Link key={user.id} href={`/profile/${encodeURIComponent(user.username)}`} className='profile-modal-user-item' onClick={closeModal}>
                  <span className='profile-modal-user-item__avatar'>{user.avatar}</span>
                  <span className='profile-modal-user-item__name'>@{user.username}</span>
                </Link>
              ))
            )}
          </div>
        </ProfileModal>
      )}

      {modal.type === 'followers' && (
        <ProfileModal
          title={`팔로워 (${totalFollowers})`}
          onClose={closeModal}
        >
          <div className='profile-modal-list'>
            {followers.length === 0 ? (
              <p className='profile-modal-empty'>팔로워가 없습니다.</p>
            ) : (
              followers.map((user) => (
                <Link key={user.id} href={`/profile/${encodeURIComponent(user.username)}`} className='profile-modal-user-item' onClick={closeModal}>
                  <span className='profile-modal-user-item__avatar'>{user.avatar}</span>
                  <span className='profile-modal-user-item__name'>@{user.username}</span>
                </Link>
              ))
            )}
          </div>
        </ProfileModal>
      )}

      {modal.type === 'myConversations' && (
        <ProfileModal
          title={`내 대화 (${totalMyConversations})`}
          onClose={closeModal}
        >
          <div className='profile-modal-conv-grid'>
            {myConversations.length === 0 ? (
              <p className='profile-modal-empty'>대화가 없습니다.</p>
            ) : (
              myConversations.map((conv) => (
                <div key={conv.id} className='profile-modal-conv-card' onClick={() => { closeModal(); goToConversation(conv.id); }}>
                  <p className='profile-modal-conv-card__title'>{conv.title}</p>
                  <p className='profile-modal-conv-card__book'>{conv.book}</p>
                  <p className='profile-modal-conv-card__footer'>♥ {conv.likeCount} · {conv.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </ProfileModal>
      )}
    </>
  );
}

interface ProfileModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ProfileModal({ title, onClose, children }: ProfileModalProps) {
  return (
    <div className='profile-modal-overlay' onClick={onClose} role='dialog' aria-modal='true'>
      <div className='profile-modal' onClick={(e) => e.stopPropagation()}>
        <div className='profile-modal__header'>
          <h3 className='profile-modal__title'>{title}</h3>
          <button type='button' className='profile-modal__close' onClick={onClose} aria-label='닫기'>
            ✕
          </button>
        </div>
        <div className='profile-modal__body'>{children}</div>
      </div>
    </div>
  );
}
