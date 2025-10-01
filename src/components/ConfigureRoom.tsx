import React, { useState } from "react";

const ConfigureRoom: React.FC = () => {
  const [formData, setFormData] = useState({
    room: "",
    welcomeMessage: "",
    supportedLanguages: [] as string[],
    defaultLanguage: "English",
  });

  // Raw input for text box
  const [supportedLanguagesInput, setSupportedLanguagesInput] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "supportedLanguages") {
      // update raw input
      setSupportedLanguagesInput(value);

      // update array version
      setFormData((prev) => ({
        ...prev,
        supportedLanguages: value
          .split(",")
          .map((lang) => lang.trim())
          .filter((lang) => lang.length > 0),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure defaultLanguage is valid
    let finalDefault = formData.defaultLanguage;
    if (
      formData.supportedLanguages.length > 0 &&
      !formData.supportedLanguages.includes(formData.defaultLanguage)
    ) {
      finalDefault = formData.supportedLanguages[0]; // pick first one
    }

    const payload = {
      ...formData,
      defaultLanguage: finalDefault,
    };

    console.log("Saving configuration:", payload);

    // Reset form
    setFormData({
      room: "",
      welcomeMessage: "",
      supportedLanguages: [],
      defaultLanguage: "English",
    });
    setSupportedLanguagesInput("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Selection */}
        <div>
          <label htmlFor="configure-room" className="form-label">
            Select Room to Configure
          </label>
          <select
            id="configure-room"
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

      

        {/* Welcome Message */}
        <div>
          <label htmlFor="welcome-message" className="form-label">
            Welcome Message
          </label>
          <textarea
            id="welcome-message"
            name="welcomeMessage"
            rows={3}
            className="form-input"
            placeholder="e.g., Welcome {guest_name} to Hotel Aurora"
            value={formData.welcomeMessage}
            onChange={handleInputChange}
          />
        </div>

        {/* Supported Languages */}
        <div>
          <label htmlFor="supported-languages" className="form-label">
            Supported Languages
          </label>
          <input
            type="text"
            id="supported-languages"
            name="supportedLanguages"
            className="form-input"
            placeholder="e.g., English, French, German"
            value={supportedLanguagesInput}
            onChange={handleInputChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Comma-separated values
          </p>
        </div>

        {/* Default Language */}
        <div>
          <label htmlFor="default-language" className="form-label">
            Default Language
          </label>
          <select
            id="default-language"
            name="defaultLanguage"
            className="form-input"
            value={formData.defaultLanguage}
            onChange={handleInputChange}
          >
            {formData.supportedLanguages.length > 0 ? (
              formData.supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))
            ) : (
              <option value="English">English</option>
            )}
          </select>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex justify-end gap-4">
          <button type="button" className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-save"></i> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigureRoom;
