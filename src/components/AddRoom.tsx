import React, { useState } from 'react';
import { adminApi, CreateRoomPayload, ApiError } from '../services/api';

const AddRoom: React.FC = () => {
  const [formData, setFormData] = useState<CreateRoomPayload>({
    hotel_id: '',
    room_number: '',
    room_type: 'standard',
    availability: true,
    capacity_adults: 2,
    capacity_children: 0,
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Get hotel_id from localStorage (selected hotel)
      const selectedHotel = localStorage.getItem('selected_hotel');
      if (!selectedHotel) {
        throw new Error('No hotel selected. Please select a hotel first.');
      }

      const hotelData = JSON.parse(selectedHotel);
      const payload: CreateRoomPayload = {
        ...formData,
        hotel_id: hotelData.id || hotelData.hotel_id,
      };

      const response = await adminApi.createRoom(payload);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Room created successfully!' });
        // Reset form
        setFormData({
          hotel_id: '',
          room_number: '',
          room_type: 'standard',
          availability: true,
          capacity_adults: 2,
          capacity_children: 0,
          password: '',
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create room' });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      if (error instanceof ApiError) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div>
          <label htmlFor="room_number" className="form-label">
            Room Number *
          </label>
          <input
            type="text"
            id="room_number"
            name="room_number"
            className="form-input"
            placeholder="e.g., 305"
            value={formData.room_number}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label htmlFor="room_type" className="form-label">
            Room Type *
          </label>
          <select
            id="room_type"
            name="room_type"
            className="form-input"
            value={formData.room_type}
            onChange={handleInputChange}
            required
          >
            <option value="standard">Standard</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
            <option value="presidential">Presidential</option>
          </select>
        </div>

        <div>
          <label htmlFor="capacity_adults" className="form-label">
            Adult Capacity *
          </label>
          <input
            type="number"
            id="capacity_adults"
            name="capacity_adults"
            className="form-input"
            placeholder="e.g., 2"
            value={formData.capacity_adults}
            onChange={handleInputChange}
            min="1"
            max="10"
            required
          />
        </div>

        <div>
          <label htmlFor="capacity_children" className="form-label">
            Children Capacity
          </label>
          <input
            type="number"
            id="capacity_children"
            name="capacity_children"
            className="form-input"
            placeholder="e.g., 2"
            value={formData.capacity_children}
            onChange={handleInputChange}
            min="0"
            max="10"
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Room Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-input"
            placeholder="Enter room password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="availability"
            name="availability"
            className="form-checkbox"
            checked={formData.availability}
            onChange={handleInputChange}
          />
          <label htmlFor="availability" className="ml-2 form-label">
            Room Available
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button 
            type="button" 
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i> Add Room
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoom;
