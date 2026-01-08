import React, { useState } from 'react';
import { PlaceDetailPage, PlaceFormPage, PlacesListPage } from '../features/places';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface PlacesState {
  mode: ViewMode;
  selectedPlaceId?: string;
  refreshKey?: number; // Force refresh detail view
}

const Places: React.FC = () => {
  const [state, setState] = useState<PlacesState>({ mode: 'list' });

  const handleCreatePlace = () => {
    setState({ mode: 'create' });
  };

  const handleEditPlace = (placeId: string) => {
    setState({ mode: 'edit', selectedPlaceId: placeId });
  };

  const handleViewPlace = (placeId: string) => {
    setState({ mode: 'detail', selectedPlaceId: placeId });
  };

  const handleBackToList = () => {
    setState({ mode: 'list' });
  };

  const handlePlaceSaved = (place: any) => {
    // Show success message (could use toast/notification)
    console.log('Place saved:', place);
    
    // Navigate to detail view to see updated data with new refresh key
    setState({ 
      mode: 'detail', 
      selectedPlaceId: place._id || state.selectedPlaceId,
      refreshKey: Date.now() 
    });
  };

  const renderContent = () => {
    switch (state.mode) {
      case 'create':
        return (
          <PlaceFormPage
            onBack={handleBackToList}
            onSave={handlePlaceSaved}
          />
        );
      
      case 'edit':
        return (
          <PlaceFormPage
            placeId={state.selectedPlaceId}
            onBack={handleBackToList}
            onSave={handlePlaceSaved}
          />
        );
      
      case 'detail':
        return state.selectedPlaceId ? (
          <PlaceDetailPage
            key={`detail-${state.selectedPlaceId}-${state.refreshKey || 0}`}
            placeId={state.selectedPlaceId}
            onBack={handleBackToList}
            onEdit={() => handleEditPlace(state.selectedPlaceId!)}
          />
        ) : (
          <div className="p-6">
            <p className="text-red-500">Không tìm thấy địa điểm</p>
            <button
              onClick={handleBackToList}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        );
      
      case 'list':
      default:
        return (
          <PlacesListPage
            onCreatePlace={handleCreatePlace}
            onEditPlace={handleEditPlace}
            onViewPlace={handleViewPlace}
          />
        );
    }
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
};

export default Places;