import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { BusRoute, DayOfWeek } from '../../../types';
import { WEEK_DAYS } from '../../../utils/constants';
import toast from 'react-hot-toast';
import { createBusRouteApi, updateBusRouteApi } from '../../../services/busRouteService';
import { formatTimeForInput } from '../../../utils/time';
import { getChangedFields, removeEmptyFields } from '../../../utils/updateFields';

interface CreateRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (route: BusRoute) => void;
  initialData?: BusRoute;
}

export default function CreateRouteDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CreateRouteDialogProps) {
  const isEditMode = !!initialData;
  const defaultDeparture = new Date();
  defaultDeparture.setHours(8, 0, 0, 0);

  const [form, setForm] = useState<Partial<BusRoute>>({
    route_code: '',
    route_name: '',
    description: '',
    departure_time: defaultDeparture,
    estimated_duration: 0,
    operating_dates: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalForm, setOriginalForm] = useState<Partial<BusRoute> | null>(null);

  /* =======================
   Sync form khi mở dialog
  ======================= */
  useEffect(() => {
    if (!open || !initialData) return;

    const snapshot: Partial<BusRoute> = {
      ...initialData,
      departure_time: initialData.departure_time
        ? new Date(new Date(initialData.departure_time).getTime())
        : undefined,
    };

    setForm(snapshot);
    setOriginalForm({
      ...snapshot,
      departure_time: snapshot.departure_time
        ? new Date(snapshot.departure_time.getTime())
        : undefined,
    });
  }, [open, initialData]);

  /* =======================
   Handlers
  ======================= */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'departure_time') {
      if (!value) return;

      setForm((prev) => ({
        ...prev,
        departure_time: new Date(`2026-01-01T${value}`),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const toggleOperatingDay = (day: DayOfWeek) => {
    setForm((prev) => ({
      ...prev,
      operating_dates: prev.operating_dates?.includes(day)
        ? prev.operating_dates.filter((d) => d !== day)
        : [...(prev.operating_dates || []), day],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // CREATE
      if (!isEditMode) {
        const res = await createBusRouteApi(form);
        if (!res.success) {
          toast.error(res.message);

          return;
        }

        toast.success('Create route successfully');
        onSuccess(res.data);
        handleClose();

        return;
      }

      // UPDATE
      if (!originalForm) return;

      let payload = getChangedFields(originalForm, form);
      payload = removeEmptyFields(payload);
      if (!Object.keys(payload).length) {
        toast.success('No changes detected');

        return;
      }

      const res = await updateBusRouteApi(initialData!.id, payload);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Update route successfully');
      onSuccess(res.data);
      handleClose();
    } catch (error: any) {
      toast.error(error?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  /* =======================
   Render
  ======================= */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>🚌 {isEditMode ? 'Update Route' : 'Create New Route'}</DialogTitle>
        </DialogHeader>
        <DialogDescription>Enter the basic information for the bus route</DialogDescription>

        <div className="grid grid-cols-1 gap-6">
          {/* Left */}
          <div className="space-y-4">
            {/* Route Code */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Route Code <span className="text-red-500">*</span>
              </label>
              <Input
                name="route_code"
                placeholder="e.g., R01"
                value={form.route_code || ''}
                onChange={handleInputChange}
                disabled={isSubmitting || isEditMode}
              />
            </div>

            {/* Route Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Route Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="route_name"
                placeholder="e.g., Downtown Express"
                value={form.route_name || ''}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>

            {/* Time + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  name="departure_time"
                  value={formatTimeForInput(form.departure_time)}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Duration (min) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.estimated_duration || ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estimated_duration: Number(e.target.value),
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                rows={5}
                value={form.description || ''}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <label className="text-sm font-medium">
              Operating Days <span className="text-red-500">*</span>
            </label>

            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.map((day: any) => {
                const active = form.operating_dates?.includes(day.key);

                return (
                  <button
                    key={day.key}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => toggleOperatingDay(day.key)}
                    style={{
                      width: '48px',
                      height: '30px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: active ? '#2563eb' : '#f3f4f6',
                      color: active ? '#ffffff' : '#4b5563',
                      boxShadow: active ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                      opacity: isSubmitting ? 0.5 : 1,
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>

            {form.operating_dates && form.operating_dates.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {form.operating_dates.length} day(s)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Route'
                : 'Create Route'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
