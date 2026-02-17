import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Document {
  id: string;
  title: string;
  type: 'Letter' | 'Circular' | 'Report';
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  workflow: {
    currentStep: string;
    progress: number;
    steps: Array<{
      name: string;
      status: 'completed' | 'current' | 'pending';
      assignee: string;
      completedDate?: string;
    }>;
  };
  requiresSignature: boolean;
  signedBy?: string[];
  comments?: Array<{
    author: string;
    date: string;
    message: string;
  }>;
  files?: File[];
  recipients?: string[];
  description?: string;
}

interface DocumentContextType {
  documents: Document[];
  addDocument: (documentData: any, userRole: string, userName: string) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  getDocumentById: (id: string) => Document | undefined;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function useDocuments(): DocumentContextType {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}

const initialDocuments: Document[] = [
  {
    id: 'DOC-001',
    title: 'Faculty Meeting Minutes - Q4 2024',
    type: 'Report',
    submittedBy: 'Dr. Sarah Johnson',
    submittedDate: '2024-01-15',
    status: 'pending',
    priority: 'high',
    workflow: {
      currentStep: 'Principal Approval',
      progress: 75,
      steps: [
        { name: 'Submission', status: 'completed', assignee: 'Dr. Sarah Johnson', completedDate: '2024-01-15' },
        { name: 'HOD Review', status: 'completed', assignee: 'Prof. Michael Chen', completedDate: '2024-01-16' },
        { name: 'Registrar Review', status: 'completed', assignee: 'Ms. Lisa Wang', completedDate: '2024-01-17' },
        { name: 'Principal Approval', status: 'current', assignee: 'Dr. Robert Smith' },
      ]
    },
    requiresSignature: true,
    comments: [
      { author: 'Prof. Michael Chen', date: '2024-01-16', message: 'Minutes look comprehensive. Approved for next level.' }
    ]
  },
  {
    id: 'DOC-002',
    title: 'New Course Proposal - Data Science',
    type: 'Circular',
    submittedBy: 'Dr. Emily Davis',
    submittedDate: '2024-01-14',
    status: 'approved',
    priority: 'medium',
    workflow: {
      currentStep: 'Complete',
      progress: 100,
      steps: [
        { name: 'Submission', status: 'completed', assignee: 'Dr. Emily Davis', completedDate: '2024-01-14' },
        { name: 'Department Review', status: 'completed', assignee: 'Prof. James Wilson', completedDate: '2024-01-15' },
        { name: 'Academic Committee', status: 'completed', assignee: 'Dr. Maria Garcia', completedDate: '2024-01-16' },
        { name: 'Principal Approval', status: 'completed', assignee: 'Dr. Robert Smith', completedDate: '2024-01-17' },
      ]
    },
    requiresSignature: true,
    signedBy: ['Prof. James Wilson', 'Dr. Maria Garcia', 'Dr. Robert Smith']
  }
];

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);

  function generateDocumentId(): string {
    return `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function getDocumentTypeFromUpload(documentTypes: string[]): 'Letter' | 'Circular' | 'Report' {
    if (documentTypes.includes('letter')) return 'Letter';
    if (documentTypes.includes('circular')) return 'Circular';
    if (documentTypes.includes('report')) return 'Report';
    return 'Letter';
  }

  function getPriorityMapping(priority: string): 'low' | 'medium' | 'high' | 'urgent' {
    const map: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      low: 'low', normal: 'medium', high: 'high', urgent: 'urgent',
    };
    return map[priority] ?? 'medium';
  }

  function createInitialWorkflow(_userRole: string, userName: string) {
    return {
      currentStep: 'HOD Review',
      progress: 25,
      steps: [
        { name: 'Submission', status: 'completed' as const, assignee: userName, completedDate: new Date().toISOString().split('T')[0] },
        { name: 'HOD Review', status: 'current' as const, assignee: 'HOD' },
        { name: 'Registrar Review', status: 'pending' as const, assignee: 'Registrar' },
        { name: 'Principal Approval', status: 'pending' as const, assignee: 'Principal' },
      ],
    };
  }

  function addDocument(documentData: any, userRole: string, userName: string) {
    const newDocument: Document = {
      id: generateDocumentId(),
      title: documentData.files && documentData.files.length > 0
        ? documentData.files[0].name
        : `Document - ${new Date().toLocaleDateString()}`,
      type: getDocumentTypeFromUpload(documentData.documentTypes),
      submittedBy: userName,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: getPriorityMapping(documentData.priority),
      workflow: createInitialWorkflow(userRole, userName),
      requiresSignature: true,
      files: documentData.files,
      recipients: documentData.recipients,
      description: documentData.description,
      comments: []
    };

    setDocuments(prev => [newDocument, ...prev]);
    return newDocument;
  }

  function updateDocument(id: string, updates: Partial<Document>) {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, ...updates } : doc
      )
    );
  }

  function getDocumentById(id: string) {
    return documents.find(doc => doc.id === id);
  }

  return (
    <DocumentContext.Provider value={{
      documents,
      addDocument,
      updateDocument,
      getDocumentById
    }}>
      {children}
    </DocumentContext.Provider>
  );
};

export function useDocumentContext(): DocumentContextType {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
}

export type { Document };
