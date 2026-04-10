import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../services/supabase";

const C = {
  bg:"#0A0A0A",card:"#141414",border:"#1E1E1E",gold:"#FFD700",
  white:"#FFFFFF",gray:"#888888",green:"#4ADE80",red:"#F87171",
  orange:"#FB923C",blue:"#60A5FA",input:"#1A1A1A",
};

const TYPE_CONFIG: Record<string,{label:string;color:string;icon:string}> = {
  reclamation:{label:"Réclamation",color:C.blue,icon:"chatbubble-outline"},
  accident:{label:"Accident",color:C.red,icon:"car-outline"},
  panne:{label:"Panne",color:C.orange,icon:"construct-outline"},
  objet_perdu:{label:"Objet perdu",color:C.gold,icon:"bag-outline"},
  annulation:{label:"Annulation",color:C.gray,icon:"close-circle-outline"},
};

const PRIORITE_COLOR: Record<string,string> = {
  faible:C.blue, normale:C.gold, haute:C.orange, urgente:C.red,
};

const STATUT_COLOR: Record<string,string> = {
  ouvert:C.red, en_cours:C.gold, resolu:C.green, ferme:C.gray,
};

function NewIncidentModal({ visible, onClose, onSaved, drivers }: {
  visible:boolean; onClose:()=>void; onSaved:()=>void; drivers:any[];
}) {
  const [type, setType] = useState("reclamation");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState("normale");
  const [driverId, setDriverId] = useState<number|null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setType("reclamation"); setDescription(""); setPriorite("normale"); setError(""); setDriverId(null); };

  const handleSave = async () => {
    if (!description.trim()) { setError("La description est obligatoire."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("incidents").insert({
      driver_id: driverId || null,
      type_incident: type,
      description: description.trim(),
      priorite,
      statut: "ouvert",
    });
    setSaving(false);
    if (err) { setError("Erreur: " + err.message); return; }
    reset(); onSaved(); onClose();
  };

  const types = [
    { val:"reclamation", label:"Réclamation" },
    { val:"accident", label:"Accident" },
    { val:"panne", label:"Panne" },
    { val:"objet_perdu", label:"Objet perdu" },
    { val:"annulation", label:"Annulation" },
  ];

  const priorites = [
    { val:"faible", label:"Faible", color:C.blue },
    { val:"normale", label:"Normale", color:C.gold },
    { val:"haute", label:"Haute", color:C.orange },
    { val:"urgente", label:"Urgente", color:C.red },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:C.bg }}>
        <View style={{ flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:16,borderBottomWidth:1,borderBottomColor:C.border }}>
          <Text style={{ fontSize:20,fontWeight:"800",color:C.white }}>Nouvel incident</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={C.white} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ padding:16 }} showsVerticalScrollIndicator={false}>

          <Text style={s.label}>Type</Text>
          <View style={{ flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:16 }}>
            {types.map(t => (
              <TouchableOpacity key={t.val}
                style={{ paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,
                  borderColor:type===t.val?C.gold:C.border,
                  backgroundColor:type===t.val?C.gold+"20":"transparent" }}
                onPress={() => setType(t.val)}>
                <Text style={{ fontSize:12,fontWeight:"600",color:type===t.val?C.gold:C.gray }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Chauffeur concerné</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:16 }}>
            <TouchableOpacity
              style={{ paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,marginRight:8,
                borderColor:driverId===null?C.gold:C.border,backgroundColor:driverId===null?C.gold+"20":"transparent" }}
              onPress={() => setDriverId(null)}>
              <Text style={{ fontSize:12,fontWeight:"600",color:driverId===null?C.gold:C.gray }}>Aucun</Text>
            </TouchableOpacity>
            {drivers.map(d => (
              <TouchableOpacity key={d.id}
                style={{ paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,marginRight:8,
                  borderColor:driverId===d.id?C.gold:C.border,backgroundColor:driverId===d.id?C.gold+"20":"transparent" }}
                onPress={() => setDriverId(d.id)}>
                <Text style={{ fontSize:12,fontWeight:"600",color:driverId===d.id?C.gold:C.gray }}>{d.prenom} {d.nom}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>Description *</Text>
          <TextInput
            style={{ backgroundColor:C.input,borderWidth:1,borderColor:C.border,borderRadius:12,
              paddingHorizontal:14,paddingVertical:12,color:C.white,fontSize:14,marginBottom:16,
              height:100,textAlignVertical:"top" }}
            value={description} onChangeText={setDescription}
            placeholder="Decrivez l incident..." placeholderTextColor={C.gray}
            multiline numberOfLines={4} />

          <Text style={s.label}>Priorité</Text>
          <View style={{ flexDirection:"row",gap:8,marginBottom:24 }}>
            {priorites.map(p => (
              <TouchableOpacity key={p.val} style={{ flex:1,paddingVertical:10,borderRadius:12,borderWidth:1,alignItems:"center",
                borderColor:priorite===p.val?p.color:C.border,backgroundColor:priorite===p.val?p.color+"20":"transparent" }}
                onPress={() => setPriorite(p.val)}>
                <Text style={{ fontSize:11,fontWeight:"700",color:priorite===p.val?p.color:C.gray }}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={{ color:C.red,fontSize:13,marginBottom:12,textAlign:"center" }}>{error}</Text> : null}

          <TouchableOpacity
            style={{ backgroundColor:C.gold,borderRadius:14,paddingVertical:16,alignItems:"center",marginBottom:40 }}
            onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={C.bg} />
              : <Text style={{ fontSize:16,fontWeight:"800",color:C.bg }}>Enregistrer</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function IncidentCard({ item }: { item:any }) {
  const tc = TYPE_CONFIG[item.type_incident] ?? { label:item.type_incident,color:C.gray,icon:"alert-outline" };
  const pc = PRIORITE_COLOR[item.priorite] ?? C.gray;
  const sc = STATUT_COLOR[item.statut] ?? C.gray;
  const statutLabel: Record<string,string> = { ouvert:"Ouvert",en_cours:"En cours",resolu:"Résolu",ferme:"Fermé" };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor:tc.color+"20" }]}>
          <Ionicons name={tc.icon as any} size={20} color={tc.color} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{tc.label}</Text>
            <View style={[styles.badge, { backgroundColor:pc+"20" }]}>
              <Text style={[styles.badgeText, { color:pc }]}>{item.priorite}</Text>
            </View>
          </View>
          {item.drivers && (
            <Text style={styles.cardDriver}>{item.drivers.prenom} {item.drivers.nom}</Text>
          )}
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={[styles.statutBadge, { backgroundColor:sc+"20" }]}>
        <View style={[styles.statutDot, { backgroundColor:sc }]} />
        <Text style={[styles.statutText, { color:sc }]}>{statutLabel[item.statut] ?? item.statut}</Text>
      </View>
    </View>
  );
}

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");
  const [modalVisible, setModalVisible] = useState(false);

  const loadIncidents = () => {
    setLoading(true);
    supabase.from("incidents").select("*, drivers(nom, prenom)")
      .order("created_at", { ascending:false })
      .then(({ data }) => { setIncidents(data || []); setLoading(false); });
  };

  useEffect(() => {
    loadIncidents();
    supabase.from("drivers").select("id, nom, prenom")
      .then(({ data }) => { setDrivers(data || []); });
  }, []);

  const FILTERS = [
    { val:"tous", label:"Tous" },
    { val:"ouvert", label:"Ouverts" },
    { val:"en_cours", label:"En cours" },
    { val:"resolu", label:"Résolus" },
  ];

  const filtered = filter === "tous" ? incidents : incidents.filter(i => i.statut === filter);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Incidents</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color={C.bg} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f.val;
          const color = STATUT_COLOR[f.val] ?? C.white;
          return (
            <TouchableOpacity key={f.val}
              style={[styles.filterChip, active && { backgroundColor:color+"20", borderColor:color }]}
              onPress={() => setFilter(f.val)}>
              <Text style={[styles.filterText, { color:active?color:C.gray }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} incident{filtered.length !== 1 ? "s" : ""}</Text>
      </View>

      {loading
        ? <ActivityIndicator color={C.gold} style={{ marginTop:40 }} />
        : <FlatList
            data={filtered}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => <IncidentCard item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height:10 }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="shield-checkmark-outline" size={48} color={C.border} />
                <Text style={styles.emptyText}>Aucun incident</Text>
              </View>
            }
          />
      }

      <NewIncidentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={loadIncidents}
        drivers={drivers}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  label:{ fontSize:12,fontWeight:"600",color:"#888888",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5 },
});

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:16,paddingTop:14,paddingBottom:12},
  title:{fontSize:26,fontWeight:"800",color:C.white},
  addBtn:{width:36,height:36,borderRadius:10,backgroundColor:C.gold,alignItems:"center",justifyContent:"center"},
  filterRow:{flexDirection:"row",gap:8,paddingHorizontal:16,marginBottom:8},
  filterChip:{paddingHorizontal:10,paddingVertical:5,borderRadius:20,borderWidth:1,borderColor:C.border},
  filterText:{fontSize:11,fontWeight:"600"},
  countRow:{paddingHorizontal:16,marginBottom:10},
  countText:{fontSize:12,color:C.gray},
  listContent:{paddingHorizontal:16,paddingBottom:24},
  card:{backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border},
  cardHeader:{flexDirection:"row",gap:12,marginBottom:10},
  iconWrap:{width:42,height:42,borderRadius:12,alignItems:"center",justifyContent:"center"},
  cardInfo:{flex:1},
  cardTitleRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:3},
  cardTitle:{fontSize:14,fontWeight:"700",color:C.white},
  badge:{paddingHorizontal:8,paddingVertical:2,borderRadius:20},
  badgeText:{fontSize:10,fontWeight:"700"},
  cardDriver:{fontSize:12,color:C.gray},
  cardDesc:{fontSize:13,color:"#CCCCCC",lineHeight:18,marginBottom:10},
  statutBadge:{flexDirection:"row",alignItems:"center",gap:6,alignSelf:"flex-start",paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  statutDot:{width:6,height:6,borderRadius:3},
  statutText:{fontSize:11,fontWeight:"600"},
  empty:{flex:1,alignItems:"center",justifyContent:"center",paddingTop:80,gap:12},
  emptyText:{fontSize:14,color:C.gray},
});
