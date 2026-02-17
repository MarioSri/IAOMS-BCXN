import { Request, Response } from 'express';
import { ApiResponse } from '../types';

export async function searchAll(req: Request, res: Response) {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const q = query.toLowerCase();

    const results: any[] = [];
    if ('document'.includes(q) || 'approval'.includes(q)) {
      results.push({
        id: 'doc-mock-1',
        title: 'Project Proposal',
        description: 'Mock document search result...',
        type: 'document',
        section: 'Track Documents',
        path: '/track-documents#doc-mock-1',
        status: 'pending'
      });
    }

    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Search failed' });
  }
}