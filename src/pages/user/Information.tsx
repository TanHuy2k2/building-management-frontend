import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, Megaphone, Users } from 'lucide-react';
import {
  GetInformationParams,
  Information,
  InformationCategory,
  InformationStatus,
  InformationTarget,
  OrderDirection,
} from '../../types';
import { useEffect, useState } from 'react';
import { getInformationList } from '../../services/informationService';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, DEFAULT_PAGE_TOTAL } from '../../utils/constants';
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { getPaginationNumbers } from '../../utils/pagination';

export default function UserInformation() {
  const [informationList, setInformationList] = useState<Information[]>([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<GetInformationParams>({
    target: InformationTarget.ALL,
    status: InformationStatus.SENT,
    page: DEFAULT_PAGE,
    page_size: DEFAULT_PAGE_SIZE,
    order_by: 'schedule_at',
    order: OrderDirection.DESCENDING,
  });
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);

  const loadInformationList = async () => {
    try {
      setLoading(true);

      const response = await getInformationList(params);
      if (!response.success) {
        toast.error(response.message);
        setInformationList([]);
        setTotalPage(DEFAULT_PAGE_TOTAL);

        return;
      }

      setInformationList(response.data.informationList);
      setTotalPage(response.data.pagination.total_page);
    } catch (error) {
      toast.error('Failed to load information list', error);
      setInformationList([]);
      setTotalPage(DEFAULT_PAGE_TOTAL);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (category: InformationCategory) => {
    switch (category) {
      case InformationCategory.NOTIFICATION:
        return <Megaphone className="size-5" />;
      case InformationCategory.INFO:
        return <AlertCircle className="size-5" />;
      case InformationCategory.NEWS:
        return <Users className="size-5" />;
      case InformationCategory.EVENT:
        return <Users className="size-5" />;
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: InformationCategory) => {
    const config = {
      [InformationCategory.NOTIFICATION]: {
        label: 'Notification',
        variant: 'default' as const,
      },
      [InformationCategory.INFO]: {
        label: 'Information',
        variant: 'secondary' as const,
      },
      [InformationCategory.NEWS]: {
        label: 'News',
        variant: 'outline' as const,
      },
      [InformationCategory.EVENT]: {
        label: 'Event',
        variant: 'secondary' as const,
      },
    };

    return <Badge variant={config[category].variant}>{config[category].label}</Badge>;
  };

  useEffect(() => {
    loadInformationList();
  }, [params]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Information List</h1>
        <p className="text-muted-foreground">Update latest information from the system</p>
      </div>

      <Tabs
        value={params.category ?? 'all'}
        onValueChange={(value) =>
          setParams((prev) => ({
            ...prev,
            category: value === 'all' ? undefined : (value as InformationCategory),
            page: DEFAULT_PAGE,
          }))
        }
      >
        <TabsList>
          <TabsTrigger value="all" className="px-4">
            All
          </TabsTrigger>
          <TabsTrigger value={InformationCategory.NOTIFICATION} className="px-4">
            Notification
          </TabsTrigger>
          <TabsTrigger value={InformationCategory.INFO} className="px-4">
            Information
          </TabsTrigger>
          <TabsTrigger value={InformationCategory.NEWS} className="px-4">
            News
          </TabsTrigger>
          <TabsTrigger value={InformationCategory.EVENT} className="px-4">
            Event
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        <div className="space-y-4">
          {informationList.map((info) => (
            <Card key={info.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">{getTypeIcon(info.category)}</div>
                    <div>
                      <CardTitle className="text-base">{info.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(info.schedule_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {getCategoryBadge(info.category)}
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm">{info.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-4 gap-2">
        {/* Prev */}
        <Button
          variant="outline"
          disabled={params.page === 1}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Math.max(1, (p.page ?? 1) - 1),
            }))
          }
        >
          Prev
        </Button>

        {/* Numbers */}
        <div className="flex gap-2">
          {getPaginationNumbers(params.page ?? 1, totalPage).map((item, idx) => {
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
                onClick={() =>
                  setParams((p) => ({
                    ...p,
                    page: Number(item),
                  }))
                }
                style={{
                  backgroundColor: params.page === item ? 'black' : 'white',
                  color: params.page === item ? 'white' : 'black',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s',
                }}
                className={params.page === item ? '' : 'hover:bg-gray-100'}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          disabled={params.page === totalPage}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Math.min(totalPage, (p.page ?? 1) + 1),
            }))
          }
        >
          Next
        </Button>
      </div>

      {!loading && informationList.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No information available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
