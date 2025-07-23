import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  amount: number;
  category: string;
  estimatedPrice: number;
  realPrice?: number;
  createdAt: number;
  checkedAt?: number;
};

export type ShoppingList = {
  id: string;
  name: string;
  items: ShoppingItem[];
};

type ShoppingListContextType = {
  lists: ShoppingList[];
  addList: (name: string) => void;
  removeList: (id: string) => void;
  addItem: (listId: string, item: Omit<ShoppingItem, 'id' | 'checked' | 'createdAt' | 'checkedAt'>) => void;
  toggleItem: (listId: string, itemId: string) => void;
  updateItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  getListTotals: (listId: string) => { estimated: number; real: number };
  getSuggestions: (listId: string) => string[];
};

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
  const [lists, setLists] = useState<ShoppingList[]>([
    {
      id: '1',
      name: 'Haftalık Market',
      items: [
        { id: '1', name: 'Süt', checked: false, amount: 1, category: 'Süt Ürünleri', estimatedPrice: 30, createdAt: Date.now() },
        { id: '2', name: 'Domates', checked: false, amount: 2, category: 'Sebze', estimatedPrice: 20, createdAt: Date.now() },
      ],
    },
    {
      id: '2',
      name: 'Kahvaltı Alışverişi',
      items: [],
    },
  ]);

  const addList = (name: string) => {
    setLists(prev => [
      ...prev,
      { id: Date.now().toString(), name, items: [] },
    ]);
  };

  const removeList = (id: string) => {
    setLists(prev => prev.filter(list => list.id !== id));
  };

  const addItem = (listId: string, item: Omit<ShoppingItem, 'id' | 'checked' | 'createdAt' | 'checkedAt'>) => {
    setLists(prev =>
      prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: [
                ...list.items,
                { ...item, id: Date.now().toString(), checked: false, createdAt: Date.now() },
              ],
            }
          : list
      )
    );
  };

  const toggleItem = (listId: string, itemId: string) => {
    setLists(prev =>
      prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      checked: !item.checked,
                      checkedAt: !item.checked ? Date.now() : undefined,
                    }
                  : item
              ),
            }
          : list
      )
    );
  };

  const updateItem = (listId: string, itemId: string, updates: Partial<ShoppingItem>) => {
    setLists(prev =>
      prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : list
      )
    );
  };

  const getListTotals = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return { estimated: 0, real: 0 };
    let estimated = 0;
    let real = 0;
    for (const item of list.items) {
      estimated += (item.estimatedPrice || 0) * (item.amount || 1);
      if (item.realPrice !== undefined) {
        real += (item.realPrice || 0) * (item.amount || 1);
      }
    }
    return { estimated, real };
  };

  const getSuggestions = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return [];
    const now = Date.now();
    const TWO_WEEKS = 1000 * 60 * 60 * 24 * 14;
    // Son 2 haftada alınan kategoriler
    const recentlyCheckedCategories = new Set(
      list.items.filter(i => i.checked && i.checkedAt && now - i.checkedAt < TWO_WEEKS).map(i => i.category)
    );
    // Sık kullanılan kategoriler
    const allCategories = list.items.map(i => i.category);
    const popularCategories = Array.from(new Set(allCategories));
    // Önerilecek kategoriler
    const missingCategories = popularCategories.filter(cat => !recentlyCheckedCategories.has(cat));
    // Örnek ürün önerileri
    const categoryToExample: Record<string, string[]> = {
      'Süt Ürünleri': ['Süt', 'Peynir', 'Yoğurt'],
      'Sebze': ['Domates', 'Salatalık', 'Biber'],
      'Meyve': ['Muz', 'Elma', 'Portakal'],
      'Et': ['Tavuk', 'Kıyma', 'Balık'],
      'Temizlik': ['Deterjan', 'Bulaşık Süngeri'],
      'Atıştırmalık': ['Bisküvi', 'Cips'],
      'Kahvaltılık': ['Zeytin', 'Reçel'],
      'Diğer': ['Su', 'Ekmek'],
    };
    const suggestions: string[] = [];
    for (const cat of missingCategories) {
      const examples = categoryToExample[cat] || [];
      if (examples.length > 0) {
        suggestions.push(`Son 2 haftadır ${cat.toLowerCase()} almadın, örn: ${examples.join(', ')}`);
      } else {
        suggestions.push(`Son 2 haftadır ${cat.toLowerCase()} almadın.`);
      }
    }
    // Eğer hiç meyve eklenmemişse ayrıca öner
    if (!allCategories.includes('Meyve')) {
      suggestions.push('Bu hafta meyve eklemedin, muz ya da elma alabilirsin.');
    }
    return suggestions;
  };

  return (
    <ShoppingListContext.Provider value={{ lists, addList, removeList, addItem, toggleItem, updateItem, getListTotals, getSuggestions }}>
      {children}
    </ShoppingListContext.Provider>
  );
};

export const useShoppingList = () => {
  const context = useContext(ShoppingListContext);
  if (!context) throw new Error('useShoppingList must be used within a ShoppingListProvider');
  return context;
}; 