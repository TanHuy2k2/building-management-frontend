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
import { Bus, BusRoute, BusStatus } from '../../../types';
import toast from 'react-hot-toast';
import { getAllBusApi } from '../../../services/busService';
import { updateBusRouteApi } from '../../../services/busRouteService';
import { X, Bus as BusIcon } from 'lucide-react';

interface UpdateBusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: BusRoute;
  onSuccess: () => void;
}

export default function UpdateAssignedBusDialog({
  open,
  onOpenChange,
  route,
  onSuccess,
}: UpdateBusDialogProps) {
  const [allBuses, setAllBuses] = useState<Bus[]>([]);
  const [selectedBusIds, setSelectedBusIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all buses
  useEffect(() => {
    if (!open) return;

    const fetchBuses = async () => {
      setIsLoading(true);
      try {
        const res = await getAllBusApi({ status: BusStatus.ACTIVE });
        if (!res.success) {
          toast.error(res.message);

          return;
        }

        setAllBuses(res.data.buses || []);
      } catch (error: any) {
        toast.error('Failed to load buses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuses();
  }, [open]);

  // Initialize selected buses from route
  useEffect(() => {
    if (open && route) {
      setSelectedBusIds(route.bus_id || []);
    }
  }, [open, route]);

  const toggleBusSelection = (busId: string) => {
    setSelectedBusIds((prev) =>
      prev.includes(busId) ? prev.filter((id) => id !== busId) : [...prev, busId],
    );
  };

  const removeBus = (busId: string) => {
    setSelectedBusIds((prev) => prev.filter((id) => id !== busId));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        bus_id: selectedBusIds,
      };
      const res = await updateBusRouteApi(route.id, payload);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Buses updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update buses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBuses = allBuses.filter((bus) => selectedBusIds.includes(bus.id));
  const availableBuses = allBuses.filter((bus) => !selectedBusIds.includes(bus.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BusIcon className="w-5 h-5" />
            Update Assigned Buses
          </DialogTitle>
          <DialogDescription>
            Update buses for route: <span className="font-semibold">{route?.route_name}</span> (
            {route?.route_code})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Selected Buses Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Selected Buses ({selectedBusIds.length})
              </h3>
              {selectedBusIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedBusIds([])}
                  className="text-xs text-red-500 hover:text-red-700"
                  disabled={isSubmitting}
                >
                  Clear all
                </button>
              )}
            </div>

            {!selectedBuses.length ? (
              <div className="p-4 border-2 border-dashed rounded-lg text-center text-sm text-gray-500">
                No buses selected. Choose from available buses below.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                {selectedBuses.map((bus) => (
                  <div
                    key={bus.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-blue-700 truncate">
                        {bus.plate_number}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{bus.status}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBus(bus.id)}
                      disabled={isSubmitting}
                      className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
                      title="Remove bus"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Buses Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Available Buses ({availableBuses.length})
            </h3>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-500">Loading buses...</p>
              </div>
            ) : !availableBuses.length ? (
              <div className="p-4 border-2 border-dashed rounded-lg text-center text-sm text-gray-500">
                {!allBuses.length
                  ? 'No buses available in the system'
                  : 'All buses are already selected'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                {availableBuses.map((bus) => (
                  <button
                    key={bus.id}
                    type="button"
                    onClick={() => toggleBusSelection(bus.id)}
                    disabled={isSubmitting}
                    className="group px-3 py-2.5 text-left border-2 border-gray-200 bg-white rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-700 truncate">
                          {bus.plate_number}
                        </div>
                        <div className="text-xs text-gray-500 capitalize mt-0.5">{bus.status}</div>
                        {bus.capacity && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Capacity: {bus.capacity}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 w-5 h-5 border-2 border-gray-300 rounded group-hover:border-blue-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-gray-600">
              {selectedBusIds.length} bus(es) will be assigned to this route
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Updating...
                  </>
                ) : (
                  'Update Buses'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
