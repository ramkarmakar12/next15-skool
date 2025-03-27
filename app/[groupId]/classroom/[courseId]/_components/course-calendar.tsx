"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Calendar as CalendarIcon, Clock, BookOpen } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CourseCalendarProps {
  courseId: Id<"courses">;
  groupId: Id<"groups">;
  modules: any[];
  contents: any[];
}

export const CourseCalendar = ({ courseId, groupId, modules, contents }: CourseCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  
  // Mock events data - in a real app, you would fetch this from your database
  const [events, setEvents] = useState([
    { 
      id: "1", 
      title: "Module 1 Deadline", 
      date: new Date(new Date().setDate(new Date().getDate() + 7)),
      description: "Complete all content in Module 1",
      moduleId: modules[0]?._id
    },
    { 
      id: "2", 
      title: "Live Q&A Session", 
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      description: "Join the live Q&A session to ask questions about the course content",
      moduleId: null
    }
  ]);

  // Get current user
  const currentUser = useQuery(api.users.currentUser);
  
  // Function to add a new event
  const addEvent = () => {
    if (!eventTitle || !eventDate) {
      toast.error("Please provide a title and date for the event");
      return;
    }
    
    const newEvent = {
      id: Date.now().toString(),
      title: eventTitle,
      date: eventDate,
      description: eventDescription,
      moduleId: null
    };
    
    setEvents([...events, newEvent]);
    setEventTitle("");
    setEventDescription("");
    setEventDate(new Date());
    setIsAddEventOpen(false);
    
    toast.success("Event added to calendar");
  };
  
  // Filter events for the selected date
  const selectedDateEvents = events.filter(event => 
    date && event.date.toDateString() === date.toDateString()
  );
  
  // Get module name by ID
  const getModuleName = (moduleId: string | null) => {
    if (!moduleId) return null;
    const module = modules.find(m => m._id === moduleId);
    return module ? module.title : null;
  };
  
  // Function to format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Course Calendar
          </CardTitle>
          <CardDescription>
            View and manage course events and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          
          <div className="mt-4">
            <Button 
              onClick={() => setIsAddEventOpen(true)}
              className="w-full"
            >
              Add Event
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            {date ? formatDate(date) : "Select a date"}
          </CardTitle>
          <CardDescription>
            {selectedDateEvents.length} events scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedDateEvents.map(event => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                    {event.moduleId && (
                      <Badge variant="outline" className="ml-2">
                        {getModuleName(event.moduleId)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center mt-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No events scheduled for this date</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                placeholder="Enter event title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description (optional)</Label>
              <Input
                id="event-description"
                placeholder="Enter event description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Calendar
                mode="single"
                selected={eventDate}
                onSelect={setEventDate}
                className="rounded-md border"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addEvent}>
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};