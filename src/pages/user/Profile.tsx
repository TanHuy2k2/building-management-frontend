import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { getRankDetails, mockTransactions } from '../../data/mockData';
import { User, Crown, DollarSign, Award, TrendingUp } from 'lucide-react';
import { Progress } from '../../components/ui/progress';

export default function UserProfile() {
  const { currentUser } = useAuth();
  const currentUser_totalSpent = 10000;
  if (!currentUser) return null;

  const rankDetails = getRankDetails(currentUser.ranks);
  const userTransactions = mockTransactions.filter((t) => t.userId === currentUser.id);

  const ranks = [
    { name: 'bronze', min: 0, max: 2000000 },
    { name: 'silver', min: 2000000, max: 5000000 },
    { name: 'gold', min: 5000000, max: 10000000 },
    { name: 'platinum', min: 10000000, max: Infinity },
  ];
  const currentRankIndex = ranks.findIndex((r) => r.name === currentUser.ranks);
  const nextRank = ranks[currentRankIndex + 1];
  const progressToNextRank = nextRank
    ? (currentUser_totalSpent -
        ranks[currentRankIndex].min / (nextRank.min - ranks[currentRankIndex].min)) *
      100
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground">Profile Details</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
              <User className="size-10" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{currentUser.fullName}</h2>
              <p className="text-muted-foreground">{currentUser.email}</p>
              <p className="text-muted-foreground">{currentUser.phone}</p>
            </div>
            <Badge variant="outline" className={rankDetails.bgColor}>
              <Crown className={`size-4 mr-1 ${rankDetails.color}`} />
              <span className={rankDetails.color}>{rankDetails.name}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total points</CardTitle>
            <Award className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{currentUser.points}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {(currentUser.points ?? 0 * rankDetails.pointValue).toLocaleString()} VNĐ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total spent</CardTitle>
            <DollarSign className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {(currentUser_totalSpent / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">VNĐ</p>
          </CardContent>
        </Card>

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

      {nextRank && (
        <Card>
          <CardHeader>
            <CardTitle>Next rank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                {rankDetails.name} → {getRankDetails(nextRank.name).name}
              </span>
              <span>
                {currentUser_totalSpent.toLocaleString()} / {nextRank.min.toLocaleString()} VNĐ
              </span>
            </div>
            <Progress value={progressToNextRank} />
            <p className="text-sm text-muted-foreground">
              Còn {(nextRank.min - currentUser_totalSpent).toLocaleString()} VNĐ để lên hạng{' '}
              {getRankDetails(nextRank.name).name}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rank Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Quyền lợi hạng {rankDetails.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Giá trị điểm cao hơn</p>
              <p className="text-sm text-muted-foreground">
                1 điểm = {rankDetails.pointValue.toLocaleString()} VNĐ
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Ưu tiên đặt chỗ</p>
              <p className="text-sm text-muted-foreground">Đặt trước các dịch vụ hot</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-2 rounded-full bg-blue-600 mt-2" />
            <div>
              <p className="font-medium">Tích điểm nhanh</p>
              <p className="text-sm text-muted-foreground">Mỗi 20.000 VNĐ = 1 điểm tích lũy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
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
                    {new Date(txn.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{txn.finalAmount.toLocaleString()} VNĐ</p>
                  <p className="text-sm text-blue-600">+{txn.pointsEarned} điểm</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
