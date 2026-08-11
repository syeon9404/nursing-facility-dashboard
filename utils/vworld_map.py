import folium, streamlit as st
from folium.plugins import MarkerCluster
def make_map(df):
    m=folium.Map(location=[36.3,127.8],zoom_start=7,tiles=None,control_scale=True)
    url=st.secrets.get("VWORLD_TILE_URL","")
    if url: folium.TileLayer(tiles=url,attr=st.secrets.get("VWORLD_ATTRIBUTION","V-World"),name="V-World 2D").add_to(m)
    else: folium.TileLayer("OpenStreetMap",name="임시 배경지도").add_to(m)
    cluster=MarkerCluster().add_to(m)
    for _,r in df.dropna(subset=["latitude","longitude"]).iterrows():
        name=str(r.get("facility_name","시설"))
        popup=f"<b>{name}</b><br>{r.get('facility_type','')}<br>{r.get('road_address','')}<br>건물유형: {r.get('building_type','미분류')}"
        folium.Marker([r.latitude,r.longitude],tooltip=name,popup=popup).add_to(cluster)
    folium.LayerControl().add_to(m); return m
