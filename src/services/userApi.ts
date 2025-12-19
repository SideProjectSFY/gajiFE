/**
 * User API Service
 * Handles HTTP requests for user-related operations
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
    await axios.post(`${API_BASE_URL}/api/v1/users/${userId}/follow`)
  },

  /**
   * Unfollow a user
   * @param userId User ID to unfollow
   */
  async unfollowUser(userId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/v1/users/${userId}/follow`)
  },

  /**
   * Get user profile by username
   * @param username Username
   */
  async getUserProfile(username: string): Promise<User> {
    const response = await axios.get<User>(`${API_BASE_URL}/api/v1/users/${username}`)
    return response.data
  },

  /**
   * Get followers list
   * @param userId User ID
   */
  async getFollowers(userId: string): Promise<User[]> {
    const response = await axios.get<User[]>(`${API_BASE_URL}/api/v1/users/${userId}/followers`)
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
