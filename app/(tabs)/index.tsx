import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  bg: '#0A0A0A',
  card: '#141414',
  border: '#1E1E1E',
  gold: '#FFD700',
  goldDim: '#6B5700',
  white: '#FFFFFF',
  gray: '#888888',
  lightGray: '#CCCCCC',
  green: '#4ADE80',
  red: '#F87171',
  orange: '#FB923C',
  blue: '#60A5FA',
};

const today = new Date();
const dateStr = today.toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const STATS = [
  { label: 'Courses\ndu jour', value: '24', icon: 'car' as const, color: C.gold },
  { label: 'Revenus\ndu jour', value: '1 847 €', icon: 'cash' as const, color: C.green },
  { label: 'Chauffeurs\nactifs', value: '8', icon: 'people' as const, color: C.blue },
];

const STATS2 = [
  { label: 'Taux completion', value: '94%', icon: 'checkmark-circle' as const, color: C.green },
  { label: 'Note moyenne', value: '4.8 ★', icon: 'star' as const, color: C.gold },
  { label: 'Km parcourus', value: '312 km', icon: 'navigate' as const, color: C.orange },
];

// Données chargées depuis Supabase
function useRecentCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from('courses')
      .select('*, drivers(nom, prenom)')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        console.log("Supabase courses:", JSON.stringify(data), "Error:", JSON.stringify(error));
        if (data) setCourses(data.map(c => ({
          id: String(c.id),
          driver: c.drivers ? c.drivers.prenom + ' ' + c.drivers.nom[0] + '.' : 'Inconnu',
          from: c.depart || '-',
          to: c.arrivee || '-',
          price: c.montant ? c.montant + ' €' : '-',
          status: c.statut === 'termine' ? 'Terminée' : c.statut === 'en_cours' ? 'En cours' : 'En attente',
          statusColor: c.statut === 'termine' ? C.green : c.statut === 'en_cours' ? C.gold : C.orange,
          time: new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        })));
      });
  }, []);
  return courses;
}

const BAR_HEIGHTS = [60, 45, 80, 55, 90, 70, 95];
const BAR_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function StatCard({ label, value, icon, color }: {
  label: string; value: string;
  icon: React.ComponentProps<typeof Ionicons>['name']; color: string;
}) {
  return (
    <View style={[styles.statCard, { flex: 1 }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Stat2Card({ label, value, icon, color }: {
  label: string; value: string;
  icon: React.ComponentProps<typeof Ionicons>['name']; color: string;
}) {
  return (
    <View style={[styles.stat2Card, { flex: 1 }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.stat2Value, { color }]}>{value}</Text>
      <Text style={styles.stat2Label}>{label}</Text>
    </View>
  );
}

function CourseRow({ item }: { item: any }) {
  return (
    <View style={styles.courseRow}>
      <View style={styles.courseTimeCol}>
        <Text style={styles.courseTime}>{item.time}</Text>
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseDriver}>{item.driver}</Text>
        <View style={styles.courseRoute}>
          <Text style={styles.courseFrom} numberOfLines={1}>{item.from}</Text>
          <Ionicons name="arrow-forward" size={11} color={C.gray} style={{ marginHorizontal: 3 }} />
          <Text style={styles.courseTo} numberOfLines={1}>{item.to}</Text>
        </View>
      </View>
      <View style={styles.courseRight}>
        <Text style={styles.coursePrice}>{item.price}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.statusColor + '22' }]}>
          <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const RECENT_COURSES = useRecentCourses();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>
              DRIVER <Text style={styles.appTitleGold}>PRO</Text>
            </Text>
            <Text style={styles.headerDate}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={C.gold} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Alert banner */}
        <View style={styles.alertBanner}>
          <Ionicons name="flash" size={13} color={C.gold} />
          <Text style={styles.alertText}>3 courses en attente d'attribution</Text>
          <TouchableOpacity>
            <Text style={styles.alertAction}>Voir →</Text>
          </TouchableOpacity>
        </View>

        {/* Main stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </View>

        {/* Secondary stats */}
        <View style={styles.stats2Row}>
          {STATS2.map((s) => <Stat2Card key={s.label} {...s} />)}
        </View>

        {/* Revenue chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenus — 7 derniers jours</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {BAR_HEIGHTS.map((h, i) => (
                <View key={i} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: h * 0.7,
                        backgroundColor: i === 6 ? C.gold : C.goldDim,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{BAR_DAYS[i]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Recent courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses récentes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Tout voir</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {RECENT_COURSES.map((item, index) => (
              <React.Fragment key={item.id}>
                <CourseRow item={item} />
                {index < RECENT_COURSES.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 16,
  },
  appTitle: { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: 2 },
  appTitleGold: { color: C.gold },
  headerDate: { fontSize: 12, color: C.gray, marginTop: 2, textTransform: 'capitalize' },
  notifBtn: { position: 'relative', padding: 8 },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.red, borderWidth: 1.5, borderColor: C.bg,
  },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70015',
    borderColor: '#FFD70040',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
    gap: 6,
  },
  alertText: { flex: 1, fontSize: 12, color: C.lightGray },
  alertAction: { fontSize: 12, color: C.gold, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: C.white, marginBottom: 3 },
  statLabel: { fontSize: 10, color: C.gray, lineHeight: 14 },

  stats2Row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat2Card: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    gap: 4,
  },
  stat2Value: { fontSize: 15, fontWeight: '700' },
  stat2Label: { fontSize: 9, color: C.gray, textAlign: 'center' },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 10 },
  seeAll: { fontSize: 12, color: C.gold, fontWeight: '600' },

  chartCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    height: 110,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    gap: 4,
  },
  barCol: { alignItems: 'center', flex: 1, gap: 5, justifyContent: 'flex-end' },
  bar: { width: '75%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: C.gray },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  courseTimeCol: { width: 44, marginRight: 8 },
  courseTime: { fontSize: 12, color: C.gray, fontWeight: '600' },
  courseInfo: { flex: 1 },
  courseDriver: { fontSize: 13, fontWeight: '700', color: C.white, marginBottom: 3 },
  courseRoute: { flexDirection: 'row', alignItems: 'center' },
  courseFrom: { fontSize: 11, color: C.gray, flexShrink: 1 },
  courseTo: { fontSize: 11, color: C.gray, flexShrink: 1 },
  courseRight: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  coursePrice: { fontSize: 13, fontWeight: '700', color: C.gold },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
});
