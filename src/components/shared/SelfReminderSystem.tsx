import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Plus, Calendar, Clock, AlertTriangle, CheckCircle2, Repeat, Tag, Edit, Trash2, SunSnow as Snooze, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customRepeat?: {
    interval: number;
    unit: 'days' | 'weeks' | 'months';
  };
  completed: boolean;
  snoozedUntil?: Date;
  createdAt: Date;
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
}

interface SelfReminderSystemProps {
  userRole: string;
}

export const SelfReminderSystem: React.FC<SelfReminderSystemProps> = ({ userRole }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    category: 'general',
    repeat: 'none',
    notifications: {
      email: true,
      push: true,
      sound: false
    }
  });

  const { toast } = useToast();

  const categories = [
    'general', 'meeting', 'document', 'deadline', 'personal', 'follow-up', 'review'
  ];

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
  };

  useEffect(() => {
    const savedReminders = localStorage.getItem('selfReminders');
    if (savedReminders) {
      const parsed = JSON.parse(savedReminders);
      setReminders(parsed.map((reminder: any) => ({
        ...reminder,
        createdAt: new Date(reminder.createdAt),
        snoozedUntil: reminder.snoozedUntil ? new Date(reminder.snoozedUntil) : undefined
      })));
    }

    // Check for due reminders every minute
    const interval = setInterval(checkDueReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const saveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    localStorage.setItem('selfReminders', JSON.stringify(newReminders));
  };

  const checkDueReminders = () => {
    const now = new Date();
    const dueReminders = reminders.filter(reminder => {
      if (reminder.completed || reminder.snoozedUntil && reminder.snoozedUntil > now) {
        return false;
      }
      
      const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
      return dueDateTime <= now;
    });

    dueReminders.forEach(reminder => {
      showNotification(reminder);
    });
  };

  const showNotification = (reminder: Reminder) => {
    if (reminder.notifications.push && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(reminder.title, {
          body: reminder.description,
          icon: '/favicon.ico',
          tag: reminder.id
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(reminder.title, {
              body: reminder.description,
              icon: '/favicon.ico',
              tag: reminder.id
            });
          }
        });
      }
    }

    toast({
      title: `Reminder: ${reminder.title}`,
      description: reminder.description,
      duration: 10000,
    });
  };

  const createReminder = () => {
    if (!newReminder.title || !newReminder.dueDate || !newReminder.dueTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, date, and time",
        variant: "destructive"
      });
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title!,
      description: newReminder.description || '',
      dueDate: newReminder.dueDate!,
      dueTime: newReminder.dueTime!,
      priority: newReminder.priority || 'medium',
      category: newReminder.category || 'general',
      repeat: newReminder.repeat || 'none',
      customRepeat: newReminder.customRepeat,
      completed: false,
      createdAt: new Date(),
      notifications: newReminder.notifications || {
        email: true,
        push: true,
        sound: false
      }
    };

    const updatedReminders = [...reminders, reminder];
    saveReminders(updatedReminders);
    
    setNewReminder({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium',
      category: 'general',
      repeat: 'none',
      notifications: {
        email: true,
        push: true,
        sound: false
      }
    });
    setIsCreating(false);

    toast({
      title: "Reminder Created",
      description: `Reminder set for ${reminder.dueDate} at ${reminder.dueTime}`,
    });
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, ...updates } : reminder
    );
    saveReminders(updatedReminders);
  };

  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    saveReminders(updatedReminders);
    setSelectedReminder(null);
    
    toast({
      title: "Reminder Deleted",
      description: "Reminder removed successfully",
    });
  };

  const completeReminder = (id: string) => {
    updateReminder(id, { completed: true });
    
    const reminder = reminders.find(r => r.id === id);
    if (reminder && reminder.repeat !== 'none') {
      createRecurringReminder(reminder);
    }
    
    toast({
      title: "Reminder Completed",
      description: "Great job staying on track!",
    });
  };

  const createRecurringReminder = (originalReminder: Reminder) => {
    const dueDate = new Date(`${originalReminder.dueDate}T${originalReminder.dueTime}`);
    let nextDate = new Date(dueDate);

    switch (originalReminder.repeat) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'custom':
        if (originalReminder.customRepeat) {
          const { interval, unit } = originalReminder.customRepeat;
          switch (unit) {
            case 'days':
              nextDate.setDate(nextDate.getDate() + interval);
              break;
            case 'weeks':
              nextDate.setDate(nextDate.getDate() + (interval * 7));
              break;
            case 'months':
              nextDate.setMonth(nextDate.getMonth() + interval);
              break;
          }
        }
        break;
    }

    const newReminder: Reminder = {
      ...originalReminder,
      id: Date.now().toString(),
      dueDate: nextDate.toISOString().split('T')[0],
      dueTime: nextDate.toTimeString().slice(0, 5),
      completed: false,
      createdAt: new Date(),
      snoozedUntil: undefined
    };

    const updatedReminders = [...reminders, newReminder];
    saveReminders(updatedReminders);
  };

  const snoozeReminder = (id: string, minutes: number) => {
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);
    
    updateReminder(id, { snoozedUntil: snoozeUntil });
    
    toast({
      title: "Reminder Snoozed",
      description: `Snoozed for ${minutes} minutes`,
    });
  };

  const getFilteredReminders = () => {
    const now = new Date();
    
    return reminders.filter(reminder => {
      // Filter by status
      switch (filter) {
        case 'pending':
          if (reminder.completed) return false;
          break;
        case 'completed':
          if (!reminder.completed) return false;
          break;
        case 'overdue':
          if (reminder.completed) return false;
          const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
          if (dueDateTime > now) return false;
          break;
      }
      
      // Filter by category
      if (categoryFilter && reminder.category !== categoryFilter) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by due date/time
      const aDateTime = new Date(`${a.dueDate}T${a.dueTime}`);
      const bDateTime = new Date(`${b.dueDate}T${b.dueTime}`);
      return aDateTime.getTime() - bDateTime.getTime();
    });
  };

  const isOverdue = (reminder: Reminder) => {
    if (reminder.completed) return false;
    const now = new Date();
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
    return dueDateTime < now;
  };

  const getTimeUntilDue = (reminder: Reminder) => {
    const now = new Date();
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
    const diff = dueDateTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredReminders = getFilteredReminders();
  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => !r.completed).length,
    completed: reminders.filter(r => r.completed).length,
    overdue: reminders.filter(r => isOverdue(r)).length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reminders" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reminders">My Reminders</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>
          
          <Button
            onClick={() => setIsCreating(true)}
            variant="gradient"
            className="animate-scale-in"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>

        <TabsContent value="reminders" className="space-y-6">
          {/* Filters */}
          <Card className="shadow-elegant">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2">
                  {(['all', 'pending', 'completed', 'overdue'] as const).map(filterType => (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(filterType)}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </Button>
                  ))}
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Reminders List */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Reminders ({filteredReminders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        isOverdue(reminder) ? 'border-destructive bg-destructive/5' : 
                        reminder.completed ? 'border-success bg-success/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className={`font-medium ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {reminder.title}
                          </h4>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={priorityColors[reminder.priority]}>
                            {reminder.priority}
                          </Badge>
                          
                          {reminder.repeat !== 'none' && (
                            <Badge variant="outline">
                              <Repeat className="w-3 h-3 mr-1" />
                              {reminder.repeat}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {reminder.dueDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {reminder.dueTime}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {reminder.category}
                          </Badge>
                        </div>
                        
                        <div className={`font-medium ${isOverdue(reminder) ? 'text-destructive' : ''}`}>
                          {getTimeUntilDue(reminder)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!reminder.completed && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => completeReminder(reminder.id)}
                              variant="default"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => snoozeReminder(reminder.id, 15)}
                            >
                              <Snooze className="w-4 h-4 mr-1" />
                              15m
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => snoozeReminder(reminder.id, 60)}
                            >
                              1h
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReminder(reminder.id)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteReminder(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredReminders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No reminders found</p>
                      <p className="text-sm">Create your first reminder to get started</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Create New Reminder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    placeholder="Enter reminder title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newReminder.category}
                    onChange={(e) => setNewReminder({...newReminder, category: e.target.value})}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                  placeholder="Enter reminder description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newReminder.dueDate}
                    onChange={(e) => setNewReminder({...newReminder, dueDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time *</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={newReminder.dueTime}
                    onChange={(e) => setNewReminder({...newReminder, dueTime: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={newReminder.priority}
                    onChange={(e) => setNewReminder({...newReminder, priority: e.target.value as any})}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="repeat">Repeat</Label>
                <select
                  id="repeat"
                  value={newReminder.repeat}
                  onChange={(e) => setNewReminder({...newReminder, repeat: e.target.value as any})}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="none">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {newReminder.repeat === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Every</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newReminder.customRepeat?.interval || 1}
                      onChange={(e) => setNewReminder({
                        ...newReminder,
                        customRepeat: {
                          ...newReminder.customRepeat,
                          interval: parseInt(e.target.value) || 1,
                          unit: newReminder.customRepeat?.unit || 'days'
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <select
                      value={newReminder.customRepeat?.unit || 'days'}
                      onChange={(e) => setNewReminder({
                        ...newReminder,
                        customRepeat: {
                          ...newReminder.customRepeat,
                          interval: newReminder.customRepeat?.interval || 1,
                          unit: e.target.value as any
                        }
                      })}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Label>Notifications</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newReminder.notifications?.email}
                      onChange={(e) => setNewReminder({
                        ...newReminder,
                        notifications: {
                          ...newReminder.notifications!,
                          email: e.target.checked
                        }
                      })}
                    />
                    <span className="text-sm">Email</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newReminder.notifications?.push}
                      onChange={(e) => setNewReminder({
                        ...newReminder,
                        notifications: {
                          ...newReminder.notifications!,
                          push: e.target.checked
                        }
                      })}
                    />
                    <span className="text-sm">Push Notification</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newReminder.notifications?.sound}
                      onChange={(e) => setNewReminder({
                        ...newReminder,
                        notifications: {
                          ...newReminder.notifications!,
                          sound: e.target.checked
                        }
                      })}
                    />
                    <span className="text-sm">Sound Alert</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setNewReminder({
                    title: '',
                    description: '',
                    dueDate: '',
                    dueTime: '',
                    priority: 'medium',
                    category: 'general',
                    repeat: 'none',
                    notifications: {
                      email: true,
                      push: true,
                      sound: false
                    }
                  })}
                >
                  Clear
                </Button>
                <Button onClick={createReminder} variant="gradient">
                  <Bell className="w-4 h-4 mr-2" />
                  Create Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};