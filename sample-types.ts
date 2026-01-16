// Contoh berkas TypeScript untuk pengujian
interface User {
  id: number;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'editor' | 'viewer';

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getUsersByRole(role: UserRole): User[] {
    // Implementasi sederhana - dalam kasus nyata mungkin akan terkait dengan role
    return this.users;
  }
}

function processUserData(userData: User): string {
  return `Processing user: ${userData.name}`;
}

export { User, UserService, processUserData };