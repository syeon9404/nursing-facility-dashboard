import streamlit as st
from utils.data_loader import load_facilities
st.title("유형별 통계"); df=load_facilities()
if df.empty: st.info("facility_master.csv 연결 후 통계가 활성화됩니다."); st.stop()
for col,title in [("location_type","입지유형"),("building_type","건물유형"),("aging_type","노후"),("size_type","규모"),("capacity_type","역량")]:
    if col in df and df[col].notna().any(): st.subheader(title); st.bar_chart(df.groupby([col,"facility_type"]).size().unstack(fill_value=0))
