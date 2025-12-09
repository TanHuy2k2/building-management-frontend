import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { getRankDetails } from '../../data/mockData';
import { Search, User, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Permission, ResponseInterface, User as UserInterFace, UserRole } from '../../types';
import { createUser, getUsers, updateUser } from '../../services/userService';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import toast from 'react-hot-toast';

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserInterFace[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    full_name: '',
    phone: '',
    role: UserRole.MANAGER,
    permissions: [] as string[],
  });
  const [permissionSearch, setPermissionSearch] = useState('');
  const [viewUser, setViewUser] = useState<UserInterFace | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserInterFace | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { BE_URL } = process.env;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response: ResponseInterface = await getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();
  }, []);

  const handleCreate = async () => {
    try {
      const res: ResponseInterface = await createUser(newUser);
      if (!res.success) {
        toast.error(res.message || 'Failed to create user');

        return;
      }

      toast.success('User created successfully!');
      setUsers((prev) => [...prev, res.data]);
      setIsCreateOpen(false);
      setNewUser({
        email: '',
        username: '',
        password: '',
        confirm_password: '',
        full_name: '',
        phone: '',
        role: UserRole.MANAGER,
        permissions: [],
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectPermission = (p: string) => {
    setNewUser((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(p)
        ? prev.permissions.filter((x) => x !== p)
        : [...prev.permissions, p],
    }));
  };

  const handleSubmitEdit = async () => {
    if (!editUser) return;

    const formData = new FormData();
    formData.append('full_name', editUser.full_name);
    formData.append('username', editUser.username);
    formData.append('phone', editUser.phone);

    if (selectedFile) {
      formData.append('user-images', selectedFile);
    }

    const res = await updateUser(editUser.id, formData);
    if (!res?.success) {
      toast.error(res?.message || 'Update failed!');
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? res.data : u)));
    toast.success('User updated!');
    setIsEditOpen(false);
    setSelectedFile(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredPermissions = Object.values(Permission).filter((p) =>
    p.toLowerCase().includes(permissionSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header + Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-muted-foreground">List of users and their information</p>
        </div>

        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Create User
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Platinum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-purple-600">
              {users.filter((u) => u.rank === 'platinum').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Gold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">
              {users.filter((u) => u.rank === 'gold').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Silver and Bronze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-600">
              {users.filter((u) => u.rank === 'silver' || u.rank === 'bronze').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => {
          const rankDetails = getRankDetails(user.rank);
          return (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full flex items-center justify-center text-white overflow-hidden">
                    {user.image_url ? (
                      <img
                        src={`${BE_URL}/${user.image_url}`}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center w-full h-full">
                        <User className="size-6" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{user.full_name}</p>
                      <Badge variant="outline" className={rankDetails.bgColor}>
                        <Crown className={`size-3 mr-1 ${rankDetails.color}`} />
                        <span className={rankDetails.color}>{rankDetails.name}</span>
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                    <p className="text-sm text-muted-foreground">Username: {user.username}</p>
                    <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <p className="text-sm text-blue-600">{user.points} points</p>

                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" onClick={() => setViewUser(user)}>
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditUser(user);
                        setIsEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}

      {/* ======= CREATE USER POPUP ======= */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 overflow-y-auto flex justify-center items-start p-6">
          <Card className="w-full max-w-md md:max-w-lg p-6 max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-semibold mb-4">Create New User</h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <Label>Full Name</Label>
                <Input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email</Label>
                <Input
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              {/* Username */}
              <div>
                <Label>Username</Label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div>
                <Label>Phone</Label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>

              {/* Password */}
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={newUser.confirm_password}
                  onChange={(e) => setNewUser({ ...newUser, confirm_password: e.target.value })}
                />
              </div>

              {/* Role */}
              <div>
                <Label>Role</Label>
                <select
                  className="border rounded p-2 w-full"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                >
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.USER}>User</option>
                </select>
              </div>

              <div>
                <Label>Permissions</Label>

                {/* Search */}
                <Input
                  placeholder="Search permission..."
                  className="mt-1 mb-2"
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                />

                {/* Scrollable box */}
                <div className="border rounded h-48 overflow-y-auto p-3">
                  <div className="grid grid-cols-2 gap-3">
                    {filteredPermissions.map((p) => (
                      <label key={p} className="flex items-start space-x-2 break-words leading-5">
                        <Checkbox
                          checked={newUser.permissions.includes(p)}
                          onCheckedChange={() => handleSelectPermission(p)}
                        />
                        <span className="capitalize text-sm">{p.replace(/_/g, ' ')}</span>
                      </label>
                    ))}

                    {filteredPermissions.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-2 text-center">
                        No permissions found
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======= VIEW USER POPUP ======= */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-start p-6 overflow-y-auto">
          <Card className="w-full max-w-md md:max-w-lg p-6 max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-semibold mb-4 text-center md:text-left">User Details</h2>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="size-20 rounded-full flex items-center justify-center text-white overflow-hidden">
                {viewUser.image_url ? (
                  <img
                    src={`${BE_URL}/${viewUser.image_url}`}
                    alt={viewUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center w-full h-full">
                    <User className="size-6" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-2 max-w-md">
                <p>
                  <strong>Full Name:</strong> {viewUser.full_name}
                </p>
                <p>
                  <strong>Email:</strong> {viewUser.email}
                </p>
                <p>
                  <strong>Username:</strong> {viewUser.username}
                </p>
                <p>
                  <strong>Phone:</strong> {viewUser.phone}
                </p>
                <p>
                  <strong>Role:</strong> {viewUser.role}
                </p>
                <p>
                  <strong>Rank:</strong> {viewUser.rank}
                </p>
                <p>
                  <strong>Points:</strong> {viewUser.points}
                </p>

                <div>
                  <strong>Permissions:</strong>
                  {viewUser.permissions?.length ? (
                    <ul className="list-disc ml-5 mt-1">
                      {viewUser.permissions.map((p) => (
                        <li key={p} className="capitalize">
                          {p.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No permissions</p>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6">
              <Button onClick={() => setViewUser(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {/* ======= EDIT USER POPUP ======= */}
      {isEditOpen && editUser && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-start p-6 overflow-y-auto"
          onClick={() => {
            setIsEditOpen(false);
            setSelectedFile(null);
          }}
        >
          <Card
            className="w-full max-w-md md:max-w-lg p-6 max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-6 text-center md:text-left">Edit User</h2>

            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="size-20 rounded-full flex items-center justify-center text-white overflow-hidden">
                {editUser.image_url ? (
                  <img
                    src={`${BE_URL}/${editUser.image_url}`}
                    alt={editUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center w-full h-full">
                    <User className="size-6" />
                  </div>
                )}
              </div>

              {/* User Info / Form */}
              <div className="flex-1 min-w-0 space-y-4 text-sm md:text-base">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={editUser.full_name}
                    onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input value={editUser.email} disabled className="bg-gray-100" />
                </div>

                <div>
                  <Label>Username</Label>
                  <Input
                    value={editUser.username}
                    onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Avatar</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) setSelectedFile(e.target.files[0]);
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditOpen(false);
                      setSelectedFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitEdit}>Save</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
