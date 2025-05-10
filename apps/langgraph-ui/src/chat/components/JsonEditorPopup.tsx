import React, { useState, useEffect } from 'react';
import './JsonEditorPopup.css';

interface JsonEditorPopupProps {
  isOpen: boolean;
  initialJson: object;
  onClose: () => void;
  onSave: (jsonData: object) => void;
}

const JsonEditorPopup: React.FC<JsonEditorPopupProps> = ({ isOpen, initialJson, onClose, onSave }) => {
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonString(JSON.stringify(initialJson, null, 2));
    setError(null); // Reset error when initialJson changes or popup opens
  }, [initialJson, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    try {
      const parsedJson = JSON.parse(jsonString);
      onSave(parsedJson);
      onClose();
    } catch (e) {
      setError('JSON 格式无效，请检查后重试。');
      console.error("Invalid JSON format:", e);
    }
  };

  return (
    <div className="json-editor-popup-overlay">
      <div className="json-editor-popup-content">
        <h2>编辑 Extra Parameters</h2>
        <textarea
          value={jsonString}
          onChange={(e) => {
            setJsonString(e.target.value);
            setError(null); // Clear error on edit
          }}
          rows={15}
        />
        {error && <p className="error-message">{error}</p>}
        <div className="popup-actions">
          <button onClick={onClose} className="cancel-button">取消</button>
          <button onClick={handleSave} className="save-button">保存</button>
        </div>
      </div>
    </div>
  );
};

export default JsonEditorPopup; 