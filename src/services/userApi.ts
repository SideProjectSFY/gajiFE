/**
 * User API Service
 * Handles HTTP requests for user-related operations
 */

import api from './api'

export interface User {
  id: string
  username: string
  avatarUrl?: string
  bio?: string
}

export const userApi = {
  /**
   * Follow a user
   * @param userId User ID to follow
   */
  async followUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/follow`)
  },

  /**
   * Unfollow a user
   * @param userId User ID to unfollow
   */
  async unfollowUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/unfollow`)
  },

  /**
   * Get user profile by username
   * @param username Username
   */
  async getUserProfile(username: string): Promise<User> {
    const response = await api.get<User>(`/users/${username}`)
    return response.data
  },

  /**
   * Get followers list
   * @param userId User ID
   */
  async getFollowers(userId: string): Promise<User[]> {
    const response = await api.get<any>(`/users/${userId}/followers`)
    return response.data.content
  },

  /**
   * Get following list
   * @param userId User ID
   */
  async getFollowing(userId: string): Promise<User[]> {
    const response = await api.get<any>(`/users/${userId}/following`)
    return response.data.content
  },
}
