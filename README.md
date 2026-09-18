# 요양(병)원 시설 현황 지도 - GitHub Pages 배포본

이 폴더는 `260918_data+(2).xlsx`의 DB 시트를 실제 웹 지도용 JSON으로 변환한 배포본입니다.

## 포함 데이터
- 시설 7,676건
- 시설 좌표, 시설유형, 시도/시군구
- 입지유형, 산림인접유형, 건축유형, 규모유형
- 병상/정원/현원 및 주요 인력
- `final_nearest_119_name`
- `final_fire_station_road_m`, `final_fire_station_linear_m`, `final_fire_response_min`
- 지정 소방기관 좌표 및 시설-소방기관 연결선

## 배포
1. GitHub에서 새 repository를 만듭니다.
2. 이 폴더 안의 파일과 폴더를 repository 최상위에 업로드합니다.
3. `index.html`에서 `YOUR_KAKAO_JAVASCRIPT_KEY`를 본인의 카카오 **JavaScript 키**로 교체합니다.
4. Kakao Developers에서 Web 플랫폼 사이트 도메인에 GitHub Pages 주소를 등록합니다.
   예: `https://사용자명.github.io`
5. GitHub repository → Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.
6. 잠시 후 표시되는 GitHub Pages 주소로 접속합니다.

## 주의
GitHub Pages는 정적 웹사이트이므로 JavaScript 키는 브라우저에서 확인할 수 있습니다. 키 자체를 비밀값처럼 숨기는 방식이 아니라, Kakao Developers에서 허용 도메인을 제한해 사용하세요.

현재 지도 연결선은 DB에 저장된 도로거리 결과를 지도 위에 직선으로 시각화한 것입니다. 실제 도로 주행경로 선형을 표시하려면 별도의 길찾기 API 연동이 필요합니다.
