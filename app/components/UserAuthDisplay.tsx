"use client";

import { useUser } from "@/lib/context/user-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export default function UserAuthDisplay() {
  const { user, authUser, loading, signOut } = useUser();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <Button 
        onClick={() => router.push("/auth")}
        variant="outline"
        className="bg-black/30 border-white/30 text-white hover:bg-black/50 hover:border-white/50 backdrop-blur-sm transition-all duration-200 font-medium"
      >
        Sign In
      </Button>
    );
  }

  // Generate avatar from user initials as fallback
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
  };

  // Get user's avatar URL from Supabase auth user
  const getAvatarUrl = () => {
    // Try to get avatar from Supabase auth user metadata
    if (authUser?.user_metadata?.avatar_url) {
      return authUser.user_metadata.avatar_url;
    }
    
    // Try to get avatar from user_metadata picture (Google, etc.)
    if (authUser?.user_metadata?.picture) {
      return authUser.user_metadata.picture;
    }
    
    // Generate Gravatar URL from email
    if (user.email) {
      const emailHash = btoa(user.email.toLowerCase().trim()).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=32`;
    }
    
    return null;
  };

  const avatarUrl = getAvatarUrl();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 hover:scale-105 group">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-200">
            {avatarUrl && !imageError ? (
              <img 
                src={avatarUrl} 
                alt={user.name || "User avatar"}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <span>{getInitials(user.name)}</span>
            )}
          </div>
          {/* Username */}
          <span className="text-white font-medium hidden sm:block group-hover:text-gray-200 transition-colors duration-200">
            {user.name || user.email.split("@")[0]}
          </span>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-black border-gray-800 shadow-xl shadow-black/50"
        sideOffset={5}
      >
        <div className="px-3 py-2 border-b border-gray-800">
          <p className="text-sm font-medium text-white truncate">{user.name || "User"}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        
        <div className="py-1">
          <DropdownMenuItem 
            onClick={handleDashboard}
            className="text-gray-300 hover:text-white hover:bg-gray-900 cursor-pointer focus:bg-gray-900 focus:text-white mx-1 rounded-sm"
          >
            <User className="mr-2 h-4 w-4" />
            Dashboard
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-gray-300 hover:text-red-400 hover:bg-red-900/20 cursor-pointer focus:bg-red-900/20 focus:text-red-400 mx-1 rounded-sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
