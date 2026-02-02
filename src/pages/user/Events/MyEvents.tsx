import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';

interface MyEventUI {
  id: string;
  event_title: string;
  facility_name: string;
  building_name: string;
  start_time: string;
  end_time: string;
  current_participants: number;
  max_participants: number;
  type: 'joined' | 'created';
}

const rawEvents: MyEventUI[] = [
  {
    id: '1',
    event_title: 'Yoga Workshop',
    facility_name: 'Meeting Room A',
    building_name: 'Building B',
    start_time: '2026-02-12 08:00',
    end_time: '2026-02-12 10:00',
    current_participants: 12,
    max_participants: 20,
    type: 'joined',
  },
  {
    id: '2',
    event_title: 'Tech Meetup',
    facility_name: 'Hall C',
    building_name: 'Building A',
    start_time: '2026-02-20 18:00',
    end_time: '2026-02-20 20:00',
    current_participants: 30,
    max_participants: 50,
    type: 'created',
  },
];

export default function MyEvents() {
  const joinedEvents = rawEvents.filter((e) => e.type === 'joined');
  const createdEvents = rawEvents.filter((e) => e.type === 'created');

  const renderEventCard = (event: MyEventUI) => (
    <Card className="hover:shadow-md transition">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{event.event_title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {event.facility_name} · {event.building_name}
          </p>
        </div>
        <Badge variant="secondary">Joined</Badge>
      </CardHeader>

      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="size-4" />
          <span>Feb 12, 2026 · 08:00 - 10:00</span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="size-4" />
          <span>
            {event.current_participants}/{event.max_participants} participants
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button size="sm" variant="outline">
            View Details
          </Button>
          <Button size="sm" variant="destructive">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Events</h1>
        <p className="text-muted-foreground">Manage events you joined or created</p>
      </div>

      <Tabs defaultValue="joined">
        <TabsList className="grid w-[300px] grid-cols-2">
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
        </TabsList>

        <TabsContent value="joined">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {joinedEvents.length ? (
              joinedEvents.map(renderEventCard)
            ) : (
              <p className="text-muted-foreground">You haven’t joined any events yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="created">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {createdEvents.length ? (
              createdEvents.map(renderEventCard)
            ) : (
              <p className="text-muted-foreground">You haven’t created any events yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
