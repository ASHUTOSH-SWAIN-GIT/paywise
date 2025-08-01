import {  User, LogOut } from "lucide-react";
import { ActionButton } from "./ui/ActionButton";
import { useUser } from '@/lib/context/user-context';
import { useState } from 'react';
import { uploadQRCodeAction } from '@/lib/actions/upload-actions';
import { toast } from 'sonner';

export const Header = () => {
  const { user, signOut } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const handleQRUpload = async () => {
    if (!user?.id) {
      toast.error('Please log in to upload QR codes');
      return;
    }

    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          toast.loading('Uploading QR code...');
          
          // Create FormData for server action
          const formData = new FormData();
          formData.append('file', file);
          
          // Upload using server action
          const result = await uploadQRCodeAction(formData);
          
          // Dismiss loading toast first
          toast.dismiss();
          
          if (result.success) {
            toast.success('QR code uploaded successfully!');
            console.log('QR code uploaded to:', result.filePath);
            console.log('QR code public URL:', result.publicUrl);
          } else {
            toast.error(result.error || 'Failed to upload QR code');
          }
        } catch (error) {
          // Dismiss loading toast first
          toast.dismiss();
          console.error('Error uploading QR code:', error);
          toast.error('Failed to upload QR code');
        }
      }
    };
    input.click();
  };

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 p-4 h-20 flex items-center">
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400 text-sm">Welcome back, {user?.name || 'User'}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <ActionButton onClick={handleQRUpload}>
           
            <span>Upload QR</span>
          </ActionButton>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-300" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm font-medium text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
