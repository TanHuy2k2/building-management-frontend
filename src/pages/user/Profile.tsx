import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

import { useAuth } from '../../contexts/AuthContext';
import { getRankDetails, mockTransactions } from '../../data/mockData';
import { User, Crown, Award, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential } from 'firebase/auth';
import { updatePassword, updateUserProfile } from '../../services/userService';
import { User as UserInterface } from '../../types';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

export default function UserProfile() {
  const { currentUser } = useAuth();
  const POINT_VALUE = 1000;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<UserInterface | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [passwordEditOpen, setPasswordEditOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { BE_URL } = process.env;

  useEffect(() => {
    if (currentUser) setUser({ ...currentUser });
  }, [currentUser]);

  if (!currentUser || !user) return null;

  const rankDetails = getRankDetails(currentUser.rank);
  const userTransactions = mockTransactions.filter((t) => t.userId === currentUser.id);
  const ranks = [
    { name: 'bronze', min: 0 },
    { name: 'silver', min: 1000000 },
    { name: 'gold', min: 5000000 },
    { name: 'platinum', min: 10000000 },
  ];
  const currentRankIndex = ranks.findIndex((r) => r.name === currentUser.rank);
  const currentRank = ranks[currentRankIndex];
  const nextRank = ranks[currentRankIndex + 1] || null;
  const userSpentBasedOnRank = currentRank.min;
  const amountNeededForNextRank = nextRank ? nextRank.min - userSpentBasedOnRank : 0;

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser!;
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      const res = await updatePassword({
        password: newPassword,
        confirm_password: confirmPassword,
      });
      if (res.success) {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordEditOpen(false);
      } else {
        toast.error(res.message || 'Failed to update password');
      }

      setLoading(false);
    } catch (error: any) {
      console.error(error);
      toast.error('Current password is incorrect or update failed');
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    const formData = new FormData();
    let hasUpdates = false;

    if (user.full_name !== currentUser.full_name) {
      formData.append('full_name', user.full_name);
      hasUpdates = true;
    }
    if (user.username !== currentUser.username) {
      formData.append('username', user.username);
      hasUpdates = true;
    }
    if (user.phone !== currentUser.phone) {
      formData.append('phone', user.phone);
      hasUpdates = true;
    }
    if (selectedFile) {
      formData.append('user-images', selectedFile);
      hasUpdates = true;
    }

    if (!hasUpdates) {
      toast.error('No changes to update');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserProfile(formData);

      if (res.success) {
        toast.success('Profile updated successfully');
        if (selectedFile) {
          setSelectedFile(null);
        }

        setProfileEditOpen(false);
      } else {
        toast.error(res.message || 'Failed to update profile');
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
      setLoading(false);
    }
  };

  const getAvatarSrc = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.image_url) return `${BE_URL}/${user.image_url}`;
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground">Profile Details</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* LEFT: USER INFO */}
            <div className="flex items-center gap-6 flex-1">
              <div
                style={{ width: 100, height: 100 }}
                className="rounded-full overflow-hidden bg-gray-200 items-center justify-center"
              >
                <img
                  src={getAvatarSrc()}
                  alt="Avatar"
                  className="w-full h-full object-center object-cover"
                  style={{ aspectRatio: '1 / 1' }}
                />
              </div>

              <div className="space-y-1">
                <p className="text-lg font-semibold">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">Username: {user.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">{user.phone}</p>

                <Badge variant="outline" className={`mt-2 ${rankDetails.bgColor}`}>
                  <Crown className={`size-4 mr-1 ${rankDetails.color}`} />
                  <span className={rankDetails.color}>{rankDetails.name}</span>
                </Badge>
              </div>
            </div>
            {/* RIGHT BUTTONS */}
            <div className="flex flex-col gap-3 shrink-0 self-start">
              {/* Update Profile */}
              <Dialog
                open={profileEditOpen}
                onOpenChange={(open: boolean) => {
                  setProfileEditOpen(open);
                  if (!open) {
                    setUser({ ...currentUser });
                    setAvatarPreview(null);
                    setSelectedFile(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="w-[180px] min-w-[180px] shrink-0">Update Profile</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Profile</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex-1 min-w-0 space-y-4 text-sm md:text-base">
                      {/* Full Name */}
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={user.full_name}
                          onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <Label>Email</Label>
                        <Input value={user.email} disabled className="bg-gray-100" />
                      </div>

                      {/* Username */}
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={user.username}
                          onChange={(e) => setUser({ ...user, username: e.target.value })}
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={user.phone}
                          onChange={(e) => setUser({ ...user, phone: e.target.value })}
                        />
                      </div>

                      {/* Avatar */}
                      <div>
                        <Label>Avatar</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setSelectedFile(file);
                              setAvatarPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </div>

                      <Button
                        className="w-full mt-2"
                        onClick={handleUpdateProfile}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Update Password */}
              <Dialog open={passwordEditOpen} onOpenChange={setPasswordEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-[180px] min-w-[180px] shrink-0">
                    Update Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3">
                    <input
                      className="w-full border p-2 rounded"
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <input
                      className="w-full border p-2 rounded"
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                      className="w-full border p-2 rounded"
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                      className="w-full mt-2"
                      onClick={handleUpdatePassword}
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Points */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Points</CardTitle>
            <Award className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{currentUser.points.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {(currentUser.points * POINT_VALUE).toLocaleString()} VND
            </p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Transactions</CardTitle>
            <TrendingUp className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{userTransactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Rank Requirement */}
      {nextRank && (
        <Card>
          <CardHeader>
            <CardTitle>Next Rank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Upgrade from <strong>{rankDetails.name}</strong> to{' '}
              <strong>{getRankDetails(nextRank.name).name}</strong> by reaching:
            </p>

            <p className="text-xl font-semibold">
              {nextRank.min.toLocaleString()} VND total spending
            </p>

            <p className="text-muted-foreground text-sm">
              You need{' '}
              <strong className="text-blue-600">
                {amountNeededForNextRank.toLocaleString()} VND
              </strong>{' '}
              more to reach {getRankDetails(nextRank.name).name}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rank Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>{rankDetails.name} Rank Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Higher Point Value</p>
              <p className="text-sm text-muted-foreground">
                1 point = {POINT_VALUE.toLocaleString()} VND
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Priority Reservations</p>
              <p className="text-sm text-muted-foreground">Early-access for popular services</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Faster Point Accumulation</p>
              <p className="text-sm text-muted-foreground">Every 20,000 VND earns 1 point</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userTransactions.slice(0, 5).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium capitalize">{txn.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(txn.createdAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{txn.finalAmount.toLocaleString()} VND</p>
                  <p className="text-sm text-blue-600">+{txn.pointsEarned.toLocaleString()} pts</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
