import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import {
  StickyNote,
  Plus,
  X,
  Edit,
  Save,
  Pin,
  Palette,
  Search,
  Calendar,
  Clock,
  Move,
  Lock,
  Unlock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface StickyNoteData {
  id: string;
  title: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  createdAt: string;
  category: string;
  pinned: boolean;
  reminder?: {
    date: string;
    time: string;
    enabled: boolean;
  };
}

interface StickyNotesWidgetProps {
  userRole: string;
  permissions: any;
  isCustomizing?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const StickyNotesWidget: React.FC<StickyNotesWidgetProps> = ({
  userRole,
  permissions,
  isCustomizing,
  onSelect,
  isSelected
}) => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [notes, setNotes] = useState<StickyNoteData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: 'bg-yellow-200',
    category: 'general'
  });

  const noteColors = [
    { name: 'Yellow', class: 'bg-yellow-200', border: 'border-yellow-300' },
    { name: 'Blue', class: 'bg-blue-200', border: 'border-blue-300' },
    { name: 'Green', class: 'bg-green-200', border: 'border-green-300' },
    { name: 'Pink', class: 'bg-pink-200', border: 'border-pink-300' },
    { name: 'Purple', class: 'bg-purple-200', border: 'border-purple-300' },
    { name: 'Orange', class: 'bg-orange-200', border: 'border-orange-300' }
  ];

  const categories = ['general', 'meetings', 'documents', 'reminders', 'ideas', 'tasks'];

  useEffect(() => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem(`sticky-notes-${user?.id}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      // Default notes for demonstration
      const defaultNotes: StickyNoteData[] = [
        {
          id: '1',
          title: 'Faculty Meeting Follow-up',
          content: 'Review new curriculum proposals and schedule next review meeting with department heads',
          color: 'bg-yellow-200',
          position: { x: 10, y: 10 },
          createdAt: '2024-01-15',
          category: 'meetings',
          pinned: true,
          reminder: {
            date: '2024-01-18',
            time: '09:00',
            enabled: true
          }
        },
        {
          id: '2',
          title: 'Budget Review',
          content: 'Check Q1 budget allocations and submit variance report to finance committee',
          color: 'bg-blue-200',
          position: { x: 220, y: 30 },
          createdAt: '2024-01-14',
          category: 'documents',
          pinned: false
        },
        {
          id: '3',
          title: 'Student Evaluation',
          content: 'Complete mid-semester evaluation forms for all assigned courses',
          color: 'bg-green-200',
          position: { x: 10, y: 150 },
          createdAt: '2024-01-13',
          category: 'tasks',
          pinned: false
        }
      ];
      setNotes(defaultNotes);
    }
  }, [user]);

  const saveNotes = (updatedNotes: StickyNoteData[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(`sticky-notes-${user?.id}`, JSON.stringify(updatedNotes));
  };

  const addNote = () => {
    if (!newNote.title.trim()) return;

    const note: StickyNoteData = {
      id: Date.now().toString(),
      ...newNote,
      position: { 
        x: Math.random() * 200, 
        y: Math.random() * 100 + 50 
      },
      createdAt: new Date().toISOString().split('T')[0],
      pinned: false
    };
    
    saveNotes([...notes, note]);
    setNewNote({ title: '', content: '', color: 'bg-yellow-200', category: 'general' });
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(note => note.id !== id));
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    if (isLocked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    
    setDraggedNote(noteId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNote || isLocked) return;
    
    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      const noteWidth = isMobile ? 144 : 160; // w-36 = 144px, w-40 = 160px
      const noteHeight = 120;
      
      const newX = Math.max(0, Math.min(
        containerRect.width - noteWidth,
        e.clientX - containerRect.left - dragOffset.x
      ));
      const newY = Math.max(0, Math.min(
        containerRect.height - noteHeight,
        e.clientY - containerRect.top - dragOffset.y
      ));

      setNotes(prev => prev.map(note => 
        note.id === draggedNote 
          ? { ...note, position: { x: newX, y: newY } }
          : note
      ));
    }
  };

  const handleMouseUp = () => {
    if (draggedNote) {
      // Save the new positions
      saveNotes(notes);
      setDraggedNote(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, noteId: string) => {
    if (isLocked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
    
    setDraggedNote(noteId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedNote || isLocked) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      const noteWidth = isMobile ? 144 : 160; // w-36 = 144px, w-40 = 160px  
      const noteHeight = 120;
      
      const newX = Math.max(0, Math.min(
        containerRect.width - noteWidth,
        touch.clientX - containerRect.left - dragOffset.x
      ));
      const newY = Math.max(0, Math.min(
        containerRect.height - noteHeight,
        touch.clientY - containerRect.top - dragOffset.y
      ));

      setNotes(prev => prev.map(note => 
        note.id === draggedNote 
          ? { ...note, position: { x: newX, y: newY } }
          : note
      ));
    }
  };

  const handleTouchEnd = () => {
    if (draggedNote) {
      saveNotes(notes);
      setDraggedNote(null);
    }
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
  };

  const togglePin = (id: string) => {
    saveNotes(notes.map(note => 
      note.id === id ? { ...note, pinned: !note.pinned } : note
    ));
  };

  const updateNote = (id: string, updates: Partial<StickyNoteData>) => {
    saveNotes(notes.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pinnedCount = notes.filter(note => note.pinned).length;
  const reminderCount = notes.filter(note => note.reminder?.enabled).length;

  return (
    <Card className={cn(
      "shadow-elegant hover:shadow-glow transition-all duration-300",
      isSelected && "border-primary",
      isCustomizing && "cursor-pointer"
    )} onClick={onSelect}>
      <CardHeader className={cn(isMobile && "pb-3")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            <StickyNote className="w-5 h-5 text-primary" />
            Sticky Notes
            <div className="flex gap-1">
              {pinnedCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {pinnedCount} pinned
                </Badge>
              )}
              {reminderCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {reminderCount} reminders
                </Badge>
              )}
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLock}
              title={isLocked ? "Unlock notes for moving" : "Lock notes in place"}
              className={cn(
                "p-2",
                isLocked ? "text-red-600 border-red-300" : "text-green-600 border-green-300"
              )}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sticky Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Note title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Note content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {noteColors.map(color => (
                        <button
                          key={color.class}
                          title={`Select ${color.name} color`}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            color.class,
                            newNote.color === color.class ? 'border-primary scale-110' : 'border-border'
                          )}
                          onClick={() => setNewNote({...newNote, color: color.class})}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={newNote.category}
                      onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                      aria-label="Note category"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button onClick={addNote}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
            aria-label="Filter by category"
          >
            <option value="all">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Notes Display */}
        <div 
          ref={containerRef}
          className={cn(
            "relative rounded-lg p-3 overflow-hidden select-none",
            isMobile ? "min-h-[240px] bg-gradient-subtle" : "min-h-[200px] bg-gradient-subtle",
            !isLocked && "cursor-move"
          )}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isLocked && (
            <div className="absolute top-2 right-2 z-20">
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            </div>
          )}
          
          {!isLocked && !isMobile && (
            <div className="absolute top-2 left-2 z-20">
              <Badge variant="outline" className="text-xs bg-white/80">
                <Move className="w-3 h-3 mr-1" />
                Drag to move
              </Badge>
            </div>
          )}
          
          {sortedNotes.slice(0, isMobile ? 4 : 6).map((note, index) => (
            <div
              key={note.id}
              className={cn(
                "absolute p-3 rounded-lg shadow-md transition-all hover:shadow-lg animate-scale-in border-2",
                note.color,
                isMobile ? "w-36 text-xs" : "w-40 text-sm",
                !isLocked && "cursor-move hover:scale-105",
                isLocked && "cursor-default",
                draggedNote === note.id && "shadow-2xl scale-105",
                note.pinned && "border-yellow-400 sticky-note-pinned",
                !note.pinned && "border-transparent",
                draggedNote === note.id ? "sticky-note-dragging" : "sticky-note-default"
              )}
              style={{
                left: `${note.position.x}px`,
                top: `${note.position.y}px`,
                animationDelay: `${index * 100}ms`
              }}
              onMouseDown={(e) => handleMouseDown(e, note.id)}
              onTouchStart={(e) => handleTouchStart(e, note.id)}
            >
              <div className="flex items-start justify-between mb-2 min-h-[20px]">
                <h5 className="font-medium line-clamp-1 pr-2">{note.title}</h5>
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePin(note.id)}
                    title={note.pinned ? "Unpin note" : "Pin note"}
                    className={cn(
                      "p-1 rounded transition-colors min-w-[24px] min-h-[24px]",
                      note.pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    )}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingNote(note.id)}
                    title="Edit note"
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors min-w-[24px] min-h-[24px]"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    title="Delete note"
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors min-w-[24px] min-h-[24px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3 line-clamp-3 leading-relaxed">{note.content}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <Badge variant="outline" className="text-xs">
                  {note.category}
                </Badge>
                <span className="text-xs text-gray-600">{note.createdAt}</span>
              </div>
              
              {note.reminder?.enabled && (
                <div className="flex items-center gap-1 mt-2 p-2 bg-white/50 rounded text-xs">
                  <Clock className="w-3 h-3 text-warning" />
                  <span>{note.reminder.date} {note.reminder.time}</span>
                </div>
              )}
              
              {note.pinned && (
                <div className="absolute -top-2 -right-2">
                  <Pin className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          
          {sortedNotes.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground min-h-[200px]">
              <div className="text-center">
                <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className={cn(isMobile ? "text-sm" : "text-base")}>
                  No sticky notes yet
                </p>
                <p className="text-xs">Create your first note!</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className={cn(
              "font-bold text-primary",
              isMobile ? "text-lg" : "text-xl"
            )}>
              {notes.length}
            </p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Total
            </p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className={cn(
              "font-bold text-warning",
              isMobile ? "text-lg" : "text-xl"
            )}>
              {pinnedCount}
            </p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Pinned
            </p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className={cn(
              "font-bold text-success",
              isMobile ? "text-lg" : "text-xl"
            )}>
              {reminderCount}
            </p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Reminders
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};