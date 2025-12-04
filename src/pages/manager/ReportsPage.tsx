import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { mockTransactions, mockRevenueByService } from "../../data/mockData";
import { Download, FileText, TrendingUp, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export default function ReportsPage() {
  const handleExportCSV = (reportType: string) => {
    alert(`Xuất báo cáo ${reportType} dạng CSV`);
  };

  const totalRevenue = mockRevenueByService.reduce(
    (sum, item) => sum + item.revenue,
    0,
  );
  const totalTransactions = mockTransactions.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Báo cáo & Thống kê</h1>
        <p className="text-muted-foreground">
          Xuất và phân tích dữ liệu hệ thống
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Tổng doanh thu</CardTitle>
            <DollarSign className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {(totalRevenue / 1000000).toFixed(1)}M VNĐ
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Tổng giao dịch</CardTitle>
            <FileText className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Trung bình/giao dịch</CardTitle>
            <TrendingUp className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {(totalRevenue / totalTransactions / 1000).toFixed(0)}K VNĐ
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Xuất báo cáo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Báo cáo doanh thu theo dịch vụ</p>
              <p className="text-sm text-muted-foreground">
                Xuất dữ liệu doanh thu từng dịch vụ
              </p>
            </div>
            <Button onClick={() => handleExportCSV("Doanh thu")}>
              <Download className="size-4 mr-2" />
              Xuất CSV
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Báo cáo giao dịch</p>
              <p className="text-sm text-muted-foreground">
                Xuất toàn bộ lịch sử giao dịch
              </p>
            </div>
            <Button onClick={() => handleExportCSV("Giao dịch")}>
              <Download className="size-4 mr-2" />
              Xuất CSV
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Báo cáo người dùng</p>
              <p className="text-sm text-muted-foreground">
                Xuất danh sách người dùng và thông tin rank
              </p>
            </div>
            <Button onClick={() => handleExportCSV("Người dùng")}>
              <Download className="size-4 mr-2" />
              Xuất CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã GD</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.slice(0, 10).map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.id}</TableCell>
                  <TableCell>{txn.userName}</TableCell>
                  <TableCell className="capitalize">{txn.type}</TableCell>
                  <TableCell>{txn.finalAmount.toLocaleString()} VNĐ</TableCell>
                  <TableCell className="capitalize">
                    {txn.paymentMethod.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    {new Date(txn.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
