import { create } from 'zustand';

// Define the state interface
interface GlobalState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Selection State (for tables across features)
  selections: Record<string, Set<string>>;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;

  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSelection: (feature: string, selection: Set<string>) => void;
  clearSelection: (feature: string) => void;
  addNotification: (notification: Omit<GlobalState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

// Create the store with a simpler implementation to avoid middleware typing issues
export const useGlobalStore = create<GlobalState>((set) => ({
  // Initial state
  sidebarOpen: true,
  theme: 'system',
  selections: {},
  notifications: [],

  // Actions
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  
  setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
  
  setSelection: (feature: string, selection: Set<string>) => 
    set((state) => ({
      selections: { ...state.selections, [feature]: selection }
    })),
  
  clearSelection: (feature: string) =>
    set((state) => ({
      selections: { ...state.selections, [feature]: new Set() }
    })),

  addNotification: (notification: Omit<GlobalState['notifications'][0], 'id' | 'timestamp'>) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
        }
      ]
    })),

  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),
}));

// Note: We've temporarily removed the middleware (devtools, subscribeWithSelector)
// to fix the typing issues. Once the build error is resolved, we can revisit this.
