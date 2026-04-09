import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

const C = { bg:'#0A0A0A',card:'#141414',border:'#1E1E1E',gold:'#FFD700',white:'#FFFFFF',gray:'#888888',green:'#4ADE80',red:'#F87171',orange:'#FB923C',blue:'#60A5FA' };

const TYPE_CONFIG: Record<string,{icon:string,color:string,label:string}> = {
  objet_perdu:   {icon:'phone-portrait-outline', color:'#60A5FA', label:'Objet perdu'},
  accident:      {icon:'warning-outline',        color:'#F87171', label:'Accident'},
  panne:         {icon:'construct-outline',       color:'#FB923C', label:'Panne'},
  reclamation:   {icon:'chatbubble-outline',      color:'#FFD700', label:'Réclamation'},
  annulation:    {icon:'close-circle-outline',    color:'#888888', label:'Annulation'},
};

const PRIORITE_COLOR: Record<string,string> = { urgente:'#F87171', haute:'#FB923C', normale:'#FFD700', faible:'#4ADE80' };
const STATUT_COLOR: Record<string,string> = { ouvert:'#F87171', en_cours:'#FB923C', resolu:'#4ADE80', ferme:'#888888' };

interface Incident {
  id: string; type: string; statut: string; description: string;
  priorite: string; date_incident: string;
  drivers?: { nom: string; prenom: string };
}

function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('incidents').select('*, drivers(nom, prenom)').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setIncidents(data as Incident[]);
        setLoading(false);
      });
  }, []);
  return { incidents, loading };
}

function IncidentCard({ item }: { item: Incident }) {
  const cfg = TYPE_CONFIG[item.type] ?? { icon: 'alert-circle-outline', color: C.gray, label: item.type };
  const pColor = PRIORITE_COLOR[item.priorite] ?? C.gray;
  const sColor = STATUT_COLOR[item.statut] ?? C.gray;
  const driverName = item.drivers ? `${item.drivers.prenom} ${item.drivers.nom}` : '—';
  const date = new Date(item.date_incident).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{cfg.label}</Text>
            <View style={[styles.badge, { backgroundColor: pColor + '20' }]}>
              <Text style={[styles.badgeText, { color: pColor }]}>{item.priorite}</Text>
            </View>
          </View>
          <Text style={styles.cardDriver}>{driverName} · {date}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={[styles.statutBadge, { backgroundColor: sColor + '20' }]}>
        <View style={[styles.statutDot, { backgroundColor: sColor }]} />
        <Text style={[styles.statutText, { color: sColor }]}>{item.statut.replace('_', ' ')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const FILTERS = ['Tous', 'ouvert', 'en_cours', 'resolu', 'ferme'];

export default function IncidentsScreen() {
  const { incidents, loading } = useIncidents();
  const [filter, setFilter] = useState('Tous');
  const filtered = filter === 'Tous' ? incidents : incidents.filter(i => i.statut === filter);
  const counts = { ouvert: incidents.filter(i=>i.statut==='ouvert').length, en_cours: incidents.filter(i=>i.statut==='en_cours').length };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Incidents</Text>
        {counts.ouvert > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>{counts.ouvert} ouvert{counts.ouvert > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f;
          const color = f === 'Tous' ? C.white : STATUT_COLOR[f] ?? C.gray;
          return (
            <TouchableOpacity key={f} style={[styles.filterChip, active && { backgroundColor: color+'20', borderColor: color }]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, { color: active ? color : C.gray }]}>{f === 'Tous' ? 'Tous' : f.replace('_',' ')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Chargement...</Text></View>
      ) : (
        <FlatList data={filtered} keyExtractor={i => String(i.id)}
          renderItem={({ item }) => <IncidentCard item={item} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="checkmark-circle-outline" size={48} color={C.border} /><Text style={styles.emptyText}>Aucun incident</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:14,paddingBottom:12},
  title:{fontSize:26,fontWeight:'800',color:C.white},
  alertBadge:{backgroundColor:'#F8717120',borderRadius:20,paddingHorizontal:12,paddingVertical:4,borderWidth:1,borderColor:'#F87171'},
  alertText:{color:'#F87171',fontSize:12,fontWeight:'700'},
  filterRow:{flexDirection:'row',gap:6,paddingHorizontal:16,marginBottom:8,flexWrap:'wrap'},
  filterChip:{paddingHorizontal:10,paddingVertical:5,borderRadius:20,borderWidth:1,borderColor:C.border},
  filterText:{fontSize:11,fontWeight:'600'},
  countRow:{paddingHorizontal:16,marginBottom:10},
  countText:{fontSize:12,color:C.gray},
  listContent:{paddingHorizontal:16,paddingBottom:24},
  card:{backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border},
  cardHeader:{flexDirection:'row',gap:12,marginBottom:10},
  iconWrap:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},
  cardInfo:{flex:1},
  cardTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:3},
  cardTitle:{fontSize:14,fontWeight:'700',color:C.white},
  badge:{paddingHorizontal:8,paddingVertical:2,borderRadius:20},
  badgeText:{fontSize:10,fontWeight:'700'},
  cardDriver:{fontSize:12,color:C.gray},
  cardDesc:{fontSize:13,color:'#CCCCCC',lineHeight:18,marginBottom:10},
  statutBadge:{flexDirection:'row',alignItems:'center',gap:6,alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  statutDot:{width:6,height:6,borderRadius:3},
  statutText:{fontSize:11,fontWeight:'600'},
  empty:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:80,gap:12},
  emptyText:{fontSize:14,color:C.gray},
});
