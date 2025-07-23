import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShoppingList } from '@/context/ShoppingListContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ListDetailScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { lists, addItem, toggleItem, updateItem, getListTotals, getSuggestions } = useShoppingList();
  const list = lists.find(l => l.id === listId);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '', category: '', estimatedPrice: '' });
  const [modalCategory, setModalCategory] = useState<string | undefined>(undefined);
  const [priceModal, setPriceModal] = useState<{ open: boolean; itemId?: string }>({ open: false });
  const [realPriceInput, setRealPriceInput] = useState('');
  const router = useRouter();
  const totals = getListTotals(list?.id || '');
  const suggestions = getSuggestions(list?.id || '');
  const insets = useSafeAreaInsets();

  if (!list) {
    return (
      <SafeAreaView style={styles.safeArea}><Text>Liste bulunamadı.</Text></SafeAreaView>
    );
  }

  // Kategoriye göre gruplama
  const grouped = list.items.reduce((acc, item) => {
    const cat = item.category || 'Diğer';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof list.items>);
  const sortedCategories = Object.keys(grouped);

  const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
    'Sebze': { icon: '🥦', color: '#4CAF50' },
    'Et': { icon: '🥩', color: '#B71C1C' },
    'Temizlik': { icon: '🧼', color: '#1976D2' },
    'Süt Ürünleri': { icon: '🥛', color: '#90CAF9' },
    'Atıştırmalık': { icon: '🍪', color: '#FF9800' },
    'Kahvaltılık': { icon: '🍳', color: '#FFD600' },
    'Meyve': { icon: '🍎', color: '#E91E63' },
    'Diğer': { icon: '🛒', color: '#757575' },
  };

  const openPriceModal = (itemId: string) => {
    setPriceModal({ open: true, itemId });
    setRealPriceInput('');
  };
  const saveRealPrice = () => {
    if (priceModal.itemId && !isNaN(Number(realPriceInput))) {
      updateItem(list.id, priceModal.itemId, { realPrice: Number(realPriceInput) });
    }
    setPriceModal({ open: false });
    setRealPriceInput('');
  };

  // Modal açıcı fonksiyonlar
  const openAddItemModal = (category?: string) => {
    setModalCategory(category);
    setNewItem({ name: '', amount: '', category: category || '', estimatedPrice: '' });
    setModalVisible(true);
  };

  // FlatList data: kategori başlıkları + ürünler
  type CategoryRow = { type: 'category'; category: string };
  type ItemRow = { type: 'item'; id: string; name: string; checked: boolean; amount: number; estimatedPrice: number; realPrice?: number; createdAt: number; checkedAt?: number; category: string };
  type Row = CategoryRow | ItemRow;
  const flatListData: Row[] = sortedCategories.flatMap(category => [
    { type: 'category' as const, category },
    ...grouped[category].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1)).map(item => ({ ...item, type: 'item' as const, category })),
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.innerContainer}>
          <FlatList
            ListHeaderComponent={
              <>
                <Text style={styles.title}>{list.name}</Text>
                {suggestions.length > 0 && (
                  <View style={styles.suggestionBox}>
                    {suggestions.map((s, i) => (
                      <Text key={i} style={styles.suggestionText}>💡 {s}</Text>
                    ))}
                  </View>
                )}
                <View style={styles.totalsCard}>
                  <Text style={styles.totalsLabel}>Toplamlar</Text>
                  <View style={styles.totalsRowCol}>
                    <Text style={styles.totalsText}>Tahmini: <Text style={styles.totalsValue}>₺{totals.estimated.toFixed(2)}</Text></Text>
                    <Text style={styles.totalsText}>Gerçek: <Text style={styles.totalsValue}>₺{totals.real.toFixed(2)}</Text></Text>
                    <Text style={styles.totalsText}>Fark: <Text style={styles.totalsValue}>₺{(totals.real - totals.estimated).toFixed(2)}</Text></Text>
                  </View>
                </View>
                {sortedCategories.length === 0 && <Text style={styles.emptyText}>Listeye ürün ekleyin.</Text>}
              </>
            }
            data={flatListData}
            keyExtractor={(item, idx) => item.type === 'category' ? 'cat-' + item.category : (item as ItemRow).id}
            renderItem={({ item }) => {
              if (item.type === 'category') {
                return (
                  <View style={styles.categoryGroup}>
                    <View style={[styles.categoryHeader, { backgroundColor: CATEGORY_ICONS[item.category]?.color + '22' || '#eee' }] }>
                      <Text style={[styles.categoryIcon, { color: CATEGORY_ICONS[item.category]?.color }]}>{CATEGORY_ICONS[item.category]?.icon || '🛒'}</Text>
                      <Text style={styles.categoryTitle}>{item.category}</Text>
                      <TouchableOpacity style={styles.categoryAddButton} onPress={() => openAddItemModal(item.category)}>
                        <Text style={styles.categoryAddButtonText}>+ Ürün Ekle</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
              const row = item as ItemRow;
              return (
                <View style={[styles.itemCard, row.checked && styles.checkedItemCard]}>
                  <TouchableOpacity style={styles.itemRow} onPress={() => toggleItem(list.id, row.id)}>
                    <View style={styles.itemLeft}>
                      <Text style={[styles.itemName, row.checked && styles.checkedText]}>{row.name}</Text>
                      <Text style={styles.itemInfo}>{row.amount} adet</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemPrice}>₺{row.estimatedPrice}</Text>
                      {row.checked ? (
                        <TouchableOpacity style={styles.priceButton} onPress={() => openPriceModal(row.id)}>
                          <Text style={styles.priceButtonText}>{row.realPrice !== undefined ? `₺${row.realPrice}` : 'Gerçek Fiyat'}</Text>
                        </TouchableOpacity>
                      ) : null}
                      <View style={[styles.checkbox, row.checked && styles.checkedBox]} />
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
            contentContainerStyle={[styles.listContent, { paddingBottom: 90 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          />
          <View style={[styles.bottomArea, { paddingBottom: 18 + insets.bottom }] }>
            <TouchableOpacity style={styles.addButton} onPress={() => openAddItemModal()}>
              <Text style={styles.addButtonText}>+ Kategori Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal visible={modalVisible} transparent animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Ürün Bilgileri</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ürün adı"
                    value={newItem.name}
                    onChangeText={text => setNewItem({ ...newItem, name: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Miktar"
                    keyboardType="numeric"
                    value={newItem.amount}
                    onChangeText={text => setNewItem({ ...newItem, amount: text })}
                  />
                  <TextInput
                    style={[styles.input, modalCategory && { backgroundColor: '#f0f0f0' }]}
                    placeholder="Kategori (örn: Sebze)"
                    value={newItem.category}
                    editable={!modalCategory ? true : false}
                    onChangeText={text => setNewItem({ ...newItem, category: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Tahmini fiyat"
                    keyboardType="numeric"
                    value={newItem.estimatedPrice}
                    onChangeText={text => setNewItem({ ...newItem, estimatedPrice: text })}
                  />
                  <View style={[styles.modalButtons, { paddingBottom: insets.bottom }] }>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      if (!newItem.name.trim()) return;
                      addItem(list.id, {
                        name: newItem.name,
                        amount: Number(newItem.amount) || 1,
                        category: newItem.category || 'Diğer',
                        estimatedPrice: Number(newItem.estimatedPrice) || 0,
                      });
                      setNewItem({ name: '', amount: '', category: '', estimatedPrice: '' });
                      setModalVisible(false);
                    }}>
                      <Text style={styles.saveText}>Ekle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
        <Modal visible={priceModal.open} transparent animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Gerçek Fiyatı Gir</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="₺"
                    keyboardType="numeric"
                    value={realPriceInput}
                    onChangeText={setRealPriceInput}
                  />
                  <View style={[styles.modalButtons, { paddingBottom: insets.bottom }] }>
                    <TouchableOpacity onPress={() => setPriceModal({ open: false })}>
                      <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveRealPrice}>
                      <Text style={styles.saveText}>Kaydet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  innerContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 90, // butonun üstünde boşluk bırak
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  suggestionBox: {
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD600',
  },
  suggestionText: {
    color: '#B8860B',
    fontSize: 16,
    marginBottom: 2,
    fontWeight: '500',
  },
  totalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  totalsLabel: {
    fontSize: 15,
    color: '#888',
    marginBottom: 6,
    fontWeight: '600',
  },
  totalsRowCol: {
    flexDirection: 'column',
    gap: 4,
  },
  totalsText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  totalsValue: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 17,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 24,
  },
  categoryGroup: {
    marginBottom: 22,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  categoryIcon: {
    fontSize: 26,
    marginRight: 10,
    fontWeight: 'bold',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.2,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  checkedItemCard: {
    backgroundColor: '#F0F0F0',
    opacity: 0.7,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flex: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#888',
    opacity: 0.7,
  },
  itemInfo: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    color: '#4CAF50',
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  priceButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  priceButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  checkedBox: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250,250,250,0.97)',
    paddingBottom: 18,
    paddingTop: 8,
    alignItems: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 16,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
    marginRight: 16,
  },
  saveText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryAddButton: {
    marginLeft: 'auto',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryAddButtonText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 