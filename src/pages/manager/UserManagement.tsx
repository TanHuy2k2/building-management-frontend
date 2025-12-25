import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { getRankDetails } from '../../utils/rank';
import { Search, User, Crown, Shield, Trash2, Eye, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ActiveStatus,
  CreateUserDto,
  GetUsersParams,
  groupedPermissions,
  OrderDirection,
  Permission,
  ResponseInterface,
  UserForm,
  User as UserInterFace,
  UserModalMode,
  UserRank,
  UserRole,
} from '../../types';
import { createUser, getUsers, getUsersStats, updateUser } from '../../services/userService';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import toast from 'react-hot-toast';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_AVATAR_URL,
  DEFAULT_PAGE_TOTAL,
} from '../../utils/constants';
import { getPaginationNumbers } from '../../utils/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export default function UserManagement() {
  const [users, setUsers] = useState<UserInterFace[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [order, setOrder] = useState<OrderDirection | undefined>();
  const [modalMode, setModalMode] = useState<UserModalMode>(null);
  const [activeUser, setActiveUser] = useState<UserForm | null>(null);
  const [filters, setFilters] = useState({
    search_text: '',
    search_field: 'full_name' as 'full_name' | 'email',
    role: '' as UserRole | '',
    rank: '' as UserRank | '',
    status: 'all' as ActiveStatus | 'all',
  });
  const [userStats, setUserStats] = useState<{
    total: number;
    roles: Record<string, number>;
    ranks: Record<string, number>;
  }>({
    total: 0,
    roles: {},
    ranks: {},
  });
  const { BE_URL } = process.env;

  const fetchUserStats = async () => {
    try {
      const res: ResponseInterface = await getUsersStats();
      if (!res.success) return;

      setUserStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async (p: number = page) => {
    try {
      const effectiveOrder = filters.search_text ? OrderDirection.ASCENDING : order;
      const params: GetUsersParams = {
        ...(filters.search_text
          ? {
              search_text: filters.search_text,
              search_field: filters.search_field,
            }
          : {}),
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.rank ? { rank: filters.rank } : {}),
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        ...(orderBy ? { order_by: orderBy } : {}),
        ...(effectiveOrder ? { order: effectiveOrder } : {}),
      };

      const response: ResponseInterface = await getUsers(params);
      setUsers(response.data.users);
      setTotalPage(response.data.pagination.total_page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchUsers(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [page, orderBy, order]);

  const handleCreate = async () => {
    if (!activeUser) return;

    if (
      !activeUser.full_name ||
      !activeUser.email ||
      !activeUser.username ||
      !activeUser.password ||
      !activeUser.confirm_password
    ) {
      toast.error('Please fill all required fields');

      return;
    }

    if (activeUser.password !== activeUser.confirm_password) {
      toast.error('Passwords do not match');

      return;
    }

    try {
      setLoading(true);

      const payload: CreateUserDto = {
        email: activeUser.email,
        username: activeUser.username,
        password: activeUser.password,
        confirm_password: activeUser.confirm_password,
        full_name: activeUser.full_name,
        phone: activeUser.phone,
        role: activeUser.role,
        ...(activeUser.role !== UserRole.USER && {
          permissions: activeUser.permissions || [],
        }),
      };
      const res: ResponseInterface = await createUser(payload);
      if (!res.success) {
        toast.error(res.message || 'Failed to create user');

        return;
      }

      toast.success('User created successfully');
      setModalMode(null);
      setActiveUser(null);
      setPage(DEFAULT_PAGE);

      await fetchUsers(DEFAULT_PAGE);

      await fetchUserStats();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPermission = (p: Permission) => {
    if (!activeUser) return;

    setActiveUser((prev) => {
      if (!prev) return prev;

      const permissions = prev.permissions?.includes(p)
        ? prev.permissions.filter((x) => x !== p)
        : [...(prev.permissions || []), p];

      return {
        ...prev,
        permissions,
      };
    });
  };

  const filteredPermissionGroups = groupedPermissions
    .map(({ group, permissions }) => {
      const filtered = permissions.filter((p) =>
        p.toLowerCase().includes(permissionSearch.toLowerCase()),
      );

      return { group, permissions: filtered };
    })
    .filter((g) => g.permissions.length > 0);

  const resolveAvatar = (imageUrl?: string | null) => {
    if (!imageUrl) return DEFAULT_AVATAR_URL;

    return imageUrl.startsWith('http') ? imageUrl : `${BE_URL}/${imageUrl}`;
  };

  return (
    <div className="space-y-6">
      {/* Header + Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-muted-foreground">List of users and their information</p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setActiveUser({
              full_name: '',
              email: '',
              username: '',
              phone: '',
              password: '',
              confirm_password: '',
              role: UserRole.USER,
              permissions: [],
            });
            setModalMode('create');
          }}
        >
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        {/* STATUS - LEFT */}
        <Select
          value={filters.status}
          onValueChange={(v: any) => setFilters((p) => ({ ...p, status: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value={ActiveStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={ActiveStatus.INACTIVE}>Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* SEARCH FIELD - RIGHT */}
        <Select
          value={filters.search_field}
          onValueChange={(v: 'full_name' | 'email') =>
            setFilters((p) => ({ ...p, search_field: v }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Search by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full_name">Full name</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>

        {/* SEARCH INPUT */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={
              filters.search_field === 'email' ? 'Search by email...' : 'Search by name...'
            }
            value={filters.search_text}
            onChange={(e) => setFilters((p) => ({ ...p, search_text: e.target.value }))}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL USERS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{userStats.total}</div>
          </CardContent>
        </Card>

        {/* ROLES */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold tracking-tight">Roles</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-3">
            {/* MANAGER */}
            <div className="rounded-lg border p-2">
              <Badge
                variant="outline"
                className="w-full flex items-center justify-between px-3 py-2
                   bg-blue-50 text-blue-700 border-blue-200"
              >
                {/* LEFT */}
                <span className="flex items-center gap-1">
                  <Shield className="size-3" />
                  <span className="text-sm font-medium">Manager</span>
                </span>

                {/* RIGHT */}
                <span className="text-sm font-semibold">{userStats.roles.manager || 0}</span>
              </Badge>
            </div>

            {/* USER */}
            <div className="rounded-lg border p-2">
              <Badge
                variant="outline"
                className="w-full flex items-center justify-between px-3 py-2
                   bg-green-50 text-green-700 border-green-200"
              >
                {/* LEFT */}
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  <span className="text-sm font-medium">User</span>
                </span>

                {/* RIGHT */}
                <span className="text-sm font-semibold">{userStats.roles.user || 0}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* RANKS */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold tracking-tight">Ranks</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-3">
            {(['platinum', 'gold', 'silver', 'bronze'] as const).map((rank) => {
              const details = getRankDetails(rank);
              const count = userStats.ranks[rank] || 0;

              return (
                <div key={rank} className="rounded-lg border p-2 flex items-center">
                  <Badge
                    variant="outline"
                    className={`w-full flex items-center justify-between px-3 py-2 ${details.bgColor}`}
                  >
                    <span className="flex items-center gap-1">
                      <Crown className={`size-3 ${details.color}`} />
                      <span className={`text-sm font-medium ${details.color}`}>{details.name}</span>
                    </span>

                    <span className={`text-sm font-semibold ${details.color}`}>{count}</span>
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-2 gap-6">
        {users.map((user) => {
          const rankDetails = getRankDetails(user.rank);

          return (
            <Card key={user.id}>
              <CardContent className="flex justify-between items-start p-4 gap-4">
                {/* LEFT: Avatar */}
                <div className="size-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={resolveAvatar(user.image_url)}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR_URL;
                    }}
                  />
                </div>

                {/* MIDDLE: Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{user.full_name}</p>
                      <Badge variant="outline" className={rankDetails.bgColor}>
                        <Crown className={`size-3 mr-1 ${rankDetails.color}`} />
                        <span className={rankDetails.color}>{rankDetails.name}</span>
                      </Badge>
                    </div>

                    <p>
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span> {user.phone}
                    </p>
                    <p>
                      <span className="font-medium">Username:</span> {user.username}
                    </p>
                    <p>
                      <span className="font-medium">Role:</span>{' '}
                      <span className="capitalize">{user.role}</span>
                    </p>
                  </div>
                </div>

                {/* RIGHT: Points + Actions */}
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm text-blue-600">{user.points} points</p>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      title="View"
                      className="w-9 h-9"
                      onClick={() => {
                        setActiveUser(user);
                        setModalMode('view');
                      }}
                    >
                      <Eye className="size-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="secondary"
                      title="Edit"
                      className="w-9 h-9"
                      onClick={() => {
                        setActiveUser({
                          id: user.id,
                          full_name: user.full_name,
                          email: user.email,
                          username: user.username,
                          phone: user.phone,
                          role: user.role,
                          permissions: user.permissions,
                        });
                        setModalMode('edit');
                      }}
                    >
                      <Edit className="size-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="destructive"
                      title="Delete"
                      className="w-9 h-9"
                      onClick={() => {}}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modalMode && activeUser && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-start p-6 overflow-y-auto"
          onClick={() => {
            setModalMode(null);
            setActiveUser(null);
            setSelectedFile(null);
          }}
        >
          <Card
            style={{
              width: '100%',
              maxWidth: modalMode === 'view' || activeUser.role === UserRole.USER ? 440 : 700,
              margin:
                modalMode === 'view' || activeUser.role === UserRole.USER ? '0 auto' : undefined,
              transition: 'max-width 0.3s ease',
            }}
            className="p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== TITLE ===== */}
            <h2 className="text-xl font-semibold mb-6">
              {modalMode === 'create' && 'Create New User'}
              {modalMode === 'view' && 'User Details'}
              {modalMode === 'edit' && 'Edit User'}
            </h2>

            {modalMode === 'view' && (
              <div className="space-y-6 text-sm">
                {/* ===== HEADER ===== */}
                <div className="flex items-center gap-6">
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    <img
                      src={resolveAvatar(activeUser.image_url)}
                      alt={activeUser.full_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR_URL;
                      }}
                    />
                  </div>

                  {/* NAME + META */}
                  <div>
                    <h3 className="text-lg font-semibold">{activeUser.full_name}</h3>
                    <p className="text-muted-foreground">{activeUser.email}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="capitalize">
                        {activeUser.role}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        Rank: {activeUser.rank}
                      </Badge>
                      <Badge variant="outline">{activeUser.points} pts</Badge>
                    </div>
                  </div>
                </div>

                {/* ===== INFO GRID ===== */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                  <div>
                    <p className="text-muted-foreground">Username</p>
                    <p className="font-medium">{activeUser.username}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{activeUser.phone || '-'}</p>
                  </div>
                </div>

                {/* ===== PERMISSIONS ===== */}
                <div>
                  <p className="font-semibold mb-2">Permissions</p>

                  {activeUser.permissions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {activeUser.permissions.map((p) => (
                        <Badge key={p} variant="outline" className="capitalize">
                          {p.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No permissions</p>
                  )}
                </div>
              </div>
            )}

            {/* ===== CREATE / EDIT MODE ===== */}
            {(modalMode === 'create' || modalMode === 'edit') && (
              <div
                style={{
                  width: '100%',
                  maxWidth: activeUser.role === UserRole.USER ? 400 : '100%',
                  margin: activeUser.role === UserRole.USER ? '0 auto' : undefined,
                }}
              >
                {activeUser.role === UserRole.USER ? (
                  /* ================= USER → SINGLE COLUMN ================= */
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={activeUser.full_name}
                        onChange={(e) =>
                          setActiveUser({ ...activeUser, full_name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input
                        placeholder="example@email.com"
                        value={activeUser.email}
                        disabled={modalMode === 'edit'}
                        onChange={(e) => setActiveUser({ ...activeUser, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Username</Label>
                      <Input
                        value={activeUser.username}
                        onChange={(e) => setActiveUser({ ...activeUser, username: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Phone</Label>
                      <Input
                        placeholder="0123456789"
                        value={activeUser.phone}
                        onChange={(e) => setActiveUser({ ...activeUser, phone: e.target.value })}
                      />
                    </div>

                    {/* PASSWORD */}
                    {modalMode === 'create' && (
                      <>
                        <div>
                          <Label>Password</Label>
                          <Input
                            placeholder="At least 8 characters and 1 uppercase"
                            type="password"
                            value={activeUser.password}
                            onChange={(e) =>
                              setActiveUser({ ...activeUser, password: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label>Confirm Password</Label>
                          <Input
                            placeholder="At least 8 characters and 1 uppercase"
                            type="password"
                            value={activeUser.confirm_password}
                            onChange={(e) =>
                              setActiveUser({
                                ...activeUser,
                                confirm_password: e.target.value,
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    {/* ROLE */}
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={activeUser.role}
                        onValueChange={(value: UserRole) =>
                          setActiveUser({
                            ...activeUser,
                            role: value,
                            permissions: [],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                          <SelectItem value={UserRole.USER}>User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* AVATAR */}
                    {modalMode === 'edit' && (
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
                    )}
                  </div>
                ) : (
                  /* ================= MANAGER → TWO COLUMNS ================= */
                  <div className="grid grid-cols-2 gap-6">
                    {/* ===== LEFT COLUMN ===== */}
                    <div className="space-y-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={activeUser.full_name}
                          onChange={(e) =>
                            setActiveUser({ ...activeUser, full_name: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label>Email</Label>
                        <Input
                          placeholder="example@email.com"
                          value={activeUser.email}
                          disabled={modalMode === 'edit'}
                          onChange={(e) => setActiveUser({ ...activeUser, email: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Username</Label>
                        <Input
                          value={activeUser.username}
                          onChange={(e) =>
                            setActiveUser({ ...activeUser, username: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label>Phone</Label>
                        <Input
                          placeholder="0123456789"
                          value={activeUser.phone}
                          onChange={(e) => setActiveUser({ ...activeUser, phone: e.target.value })}
                        />
                      </div>

                      {/* PASSWORD */}
                      {modalMode === 'create' && (
                        <>
                          <div>
                            <Label>Password</Label>
                            <Input
                              placeholder="At least 8 characters and 1 uppercase"
                              type="password"
                              value={activeUser.password}
                              onChange={(e) =>
                                setActiveUser({ ...activeUser, password: e.target.value })
                              }
                            />
                          </div>

                          <div>
                            <Label>Confirm Password</Label>
                            <Input
                              placeholder="At least 8 characters and 1 uppercase"
                              type="password"
                              value={activeUser.confirm_password}
                              onChange={(e) =>
                                setActiveUser({
                                  ...activeUser,
                                  confirm_password: e.target.value,
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* ===== RIGHT COLUMN ===== */}
                    <div className="space-y-6">
                      {/* ROLE */}
                      <div>
                        <Label>Role</Label>
                        <Select
                          value={activeUser.role}
                          onValueChange={(value: UserRole) =>
                            setActiveUser({
                              ...activeUser,
                              role: value,
                              permissions: [],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                            <SelectItem value={UserRole.USER}>User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* AVATAR */}
                      {modalMode === 'edit' && (
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
                      )}

                      {/* PERMISSIONS */}
                      <div>
                        <Label>Permissions</Label>

                        <Input
                          placeholder="Search permission..."
                          className="mt-1 mb-2"
                          value={permissionSearch}
                          onChange={(e) => setPermissionSearch(e.target.value)}
                        />

                        <div className="border rounded h-64 overflow-y-auto p-3 space-y-4">
                          {filteredPermissionGroups.map(({ group, permissions }) => (
                            <div key={group}>
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                                {group}
                              </p>

                              <div className="grid grid-cols-2 gap-3">
                                {permissions.map((p) => (
                                  <label key={p} className="flex items-start space-x-2 text-sm">
                                    <Checkbox
                                      checked={activeUser.permissions?.includes(p)}
                                      onCheckedChange={() => handleSelectPermission(p)}
                                    />
                                    <span className="capitalize break-words">
                                      {p.replace(/_/g, ' ')}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}

                          {filteredPermissionGroups.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center">
                              No permissions found
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== ACTIONS ===== */}
            <div className="flex justify-end gap-2 pt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setModalMode(null);
                  setActiveUser(null);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </Button>

              {modalMode === 'create' && <Button onClick={handleCreate}>Create</Button>}
              {modalMode === 'edit' && <Button>Save</Button>}
            </div>
          </Card>
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex justify-center mt-4 gap-2">
        {/* Prev */}
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>

        {/* Numbers */}
        <div className="flex gap-2">
          {getPaginationNumbers(page, totalPage).map((item, idx) => {
            if (item === '...') {
              return (
                <div key={idx} className="px-3 py-1 border rounded-lg text-gray-500">
                  ...
                </div>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => setPage(Number(item))}
                style={{
                  backgroundColor: page === item ? 'black' : 'white',
                  color: page === item ? 'white' : 'black',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s',
                }}
                className={page === item ? '' : 'hover:bg-gray-100'}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          disabled={page === totalPage}
          onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
        >
          Next
        </Button>
      </div>

      {/* =================== LOADING INDICATOR =================== */}
      {loading && <div className="flex justify-center mt-6 text-gray-500">Loading...</div>}

      {users.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No users found.</p>
            <Button
              variant="link"
              onClick={() => {
                setFilters({
                  status: 'all',
                  search_field: 'full_name',
                  search_text: '',
                  role: '',
                  rank: '',
                });
              }}
            >
              View All
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
