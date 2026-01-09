import { useState } from 'react';
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
import { createBusRouteApi } from '../../../services/busRouteService';
import { formatTimeForInput } from '../../../utils/time';

interface CreateRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (route: Partial<BusRoute>) => void;
}

export default function CreateRouteDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRouteDialogProps) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'departure_time') {
      setForm((prev) => ({
        ...prev,
        [name]: new Date(`2026-01-01T${value}`),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
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
      const res = await createBusRouteApi(form);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Add building successfully');

      onSuccess(form);
      handleClose();
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({
      route_code: '',
      route_name: '',
      description: '',
      departure_time: defaultDeparture,
      estimated_duration: 0,
      operating_dates: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>🚌 Create New Route</DialogTitle>
        </DialogHeader>
        <DialogDescription>Enter the basic information for the bus route</DialogDescription>

        <div className="grid grid-cols-1 gap-6">
          {/* Left Column */}
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
                disabled={isSubmitting}
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

            {/* Departure Time & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  name="departure_time"
                  value={formatTimeForInput(form.departure_time ?? defaultDeparture)}
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
                  name="estimated_duration"
                  min={1}
                  placeholder="45"
                  value={form.estimated_duration || ''}
                  onChange={(e: any) =>
                    setForm((prev) => ({ ...prev, estimated_duration: Number(e.target.value) }))
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
                placeholder="Optional description of the route"
                value={form.description || ''}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Operating Days */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Operating Days <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {WEEK_DAYS.map((day: any) => (
                  <button
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
                      backgroundColor: form.operating_dates?.includes(day.key)
                        ? '#2563eb'
                        : '#f3f4f6',
                      color: form.operating_dates?.includes(day.key) ? '#ffffff' : '#4b5563', // gray-600
                      boxShadow: form.operating_dates?.includes(day.key)
                        ? '0 4px 6px rgba(0,0,0,0.1)'
                        : 'none',
                      opacity: isSubmitting ? 0.5 : 1,
                    }}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {form.operating_dates && form.operating_dates.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {form.operating_dates.length} day(s)
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Route'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
