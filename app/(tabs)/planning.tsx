import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
  white: '#FFFFFF',
  gray: '#888888',
  lightGray: '#CCCCCC',
  green: '#4ADE80',
  red: '#F87171',
  orange: '#FB923C',
  blue: '#60A5FA',
  purple: '#C084FC',
};

const DRIVER_COLORS = [C.gold, C.blue, C.green, C.orange, C.purple, C.red];
const DRIVER_NAMES = ['Marc D.', 'Sarah K.', 'Karim B.', 'Julie M.', 'Thomas P.', 'Aisha T.'];

interface Slot {
  driver: number; // index into DRIVER_NAMES
  from: string;
  to: string;
  label: string;
  startHour: number;
  durationH: number;
}

const SLOTS: Slot[] = [
  { driver: 0, from: 'CDG T2', to: 'Paris 8e', label: 'CDG → Paris 8e', startHour: 6, durationH: 1 },
  { driver: 1, from: 'Gare de Lyon', to: 'Orly T4', label: 'Gare Lyon → Orly', startHour: 7.5, durationH: 1 },
  { driver: 2, from: 'Paris 16e', to: 'Versailles', label: 'Paris 16e → Versailles', startHour: 8, durationH: 1.5 },
  { driver: 3, from: 'Montparnasse', to: 'La Défense', label: 'Montparnasse → Défense', startHour: 6.5, durationH: 0.75 },
  { driver: 0, from: 'Paris 1er', to: 'CDG T1', label: 'Paris 1er → CDG T1', startHour: 9, durationH: 1 },
  { driver: 4, from: 'Neuilly', to: 'Disneyland', label: 'Neuilly → Disneyland', startHour: 9.5, durationH: 1.5 },
  { driver: 1, from: 'Orly T4', to: 'Paris 15e', label: 'Orly T4 → Paris 15e', startHour: 10, durationH: 0.75 },
  { driver: 5, from: 'Le Marais', to: 'Boulogne', label: 'Le Marais → Boulogne', startHour: 10.5, durationH: 0.5 },
  { driver: 2, from: 'Versailles', to: 'CDG T2', label: 'Versailles → CDG T2', startHour: 11, durationH: 1.5 },
  { driver: 3, from: 'La Défense', to: 'Opéra', label: 'La Défense → Opéra', startHour: 11, durationH: 0.75 },
  { driver: 0, from: 'CDG T1', to: 'Paris 7e', label: 'CDG T1 → Paris 7e', startHour: 12, durationH: 1 },
  { driver: 4, from: 'Disneyland', to: 'Paris 11e', label: 'Disney → Paris 11e', startHour: 13, durationH: 1 },
  { driver: 5, from: 'Boulogne', to: 'CDG T3', label: 'Boulogne → CDG T3', startHour: 13.5, durationH: 1.5 },
  { driver: 1, from: 'Paris 15e', to: 'Orly T1', label: 'Paris 15e → Orly T1', startHour: 14, durationH: 1 },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6 to 18
const HOUR_HEIGHT = 64;
const START_HOUR = 6;

const today = new Date();

function getWeekDays(baseDate: Date) {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function PlanningScreen() {
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const weekDays = getWeekDays(today);

  const totalSlots = SLOTS.length;
  const activeDrivers = new Set(SLOTS.map((s) => s.driver)).size;
  const totalRevenue = '1 847 €';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Planning</Text>
          <Text style={styles.subtitle}>
            {today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color={C.bg} />
        </TouchableOpacity>
      </View>

      {/* Week selector */}
      <View style={styles.weekRow}>
        {weekDays.map((d, i) => {
          const isSelected = d.getDate() === selectedDay;
          const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
          return (
            <TouchableOpacity
              key={i}
              style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
              onPress={() => setSelectedDay(d.getDate())}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                {DAY_LABELS[i]}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                {d.getDate()}
              </Text>
              {isToday && <View style={[styles.todayDot, { backgroundColor: isSelected ? C.bg : C.gold }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Ionicons name="car" size={14} color={C.gold} />
          <Text style={styles.summaryValue}>{totalSlots}</Text>
          <Text style={styles.summaryLabel}>courses</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="people" size={14} color={C.blue} />
          <Text style={styles.summaryValue}>{activeDrivers}</Text>
          <Text style={styles.summaryLabel}>chauffeurs</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="cash" size={14} color={C.green} />
          <Text style={[styles.summaryValue, { color: C.green }]}>{totalRevenue}</Text>
          <Text style={styles.summaryLabel}>revenus</Text>
        </View>
      </View>

      {/* Driver legend */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.legendRow}
      >
        {DRIVER_NAMES.map((name, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: DRIVER_COLORS[i] }]} />
            <Text style={styles.legendName}>{name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Timeline */}
      <ScrollView style={styles.timelineScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.timeline}>
          {/* Hour labels + lines */}
          {HOURS.map((h) => (
            <View key={h} style={[styles.hourRow, { top: (h - START_HOUR) * HOUR_HEIGHT }]}>
              <Text style={styles.hourLabel}>{`${h}h`}</Text>
              <View style={styles.hourLine} />
            </View>
          ))}

          {/* Current time indicator */}
          {(() => {
            const now = new Date();
            const currentH = now.getHours() + now.getMinutes() / 60;
            if (currentH >= START_HOUR && currentH <= START_HOUR + HOURS.length - 1 && selectedDay === today.getDate()) {
              return (
                <View style={[styles.nowLine, { top: (currentH - START_HOUR) * HOUR_HEIGHT }]}>
                  <View style={styles.nowDot} />
                  <View style={styles.nowLineBar} />
                </View>
              );
            }
            return null;
          })()}

          {/* Course slots */}
          <View style={styles.slotsArea}>
            {SLOTS.map((slot, i) => {
              const top = (slot.startHour - START_HOUR) * HOUR_HEIGHT;
              const height = Math.max(slot.durationH * HOUR_HEIGHT - 4, 24);
              const color = DRIVER_COLORS[slot.driver];
              const col = slot.driver % 3;
              const colWidth = 90;
              const left = col * (colWidth + 4);

              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  style={[
                    styles.slot,
                    {
                      top,
                      height,
                      left,
                      width: colWidth,
                      backgroundColor: color + '20',
                      borderColor: color + '80',
                    },
                  ]}
                >
                  <Text style={[styles.slotDriver, { color }]} numberOfLines={1}>
                    {DRIVER_NAMES[slot.driver]}
                  </Text>
                  {height > 36 && (
                    <Text style={styles.slotLabel} numberOfLines={1}>
                      {slot.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const TIMELINE_HEIGHT = HOURS.length * HOUR_HEIGHT;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: C.white },
  subtitle: { fontSize: 13, color: C.gray, marginTop: 2, textTransform: 'capitalize' },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },

  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 4,
  },
  dayBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    gap: 2,
  },
  dayBtnActive: { backgroundColor: C.gold, borderColor: C.gold },
  dayLabel: { fontSize: 10, color: C.gray, fontWeight: '600' },
  dayLabelActive: { color: C.bg },
  dayNum: { fontSize: 14, fontWeight: '700', color: C.white },
  dayNumActive: { color: C.bg },
  todayDot: { width: 4, height: 4, borderRadius: 2 },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  summaryValue: { fontSize: 15, fontWeight: '800', color: C.white },
  summaryLabel: { fontSize: 11, color: C.gray },
  summaryDivider: { width: 1, height: 20, backgroundColor: C.border },

  legendRow: { paddingHorizontal: 16, gap: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { fontSize: 11, color: C.lightGray, fontWeight: '600' },

  timelineScroll: { flex: 1, paddingHorizontal: 16 },
  timeline: {
    height: TIMELINE_HEIGHT + 40,
    position: 'relative',
  },

  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: HOUR_HEIGHT,
  },
  hourLabel: { width: 36, fontSize: 11, color: C.gray, fontWeight: '500' },
  hourLine: { flex: 1, height: 1, backgroundColor: C.border },

  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.red, marginLeft: 28,
  },
  nowLineBar: { flex: 1, height: 1.5, backgroundColor: C.red + 'AA' },

  slotsArea: {
    position: 'absolute',
    left: 44,
    right: 0,
    top: 0,
    height: TIMELINE_HEIGHT,
  },
  slot: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  slotDriver: { fontSize: 10, fontWeight: '700' },
  slotLabel: { fontSize: 9, color: C.lightGray, marginTop: 1 },
});
