import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

const C = { bg:'#0A0A0A',card:'#141414',border:'#1E1E1E',gold:'#FFD700',white:'#FFFFFF',gray:'#888888',lightGray:'#CCCCCC',green:'#4ADE80',red:'#F87171',orange:'#FB923C',blue:'#60A5FA',input:'#1A1A1A' };
type DriverStatus = 'Actif' | 'En course' | 'Hors ligne';
const STATUS_COLOR: Record<DriverStatus,string> = { 'Actif':C.green,'En course':C.gold,'Hors ligne':C.gray };
interface Driver { id:string;name:string;initials:string;status:DriverStatus;phone:string;vehicle:string;rating:number;coursesToday:number;revenueToday:string;totalCourses:number;zone:string }

function useDrivers() {
  const [drivers,setDrivers] = useState<Driver[]>([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    supabase.from('drivers').select('*').then(({data,error})=>{
      if(!error&&data){
        setDrivers(data.map((d:any)=>({
          id:String(d.id),
          name:`${d.prenom??''} ${d.nom??''}`.trim(),
          initials:`${(d.prenom??' ')[0]}${(d.nom??' ')[0]}`.toUpperCase(),
          status:(d.statut as DriverStatus)??'Hors ligne',
          phone:d.telephone??''  ,
          vehicle:d.vehicule??`${d.type??''} • ${d.contrat??''}`,
          rating:d.note??4.5,
          coursesToday:d.courses_today??0,
          revenueToday:d.revenue_today?`${d.revenue_today} €`:'0 €',
          totalCourses:d.total_courses??0,
          zone:d.zone??''
        })));
      }
      setLoading(false);
    });
  },[]);
  return {drivers,loading};
}

function StarRating({rating}:{rating:number}){
  return(<View style={styles.ratingRow}><Ionicons name="star" size={12} color={C.gold}/><Text style={styles.ratingText}>{rating.toFixed(1)}</Text></View>);
}

function DriverCard({item,onPress}:{item:Driver;onPress:()=>void}){
  const statusColor=STATUS_COLOR[item.status]??C.gray;
  return(
    <TouchableOpacity style={styles.driverCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar,{borderColor:statusColor+'60'}]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
          <View style={[styles.statusIndicator,{backgroundColor:statusColor}]}/>
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.driverName}>{item.name}</Text>
            <View style={[styles.statusBadge,{backgroundColor:statusColor+'20'}]}>
              <Text style={[styles.statusText,{color:statusColor}]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.vehicleText} numberOfLines={1}>{item.vehicle}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={11} color={C.gray}/>
            <Text style={styles.zoneText}>{item.zone}</Text>
            <StarRating rating={item.rating}/>
          </View>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statValue}>{item.coursesToday}</Text><Text style={styles.statLabel}>{"Courses\naujourd'hui"}</Text></View>
        <View style={styles.statDivider}/>
        <View style={styles.statItem}><Text style={[styles.statValue,{color:C.gold}]}>{item.revenueToday}</Text><Text style={styles.statLabel}>{"Revenus\naujourd'hui"}</Text></View>
        <View style={styles.statDivider}/>
        <View style={styles.statItem}><Text style={styles.statValue}>{item.totalCourses.toLocaleString('fr-FR')}</Text><Text style={styles.statLabel}>{"Courses\ntotales"}</Text></View>
      </View>
    </TouchableOpacity>
  );
}

const STATUS_FILTERS=['Tous','Actif','En course','Hors ligne'] as const;
type StatusFilter=typeof STATUS_FILTERS[number];

export default function ChauffeursScreen(){
  const {drivers,loading}=useDrivers();
  const [search,setSearch]=useState('');
  const [statusFilter,setStatusFilter]=useState<StatusFilter>('Tous');
  const filtered=drivers.filter(d=>{
    const matchStatus=statusFilter==='Tous'||d.status===statusFilter;
    const matchSearch=search===''||d.name.toLowerCase().includes(search.toLowerCase())||d.zone.toLowerCase().includes(search.toLowerCase());
    return matchStatus&&matchSearch;
  });
  const counts={ Actif:drivers.filter(d=>d.status==='Actif').length,'En course':drivers.filter(d=>d.status==='En course').length,'Hors ligne':drivers.filter(d=>d.status==='Hors ligne').length };
  return(
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>Chauffeurs</Text><TouchableOpacity style={styles.addBtn}><Ionicons name="add" size={20} color={C.bg}/></TouchableOpacity></View>
      <View style={styles.summaryRow}>
        {Object.entries(counts).map(([status,count])=>(
          <View key={status} style={[styles.summaryBadge,{backgroundColor:STATUS_COLOR[status as DriverStatus]+'15',borderColor:STATUS_COLOR[status as DriverStatus]+'40'}]}>
            <View style={[styles.summaryDot,{backgroundColor:STATUS_COLOR[status as DriverStatus]}]}/>
            <Text style={[styles.summaryCount,{color:STATUS_COLOR[status as DriverStatus]}]}>{count}</Text>
            <Text style={styles.summaryLabel}>{status}</Text>
          </View>
        ))}
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={C.gray} style={{marginRight:8}}/>
        <TextInput style={styles.searchInput} placeholder="Rechercher un chauffeur..." placeholderTextColor={C.gray} value={search} onChangeText={setSearch}/>
        {search.length>0&&<TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={16} color={C.gray}/></TouchableOpacity>}
      </View>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f=>{
          const active=statusFilter===f;
          const fc=f==='Tous'?C.white:STATUS_COLOR[f as DriverStatus];
          return(<TouchableOpacity key={f} style={[styles.filterChip,active&&{backgroundColor:fc+'20',borderColor:fc}]} onPress={()=>setStatusFilter(f)}><Text style={[styles.filterText,{color:active?fc:C.gray}]}>{f}</Text></TouchableOpacity>);
        })}
      </View>
      {loading?(<View style={styles.empty}><Text style={styles.emptyText}>Chargement...</Text></View>):(
        <FlatList data={filtered} keyExtractor={item=>item.id} renderItem={({item})=><DriverCard item={item} onPress={()=>{}}/>}
          contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={()=><View style={{height:10}}/>}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="person-outline" size={48} color={C.border}/><Text style={styles.emptyText}>Aucun chauffeur</Text></View>}
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
  summaryRow:{flexDirection:'row',gap:8,paddingHorizontal:16,marginBottom:12},
  summaryBadge:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:6,borderRadius:20,borderWidth:1,flex:1,justifyContent:'center'},
  summaryDot:{width:6,height:6,borderRadius:3},
  summaryCount:{fontSize:14,fontWeight:'800'},
  summaryLabel:{fontSize:11,color:C.gray},
  searchWrap:{flexDirection:'row',alignItems:'center',backgroundColor:C.input,marginHorizontal:16,borderRadius:12,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderColor:C.border,marginBottom:12},
  searchInput:{flex:1,color:C.white,fontSize:14},
  filterRow:{flexDirection:'row',gap:8,paddingHorizontal:16,marginBottom:12},
  filterChip:{paddingHorizontal:12,paddingVertical:6,borderRadius:20,borderWidth:1,borderColor:C.border},
  filterText:{fontSize:12,fontWeight:'600'},
  listContent:{paddingHorizontal:16,paddingBottom:24},
  driverCard:{backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border},
  cardTop:{flexDirection:'row',gap:12,marginBottom:14},
  avatar:{width:50,height:50,borderRadius:25,backgroundColor:'#FFD70015',borderWidth:2,alignItems:'center',justifyContent:'center',position:'relative'},
  avatarText:{fontSize:16,fontWeight:'800',color:C.gold},
  statusIndicator:{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:5,borderWidth:1.5,borderColor:C.card},
  driverInfo:{flex:1},
  nameRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:3},
  driverName:{fontSize:15,fontWeight:'700',color:C.white},
  statusBadge:{paddingHorizontal:8,paddingVertical:2,borderRadius:20},
  statusText:{fontSize:10,fontWeight:'700'},
  vehicleText:{fontSize:12,color:C.gray,marginBottom:4},
  infoRow:{flexDirection:'row',alignItems:'center',gap:4},
  zoneText:{fontSize:11,color:C.gray,flex:1},
  ratingRow:{flexDirection:'row',alignItems:'center',gap:2},
  ratingText:{fontSize:12,color:C.gold,fontWeight:'700'},
  statsRow:{flexDirection:'row',borderTopWidth:1,borderTopColor:C.border,paddingTop:12,justifyContent:'space-around'},
  statItem:{alignItems:'center',flex:1,gap:2},
  statValue:{fontSize:16,fontWeight:'800',color:C.white},
  statLabel:{fontSize:9,color:C.gray,textAlign:'center',lineHeight:12},
  statDivider:{width:1,backgroundColor:C.border},
  empty:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:80,gap:12},
  emptyText:{fontSize:14,color:C.gray},
});
