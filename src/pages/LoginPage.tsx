import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loginApi, registerApi } from '../services/authService';
import toast from 'react-hot-toast';
import { ResponseInterface, User, UserRole } from '../types';
import { getUserProfile } from '../services/userService';
import { getAccessToken } from '../services/tokenService';

export default function AuthPage() {
  const navigate = useNavigate();
  const { fetchCurrentUser } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const response: ResponseInterface = await loginApi(loginEmail, loginPassword);
      if (!response.success) {
        toast.error(response.message);
        return;
      }

      sessionStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);

      await fetchCurrentUser();
      toast.success('Login successful!');

      const responseUser: ResponseInterface = await getUserProfile();
      if (responseUser.data.role === UserRole.MANAGER) {
        return navigate('/manager');
      }

      return navigate('/user');
    } catch (error: any) {
      const errorMessage =
        error.response?.message || 'Login failed. Please check your email or password.';
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    if (registerPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      setIsRegistering(false);

      return;
    }

    setIsRegistering(true);

    try {
      const registerPayload = {
        email: registerEmail,
        username: registerUsername,
        full_name: registerFullName,
        password: registerPassword,
        confirm_password: confirmPassword,
        phone: registerPhone,
      };

      const response: ResponseInterface = await registerApi(registerPayload);
      if (!response.success) {
        toast.error(response.message);
        setIsRegistering(false);

        return;
      }

      toast.success(response.data.message || 'Registration successful! Please log in.');
      setRegisterEmail('');
      setRegisterUsername('');
      setRegisterFullName('');
      setRegisterPassword('');
      setConfirmPassword('');
      setRegisterPhone('');

      return navigate('/');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        const responseUser: ResponseInterface = await getUserProfile();
        if (responseUser.data.role === UserRole.MANAGER) {
          return navigate('/manager');
        }

        return navigate('/user');
      }
    };
    checkToken();
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Building Services Website</CardTitle>
          <CardDescription>Sign in or create an account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">
                <Users className="size-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register">
                <UserPlus className="size-4 mr-2" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Your email address"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a unique username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-fullname">Full Name</Label>
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder="Your full name"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone">Phone Number</Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="+84 9x xxx xxxx"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full mt-4" disabled={isRegistering}>
                  {isRegistering ? 'Signing Up...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
