'use client';

import { LocationCode, useLocation } from '@/types/location';
import { useState, useEffect } from 'react';

interface LocationPermissionEditorProps {
  initialLocations: LocationCode[];
  onLocationsChange: (locations: LocationCode[]) => void;
  disabled?: boolean;
}

export default function LocationPermissionEditor({ 
  initialLocations, 
  onLocationsChange, 
  disabled = false 
}: LocationPermissionEditorProps) {
  const [selectedLocations, setSelectedLocations] = useState<LocationCode[]>(initialLocations || []);
  const { label } = useLocation();
  useEffect(() => {
    setSelectedLocations(initialLocations || []);
  }, [initialLocations]);

  const handleLocationToggle = (location: LocationCode) => {
    if (disabled) return;
    
    const newSelectedLocations = selectedLocations.includes(location)
      ? selectedLocations.filter(loc => loc !== location)
      : [...selectedLocations, location];
    
    setSelectedLocations(newSelectedLocations);
    onLocationsChange(newSelectedLocations);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        地區權限
      </label>
      <div className="space-y-2">
        {Object.values(LocationCode).map((location) => (
          <label
            key={location}
            className={`flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedLocations.includes(location)}
              onChange={() => handleLocationToggle(location)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">{label(location)}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        選擇教練可以管理的地區。未選擇任何地區時，該教練將無法查看任何出席記錄。
      </p>
    </div>
  );
} 