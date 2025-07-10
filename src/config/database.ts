// Sistema de banco de dados interno usando localStorage com sincronização
export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

class InternalDatabase {
  private readonly USERS_KEY = '@ArbElite:users';
  private readonly CURRENT_USER_KEY = '@ArbElite:currentUser';

  // Salvar usuário no banco
  saveUser(user: User): void {
    const users = this.getAllUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // Buscar todos os usuários
  getAllUsers(): User[] {
    const usersData = localStorage.getItem(this.USERS_KEY);
    return usersData ? JSON.parse(usersData) : [];
  }

  // Buscar usuário por email
  getUserByEmail(email: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Verificar se email já existe
  emailExists(email: string): boolean {
    return this.getUserByEmail(email) !== null;
  }

  // Registrar novo usuário
  register(fullName: string, email: string, password: string): AuthResponse {
    // Validações
    if (!fullName.trim()) {
      return { success: false, message: 'Nome completo é obrigatório' };
    }

    if (fullName.trim().length < 2) {
      return { success: false, message: 'Nome deve ter pelo menos 2 caracteres' };
    }

    if (!email.trim()) {
      return { success: false, message: 'Email é obrigatório' };
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Por favor, insira um email válido' };
    }

    if (!password) {
      return { success: false, message: 'Senha é obrigatória' };
    }

    if (password.length < 6) {
      return { success: false, message: 'A senha deve ter pelo menos 6 caracteres' };
    }

    // Verificar se email já existe
    if (this.emailExists(email)) {
      return { success: false, message: 'Este email já está cadastrado. Faça login ou use outro email.' };
    }

    // Criar novo usuário
    const newUser: User = {
      id: this.generateId(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Em produção, seria hash
      createdAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    this.setCurrentUser(newUser);

    return { 
      success: true, 
      user: { ...newUser, password: '' }, // Não retornar senha
      message: 'Conta criada com sucesso!' 
    };
  }

  // Login do usuário
  login(email: string, password: string): AuthResponse {
    if (!email.trim() || !password) {
      return { success: false, message: 'Por favor, preencha todos os campos' };
    }

    const user = this.getUserByEmail(email);
    
    if (!user || user.password !== password) {
      return { success: false, message: 'Usuário não encontrado ou senha incorreta' };
    }

    // Atualizar último login
    user.lastLogin = new Date().toISOString();
    this.saveUser(user);
    this.setCurrentUser(user);

    return { 
      success: true, 
      user: { ...user, password: '' }, // Não retornar senha
      message: 'Login realizado com sucesso!' 
    };
  }

  // Definir usuário atual
  setCurrentUser(user: User): void {
    const userWithoutPassword = { ...user, password: '' };
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  }

  // Obter usuário atual
  getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  // Verificar se usuário está logado
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Gerar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Limpar todos os dados (para desenvolvimento)
  clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }
}

export const database = new InternalDatabase();