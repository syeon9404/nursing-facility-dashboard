import streamlit as st
from utils.data_loader import load_facilities
st.title("시설 검색"); df=load_facilities()
if df.empty: st.info("facility_master.csv 연결 후 검색이 활성화됩니다."); st.stop()
q=st.text_input("시설명 또는 주소 검색"); view=df
if q:
    mask=df.facility_name.astype(str).str.contains(q,case=False,na=False)
    for c in ["road_address","jibun_address"]:
        if c in df: mask|=df[c].astype(str).str.contains(q,case=False,na=False)
    view=df[mask]
cols=[c for c in ["facility_name","facility_type","sido","sigungu","road_address","capacity","location_type","building_name","building_total_floor","facility_floor_text","building_type","aging_type","size_type","capacity_type","data_quality"] if c in view]
st.dataframe(view[cols],use_container_width=True,hide_index=True)
