import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Building2, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [managerEmail, setManagerEmail] = useState("manager@example.com");
  const [userEmail, setUserEmail] = useState("user@example.com");

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(managerEmail, "manager");
    navigate("/manager");
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(userEmail, "user");
    navigate("/user");
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">
                <Users className="size-4 mr-2" />
                Cư Dân
              </TabsTrigger>
              <TabsTrigger value="manager">
                <Building2 className="size-4 mr-2" />
                Quản Lý
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="user@example.com"
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
                    defaultValue="password"
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

            <TabsContent value="manager">
              <form onSubmit={handleManagerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manager-email">Email</Label>
                  <Input
                    id="manager-email"
                    type="email"
                    placeholder="manager@example.com"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager-password">Mật khẩu</Label>
                  <Input
                    id="manager-password"
                    type="password"
                    placeholder="••••••••"
                    defaultValue="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Đăng nhập
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Demo: manager@example.com / password
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
