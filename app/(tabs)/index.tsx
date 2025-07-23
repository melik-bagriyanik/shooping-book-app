import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useShoppingList } from '@/context/ShoppingListContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { lists, addList } = useShoppingList();
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleAddList = () => {
    if (newListName.trim().length === 0) return;
    addList(newListName);
    setNewListName('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>Alışveriş Listeleri</Text>
      <FlatList
        data={lists}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 90 + insets.bottom }]}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => router.push({ pathname: '/(tabs)/list-detail', params: { listId: item.id } })}>
            <View style={styles.listInfo}>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.itemCount}>{item.items.length} ürün</Text>
            </View>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir listeniz yok.</Text>}
      />
      <View style={[styles.bottomArea, { paddingBottom: 18 + insets.bottom }] }>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Yeni Liste Ekle</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Liste Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Haftalık Market"
              value={newListName}
              onChangeText={setNewListName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddList}>
                <Text style={styles.saveText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 16,
    color: '#222',
    alignSelf: 'center',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 15,
    color: '#888',
  },
  arrow: {
    fontSize: 22,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 32,
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
    marginBottom: 45,
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
});
