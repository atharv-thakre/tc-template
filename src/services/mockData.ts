import { Account } from '../types';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: '1',
    uid: 'usr_001',
    name: 'Alex Rivera',
    handle: 'alex_dev',
    email: 'alex@example.com',
    phone: '+1 (555) 234-5678',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    status: 'active',
    has_password: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    uid: 'usr_002',
    name: 'Sarah Connor',
    handle: 'sarah_c',
    email: 'sarah@example.com',
    phone: '+1 (555) 987-6543',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'active',
    has_password: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];
