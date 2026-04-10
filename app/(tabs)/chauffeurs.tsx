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
  white:"#FFFFFF",gray:"#888888",lightGray:"#CCCCCC",
  green:"#4ADE80",red:"#F87171",orange:"#FB923C",blue:"#60A5FA",input:"#1A1A1A",
};

type DriverStatus = "Actif" | "En course" | "Hors ligne";
const STATUS_COLOR: Record<string,string> = {
  "Actif":C.green,"En course":C.gold,"Hors ligne":C.gray,
};

interface Driver {
  id: number; nom: string; prenom: string;
  statut: string; telephone?: string; vehicule?: string;
}

function NewDriverModal({ visible, onClose, onSaved }: {
  visible:boolean; onClose:()=>void; onSaved:()=>void;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [vehicule, setVehicule] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setNom(""); setPrenom(""); setTelephone(""); setVehicule(""); setError(""); };

  const handleSave = async () => {
    if (!nom.trim() || !prenom.trim()) { setError("Nom et prénom sont obligatoires."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("drivers").insert({
      nom: nom.trim(), prenom: prenom.trim(),
      telephone: telephone.trim() || null,
      vehicule: vehicule.trim() || null,
      statut: "Actif",
    });
    setSaving(false);
    if (err) { setError("Erreur: " + err.message); return; }
    reset(); onSaved(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>Nouveau chauffeur</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={C.white} />
          </TouchableOpacity>
        </View>
        <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection:"row", gap:12 }}>
            <View style={{ flex:1 }}>
              <Text style={modal.label}>Prénom *</Text>
              <TextInput style={modal.input} value={prenom} onChangeText={setPrenom}
                placeholder="Jean" placeholderTextColor={C.gray} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={modal.label}>Nom *</Text>
              <TextInput style={modal.input} value={nom} onChangeText={setNom}
                placeholder="Dupont" placeholderTextColor={C.gray} />
            </View>
          </View>

          <Text style={modal.label}>Téléphone</Text>
          <TextInput style={modal.input} value={telephone} onChangeText={setTelephone}
            placeholder="+33 6 00 00 00 00" placeholderTextColor={C.gray} keyboardType="phone-pad" />

          <Text style={modal.label}>Véhicule</Text>
          <TextInput style={modal.input} value={vehicule} onChangeText={setVehicule}
            placeholder="Mercedes Vito • AB-123-CD" placeholderTextColor={C.gray} />

          {error ? <Text style={modal.error}>{error}</Text> : null}

          <TouchableOpacity style={modal.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={C.bg} />
              : <Text style={modal.saveBtnText}>Ajouter le chauffeur</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function NewCourseModal({ visible, onClose, onSaved, driverId, driverName }: {
  visible:boolean; onClose:()=>void; onSaved:()=>void;
  driverId:number|null; driverName:string;
}) {
  const [depart, setDepart] = useState("");
  const [arrivee, setArrivee] = useState("");
  const [distance, setDistance] = useState("");
  const [montant, setMontant] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setDepart(""); setArrivee(""); setDistance(""); setMontant(""); setError(""); };

  const handleSave = async () => {
    if (!depart.trim() || !arrivee.trim()) { setError("Départ et arrivée sont obligatoires."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("courses").insert({
      driver_id: driverId,
      date: new Date().toISOString().split("T")[0],
      depart: depart.trim(), arrivee: arrivee.trim(),
      distance_km: distance ? parseFloat(distance) : null,
      montant: montant ? parseFloat(montant) : null,
      statut: "en_cours",
    });
    setSaving(false);
    if (err) { setError("Erreur: " + err.message); return; }
    reset(); onSaved(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>Nouvelle course</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color={C.white} />
          </TouchableOpacity>
        </View>
        <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
          <Text style={modal.label}>Chauffeur</Text>
          <View style={modal.driverTag}>
            <Text style={modal.driverTagText}>{driverName}</Text>
          </View>

          <Text style={modal.label}>Départ *</Text>
          <TextInput style={modal.input} value={depart} onChangeText={setDepart}
            placeholder="Adresse de départ" placeholderTextColor={C.gray} />

          <Text style={modal.label}>Arrivée *</Text>
          <TextInput style={modal.input} value={arrivee} onChangeText={setArrivee}
            placeholder="Adresse d arrivee" placeholderTextColor={C.gray} />

          <View style={{ flexDirection:"row", gap:12 }}>
            <View style={{ flex:1 }}>
              <Text style={modal.label}>Distance (km)</Text>
              <TextInput style={modal.input} value={distance} onChangeText={setDistance}
                placeholder="Ex: 12.5" placeholderTextColor={C.gray} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex:1 }}>
              <Text style={modal.label}>Montant (€)</Text>
              <TextInput style={modal.input} value={montant} onChangeText={setMontant}
                placeholder="Ex: 45" placeholderTextColor={C.gray} keyboardType="decimal-pad" />
            </View>
          </View>

          {error ? <Text style={modal.error}>{error}</Text> : null}

          <TouchableOpacity style={modal.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={C.bg} />
              : <Text style={modal.saveBtnText}>Démarrer la course</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function DriverCard({ item, onNewCourse }: { item: Driver; onNewCourse: (d: Driver) => void }) {
  const statusColor = STATUS_COLOR[item.statut] ?? C.gray;
  const initials = `${(item.prenom||" ")[0]}${(item.nom||" ")[0]}`.toUpperCase();
  return (
    <View style={styles.driverCard}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { borderColor: statusColor+"60" }]}>
          <Text style={styles.avatarText}>{initials}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.driverName}>{item.prenom} {item.nom}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor+"20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.statut}</Text>
            </View>
          </View>
          {item.telephone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={11} color={C.gray} />
              <Text style={styles.zoneText}>{item.telephone}</Text>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${item.telephone}`)}>
                <Ionicons name="call" size={12} color={C.bg} />
                <Text style={styles.callBtnText}>Appeler</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {item.vehicule ? (
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={11} color={C.gray} />
              <Text style={styles.zoneText}>{item.vehicule}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity style={styles.newCourseBtn} onPress={() => onNewCourse(item)}>
        <Ionicons name="add-circle-outline" size={16} color={C.gold} />
        <Text style={styles.newCourseBtnText}>Nouvelle course</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ChauffeursScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver|null>(null);
  const [newDriverModal, setNewDriverModal] = useState(false);

  const loadDrivers = () => {
    setLoading(true);
    supabase.from("drivers").select("*").order("nom")
      .then(({ data }) => {
        setDrivers(data || []);
        setLoading(false);
      });
  };

  useEffect(() => { loadDrivers(); }, []);

  const filtered = drivers.filter(d =>
    search === "" ||
    `${d.prenom} ${d.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    Actif: drivers.filter(d => d.statut === "Actif").length,
    "En course": drivers.filter(d => d.statut === "En course").length,
    "Hors ligne": drivers.filter(d => d.statut === "Hors ligne").length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Chauffeurs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setNewDriverModal(true)}>
          <Ionicons name="add" size={20} color={C.bg} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        {Object.entries(counts).map(([status, count]) => (
          <View key={status} style={[styles.summaryBadge, {
            backgroundColor: (STATUS_COLOR[status]||C.gray)+"15",
            borderColor: (STATUS_COLOR[status]||C.gray)+"40"
          }]}>
            <View style={[styles.summaryDot, { backgroundColor: STATUS_COLOR[status]||C.gray }]} />
            <Text style={[styles.summaryCount, { color: STATUS_COLOR[status]||C.gray }]}>{count}</Text>
            <Text style={styles.summaryLabel}>{status}</Text>
          </View>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={C.gray} style={{ marginRight:8 }} />
        <TextInput style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor={C.gray}
          value={search} onChangeText={setSearch} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={C.gray} />
          </TouchableOpacity>
        )}
      </View>

      {loading
        ? <ActivityIndicator color={C.gold} style={{ marginTop:40 }} />
        : <FlatList
            data={filtered}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <DriverCard item={item} onNewCourse={(d) => { setSelectedDriver(d); setModalVisible(true); }} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height:10 }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="person-outline" size={48} color={C.border} />
                <Text style={styles.emptyText}>Aucun chauffeur</Text>
              </View>
            }
          />
      }

      <NewDriverModal
        visible={newDriverModal}
        onClose={() => setNewDriverModal(false)}
        onSaved={loadDrivers}
      />
      <NewCourseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={loadDrivers}
        driverId={selectedDriver?.id ?? null}
        driverName={selectedDriver ? `${selectedDriver.prenom} ${selectedDriver.nom}` : ""}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:16,paddingTop:14,paddingBottom:12},
  title:{fontSize:26,fontWeight:"800",color:C.white},
  addBtn:{width:36,height:36,borderRadius:10,backgroundColor:C.gold,alignItems:"center",justifyContent:"center"},
  summaryRow:{flexDirection:"row",gap:8,paddingHorizontal:16,marginBottom:12},
  summaryBadge:{flexDirection:"row",alignItems:"center",gap:5,paddingHorizontal:10,paddingVertical:6,borderRadius:20,borderWidth:1,flex:1,justifyContent:"center"},
  summaryDot:{width:6,height:6,borderRadius:3},
  summaryCount:{fontSize:14,fontWeight:"800"},
  summaryLabel:{fontSize:11,color:C.gray},
  searchWrap:{flexDirection:"row",alignItems:"center",backgroundColor:C.input,marginHorizontal:16,borderRadius:12,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderColor:C.border,marginBottom:12},
  searchInput:{flex:1,color:C.white,fontSize:14},
  listContent:{paddingHorizontal:16,paddingBottom:24},
  driverCard:{backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border},
  cardTop:{flexDirection:"row",gap:12,marginBottom:12},
  avatar:{width:50,height:50,borderRadius:25,backgroundColor:"#FFD70015",borderWidth:2,alignItems:"center",justifyContent:"center",position:"relative"},
  avatarText:{fontSize:16,fontWeight:"800",color:C.gold},
  statusIndicator:{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:5,borderWidth:1.5,borderColor:C.card},
  driverInfo:{flex:1},
  nameRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:4},
  driverName:{fontSize:15,fontWeight:"700",color:C.white},
  statusBadge:{paddingHorizontal:8,paddingVertical:2,borderRadius:20},
  statusText:{fontSize:10,fontWeight:"700"},
  infoRow:{flexDirection:"row",alignItems:"center",gap:4,marginTop:2},
  zoneText:{fontSize:11,color:C.gray},
  callBtn:{flexDirection:"row",alignItems:"center",gap:4,backgroundColor:C.green,paddingHorizontal:8,paddingVertical:3,borderRadius:10,marginLeft:"auto"},
  callBtnText:{fontSize:10,fontWeight:"700",color:C.bg},
  newCourseBtn:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,borderTopWidth:1,borderTopColor:C.border,paddingTop:10,marginTop:2},
  newCourseBtnText:{fontSize:13,color:C.gold,fontWeight:"600"},
  empty:{flex:1,alignItems:"center",justifyContent:"center",paddingTop:80,gap:12},
  emptyText:{fontSize:14,color:C.gray},
});

const modal = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:16,borderBottomWidth:1,borderBottomColor:C.border},
  title:{fontSize:20,fontWeight:"800",color:C.white},
  body:{padding:16},
  label:{fontSize:12,fontWeight:"600",color:C.gray,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5},
  input:{backgroundColor:C.input,borderWidth:1,borderColor:C.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,color:C.white,fontSize:14,marginBottom:16},
  driverTag:{backgroundColor:C.gold+"20",borderWidth:1,borderColor:C.gold,borderRadius:12,paddingHorizontal:14,paddingVertical:10,marginBottom:16},
  driverTagText:{color:C.gold,fontSize:14,fontWeight:"700"},
  saveBtn:{backgroundColor:C.gold,borderRadius:14,paddingVertical:16,alignItems:"center",marginBottom:40},
  saveBtnText:{fontSize:16,fontWeight:"800",color:C.bg},
  error:{color:C.red,fontSize:13,marginBottom:12,textAlign:"center"},
});
