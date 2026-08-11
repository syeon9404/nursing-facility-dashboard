from pathlib import Path
import pandas as pd
import streamlit as st
DATA_PATH=Path("data/facility_master.csv")
@st.cache_data
def load_facilities():
    if not DATA_PATH.exists(): return pd.DataFrame()
    df=pd.read_csv(DATA_PATH,encoding="utf-8-sig",low_memory=False)
    for c in ["latitude","longitude","capacity","staff_total","building_total_floor","facility_min_floor","facility_max_floor","gross_floor_area","forest_distance_m","fire_station_distance_km","capacity_staff_ratio"]:
        if c in df: df[c]=pd.to_numeric(df[c],errors="coerce")
    return df
