"""Resolve only final-designated agencies; retain existing analysis results."""
import json
import math
import os
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]


def normalized(name):
    return re.sub(r'[\s_\-]', '', name)


def distance(x, y, a, b):
    y, b = math.radians(y), math.radians(b)
    d = math.sin((b-y)/2)**2 + math.cos(y)*math.cos(b)*math.sin(math.radians(a-x)/2)**2
    return 12742000 * math.asin(min(1, math.sqrt(d)))


def main():
    key = os.environ.get('KAKAO_REST_API_KEY')
    if not key:
        raise SystemExit('Add repository Actions secret KAKAO_REST_API_KEY first.')
    updated = pending = 0
    cache = {}
    for relative in json.loads((ROOT / 'data/map/manifest.json').read_text()):
        file = ROOT / relative
        rows = json.loads(file.read_text())
        changed = False
        for facility in rows:
            if facility.get('fire_station'):
                continue
            name = facility['final_nearest_119_name']
            lng, lat = facility['longitude'], facility['latitude']
            cache_key = (name, lng, lat)
            params = urllib.parse.urlencode(dict(query=name, x=lng, y=lat, radius=20000, size=15, sort='distance'))
            request = urllib.request.Request('https://dapi.kakao.com/v2/local/search/keyword.json?' + params,
                                             headers={'Authorization': 'KakaoAK ' + key})
            if cache_key not in cache:
                try:
                    with urllib.request.urlopen(request, timeout=30) as response:
                        cache[cache_key] = json.load(response).get('documents', [])
                except urllib.error.HTTPError as error:
                    raise SystemExit(f'Local API HTTP {error.code}; check key, permission and quota.') from None
                time.sleep(.2)
            matches = []
            for doc in cache[cache_key]:
                if normalized(doc['place_name']) != normalized(name):
                    continue
                actual = distance(lng, lat, float(doc['x']), float(doc['y']))
                expected = facility['final_fire_station_linear_m']
                if expected is not None and abs(actual - expected) <= max(60, expected * .02):
                    matches.append(doc)
            if len(matches) != 1:
                pending += 1
                continue
            doc = matches[0]
            facility['fire_station'] = dict(name=name, longitude=float(doc['x']), latitude=float(doc['y']),
                address=doc['road_address_name'] or doc['address_name'],
                source='카카오 로컬 · 최종 기관명 및 기존 직선거리 대조')
            changed = True
            updated += 1
        if changed:
            file.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')))
    print(f'Added station coordinates: {updated}; requiring review: {pending}')


if __name__ == '__main__':
    main()
