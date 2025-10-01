import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { X, Plus } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CleanRequest {
  id: string;
  room: string;
  requestedAt: string;
  notes?: string;
  status: 'pending' | 'in-progress' | 'completed';
}

const CleanRequests: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState<Omit<CleanRequest, 'id' | 'requestedAt'>>({ 
    room: '', 
    notes: '', 
    status: 'pending' 
  });

  const [requests, setRequests] = useState<CleanRequest[]>([
    { id: '1', room: '101', requestedAt: '2025-01-10 10:15', notes: 'Spill on carpet', status: 'pending' },
    { id: '2', room: '205', requestedAt: '2025-01-10 11:05', notes: 'Bathroom cleanup', status: 'in-progress' },
    { id: '3', room: '312', requestedAt: '2025-01-10 11:45', notes: 'Change linens', status: 'pending' },
  ]);

  const updateStatus = (id: string, status: CleanRequest['status']) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCleanRequest: CleanRequest = {
      ...newRequest,
      id: Date.now().toString(),
      requestedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') // Format: YYYY-MM-DD HH:MM
    };
    
    setRequests(prev => [newCleanRequest, ...prev]);
    setNewRequest({ room: '', notes: '', status: 'pending' });
    setIsModalOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Clean Requests</CardTitle>
            <CardDescription>See and manage all cleaning requests by room</CardDescription>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Clean Request
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold">Room</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Requested At</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-3">{r.room}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{r.requestedAt}</td>
                  <td className="px-6 py-3 text-sm">{r.notes || '—'}</td>
                  <td className="px-6 py-3 text-sm capitalize">{r.status.replace('-', ' ')}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => updateStatus(r.id, 'in-progress')}>In Progress</Button>
                    <Button size="sm" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* New Clean Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Clean Request</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  name="room"
                  type="text"
                  value={newRequest.room}
                  onChange={handleInputChange}
                  placeholder="e.g., 101"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newRequest.status}
                  onValueChange={(value: CleanRequest['status']) => 
                    setNewRequest(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newRequest.notes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions?"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CleanRequests;
