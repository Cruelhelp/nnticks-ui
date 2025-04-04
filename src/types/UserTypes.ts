
export interface UserDetailsType {
  id?: string;
  user_id?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  proStatus?: boolean;
  isAdmin?: boolean;
  lastLogin?: string;
  createdAt?: string;
  settings?: {
    theme?: string;
    accent?: string;
    [key: string]: any;
  };
  availableEpochs?: number;
  totalEpochs?: number;
}
