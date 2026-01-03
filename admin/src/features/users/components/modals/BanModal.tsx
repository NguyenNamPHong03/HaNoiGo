import React, { useState } from 'react';
import type { User } from '../../types/user.types';

interface BanModalProps {
  user: User;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const BanModal: React.FC<BanModalProps> = ({ user, onClose, onConfirm }) => {
  const [banReason, setBanReason] = useState("");

  const handleConfirm = () => {
    onConfirm(banReason);
    setBanReason("");
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ban User: {user.displayName}</h3>

          <div className="mb-4">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Reason for banning (optional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Ban User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanModal;
