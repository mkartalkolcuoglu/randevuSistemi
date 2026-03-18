import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Alert, Modal, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../../src/components/Header';
import DrawerMenu from '../../../src/components/DrawerMenu';
import api from '../../../src/services/api';

const THEME_COLOR = '#163974';

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Acil', color: '#DC2626', bg: '#FEE2E2' },
  high: { label: 'Yüksek', color: '#EA580C', bg: '#FFEDD5' },
  medium: { label: 'Orta', color: '#D97706', bg: '#FEF3C7' },
  low: { label: 'Düşük', color: '#16A34A', bg: '#DCFCE7' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Beklemede', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  in_progress: { label: 'Devam Ediyor', color: '#2563EB', bg: '#DBEAFE', icon: 'play-circle-outline' },
  completed: { label: 'Tamamlandı', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
};

export default function TasksScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (search) params.set('search', search);
      const response = await api.get(`/api/mobile/tasks?${params}`);
      if (response.data.success) {
        setTasks(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [filter, search]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchTasks(); }, [filter, search]);

  const handleStatusChange = async (task: Task) => {
    const nextStatus = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
    try {
      await api.put(`/api/mobile/tasks/${task.id}`, { status: nextStatus });
      fetchTasks();
    } catch {
      Alert.alert('Hata', 'Durum güncellenemedi');
    }
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Görevi Sil', `"${task.title}" görevini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/mobile/tasks/${task.id}`);
            fetchTasks();
          } catch { Alert.alert('Hata', 'Görev silinemedi'); }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!newTask.title.trim()) { Alert.alert('Hata', 'Görev başlığı gerekli'); return; }
    setSaving(true);
    try {
      const response = await api.post('/api/mobile/tasks', newTask);
      if (response.data.success) {
        setShowAddModal(false);
        setNewTask({ title: '', description: '', assignedTo: '', priority: 'medium' });
        fetchTasks();
      }
    } catch { Alert.alert('Hata', 'Görev eklenemedi'); }
    finally { setSaving(false); }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Görevler" subtitle="Görev Yönetimi" onMenuPress={() => setDrawerOpen(true)} gradientColors={[THEME_COLOR, '#1e4a8f']} />
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={THEME_COLOR} /></View>
        <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Görevler" subtitle={`${stats.total} görev`} onMenuPress={() => setDrawerOpen(true)} gradientColors={[THEME_COLOR, '#1e4a8f']} />

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Beklemede', value: stats.pending, color: '#D97706', bg: '#FEF3C7' },
            { label: 'Devam', value: stats.inProgress, color: '#2563EB', bg: '#DBEAFE' },
            { label: 'Tamamlandı', value: stats.completed, color: '#059669', bg: '#D1FAE5' },
          ].map(s => (
            <TouchableOpacity
              key={s.label}
              style={[styles.statCard, { backgroundColor: s.bg, borderColor: filter === (s.label === 'Beklemede' ? 'pending' : s.label === 'Devam' ? 'in_progress' : 'completed') ? s.color : 'transparent', borderWidth: 2 }]}
              onPress={() => setFilter(filter === (s.label === 'Beklemede' ? 'pending' : s.label === 'Devam' ? 'in_progress' : 'completed') ? null : (s.label === 'Beklemede' ? 'pending' : s.label === 'Devam' ? 'in_progress' : 'completed'))}
            >
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Görev ara..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Task List */}
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Görev bulunamadı</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {tasks.map(task => {
              const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
              return (
                <View key={task.id} style={styles.taskCard}>
                  <TouchableOpacity style={styles.taskMain} onPress={() => handleStatusChange(task)}>
                    <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                      <Ionicons name={status.icon as any} size={22} color={status.color} />
                    </View>
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskCompleted]}>{task.title}</Text>
                      {task.description ? <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text> : null}
                      <View style={styles.taskMeta}>
                        <View style={[styles.badge, { backgroundColor: priority.bg }]}>
                          <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
                        </View>
                        {task.assignedTo && task.assignedTo !== 'Atanmamış' && (
                          <View style={styles.assignee}>
                            <Ionicons name="person-outline" size={12} color="#6B7280" />
                            <Text style={styles.assigneeText}>{task.assignedTo}</Text>
                          </View>
                        )}
                        {task.dueDate && (
                          <View style={styles.assignee}>
                            <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                            <Text style={styles.assigneeText}>{formatDate(task.dueDate)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(task)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <LinearGradient colors={[THEME_COLOR, '#1e4a8f']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Görev</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Başlık *</Text>
              <TextInput style={styles.fieldInput} placeholder="Görev başlığı" value={newTask.title} onChangeText={t => setNewTask(p => ({ ...p, title: t }))} />

              <Text style={styles.fieldLabel}>Açıklama</Text>
              <TextInput style={[styles.fieldInput, { height: 80 }]} placeholder="Detaylar..." value={newTask.description} onChangeText={t => setNewTask(p => ({ ...p, description: t }))} multiline />

              <Text style={styles.fieldLabel}>Atanan Kişi</Text>
              <TextInput style={styles.fieldInput} placeholder="Personel adı" value={newTask.assignedTo} onChangeText={t => setNewTask(p => ({ ...p, assignedTo: t }))} />

              <Text style={styles.fieldLabel}>Öncelik</Text>
              <View style={styles.priorityRow}>
                {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.priorityBtn, newTask.priority === key && { backgroundColor: val.bg, borderColor: val.color }]}
                    onPress={() => setNewTask(p => ({ ...p, priority: key }))}
                  >
                    <Text style={[styles.priorityBtnText, newTask.priority === key && { color: val.color, fontWeight: '700' }]}>{val.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.addButton, saving && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Görev Ekle</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1F2937' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  taskList: { paddingHorizontal: 16, gap: 10 },
  taskCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  taskMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  taskCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  assignee: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  assigneeText: { fontSize: 11, color: '#6B7280' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 90, right: 20 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: THEME_COLOR, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  priorityBtnText: { fontSize: 12, color: '#6B7280' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: THEME_COLOR, paddingVertical: 14, borderRadius: 12, marginTop: 20, marginBottom: 20 },
  addButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
