
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, INITIAL_CREDITS } from '../types';
import { useAuth } from './AuthContext';
import { saveFullProfile, loadUserData } from '../services/storageService';

interface CreditContextType {
  credits: number;
  isPremium: boolean;
  hasCreditFor: (cost: number) => boolean;
  spendCredits: (cost: number, actionName: string) => Promise<boolean>;
  purchaseCredits: (amount: number) => Promise<void>;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
  closeSubscriptionModal: () => void;
  subscribe: () => void;
  updateLocalCredits: (newAmount: number) => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Load credits from storage when user changes
  useEffect(() => {
    if (user) {
        const data = loadUserData(user.id);
        if (data && data.profile) {
            setCredits(data.profile.credits !== undefined ? data.profile.credits : INITIAL_CREDITS);
            setIsPremium(!!data.profile.isPremium);
        }
    }
  }, [user]);

  const updateLocalCredits = (newAmount: number) => {
      setCredits(newAmount);
  };

  const hasCreditFor = (cost: number): boolean => {
      if (isPremium) return true;
      return credits >= cost;
  };

  const spendCredits = async (cost: number, actionName: string): Promise<boolean> => {
      if (isPremium) return true;

      if (credits < cost) {
          setShowSubscriptionModal(true);
          return false;
      }

      const newBalance = credits - cost;
      setCredits(newBalance);

      // Persist to storage
      if (user) {
          const data = loadUserData(user.id);
          if (data && data.profile) {
             const updatedProfile = { ...data.profile, credits: newBalance };
             saveFullProfile(user.id, updatedProfile, data.currentBody, data.targetBody, data.plan || undefined);
          }
      }
      
      return true;
  };

  const purchaseCredits = async (amount: number) => {
      const newBalance = credits + amount;
      setCredits(newBalance);
      
      // Persist to storage
      if (user) {
          const data = loadUserData(user.id);
          if (data && data.profile) {
             const updatedProfile = { ...data.profile, credits: newBalance };
             saveFullProfile(user.id, updatedProfile, data.currentBody, data.targetBody, data.plan || undefined);
          }
      }
  };

  const subscribe = () => {
      setIsPremium(true);
      setShowSubscriptionModal(false);
      if (user) {
          const data = loadUserData(user.id);
          if (data && data.profile) {
             const updatedProfile = { ...data.profile, isPremium: true };
             saveFullProfile(user.id, updatedProfile, data.currentBody, data.targetBody, data.plan || undefined);
          }
      }
  };

  return (
    <CreditContext.Provider value={{ 
        credits, 
        isPremium, 
        hasCreditFor, 
        spendCredits, 
        purchaseCredits,
        showSubscriptionModal, 
        setShowSubscriptionModal,
        closeSubscriptionModal: () => setShowSubscriptionModal(false),
        subscribe,
        updateLocalCredits
    }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
};
