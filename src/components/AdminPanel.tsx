
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Trash2, Edit, Shield, Award, UserPlus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';

interface UserData {
  id: string;
  email: string;
  username: string;
  created_at: string;
  proStatus: boolean;
  isAdmin: boolean;
  last_login?: string;
  avatar_url?: string;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newProStatus, setNewProStatus] = useState(false);
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Admin authentication
  const handleAdminAuth = () => {
    if (adminPassword === 'Mastermind@123') {
      setIsAuthenticated(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid admin password');
    }
  };

  // Fetch users
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchUsers();
  }, [isAuthenticated]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch from auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('users_extra')
        .select('*');
      
      if (authError) throw authError;
      
      setUsers(authUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users by search term
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Edit user
  const handleEditClick = (user: UserData) => {
    setEditUser(user);
    setNewUsername(user.username || '');
    setNewEmail(user.email || '');
    setNewProStatus(user.proStatus || false);
    setNewIsAdmin(user.isAdmin || false);
  };
  
  const handleSaveEdit = async () => {
    if (!editUser) return;
    
    try {
      const { error } = await supabase
        .from('users_extra')
        .update({
          username: newUsername,
          proStatus: newProStatus,
          isAdmin: newIsAdmin
        })
        .eq('id', editUser.id);
      
      if (error) throw error;
      
      toast.success('User updated successfully');
      fetchUsers();
      setEditUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };
  
  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete from users_extra
      const { error: extraError } = await supabase
        .from('users_extra')
        .delete()
        .eq('id', userId);
      
      if (extraError) throw extraError;
      
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2" /> Admin Authentication
            </CardTitle>
            <CardDescription>
              Enter the admin password to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleAdminAuth}>
                Authenticate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <Button onClick={fetchUsers}>Refresh</Button>
      </div>
      
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>User Management</CardTitle>
            <div className="flex gap-2">
              <Input 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" placeholder="user@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" placeholder="Username" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="pro-status" />
                      <Label htmlFor="pro-status">Pro Status</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="admin-status" />
                      <Label htmlFor="admin-status">Admin Status</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {user.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.last_login || '')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {user.proStatus && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            PRO
                          </Badge>
                        )}
                        {user.isAdmin && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            ADMIN
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Edit user details and permissions
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-username">Username</Label>
                                <Input id="edit-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="edit-pro-status" checked={newProStatus} onCheckedChange={setNewProStatus} />
                                <Label htmlFor="edit-pro-status">Pro Status</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="edit-admin-status" checked={newIsAdmin} onCheckedChange={setNewIsAdmin} />
                                <Label htmlFor="edit-admin-status">Admin Status</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button onClick={handleSaveEdit}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                                Delete User
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
