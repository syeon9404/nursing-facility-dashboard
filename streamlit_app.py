import streamlit as st
st.set_page_config(page_title="요양(병)원 시설현황 및 화재대피 특성 정보시스템",page_icon="🏥",layout="wide")
pages={"시설정보":[st.Page("views/overview.py",title="전국 현황",default=True),st.Page("views/facility_map.py",title="시설 지도"),st.Page("views/facility_search.py",title="시설 검색")],"분석":[st.Page("views/statistics.py",title="유형별 통계"),st.Page("views/methodology.py",title="분류기준")]}
st.navigation(pages).run()
