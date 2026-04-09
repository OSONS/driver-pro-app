import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

const C = { bg:'#0A0A0A',card:'#141414',border:'#1E1E1E',gold:'#FFD700',white:'#FFFFFF',gray:'#888888',lightGray:'#CCCCCC',green:'#4ADE80',red:'#F87171',orange:'#FB923C',blue:'#60A5FA',input:'#1A1A1A' };
type FilterKey='Toutes'|'En cours'|'Terminées'|'Annulées';
const FILTERS:FilterKey[]=['Toutes','En cours','Terminées','Annulées'];
const FILTER_COLORS:Record<FilterKey,string>={'Toutes':C.white,'En cours':C.gold,'Terminées':C.green,'Annulées':C.red};
const STATUT_MAP:Record<string,FilterKey>={'en_cours':'En cours','en cours':'En cours','termine':'Terminées','terminé':'Terminées','annule':'Annulées','annulé':'Annulées'};
interface Course{id:string;driver:string;initials:string;from:string;to:string;price:string;status:FilterKey;date:string;time:string;distance:string;duration:string}

function useCourses(){
  const [courses,setCourses]=useState<Course[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.from('courses').select('*, drivers(nom, prenom)').order('created_at',{ascending:false}).then(({data,error})=>{
      if(!error&&data){
        setCourses(data.map((c:any)=>{
          const prenom=c.drivers?.prenom??''  ;
          const nom=c.drivers?.nom??''  ;
          const fullName=`${prenom} ${nom}`.trim()||'Chauffeur';
          const initials=`${(prenom[0]??' ')}${(nom[0]??' ')}`.toUpperCase();
          const rawDate=c.date?new Date(c.date):new Date(c.created_at);
          const today=new Date();
          const isToday=rawDate.toDateString()===today.toDateString();
          const dateStr=isToday?"Aujourd'hui":rawDate.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
          const timeStr=new Date(c.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
          const statut=STATUT_MAP[c.statut?.toLowerCase()]??'Terminées';
          return{id:String(c.id),driver:fullName,initials,from:c.depart??'',to:c.arrivee??'',price:c.montant?`${c.montant} €`:'—',status:statut,date:dateStr,time:timeStr,distance:c.distance_km?`${c.distance_km} km`:'—',duration:'—'};
        }));
      }
      setLoading(false);
    });
  },[]);
  return{courses,loading};
}

const STATUS_COLOR:Record<string,string>={'En cours':C.gold,'Terminées':C.green,'Annulées':C.red,'Toutes':C.white};

function CourseCard({item}:{item:Course}){
  const color=STATUS_COLOR[item.status]??C.gray;
  return(
    <TouchableOpacity style={styles.courseCard} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <View style={styles.driverRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.initials}</Text></View>
          <View><Text style={styles.driverName}>{item.driver}</Text><Text style={styles.courseDateTime}>{item.date} · {item.time}</Text></View>
        </View>
        <View>
          <Text style={styles.price}>{item.price}</Text>
          <View style={[styles.statusBadge,{backgroundColor:color+'20'}]}>
            <View style={[styles.statusDot,{backgroundColor:color}]}/>
            <Text style={[styles.statusText,{color}]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.routeContainer}>
        <View style={styles.routeLine}><View style={styles.dotGold}/><View style={styles.routeVertLine}/><View style={styles.dotWhite}/></View>
        <View style={styles.routeLabels}><Text style={styles.routePoint} numberOfLines={1}>{item.from}</Text><Text style={styles.routePoint} numberOfLines={1}>{item.to}</Text></View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}><Ionicons name="navigate-outline" size={12} color={C.gray}/><Text style={styles.footerText}>{item.distance}</Text></View>
        <View style={styles.footerItem}><Ionicons name="time-outline" size={12} color={C.gray}/><Text style={styles.footerText}>{item.duration}</Text></View>
        <TouchableOpacity style={styles.detailBtn}><Text style={styles.detailBtnText}>Détails</Text><Ionicons name="chevron-forward" size={12} color={C.gold}/></TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function CoursesScreen(){
  const {courses,loading}=useCourses();
  const [filter,setFilter]=useState<FilterKey>('Toutes');
  const [search,setSearch]=useState('');
  const filtered=courses.filter(c=>{
    const matchFilter=filter==='Toutes'||c.status===filter;
    const matchSearch=search===''||c.driver.toLowerCase().includes(search.toLowerCase())||c.from.toLowerCase().includes(search.toLowerCase())||c.to.toLowerCase().includes(search.toLowerCase());
    return matchFilter&&matchSearch;
  });
  return(
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>Courses</Text><TouchableOpacity style={styles.addBtn}><Ionicons name="add" size={20} color={C.bg}/></TouchableOpacity></View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={C.gray} style={{marginRight:8}}/>
        <TextInput style={styles.searchInput} placeholder="Rechercher une course..." placeholderTextColor={C.gray} value={search} onChangeText={setSearch}/>
        {search.length>0&&<TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={16} color={C.gray}/></TouchableOpacity>}
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map(f=>{
          const active=filter===f; const fc=FILTER_COLORS[f];
          return(<TouchableOpacity key={f} style={[styles.filterChip,active&&{backgroundColor:fc+'20',borderColor:fc}]} onPress={()=>setFilter(f)}><Text style={[styles.filterText,{color:active?fc:C.gray}]}>{f}</Text></TouchableOpacity>);
        })}
      </View>
      <View style={styles.countRow}><Text style={styles.countText}>{filtered.length} course{filtered.length!==1?'s':''}</Text></View>
      {loading?(<View style={styles.empty}><Text style={styles.emptyText}>Chargement...</Text></View>):(
        <FlatList data={filtered} keyExtractor={item=>item.id} renderItem={({item})=><CourseCard item={item}/>}
          contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={()=><View style={{height:10}}/>}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="car-outline" size={48} color={C.border}/><Text style={styles.emptyText}>Aucune course</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingTop:14,paddingBottom:12},
  title:{fontSize:26,fontWeight:'800',color:C.white},
  addBtn:{width:36,height:36,borderRadius:10,backgroundColor:C.gold,alignItems:'center',justifyContent:'center'},
  searchWrap:{flexDirection:'row',alignItems:'center',backgroundColor:C.input,marginHorizontal:16,borderRadius:12,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderColor:C.border,marginBottom:12},
  searchInput:{flex:1,color:C.white,fontSize:14},
  filterRow:{flexDirection:'row',gap:8,paddingHorizontal:16,marginBottom:8},
  filterChip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,borderWidth:1,borderColor:C.border},
  filterText:{fontSize:12,fontWeight:'600'},
  countRow:{paddingHorizontal:16,marginBottom:10},
  countText:{fontSize:12,color:C.gray},
  listContent:{paddingHorizontal:16,paddingBottom:24},
  courseCard:{backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border},
  cardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14},
  driverRow:{flexDirection:'row',alignItems:'center',gap:10},
  avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#FFD70022',borderWidth:1,borderColor:'#FFD70055',alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:13,fontWeight:'700',color:C.gold},
  driverName:{fontSize:14,fontWeight:'700',color:C.white},
  courseDateTime:{fontSize:11,color:C.gray,marginTop:2},
  price:{fontSize:16,fontWeight:'800',color:C.gold,textAlign:'right',marginBottom:4},
  statusBadge:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:3,borderRadius:20},
  statusDot:{width:5,height:5,borderRadius:3},
  statusText:{fontSize:10,fontWeight:'600'},
  routeContainer:{flexDirection:'row',marginBottom:12},
  routeLine:{width:20,alignItems:'center',marginRight:10,gap:2},
  dotGold:{width:8,height:8,borderRadius:4,backgroundColor:C.gold},
  routeVertLine:{width:1,flex:1,backgroundColor:C.border,marginVertical:2},
  dotWhite:{width:8,height:8,borderRadius:4,borderWidth:2,borderColor:C.white},
  routeLabels:{flex:1,justifyContent:'space-between',gap:6},
  routePoint:{fontSize:13,color:C.lightGray},
  cardFooter:{flexDirection:'row',alignItems:'center',gap:14,borderTopWidth:1,borderTopColor:C.border,paddingTop:10},
  footerItem:{flexDirection:'row',alignItems:'center',gap:4},
  footerText:{fontSize:12,color:C.gray},
  detailBtn:{flexDirection:'row',alignItems:'center',gap:2,marginLeft:'auto'},
  detailBtnText:{fontSize:12,color:C.gold,fontWeight:'600'},
  empty:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:80,gap:12},
  emptyText:{fontSize:14,color:C.gray},
});
