import React, { useState } from 'react';

const AssignGuest: React.FC = () => {
  const [formData, setFormData] = useState({
    room: '',
    guestName: '',
    checkinDate: '',
    checkoutDate: '',
    language: 'English',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - in a real app, this would call an API
    console.log('Assigning guest:', formData);
    // Reset form
    setFormData({
      room: '',
      guestName: '',
      checkinDate: '',
      checkoutDate: '',
      language: 'English',
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <label htmlFor="assign-room" className="form-label">
            Select Room
          </label>
          <select
            id="assign-room"
            name="room"
            className="form-input"
            value={formData.room}
            onChange={handleInputChange}
          >
            <option value="">Select a room...</option>
            <option value="101">101</option>
            <option value="102">102</option>
            <option value="103">103</option>
            <option value="104">104</option>
          </select>
        </div>
        <div>
          <label htmlFor="guest-name" className="form-label">
            Guest Name
          </label>
          <input
            type="text"
            id="guest-name"
            name="guestName"
            className="form-input"
            placeholder="e.g., John Doe"
            value={formData.guestName}
            onChange={handleInputChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="checkin-date" className="form-label">
              Check-in Date
            </label>
            <input
              type="date"
              id="checkin-date"
              name="checkinDate"
              className="form-input"
              value={formData.checkinDate}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="checkout-date" className="form-label">
              Check-out Date
            </label>
            <input
              type="date"
              id="checkout-date"
              name="checkoutDate"
              className="form-input"
              value={formData.checkoutDate}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div>
          <label htmlFor="language" className="form-label">
            Preferred Language
          </label>
          <select
            id="language"
            name="language"
            className="form-input"
            value={formData.language}
            onChange={handleInputChange}
          >
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Spanish">Spanish</option>
            <option value="Italian">Italian</option>
          </select>
        </div>
        <div className="pt-4 flex justify-end gap-4">
          <button type="button" className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
            <i className="fas fa-user-check"></i> Assign Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignGuest;
