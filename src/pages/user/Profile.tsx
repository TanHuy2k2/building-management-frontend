import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { getRankDetails } from '../../utils/rank';
import { Crown, Award, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential } from 'firebase/auth';
import { updatePassword, updateUserProfile } from '../../services/userService';
import { User as UserInterface } from '../../types';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { DEFAULT_AVATAR_URL, POINT_VALUE } from '../../utils/constants';
import { resolveImageUrl } from '../../utils/image';
import { formatSnakeCase } from '../../utils/string';
import { formatVND } from '../../utils/currency';
import { useNavigate } from 'react-router';

export default function UserProfile() {
  const navigate = useNavigate();
  const { currentUser, fetchCurrentUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<UserInterface | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [passwordEditOpen, setPasswordEditOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  useEffect(() => {
    if (currentUser) setUser({ ...currentUser });
  }, [currentUser]);

  if (!currentUser || !user) return null;

  const rankDetails = getRankDetails(currentUser.rank);
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

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMismatch(newPassword !== value);
  };

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
        logout();
        navigate('/');
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

        await fetchCurrentUser();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Account Center</h1>
        <p className="text-muted-foreground">Manage Profile Details</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="flex items-center gap-6 flex-1">
              <div
                style={{ width: 100, height: 100 }}
                className="rounded-full overflow-hidden bg-gray-200 items-center justify-center"
              >
                <img
                  src={avatarPreview ?? resolveImageUrl(user.image_url, 'avatar')}
                  alt="Avatar"
                  className="w-full h-full object-center object-cover"
                  style={{ aspectRatio: '1 / 1' }}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR_URL;
                  }}
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
            <div className="flex flex-col gap-3 shrink-0 self-start">
              <Button className="w-[180px]" onClick={() => setProfileEditOpen(true)}>
                Update Profile
              </Button>

              <Button
                variant="outline"
                className="w-[180px]"
                onClick={() => setPasswordEditOpen(true)}
              >
                Update Password
              </Button>
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

            <p className="text-xl font-semibold">{formatVND(nextRank.min)} total spending</p>

            <p className="text-muted-foreground text-sm">
              You need{' '}
              <strong className="text-blue-600">{formatVND(amountNeededForNextRank)}</strong> more
              to reach {getRankDetails(nextRank.name).name}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rank Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>{formatSnakeCase(rankDetails.name)} Rank Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Rank Discount</p>
              <p className="text-sm text-muted-foreground">
                Enjoy <strong>{rankDetails.discount}%</strong> discount on eligible services
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
              <p className="font-medium">Point Value</p>
              <p className="text-sm text-muted-foreground">1 point = {formatVND(POINT_VALUE)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Point Accumulation</p>
              <p className="text-sm text-muted-foreground">Every 20.000 VND earns 1 point</p>
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
          <div className="space-y-3"></div>
        </CardContent>
      </Card>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex-1 min-w-0 space-y-4 text-sm md:text-base">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input
                  value={user.full_name}
                  onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={user.email} disabled className="bg-gray-100" />
              </div>
              <div className="space-y-1">
                <Label>Username</Label>
                <Input
                  value={user.username}
                  onChange={(e) => setUser({ ...user, username: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
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

              <Button className="w-full mt-2" onClick={handleUpdateProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Password */}
      <Dialog
        open={passwordEditOpen}
        onOpenChange={(isOpen) => {
          setPasswordEditOpen(isOpen);

          if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsCapsLockOn(false);
            setPasswordMismatch(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <input
                className="w-full border p-2 rounded"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onKeyUp={handleKeyEvent}
                onKeyDown={handleKeyEvent}
              />
            </div>

            <div className="space-y-1">
              <Label>New Password</Label>
              <input
                className="w-full border p-2 rounded"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyUp={handleKeyEvent}
                onKeyDown={handleKeyEvent}
              />
            </div>

            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <input
                className={`w-full border p-2 rounded ${passwordMismatch ? 'border-red-500' : ''}`}
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onKeyUp={handleKeyEvent}
                onKeyDown={handleKeyEvent}
              />
              {passwordMismatch && (
                <p className="text-sm text-red-600">❌ Passwords do not match</p>
              )}
            </div>

            {isCapsLockOn && <p className="text-sm text-yellow-600">⚠️ Caps Lock is on</p>}
            <Button className="w-full mt-2" onClick={handleUpdatePassword} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
