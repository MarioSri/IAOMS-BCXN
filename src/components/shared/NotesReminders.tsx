import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  StickyNote,
  Plus,
  X,
  Edit,
  Save,
  Bell,
  Calendar,
  Clock,
  Pin,
  Palette,
  Search,
  Filter,
  Lock,
  Unlock,
  Move,
  Sliders
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  createdAt: string;
  category: string;
  pinned: boolean;
}

interface Reminder {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category: string;
}

interface NotesRemindersProps {
  userRole: string;
  isMessagesPage?: boolean;
}

// Individual sticky note component to handle positioning without inline styles
interface StickyNoteItemProps {
  note: Note;
  isMessagesPage: boolean;
  isDragging: boolean;
  draggedNoteId: number | null;
  isLocked: boolean;
  isMobile: boolean;
  onMouseDown: (e: React.MouseEvent, note: Note) => void;
  onTouchStart: (e: React.TouchEvent, note: Note) => void;
  onTogglePin: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function StickyNoteItem({
  note,
  isMessagesPage,
  isDragging,
  draggedNoteId,
  isLocked,
  isMobile,
  onMouseDown,
  onTouchStart,
  onTogglePin,
  onEdit,
  onDelete
}: StickyNoteItemProps) {
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (noteRef.current && !isMobile) {
      noteRef.current.style.position = 'absolute';
      noteRef.current.style.left = `${note.position.x}px`;
      noteRef.current.style.top = `${note.position.y}px`;
      noteRef.current.style.zIndex = note.pinned ? '10' : isDragging && draggedNoteId === note.id ? '50' : '1';
      noteRef.current.style.willChange = isDragging && draggedNoteId === note.id ? 'transform' : 'auto';
    } else if (noteRef.current && isMobile) {
      noteRef.current.style.position = 'relative';
      noteRef.current.style.left = '0';
      noteRef.current.style.top = '0';
      noteRef.current.style.zIndex = 'auto';
      noteRef.current.style.willChange = 'auto';
    }
  }, [note.position.x, note.position.y, note.pinned, isDragging, draggedNoteId, note.id, isMobile]);

  return (
    <div
      ref={noteRef}
      className={cn(
        "p-4 rounded-lg shadow-md hover:shadow-lg animate-scale-in transition-all duration-200",
        note.color,
        isMobile ? "w-full" : "w-64",
        isMessagesPage && !isLocked && !isMobile ? 'cursor-move' : 'cursor-default',
        isDragging && draggedNoteId === note.id && !isMobile ? 'transition-none transform-gpu scale-105 shadow-2xl' : ''
      )}
      onMouseDown={(e) => isMessagesPage && !isMobile && onMouseDown(e, note)}
      onTouchStart={(e) => isMessagesPage && !isMobile && onTouchStart(e, note)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm pr-2">{note.title}</h4>
        <div className="flex gap-1">
          <button
            onClick={() => onTogglePin(note.id)}
            title={note.pinned ? "Unpin note" : "Pin note"}
            className={`p-1 rounded transition-colors ${note.pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={() => onEdit(note.id)}
            title="Edit note"
            className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            title="Delete note"
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-3">{note.content}</p>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <Badge variant="outline" className="text-xs">
          {note.category}
        </Badge>
        <span>{note.createdAt}</span>
      </div>
      {note.pinned && (
        <div className="absolute -top-1 -right-1">
          <Pin className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  );
}

export function NotesReminders({ userRole, isMessagesPage = false }: NotesRemindersProps) {
  const { isMobile } = useResponsive();
  const [draggedNoteId, setDraggedNoteId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<Note[]>(userRole === 'demo-work' ? [
    {
      id: 1,
      title: "Faculty Meeting Follow-up",
      content: "Review new curriculum proposals and schedule next review meeting",
      color: "bg-yellow-200",
      position: { x: 50, y: 100 },
      createdAt: "2024-01-15",
      category: "meetings",
      pinned: true
    },
    {
      id: 2,
      title: "Budget Review",
      content: "Check Q1 budget allocations and submit variance report",
      color: "bg-blue-200",
      position: { x: 300, y: 150 },
      createdAt: "2024-01-14",
      category: "finance",
      pinned: false
    },
    {
      id: 3,
      title: "Student Evaluation",
      content: "Complete mid-semester evaluation forms for all courses",
      color: "bg-green-200",
      position: { x: 550, y: 120 },
      createdAt: "2024-01-13",
      category: "academic",
      pinned: false
    }
  ] : []);

  const [reminders, setReminders] = useState<Reminder[]>(userRole === 'demo-work' ? [
    {
      id: 1,
      title: "Submit Monthly Report",
      description: "Department performance and activity report for January",
      dueDate: "2024-01-25",
      dueTime: "17:00",
      priority: "high",
      completed: false,
      category: "reports"
    },
    {
      id: 2,
      title: "Faculty Appraisal Meeting",
      description: "Annual performance review with Dr. Smith",
      dueDate: "2024-01-22",
      dueTime: "14:00",
      priority: "medium",
      completed: false,
      category: "meetings"
    },
    {
      id: 3,
      title: "Research Proposal Deadline",
      description: "Submit proposal for new research project funding",
      dueDate: "2024-01-30",
      dueTime: "23:59",
      priority: "high",
      completed: false,
      category: "research"
    }
  ] : []);

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: "bg-yellow-200",
    category: "general"
  });

  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "medium" as const,
    category: "general"
  });

  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [editNoteData, setEditNoteData] = useState({ title: "", content: "", color: "", category: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const noteColors = [
    { name: "Yellow", class: "bg-yellow-200" },
    { name: "Blue", class: "bg-blue-200" },
    { name: "Green", class: "bg-green-200" },
    { name: "Pink", class: "bg-pink-200" },
    { name: "Purple", class: "bg-purple-200" },
    { name: "Orange", class: "bg-orange-200" }
  ];

  const categories = [
    "general", "meetings", "finance", "academic", "research", "administrative"
  ];

  const addNote = () => {
    const note: Note = {
      id: Date.now(),
      ...newNote,
      position: { x: Math.random() * 400, y: Math.random() * 300 + 100 },
      createdAt: new Date().toISOString().split('T')[0],
      pinned: false
    };
    setNotes([...notes, note]);
    setNewNote({ title: "", content: "", color: "bg-yellow-200", category: "general" });
  };

  const addReminder = () => {
    const reminder: Reminder = {
      id: Date.now(),
      ...newReminder,
      completed: false
    };
    setReminders([...reminders, reminder]);
    setNewReminder({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      priority: "medium",
      category: "general"
    });
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const togglePin = (id: number) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, pinned: !note.pinned } : note
    ));
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
  };

  const startEditNote = (id: number) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setEditNoteData({
        title: note.title,
        content: note.content,
        color: note.color,
        category: note.category
      });
      setEditingNote(id);
    }
  };

  const saveEditNote = () => {
    if (editingNote) {
      setNotes(notes.map(note =>
        note.id === editingNote
          ? { ...note, ...editNoteData }
          : note
      ));
      setEditingNote(null);
      setEditNoteData({ title: "", content: "", color: "", category: "" });
    }
  };

  const cancelEditNote = () => {
    setEditingNote(null);
    setEditNoteData({ title: "", content: "", color: "", category: "" });
  };

  // Advanced mouse-based drag functionality (from Dashboard)
  const handleMouseDown = (e: React.MouseEvent, note: Note) => {
    if (!isMessagesPage || isLocked) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    setDraggedNoteId(note.id);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNoteId || !isDragging || !isMessagesPage) return;

    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      const noteWidth = 256; // w-64 = 256px
      const noteHeight = 200; // approximate height

      const newX = Math.max(0, Math.min(
        containerRect.width - noteWidth,
        e.clientX - containerRect.left - dragOffset.x
      ));
      const newY = Math.max(0, Math.min(
        containerRect.height - noteHeight,
        e.clientY - containerRect.top - dragOffset.y
      ));

      setNotes(prev => prev.map(note =>
        note.id === draggedNoteId
          ? { ...note, position: { x: newX, y: newY } }
          : note
      ));
    }
  };

  const handleMouseUp = () => {
    if (draggedNoteId && isDragging) {
      setDraggedNoteId(null);
      setIsDragging(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, note: Note) => {
    if (!isMessagesPage || isLocked) return;

    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }

    setDraggedNoteId(note.id);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedNoteId || !isDragging || !isMessagesPage) return;

    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      const noteWidth = 256;
      const noteHeight = 200;

      const newX = Math.max(0, Math.min(
        containerRect.width - noteWidth,
        touch.clientX - containerRect.left - dragOffset.x
      ));
      const newY = Math.max(0, Math.min(
        containerRect.height - noteHeight,
        touch.clientY - containerRect.top - dragOffset.y
      ));

      setNotes(prev => prev.map(note =>
        note.id === draggedNoteId
          ? { ...note, position: { x: newX, y: newY } }
          : note
      ));
    }
  };

  const handleTouchEnd = () => {
    if (draggedNoteId && isDragging) {
      setDraggedNoteId(null);
      setIsDragging(false);
    }
  };

  const toggleReminder = (id: number) => {
    setReminders(reminders.map(reminder =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    ));
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800"
    };
    return colors[priority as keyof typeof colors];
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const upcomingReminders = reminders
    .filter(reminder => !reminder.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notes & Reminders</h2>
          <p className="text-muted-foreground">Organize your thoughts and stay on top of important tasks</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Reminder</DialogTitle>
                <DialogDescription>Set up a reminder for important tasks</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Reminder title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Reminder description"
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={newReminder.dueDate}
                      onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Time</label>
                    <Input
                      type="time"
                      value={newReminder.dueTime}
                      onChange={(e) => setNewReminder({ ...newReminder, dueTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={newReminder.priority} onValueChange={(value: any) => setNewReminder({ ...newReminder, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newReminder.category} onValueChange={(value) => setNewReminder({ ...newReminder, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button onClick={addReminder} variant="gradient">
                    <Bell className="w-4 h-4 mr-2" />
                    Create Reminder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>Add a sticky note to your dashboard</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Note title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Note content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex gap-2">
                      {noteColors.map(color => (
                        <button
                          key={color.class}
                          title={`Select ${color.name.toLowerCase()} color`}
                          className={`w-8 h-8 rounded-full border-2 ${color.class} ${newNote.color === color.class ? 'border-primary' : 'border-border'
                            }`}
                          onClick={() => setNewNote({ ...newNote, color: color.class })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newNote.category} onValueChange={(value) => setNewNote({ ...newNote, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button onClick={addNote} variant="gradient">
                    <StickyNote className="w-4 h-4 mr-2" />
                    Create Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={editingNote !== null} onOpenChange={(open) => !open && cancelEditNote()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update your sticky note</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Note title"
                value={editNoteData.title}
                onChange={(e) => setEditNoteData({ ...editNoteData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Note content"
                value={editNoteData.content}
                onChange={(e) => setEditNoteData({ ...editNoteData, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  {noteColors.map(color => (
                    <button
                      key={color.class}
                      title={`Select ${color.name.toLowerCase()} color`}
                      className={`w-8 h-8 rounded-full border-2 ${color.class} ${editNoteData.color === color.class ? 'border-primary' : 'border-border'
                        }`}
                      onClick={() => setEditNoteData({ ...editNoteData, color: color.class })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={editNoteData.category} onValueChange={(value) => setEditNoteData({ ...editNoteData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={cancelEditNote}>Cancel</Button>
              <Button onClick={saveEditNote} variant="gradient">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Canvas */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" />
                Sticky Notes
              </CardTitle>
              <div className="flex items-center gap-2">
                {isMessagesPage && !isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleLock}
                    title={isLocked ? "Unlock notes for moving" : "Lock notes in place"}
                    className={`p-2 ${isLocked ? "text-red-600 border-red-300" : "text-green-600 border-green-300"}`}
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </Button>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn("pl-10", isMobile ? "w-full" : "w-64")}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className={cn(
                "relative bg-gradient-subtle rounded-lg p-4 select-none",
                isMobile
                  ? "flex flex-col gap-4 min-h-[300px]"
                  : "min-h-[500px] overflow-hidden"
              )}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Status indicators in top-right corner - matches Dashboard design */}
              {isMessagesPage && isLocked && !isMobile && (
                <div className="absolute top-2 right-2 z-20">
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                </div>
              )}

              {isMessagesPage && !isLocked && sortedNotes.length > 0 && !isMobile && (
                <div className="absolute top-2 right-2 z-20">
                  <Badge variant="outline" className="text-xs bg-white/80">
                    <Move className="w-3 h-3 mr-1" />
                    Drag to move
                  </Badge>
                </div>
              )}

              {sortedNotes.map((note) => (
                <StickyNoteItem
                  key={note.id}
                  note={note}
                  isMessagesPage={isMessagesPage}
                  isDragging={isDragging}
                  draggedNoteId={draggedNoteId}
                  isLocked={isLocked}
                  isMobile={isMobile}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTogglePin={togglePin}
                  onEdit={startEditNote}
                  onDelete={deleteNote}
                />
              ))}

              {sortedNotes.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notes yet. Create your first note!</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-3 border rounded-lg space-y-2 hover:bg-accent transition-colors animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{reminder.title}</h4>
                  <div className="flex items-center gap-1">
                    <Badge className={`text-xs ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority}
                    </Badge>
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      title={reminder.completed ? "Mark as incomplete" : "Mark as complete"}
                      className="text-muted-foreground hover:text-success transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{reminder.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {reminder.dueDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {reminder.dueTime}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {reminder.category}
                </Badge>
              </div>
            ))}

            {upcomingReminders.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming reminders</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}