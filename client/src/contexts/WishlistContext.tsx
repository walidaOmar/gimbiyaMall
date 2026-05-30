import React, { createContext, useContext, useEffect, useState } from "react";

interface WishlistContextType {
  items: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const STORAGE_KEY = "wishlist_items";

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToWishlist = (productId: string) => {
    setItems((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => prev.filter((id) => id !== productId));
  };

  const toggleWishlist = (productId: string) => {
    setItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isWishlisted = (productId: string) => items.includes(productId);
  const count = items.length;

  return (
    <WishlistContext.Provider
      value={{ items, isWishlisted, toggleWishlist, addToWishlist, removeFromWishlist, count }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
