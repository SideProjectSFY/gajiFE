'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getCatalogBookDetail } from '@/api/catalogApi';
import { createBookComment, deleteComment, listBookComments, updateComment } from '@/api/commentApi';
import type { Book } from '@/domains/catalog/types/book';
import type { Comment } from '@/domains/journeys/types/core';
import {
  canMutateOwnedResource,
  getCurrentUserFromToken,
  type CurrentUser
} from '@/domains/journeys/utils/currentUser';
import { useLocale } from '@/i18n/useLocale';

export function CatalogDetailClient({ bookId }: { bookId: string }) {
  const { t } = useLocale();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentPending, setCommentPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ userId: null, username: null });

  useEffect(() => {
    setCurrentUser(getCurrentUserFromToken());
  }, []);

  const loadBook = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCatalogBookDetail(bookId);
      const commentPage = await listBookComments(bookId).catch(() => ({ content: [] as Comment[] }));

      setBook(response);
      setComments(commentPage.content ?? []);
    } catch {
      setBook(null);
      setComments([]);
      setError(t('books.detail.failed', '책 세부 정보를 불러오는데 실패했습니다'));
    } finally {
      setLoading(false);
    }
  }, [bookId, t]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  async function onSubmitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextContent = commentInput.trim();
    if (!nextContent) return;

    try {
      setCommentPending(true);
      setError(null);
      if (editingCommentId) {
        const editingComment = comments.find((item) => item.id === editingCommentId);
        if (
          editingComment &&
          !canMutateOwnedResource(
            { userId: editingComment.userId, username: editingComment.username },
            currentUser,
            { requireExplicitOwner: true }
          )
        ) {
          setError('Only the owner can edit this comment.');
          return;
        }

        const updated = await updateComment(editingCommentId, nextContent);
        setComments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const optimisticId = `optimistic-${Date.now()}`;
        const optimistic: Comment = {
          id: optimisticId,
          content: nextContent,
          userId: currentUser.userId ?? undefined,
          username: currentUser.username ?? undefined
        };
        setComments((prev) => [optimistic, ...prev]);
        const created = await createBookComment(bookId, nextContent);
        setComments((prev) => prev.map((item) => (item.id === optimisticId ? created : item)));
      }

      setCommentInput('');
      setEditingCommentId(null);
    } catch {
      setError(t('comments.toast.postFailed', '댓글 작성에 실패했습니다'));
      if (!editingCommentId) {
        setComments((prev) => prev.filter((item) => !item.id.startsWith('optimistic-')));
      }
    } finally {
      setCommentPending(false);
    }
  }

  async function onDeleteComment(commentId: string) {
    try {
      setCommentPending(true);
      setError(null);
      const target = comments.find((item) => item.id === commentId);
      if (
        target &&
        !canMutateOwnedResource(
          { userId: target.userId, username: target.username },
          currentUser,
          { requireExplicitOwner: true }
        )
      ) {
        setError('Only the owner can delete this comment.');
        return;
      }

      setComments((prev) => prev.filter((item) => item.id !== commentId));
      await deleteComment(commentId);
    } catch {
      setError(t('comments.toast.deleteFailed', '댓글 삭제에 실패했습니다'));
      await loadBook();
    } finally {
      setCommentPending(false);
    }
  }

  return (
    <main className='book-detail-page'>
      <Link href='/books' className='book-detail-back-link'>
        ← 책 목록으로 돌아가기
      </Link>

      {loading ? <p className='book-detail-loading'>{t('books.detail.loading', '책 세부 정보를 불러오는 중...')}</p> : null}

      {!loading && error ? (
        <section className='book-detail-error' role='alert'>
          <p>{error}</p>
          <button type='button' onClick={loadBook}>
            {t('common.retry', '재시도')}
          </button>
        </section>
      ) : null}

      {!loading && !error && book ? (
        <article className='book-detail-card'>
          <header>
            <div className='book-detail-cover'>📚</div>
            <div>
              <h1>{book.title}</h1>
              <p>{book.author}</p>
              <p>{book.genre}</p>
            </div>
          </header>

          <p>{book.description ?? t('books.detail.description', '설명')}</p>

          <dl>
            <div>
              <dt>시나리오</dt>
              <dd>{book.scenarioCount}</dd>
            </div>
            <div>
              <dt>대화</dt>
              <dd>{book.conversationCount}</dd>
            </div>
            <div>
              <dt>좋아요</dt>
              <dd>{book.likeCount}</dd>
            </div>
          </dl>

          <section className='book-comments'>
            <h2>댓글</h2>
            <form onSubmit={onSubmitComment}>
              <input
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
                aria-label='Comment input'
                placeholder={t('comments.placeholder', '이 책에 대한 생각을 공유해주세요...')}
                disabled={commentPending}
              />
              <button type='submit' disabled={commentPending}>{editingCommentId ? t('common.edit', '수정') : t('comments.post', '댓글 작성')}</button>
            </form>

            <ul>
              {comments.map((comment) => (
                <li key={comment.id}>
                  <p>{comment.content}</p>
                  {canMutateOwnedResource(
                    { userId: comment.userId, username: comment.username },
                    currentUser,
                    { requireExplicitOwner: true }
                  ) ? (
                    <div>
                      <button
                        type='button'
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setCommentInput(comment.content);
                        }}
                        disabled={commentPending}
                      >
                        {t('common.edit', '수정')}
                      </button>
                      <button type='button' disabled={commentPending} onClick={() => void onDeleteComment(comment.id)}>
                        {t('common.delete', '삭제')}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </article>
      ) : null}
    </main>
  );
}
