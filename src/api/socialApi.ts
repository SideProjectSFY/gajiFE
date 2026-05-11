import { requestJson } from '@/api/http';
import type { Conversation, PageResponse, UserSummary } from '@/domains/journeys/types/core';

export function followUser(userId: string): Promise<void> {
  return requestJson<void>(`/api/users/${userId}/follow`, { method: 'POST' });
}

export function unfollowUser(userId: string): Promise<void> {
  return requestJson<void>(`/api/users/${userId}/unfollow`, { method: 'DELETE' });
}

export function getUserByUsername(username: string): Promise<UserSummary> {
  return requestJson<UserSummary>(`/api/users/profile/${username}`);
}

export function getFollowers(userId: string, page = 0, size = 20): Promise<PageResponse<UserSummary>> {
  return requestJson<PageResponse<UserSummary>>(`/api/users/${userId}/followers?page=${page}&size=${size}`);
}

export function getFollowing(userId: string, page = 0, size = 20): Promise<PageResponse<UserSummary>> {
  return requestJson<PageResponse<UserSummary>>(`/api/users/${userId}/following?page=${page}&size=${size}`);
}

export function getLikedConversations(page = 0, size = 20): Promise<PageResponse<Conversation>> {
  return requestJson<PageResponse<Conversation>>(`/api/conversations?filter=liked&page=${page}&size=${size}`);
}
