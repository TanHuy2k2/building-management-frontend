import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  ShoppingCart,
  Calendar,
  ParkingCircle,
  Bus,
  PartyPopper,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRankDetails } from '../../utils/rank';
import { formatSnakeCase } from '../../utils/string';
import { formatVND } from '../../utils/currency';
import { UserRank } from '../../types';
import { useEffect, useState } from 'react';
import { getUserPaymentsApi } from '../../services/paymentService';
import { getFirstDayOfCurrentMonth } from '../../utils/time';
import toast from 'react-hot-toast';

export default function UserHome() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<{
    totalAmount: number;
    pointsEarned: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const services = [
    {
      title: 'Food Ordering',
      description: 'Order meals from restaurants',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/user/orders',
    },
    {
      title: 'Facility Booking',
      description: 'Book sports courts, meeting rooms',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/user/reservations',
    },
    {
      title: 'Parking',
      description: 'Register for a parking spot',
      icon: ParkingCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      path: '/user/parking',
    },
    {
      title: 'Shuttle Bus',
      description: 'Book a seat on the community bus',
      icon: Bus,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      path: '/user/bus',
    },
    {
      title: 'Events',
      description: 'Join community events',
      icon: PartyPopper,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      path: '/user/events',
    },
  ];

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const from = getFirstDayOfCurrentMonth();
      const to = now.toISOString().split('T')[0];
      const response = await getUserPaymentsApi({ from, to });
      if (!response.success) {
        toast.error(response.message);

        return;
      }

      toast.success(response.message);
      setStats({
        totalAmount: response.data.totalAmount,
        pointsEarned: response.data.pointsEarned,
      });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchPayments();
  }, [currentUser]);

  if (!currentUser) return null;
  const rankDetails = getRankDetails(currentUser.rank);

  return (
    <div className="space-y-6">
      <Card className={rankDetails.bgColor}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-white">
                <Crown className={`size-6 ${rankDetails.color}`} />
              </div>
              <div>
                <CardTitle>Rank: {rankDetails.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{currentUser.points} points</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              1 point = 1.000 VND
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total spent</p>
                  <p className="text-lg font-semibold">Loading...</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Total points earned</p>
                  <p className="text-lg font-semibold">Loading...</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total spent</p>
                  <p className="text-lg font-semibold">{formatVND(stats?.totalAmount ?? 0)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Total points earned</p>
                  <p className="text-lg font-semibold">{stats?.pointsEarned ?? 0}</p>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4 text-green-600" />
              <span>
                Every 20.000 VND spent = 1 membership point • {formatSnakeCase(rankDetails.name)}:{' '}
                {rankDetails.discount}% discount
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link key={index} to={service.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`p-3 rounded-lg ${service.bgColor} w-fit`}>
                      <Icon className={`size-6 ${service.color}`} />
                    </div>
                    <CardTitle className="text-base mt-3">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Membership Rank System</h2>
        <Card>
          <CardContent className="pt-6">
            {Object.values(UserRank).map((rankKey) => {
              const rank = getRankDetails(rankKey);

              return (
                <div
                  key={rank.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${rank.bgColor}`}>
                      <Crown className={`size-5 ${rank.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{formatSnakeCase(rank.name)}</p>
                      <p className="text-sm text-muted-foreground">
                        {rank.maxSpent === Infinity
                          ? `Above ${formatVND(rank.minSpent)}`
                          : `${formatVND(rank.minSpent)} - ${formatVND(rank.maxSpent)}`}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-medium">{rank.discount}% discount</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
