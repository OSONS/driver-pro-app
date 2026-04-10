import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../services/supabase";
import {
  Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg:"#050508",card:"#0D0D18",border:"#1A1A35",
  gold:"#FFD700",goldDim:"#8B7500",cyan:"#00F5FF",
  purple:"#9D4EDD",white:"#FFFFFF",gray:"#666688",
  green:"#00FF88",red:"#FF4466",orange:"#FF8C00",
  blue:"#4488FF",
};

const today = new Date();
const dateStr = today.toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
const todayISO = today.toISOString().split("T")[0];

function PulseRing({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim,{toValue:1,duration:1500,easing:Easing.out(Easing.ease),useNativeDriver:true}),
        Animated.timing(anim,{toValue:0,duration:500,useNativeDriver:true}),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position:"absolute", width:12, height:12, borderRadius:6,
      backgroundColor:color,
      opacity:anim.interpolate({inputRange:[0,0.5,1],outputRange:[1,0.4,0]}),
      transform:[{scale:anim.interpolate({inputRange:[0,1],outputRange:[1,2.5]})}],
    }}/>
  );
}

function AnimatedCard({ children, delay, style }: { children:any; delay:number; style?:any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim,{toValue:1,duration:600,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
      Animated.timing(translateY,{toValue:0,duration:600,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
    ]).start();
  }, []);
  return (
    <Animated.View style={[style,{opacity:anim,transform:[{translateY}]}]}>
      {children}
    </Animated.View>
  );
}

function GlowCard({ children, color, style }: { children:any; color:string; style?:any }) {
  return (
    <View style={[styles.glowCard, { borderColor:color+"40" }, style]}>
      <View style={[styles.glowLine, { backgroundColor:color }]}/>
      {children}
    </View>
  );
}

function StatCard({ label, value, color, icon, delay }: {
  label:string; value:string|number; color:string; icon:string; delay:number;
}) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,{toValue:1,delay,useNativeDriver:true,tension:100,friction:8}),
      Animated.timing(opacity,{toValue:1,duration:400,delay,useNativeDriver:true}),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard,{opacity,transform:[{scale}],borderColor:color+"30"}]}>
      <View style={[styles.statIconWrap,{backgroundColor:color+"15"}]}>
        <Text style={{fontSize:18}}>{icon}</Text>
      </View>
      <Text style={[styles.statValue,{color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statGlow,{backgroundColor:color+"20"}]}/>
    </Animated.View>
  );
}

function RecentCourseRow({ item, index }: { item:any; index:number }) {
  const colorMap: Record<string,string> = { en_cours:C.gold,termine:C.green,annule:C.red };
  const labelMap: Record<string,string> = { en_cours:"En cours",termine:"Terminée",annule:"Annulée" };
  const color = colorMap[item.statut] ?? C.gray;
  const anim = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim,{toValue:1,duration:500,delay:index*100,useNativeDriver:true}),
      Animated.timing(x,{toValue:0,duration:500,delay:index*100,useNativeDriver:true}),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.courseRow,{opacity:anim,transform:[{translateX:x}]}]}>
      <View style={[styles.courseAvatar,{borderColor:color+"60"}]}>
        <Text style={[styles.courseAvatarText,{color}]}>{item.initials}</Text>
        {item.statut==="en_cours" && (
          <View style={{position:"absolute",bottom:-1,right:-1}}>
            <PulseRing color={color}/>
          </View>
        )}
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseDriver}>{item.driver}</Text>
        <Text style={styles.courseRoute} numberOfLines={1}>{item.depart} → {item.arrivee}</Text>
      </View>
      <View style={{alignItems:"flex-end"}}>
        <Text style={[styles.courseMontant,{color:C.gold}]}>{item.montant?`${item.montant} €`:"—"}</Text>
        <View style={[styles.courseBadge,{backgroundColor:color+"20",borderColor:color+"40"}]}>
          <Text style={[styles.courseBadgeText,{color}]}>{labelMap[item.statut]??item.statut}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const [loading,setLoading] = useState(true);
  const [coursesAujourdhui,setCoursesAujourdhui] = useState(0);
  const [revenusAujourdhui,setRevenusAujourdhui] = useState(0);
  const [chauffeursActifs,setChauffeursActifs] = useState(0);
  const [tauxCompletion,setTauxCompletion] = useState(0);
  const [kmParcourus,setKmParcourus] = useState(0);
  const [recentCourses,setRecentCourses] = useState<any[]>([]);
  const [weekRevenues,setWeekRevenues] = useState<number[]>([0,0,0,0,0,0,0]);
  const [enAttente,setEnAttente] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim,{toValue:1,duration:800,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const{data:todayCourses}=await supabase.from("courses").select("*").eq("date",todayISO);
      const courses=todayCourses||[];
      setCoursesAujourdhui(courses.length);
      const revenus=courses.filter((c:any)=>c.statut==="termine").reduce((s:number,c:any)=>s+(c.montant||0),0);
      setRevenusAujourdhui(Math.round(revenus));
      const terminees=courses.filter((c:any)=>c.statut==="termine").length;
      const total=courses.filter((c:any)=>c.statut!=="annule").length;
      setTauxCompletion(total>0?Math.round((terminees/total)*100):0);
      const km=courses.reduce((s:number,c:any)=>s+(c.distance_km||0),0);
      setKmParcourus(Math.round(km));
      setEnAttente(courses.filter((c:any)=>c.statut==="en_cours").length);
      const{data:drivers}=await supabase.from("drivers").select("id");
      setChauffeursActifs((drivers||[]).length);
      const{data:recent}=await supabase.from("courses").select("*, drivers(nom,prenom)")
        .order("created_at",{ascending:false}).limit(5);
      setRecentCourses((recent||[]).map((c:any)=>({
        ...c,
        driver:c.drivers?`${c.drivers.prenom} ${c.drivers.nom[0]}.`:"Inconnu",
        initials:c.drivers?`${(c.drivers.prenom||" ")[0]}${(c.drivers.nom||" ")[0]}`.toUpperCase():"??",
      })));
      const days:number[]=[];
      for(let i=6;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const ds=d.toISOString().split("T")[0];
        const{data:dc}=await supabase.from("courses").select("montant").eq("date",ds).eq("statut","termine");
        days.push(Math.round((dc||[]).reduce((s:number,c:any)=>s+(c.montant||0),0)));
      }
      setWeekRevenues(days);
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const maxRev=Math.max(...weekRevenues,1);
  const jours=["L","M","M","J","V","S","D"];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View style={[styles.header,{opacity:headerAnim,transform:[{translateY:headerAnim.interpolate({inputRange:[0,1],outputRange:[-20,0]})}]}]}>
          <View>
            <Text style={styles.appName}>DRIVER PRO</Text>
            <View style={styles.headerLine}/>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboard}>
            <Text style={{fontSize:20}}>↻</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Alert */}
        {enAttente>0&&(
          <AnimatedCard delay={100}>
            <View style={styles.alertBanner}>
              <View style={styles.alertDotWrap}>
                <PulseRing color={C.gold}/>
                <View style={[styles.alertDotCore,{backgroundColor:C.gold}]}/>
              </View>
              <Text style={styles.alertText}>{enAttente} course{enAttente>1?"s":""} en cours</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>LIVE</Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Stats row 1 */}
        <View style={styles.statsRow}>
          <StatCard label="Courses" value={coursesAujourdhui} color={C.cyan} icon="🚗" delay={200}/>
          <StatCard label="Revenus" value={`${revenusAujourdhui}€`} color={C.green} icon="💰" delay={300}/>
        </View>

        {/* Stats row 2 */}
        <View style={styles.stats2Row}>
          <StatCard label="Chauffeurs" value={chauffeursActifs} color={C.purple} icon="👤" delay={400}/>
          <StatCard label="Complétion" value={`${tauxCompletion}%`} color={C.blue} icon="✓" delay={500}/>
          <StatCard label="Km" value={`${kmParcourus}`} color={C.orange} icon="📍" delay={600}/>
        </View>

        {/* Graphique */}
        <AnimatedCard delay={700}>
          <GlowCard color={C.gold}>
            <Text style={styles.chartTitle}>⚡ Revenus — 7 derniers jours</Text>
            <View style={styles.chartBars}>
              {weekRevenues.map((rev,i)=>(
                <View key={i} style={styles.barWrap}>
                  {rev>0&&<Text style={styles.barVal}>{rev}€</Text>}
                  <View style={[styles.barBg]}>
                    <Animated.View style={[styles.bar,{
                      height:`${Math.max(4,(rev/maxRev)*100)}%`,
                      backgroundColor:rev>0?C.gold:C.border,
                    }]}/>
                  </View>
                  <Text style={[styles.barDay,{color:i===new Date().getDay()-1||i===6?C.gold:C.gray}]}>{jours[i]}</Text>
                </View>
              ))}
            </View>
          </GlowCard>
        </AnimatedCard>

        {/* Courses récentes */}
        <AnimatedCard delay={800}>
          <GlowCard color={C.cyan}>
            <Text style={styles.recentTitle}>🔥 Courses récentes</Text>
            {recentCourses.length===0
              ?<Text style={styles.emptyText}>Aucune course</Text>
              :recentCourses.map((c,i)=><RecentCourseRow key={c.id} item={c} index={i}/>)
            }
          </GlowCard>
        </AnimatedCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  scroll:{padding:16,paddingBottom:40},

  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},
  appName:{fontSize:32,fontWeight:"900",color:C.gold,letterSpacing:4},
  headerLine:{width:60,height:2,backgroundColor:C.cyan,marginVertical:4,borderRadius:1},
  dateText:{fontSize:12,color:C.gray,textTransform:"capitalize"},
  refreshBtn:{width:40,height:40,borderRadius:12,backgroundColor:C.card,borderWidth:1,borderColor:C.border,alignItems:"center",justifyContent:"center"},

  alertBanner:{flexDirection:"row",alignItems:"center",gap:10,backgroundColor:C.gold+"10",borderWidth:1,borderColor:C.gold+"40",borderRadius:14,padding:14,marginBottom:16},
  alertDotWrap:{width:12,height:12,alignItems:"center",justifyContent:"center"},
  alertDotCore:{width:8,height:8,borderRadius:4,position:"absolute"},
  alertText:{flex:1,fontSize:13,color:C.gold,fontWeight:"600"},
  alertBadge:{backgroundColor:C.gold,paddingHorizontal:6,paddingVertical:2,borderRadius:6},
  alertBadgeText:{fontSize:9,fontWeight:"900",color:C.bg,letterSpacing:1},

  statsRow:{flexDirection:"row",gap:10,marginBottom:10},
  stats2Row:{flexDirection:"row",gap:8,marginBottom:16},
  statCard:{flex:1,backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,overflow:"hidden",alignItems:"center",gap:6},
  statIconWrap:{width:36,height:36,borderRadius:10,alignItems:"center",justifyContent:"center"},
  statValue:{fontSize:20,fontWeight:"900"},
  statLabel:{fontSize:10,color:C.gray,fontWeight:"600",textAlign:"center"},
  statGlow:{position:"absolute",bottom:0,left:0,right:0,height:40,borderRadius:16},

  glowCard:{backgroundColor:C.card,borderRadius:16,padding:16,borderWidth:1,marginBottom:16,overflow:"hidden"},
  glowLine:{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:1},

  chartTitle:{fontSize:13,color:C.white,fontWeight:"700",marginBottom:14},
  chartBars:{flexDirection:"row",alignItems:"flex-end",height:120,gap:4},
  barWrap:{flex:1,alignItems:"center",gap:4},
  barVal:{fontSize:7,color:C.gold,textAlign:"center"},
  barBg:{flex:1,width:"100%",justifyContent:"flex-end",borderRadius:4,backgroundColor:C.border+"40"},
  bar:{width:"100%",borderRadius:4,minHeight:4},
  barDay:{fontSize:10,color:C.gray},

  recentTitle:{fontSize:14,fontWeight:"800",color:C.white,marginBottom:14},
  courseRow:{flexDirection:"row",alignItems:"center",gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.border+"60"},
  courseAvatar:{width:38,height:38,borderRadius:19,backgroundColor:C.card,borderWidth:1.5,alignItems:"center",justifyContent:"center"},
  courseAvatarText:{fontSize:12,fontWeight:"800"},
  courseInfo:{flex:1},
  courseDriver:{fontSize:13,fontWeight:"700",color:C.white},
  courseRoute:{fontSize:11,color:C.gray,marginTop:1},
  courseMontant:{fontSize:14,fontWeight:"800"},
  courseBadge:{paddingHorizontal:6,paddingVertical:2,borderRadius:10,marginTop:2,borderWidth:1},
  courseBadgeText:{fontSize:9,fontWeight:"700"},
  emptyText:{fontSize:13,color:C.gray,textAlign:"center",paddingVertical:20},
});
