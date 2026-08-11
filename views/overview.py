import streamlit as st
from utils.data_loader import load_facilities
st.title("전국 요양(병)원 시설 현황"); df=load_facilities()
if df.empty: st.info("facility_master.csv가 비어 있습니다. Master DB 연결 후 자동 갱신됩니다."); st.stop()
a,b,c=st.columns(3); a.metric("전체 시설",f"{len(df):,}"); b.metric("요양병원",f"{(df.facility_type=='요양병원').sum():,}"); c.metric("요양원",f"{(df.facility_type=='요양원').sum():,}")
st.bar_chart(df.groupby(["sido","facility_type"]).size().unstack(fill_value=0))
