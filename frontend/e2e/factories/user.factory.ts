export class UserFactory {
  static createTestUser(): { username: string; email: string; password: string } {
    const timestamp = Date.now()
    return {
      username: `testuser_${timestamp}`,
      email: `testuser_${timestamp}@example.com`,
      password: 'TestPass123!',
    }
  }

  static createVerifiedUser(): {
    username: string
    email: string
    password: string
    isVerified: boolean
  } {
    return {
      ...this.createTestUser(),
      isVerified: true,
    }
  }

  static createUsers(count: number): Array<{ username: string; email: string; password: string }> {
    return Array.from({ length: count }, () => this.createTestUser())
  }
}
