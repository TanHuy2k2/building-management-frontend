import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, AlertCircle, Megaphone, Users } from 'lucide-react';
import {
  CreateInformationDto,
  GetInformationParams,
  Information,
  InformationCategory,
  InformationPriority,
  InformationStatus,
  InformationTarget,
  OrderDirection,
} from '../../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, DEFAULT_PAGE_TOTAL } from '../../utils/constants';
import { createInformation, getInformationList } from '../../services/informationService';
import toast from 'react-hot-toast';
import { getPaginationNumbers } from '../../utils/pagination';
import { formatSnakeCase } from '../../utils/string';

export default function InformationManagement() {
  const [informationList, setInformationList] = useState<Information[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);
  const [params, setParams] = useState<GetInformationParams>({
    page: DEFAULT_PAGE,
    page_size: DEFAULT_PAGE_SIZE,
    order_by: 'schedule_at',
    order: OrderDirection.DESCENDING,
  });
  const [createData, setCreateData] = useState({
    title: '',
    content: '',
    category: undefined as InformationCategory | undefined,
    target: undefined as InformationTarget | undefined,
    priority: InformationPriority.HIGH,
    schedule_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.title.trim()) {
      toast.error('Title is required');

      return;
    }

    if (!createData.content.trim()) {
      toast.error('Content is required');

      return;
    }

    if (!createData.category) {
      toast.error('Category is required');

      return;
    }

    if (!createData.target) {
      toast.error('Target is required');

      return;
    }

    const payload: CreateInformationDto = {
      title: createData.title,
      content: createData.content,
      category: createData.category,
      target: createData.target,
      priority: createData.priority,
      schedule_at:
        createData.priority !== InformationPriority.HIGH
          ? new Date(createData.schedule_at).toISOString()
          : undefined,
    };

    try {
      setSubmitting(true);
      const response = await createInformation(payload);
      if (!response.success) {
        toast.error(response.message);

        return;
      }

      toast.success(response.message);
      setCreateData({
        title: '',
        content: '',
        category: undefined,
        target: undefined,
        priority: InformationPriority.HIGH,
        schedule_at: '',
      });
      setOpen(false);
      loadInformationList();
    } catch (error) {
      toast.error('Failed to create information');
    } finally {
      setSubmitting(false);
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

  const getPriorityBadge = (priority: InformationPriority) => {
    const config = {
      [InformationPriority.HIGH]: {
        label: 'High',
        variant: 'destructive' as const,
      },
      [InformationPriority.NORMAL]: {
        label: 'Normal',
        variant: 'default' as const,
      },
      [InformationPriority.LOW]: {
        label: 'Low',
        variant: 'secondary' as const,
      },
    };

    return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
  };

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

  useEffect(() => {
    loadInformationList();
  }, [params]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Information Management</h1>
          <p className="text-muted-foreground">Create and manage information page</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Create new information
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create new information</DialogTitle>
              <DialogDescription>Send information to system users</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Input your information title"
                  value={createData.title}
                  onChange={(e) =>
                    setCreateData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder="Input your information"
                  rows={4}
                  value={createData.content}
                  onChange={(e) =>
                    setCreateData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={createData.category}
                    onValueChange={(value: InformationCategory) =>
                      setCreateData((prev) => ({
                        ...prev,
                        category: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Information category" />
                    </SelectTrigger>

                    <SelectContent>
                      {Object.values(InformationCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {formatSnakeCase(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select
                    value={createData.target}
                    onValueChange={(value: InformationTarget) =>
                      setCreateData((prev) => ({
                        ...prev,
                        target: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Information target" />
                    </SelectTrigger>

                    <SelectContent>
                      {Object.values(InformationTarget).map((target) => (
                        <SelectItem key={target} value={target}>
                          {formatSnakeCase(target)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={createData.priority}
                  onValueChange={(value: InformationPriority) =>
                    setCreateData((prev) => ({
                      ...prev,
                      priority: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {Object.values(InformationPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {formatSnakeCase(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {createData.priority !== InformationPriority.HIGH && (
                <div className="space-y-2">
                  <Label>Schedule time</Label>
                  <Input
                    type="datetime-local"
                    value={createData.schedule_at || ''}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setCreateData((prev) => ({
                        ...prev,
                        schedule_at: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading information...
            </CardContent>
          </Card>
        )}

        {!loading && informationList.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="size-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No information found</p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          informationList.map((info) => (
            <Card key={info.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">{getTypeIcon(info.category)}</div>
                    <div>
                      <CardTitle className="text-base">{info.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        {new Date(info.schedule_at).toLocaleDateString('vi-VN')} •{' '}
                        {new Date(info.schedule_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        <span className="text-xs opacity-70">
                          (
                          {info.status === InformationStatus.SCHEDULED
                            ? 'Scheduled'
                            : info.status === InformationStatus.SENT
                              ? 'Sent'
                              : 'Cancelled'}
                          )
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(info.category)}
                    {getPriorityBadge(info.priority)}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm mb-3 whitespace-pre-line">{info.content}</p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>
                    Target:{' '}
                    {info.target === InformationTarget.ALL
                      ? 'All'
                      : info.target === InformationTarget.MANAGER
                        ? 'Managers'
                        : 'Users'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
}
