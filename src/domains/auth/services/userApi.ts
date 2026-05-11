export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const userApi = {
  async followUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to follow user');
  },

  async unfollowUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/unfollow`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unfollow user');
  },

  async getUserProfile(username: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${username}`);
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  },

  async getFollowers(userId: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/followers`);
    if (!response.ok) throw new Error('Failed to fetch followers');
    const data = await response.json();
    return data.content;
  },

  async getFollowing(userId: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/following`);
    if (!response.ok) throw new Error('Failed to fetch following');
    const data = await response.json();
    return data.content;
  },

  async updateProfile(userId: string, data: { bio?: string }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },
};
