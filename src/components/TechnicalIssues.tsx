import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';

interface Issue {
  id: string;
  room: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
}

const TechnicalIssues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([
    { id: '1', room: '102', category: 'HVAC', description: 'AC not cooling', priority: 'high', status: 'open' },
    { id: '2', room: '205', category: 'Electrical', description: 'Light flickering', priority: 'medium', status: 'in-progress' },
  ]);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Issue>({ id: '', room: '', category: 'General', description: '', priority: 'low', status: 'open' });

  const addIssue = () => {
    if (!draft.room || !draft.description) return;
    setIssues(prev => [...prev, { ...draft, id: Date.now().toString() }]);
    setDraft({ id: '', room: '', category: 'General', description: '', priority: 'low', status: 'open' });
    setAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Issues</CardTitle>
        <CardDescription>Track and resolve reported technical issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setAdding(true)}>Report New Issue</Button>
        </div>
        {adding && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 border p-4 rounded-lg">
            <input className="border rounded px-3 py-2" placeholder="Room" value={draft.room} onChange={e => setDraft({ ...draft, room: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Category" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} />
            <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            <select className="border rounded px-3 py-2" value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as Issue['priority'] })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="flex gap-2 md:col-span-5 justify-end">
              <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={addIssue}>Add</Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold">Room</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {issues.map(i => (
                <tr key={i.id}>
                  <td className="px-6 py-3">{i.room}</td>
                  <td className="px-6 py-3">{i.category}</td>
                  <td className="px-6 py-3 text-sm">{i.description}</td>
                  <td className="px-6 py-3 capitalize">{i.priority}</td>
                  <td className="px-6 py-3 capitalize">{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicalIssues;
