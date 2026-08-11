# 요양(병)원 시설현황 및 화재대피 특성 정보시스템
## 실행
```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```
`data/facility_master.csv`는 대시보드 공개용 정제 DB입니다. 원자료/API 키는 GitHub에 올리지 않습니다.
V-World 2D 인증정보는 Streamlit Secrets의 `VWORLD_TILE_URL`, `VWORLD_ATTRIBUTION`으로 연결하도록 골격만 구성했습니다.
