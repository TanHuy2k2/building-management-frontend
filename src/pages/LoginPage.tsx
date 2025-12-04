import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loginApi } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: any = await loginApi(userEmail, userPassword);

      sessionStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);

      login();

      if (response.data.user.roles === 'user') return navigate('/user');
      return navigate('/manager');
    } catch (error: any) {
      alert(error.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Hệ Thống Quản Lý Đa Dịch Vụ</CardTitle>
          <CardDescription>Đăng nhập để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="user">
                <Users className="size-4 mr-2" />
                Cư Dân
              </TabsTrigger>
            </TabsList>

            {/* USER LOGIN */}
            <TabsContent value="user">
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="Email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-password">Mật khẩu</Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="••••••••"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Đăng nhập
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Demo: user@example.com / password
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
