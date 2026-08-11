import streamlit as st
from streamlit_folium import st_folium
from utils.data_loader import load_facilities
from utils.vworld_map import make_map
st.title("시설 지도"); df=load_facilities()
if df.empty: st.info("facility_master.csv 연결 후 지도가 활성화됩니다."); st.stop()
c1,c2,c3,c4=st.columns(4)
def pick(col,label,key):
    vals=["전체"]+sorted(df[col].dropna().astype(str).unique().tolist()) if col in df else ["전체"]
    return st.selectbox(label,vals,key=key)
with c1: ft=pick("facility_type","시설종류","ft")
with c2: sd=pick("sido","시도","sd")
with c3: lt=pick("location_type","입지유형","lt")
with c4: bt=pick("building_type","건물유형","bt")
view=df.copy()
for col,val in [("facility_type",ft),("sido",sd),("location_type",lt),("building_type",bt)]:
    if val!="전체": view=view[view[col].astype(str)==val]
st.caption(f"표시 시설: {len(view):,}개"); st_folium(make_map(view),height=680,use_container_width=True,returned_objects=[])
