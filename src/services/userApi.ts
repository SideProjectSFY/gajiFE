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
    await api.delete(`/users/${userId}/follow`)
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
    const response = await api.get<User[]>(`/users/${userId}/followers`)
    return response.data
  },

  /**
   * Get following list
   * @param userId User ID
   */
  async getFollowing(userId: string): Promise<User[]> {
    const response = await axios.get<User[]>(`${API_BASE_URL}/api/v1/users/${userId}/following`)
    return response.data
  },
}
