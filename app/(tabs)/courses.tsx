import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { supabase } from "../../services/supabase";

const C = {
  bg:"#0A0A0A",card:"#141414",border:"#1E1E1E",gold:"#FFD700",white:"#FFFFFF",
  gray:"#888888",lightGray:"#CCCCCC",green:"#4ADE80",red:"#F87171",
  orange:"#FB923C",blue:"#60A5FA",input:"#1A1A1A",
};

type FilterKey = "Toutes"|"en_cours"|"termine"|"annule";
const FILTERS: FilterKey[] = ["Toutes","en_cours","termine","annule"];
const FILTER_LABELS: Record<FilterKey,string> = { Toutes:"Toutes",en_cours:"En cours",termine:"Terminées",annule:"Annulées" };
const FILTER_COLORS: Record<FilterKey,string> = { Toutes:C.white,en_cours:C.gold,termine:C.green,annule:C.red };

interface Course {
  id:string; driver:string; initials:string;
  from:string; to:string; price:string; status:string; date:string;
}

interface Driver { id:number; nom:string; prenom:string; }

function getMapHtml(depart: string, arrivee: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  body{margin:0;padding:0;background:#0A0A0A;}
  #map{width:100vw;height:calc(100vh - 80px);}
  #info{position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,10,0.95);
    padding:12px 16px;border-top:1px solid #1E1E1E;}
  .lbl{color:#888;font-size:11px;font-family:sans-serif;margin-bottom:2px;}
  .val{color:#fff;font-size:13px;font-family:sans-serif;font-weight:bold;}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;}
</style>
</head>
<body>
<div id="map"></div>
<div id="info">
  <div class="lbl"><span class="dot" style="background:#FFD700"></span>Depart</div>
  <div class="val">${depart}</div>
  <div style="margin-top:6px">
  <div class="lbl"><span class="dot" style="background:#fff"></span>Arrivee</div>
  <div class="val">${arrivee}</div>
  </div>
</div>
<script>
var map=L.map("map").setView([46.2276,2.2137],6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18}).addTo(map);
var gi=L.divIcon({html:'<div style="width:12px;height:12px;border-radius:50%;background:#FFD700;border:2px solid #000"></div>',iconSize:[12,12],iconAnchor:[6,6]});
var wi=L.divIcon({html:'<div style="width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #000"></div>',iconSize:[12,12],iconAnchor:[6,6]});
async function geo(q){
  const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&q="+encodeURIComponent(q)+"&limit=1");
  const d=await r.json();
  return d.length>0?[parseFloat(d[0].lat),parseFloat(d[0].lon)]:null;
}
async function init(){
  const a=await geo("${depart}");
  const b=await geo("${arrivee}");
  if(a)L.marker(a,{icon:gi}).addTo(map);
  if(b)L.marker(b,{icon:wi}).addTo(map);
  if(a&&b){const l=L.polyline([a,b],{color:"#FFD700",weight:3,dashArray:"8,6"}).addTo(map);map.fitBounds(l.getBounds(),{padding:[40,40]});}
  else if(a)map.setView(a,13);
  else if(b)map.setView(b,13);
}
init();
</script>
</body>
</html>`;
}

function MapModal({ visible, onClose, depart, arrivee }: {
  visible:boolean; onClose:()=>void; depart:string; arrivee:string;
}) {
  const html = getMapHtml(depart, arrivee);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:C.bg }}>
        <View style={{ flexDirection:"row",justifyContent:"space-between",alignItems:"center",
          padding:16,borderBottomWidth:1,borderBottomColor:C.border }}>
          <Text style={{ fontSize:18,fontWeight:"800",color:C.white }}>Itinéraire</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={C.white} />
          </TouchableOpacity>
        </View>
        <View style={{ flex:1 }}>
          {Platform.OS === "web" ? (
            <iframe srcDoc={html} style={{ width:"100%",height:"100%",border:"none" } as any} />
          ) : (
            <WebView source={{ html }} style={{ flex:1 }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

function CourseCard({ item, onAction, onMap }: {
  item:Course;
  onAction:(id:string,statut:string)=>void;
  onMap:()=>void;
}) {
  const colorMap: Record<string,string> = { en_cours:C.gold,termine:C.green,annule:C.red };
  const labelMap: Record<string,string> = { en_cours:"En cours",termine:"Terminée",annule:"Annulée" };
  const color = colorMap[item.status] ?? C.gray;
  return (
    <View style={styles.courseCard}>
      <View style={styles.cardHeader}>
        <View style={styles.driverRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.initials}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{item.driver}</Text>
            <Text style={styles.courseDateTime}>{item.date}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.price}>{item.price}</Text>
          <View style={[styles.statusBadge,{backgroundColor:color+"20"}]}>
            <View style={[styles.statusDot,{backgroundColor:color}]}/>
            <Text style={[styles.statusText,{color}]}>{labelMap[item.status]??item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeLine}>
          <View style={styles.dotGold}/>
          <View style={styles.routeVertLine}/>
          <View style={styles.dotWhite}/>
        </View>
        <View style={styles.routeLabels}>
          <Text style={styles.routePoint} numberOfLines={1}>{item.from}</Text>
          <Text style={styles.routePoint} numberOfLines={1}>{item.to}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnCarte} onPress={onMap}>
        <Ionicons name="map-outline" size={13} color={C.blue}/>
        <Text style={styles.btnCarteText}>Voir la carte</Text>
      </TouchableOpacity>

      {item.status === "en_cours" && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnTerminer} onPress={()=>onAction(item.id,"termine")}>
            <Text style={styles.btnTerminerText}>✓ Terminer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAnnuler} onPress={()=>onAction(item.id,"annule")}>
            <Text style={styles.btnAnnulerText}>✕ Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function NewCourseModal({ visible, onClose, onSaved, drivers }: {
  visible:boolean; onClose:()=>void; onSaved:()=>void; drivers:Driver[];
}) {
  const [depart,setDepart] = useState("");
  const [arrivee,setArrivee] = useState("");
  const [distance,setDistance] = useState("");
  const [montant,setMontant] = useState("");
  const [statut,setStatut] = useState("en_cours");
  const [driverId,setDriverId] = useState<number|null>(null);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");

  useEffect(()=>{ if(drivers.length>0&&driverId===null)setDriverId(drivers[0].id); },[drivers]);

  const reset=()=>{ setDepart("");setArrivee("");setDistance("");setMontant("");setStatut("en_cours");setError("");if(drivers.length>0)setDriverId(drivers[0].id); };

  const handleSave=async()=>{
    if(!depart.trim()||!arrivee.trim()){setError("Départ et arrivée sont obligatoires.");return;}
    setSaving(true);
    const{error:err}=await supabase.from("courses").insert({
      driver_id:driverId,date:new Date().toISOString().split("T")[0],
      depart:depart.trim(),arrivee:arrivee.trim(),
      distance_km:distance?parseFloat(distance):null,
      montant:montant?parseFloat(montant):null,statut,
    });
    setSaving(false);
    if(err){setError("Erreur: "+err.message);return;}
    reset();onSaved();onClose();
  };

  const statutOptions=[
    {val:"en_cours",label:"En cours",color:C.gold},
    {val:"termine",label:"Terminée",color:C.green},
    {val:"annule",label:"Annulée",color:C.red},
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>Nouvelle course</Text>
          <TouchableOpacity onPress={()=>{reset();onClose();}}>
            <Ionicons name="close" size={24} color={C.white}/>
          </TouchableOpacity>
        </View>
        <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
          <Text style={modal.label}>Chauffeur</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
            {drivers.map(d=>{
              const active=driverId===d.id;
              return(
                <TouchableOpacity key={d.id}
                  style={[modal.driverChip,active&&{backgroundColor:C.gold+"20",borderColor:C.gold}]}
                  onPress={()=>setDriverId(d.id)}>
                  <Text style={[modal.driverChipText,{color:active?C.gold:C.gray}]}>{d.prenom} {d.nom}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={modal.label}>Départ *</Text>
          <TextInput style={modal.input} value={depart} onChangeText={setDepart}
            placeholder="Adresse de départ" placeholderTextColor={C.gray}/>

          <Text style={modal.label}>Arrivée *</Text>
          <TextInput style={modal.input} value={arrivee} onChangeText={setArrivee}
            placeholder="Adresse d arrivee" placeholderTextColor={C.gray}/>

          <View style={{flexDirection:"row",gap:12}}>
            <View style={{flex:1}}>
              <Text style={modal.label}>Distance (km)</Text>
              <TextInput style={modal.input} value={distance} onChangeText={setDistance}
                placeholder="Ex: 12.5" placeholderTextColor={C.gray} keyboardType="decimal-pad"/>
            </View>
            <View style={{flex:1}}>
              <Text style={modal.label}>Montant (€)</Text>
              <TextInput style={modal.input} value={montant} onChangeText={setMontant}
                placeholder="Ex: 45" placeholderTextColor={C.gray} keyboardType="decimal-pad"/>
            </View>
          </View>

          <Text style={modal.label}>Statut</Text>
          <View style={{flexDirection:"row",gap:8,marginBottom:24}}>
            {statutOptions.map(s=>{
              const active=statut===s.val;
              return(
                <TouchableOpacity key={s.val}
                  style={[modal.statutChip,active&&{backgroundColor:s.color+"20",borderColor:s.color}]}
                  onPress={()=>setStatut(s.val)}>
                  <Text style={[modal.statutText,{color:active?s.color:C.gray}]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error?<Text style={modal.error}>{error}</Text>:null}

          <TouchableOpacity style={modal.saveBtn} onPress={handleSave} disabled={saving}>
            {saving?<ActivityIndicator color={C.bg}/>
              :<Text style={modal.saveBtnText}>Enregistrer la course</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function useCourses() {
  const [courses,setCourses] = useState<Course[]>([]);
  const [loading,setLoading] = useState(true);
  const load=()=>{
    setLoading(true);
    supabase.from("courses").select("*, drivers(nom, prenom)")
      .order("created_at",{ascending:false})
      .then(({data,error})=>{
        if(!error&&data){
          setCourses(data.map((c:any)=>({
            id:String(c.id),
            driver:c.drivers?`${c.drivers.prenom} ${c.drivers.nom}`.trim():"Chauffeur",
            initials:c.drivers?`${(c.drivers.prenom||" ")[0]}${(c.drivers.nom||" ")[0]}`.toUpperCase():"??",
            from:c.depart||"",to:c.arrivee||"",
            price:c.montant?`${c.montant} €`:"—",
            status:c.statut||"termine",date:c.date||"",
          })));
        }
        setLoading(false);
      });
  };
  useEffect(()=>{load();},[]);
  return{courses,loading,reload:load};
}

export default function CoursesScreen() {
  const{courses,loading,reload}=useCourses();
  const[filter,setFilter]=useState<FilterKey>("Toutes");
  const[search,setSearch]=useState("");
  const[modalVisible,setModalVisible]=useState(false);
  const[mapCourse,setMapCourse]=useState<Course|null>(null);
  const[drivers,setDrivers]=useState<Driver[]>([]);

  useEffect(()=>{
    supabase.from("drivers").select("id, nom, prenom")
      .then(({data})=>{if(data)setDrivers(data);});
  },[]);

  const updateStatut=async(id:string,statut:string)=>{
    await supabase.from("courses").update({statut}).eq("id",id);
    reload();
  };

  const filtered=courses.filter(c=>{
    const matchFilter=filter==="Toutes"||c.status===filter;
    const matchSearch=search===""||
      c.driver.toLowerCase().includes(search.toLowerCase())||
      c.from.toLowerCase().includes(search.toLowerCase())||
      c.to.toLowerCase().includes(search.toLowerCase());
    return matchFilter&&matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={()=>setModalVisible(true)}>
          <Ionicons name="add" size={20} color={C.bg}/>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={C.gray} style={{marginRight:8}}/>
        <TextInput style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor={C.gray}
          value={search} onChangeText={setSearch}/>
        {search.length>0&&(
          <TouchableOpacity onPress={()=>setSearch("")}>
            <Ionicons name="close-circle" size={16} color={C.gray}/>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f=>{
          const active=filter===f;
          const fc=FILTER_COLORS[f];
          return(
            <TouchableOpacity key={f}
              style={[styles.filterChip,active&&{backgroundColor:fc+"20",borderColor:fc}]}
              onPress={()=>setFilter(f)}>
              <Text style={[styles.filterText,{color:active?fc:C.gray}]}>{FILTER_LABELS[f]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} course{filtered.length!==1?"s":""}</Text>
      </View>

      {loading
        ?<ActivityIndicator color={C.gold} style={{marginTop:40}}/>
        :<FlatList
          data={filtered}
          keyExtractor={item=>item.id}
          renderItem={({item})=>(
            <CourseCard item={item} onAction={updateStatut} onMap={()=>setMapCourse(item)}/>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={()=><View style={{height:10}}/>}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={48} color={C.border}/>
              <Text style={styles.emptyText}>Aucune course</Text>
            </View>
          }
        />
      }

      {mapCourse&&(
        <MapModal
          visible={!!mapCourse}
          onClose={()=>setMapCourse(null)}
          depart={mapCourse.from}
          arrivee={mapCourse.to}
        />
      )}

      <NewCourseModal
        visible={modalVisible}
        onClose={()=>setModalVisible(false)}
        onSaved={reload}
        drivers={drivers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:16,paddingTop:14,paddingBottom:12},
  title:{fontSize:26,fontWeight:"800",color:C.white},
  addBtn:{width:36,height:36,borderRadius:10,backgroundColor:C.gold,alignItems:"center",justifyContent:"center"},
  searchWrap:{flexDirection:"row",alignItems:"center",backgroundColor:C.input,marginHorizontal:16,borderRadius:12,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderColor:C.border,marginBottom:12},
  searchInput:{flex:1,color:C.white,fontSize:14},
  filterRow:{flexDirection:"row",gap:8,paddingHorizontal:16,marginBottom:8},
  filterChip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,borderWidth:1,borderColor:C.border},
  filterText:{fontSize:12,fontWeight:"600"},
  countRow:{paddingHorizontal:16,marginBottom:10},
  countText:{fontSize:12,color:C.gray},
  listContent:{paddingHorizontal:16,paddingBottom:24},
  courseCard:{backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border},
  cardHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14},
  driverRow:{flexDirection:"row",alignItems:"center",gap:10},
  avatar:{width:38,height:38,borderRadius:19,backgroundColor:"#FFD70022",borderWidth:1,borderColor:"#FFD70055",alignItems:"center",justifyContent:"center"},
  avatarText:{fontSize:13,fontWeight:"700",color:C.gold},
  driverName:{fontSize:14,fontWeight:"700",color:C.white},
  courseDateTime:{fontSize:11,color:C.gray,marginTop:2},
  price:{fontSize:16,fontWeight:"800",color:C.gold,textAlign:"right",marginBottom:4},
  statusBadge:{flexDirection:"row",alignItems:"center",gap:4,paddingHorizontal:8,paddingVertical:3,borderRadius:20},
  statusDot:{width:5,height:5,borderRadius:3},
  statusText:{fontSize:10,fontWeight:"600"},
  routeContainer:{flexDirection:"row",marginBottom:12},
  routeLine:{width:20,alignItems:"center",marginRight:10,gap:2},
  dotGold:{width:8,height:8,borderRadius:4,backgroundColor:C.gold},
  routeVertLine:{width:1,flex:1,backgroundColor:C.border,marginVertical:2},
  dotWhite:{width:8,height:8,borderRadius:4,borderWidth:2,borderColor:C.white},
  routeLabels:{flex:1,justifyContent:"space-between",gap:6},
  routePoint:{fontSize:13,color:C.lightGray},
  btnCarte:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,paddingVertical:8,borderRadius:10,borderWidth:1,borderColor:C.blue,backgroundColor:C.blue+"15",marginBottom:8},
  btnCarteText:{fontSize:12,color:C.blue,fontWeight:"600"},
  actionRow:{flexDirection:"row",gap:8},
  btnTerminer:{flex:1,backgroundColor:"#4ADE8020",borderWidth:1,borderColor:"#4ADE80",borderRadius:10,paddingVertical:8,alignItems:"center"},
  btnTerminerText:{color:"#4ADE80",fontSize:12,fontWeight:"700"},
  btnAnnuler:{flex:1,backgroundColor:"#F8717120",borderWidth:1,borderColor:"#F87171",borderRadius:10,paddingVertical:8,alignItems:"center"},
  btnAnnulerText:{color:"#F87171",fontSize:12,fontWeight:"700"},
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
  driverChip:{paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:C.border,marginRight:8},
  driverChipText:{fontSize:13,fontWeight:"600"},
  statutChip:{flex:1,paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:C.border,alignItems:"center"},
  statutText:{fontSize:12,fontWeight:"700"},
  saveBtn:{backgroundColor:C.gold,borderRadius:14,paddingVertical:16,alignItems:"center",marginBottom:40},
  saveBtnText:{fontSize:16,fontWeight:"800",color:C.bg},
  error:{color:C.red,fontSize:13,marginBottom:12,textAlign:"center"},
});
