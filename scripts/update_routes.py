"""Fetch routes from the DATA-DESIGNATED station; never replace analysis fields."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def compact(route, facility):
    if route.get('result_code') != 0:
        raise ValueError('Route unavailable')
    path = []
    for section in route.get('sections', []):
        for road in section.get('roads', []):
            vertices = road.get('vertexes', [])
            if len(vertices) % 2:
                raise ValueError('Invalid route geometry')
            for i in range(0, len(vertices), 2):
                point = vertices[i:i + 2]
                if not path or path[-1] != point:
                    path.append(point)
    if len(path) < 2:
        raise ValueError('Missing route geometry')
    station = facility['fire_station']
    return dict(station_name=station['name'],
                origin=[station['longitude'], station['latitude']],
                destination=[facility['longitude'], facility['latitude']],
                distance_m=route['summary']['distance'],
                duration_sec=route['summary']['duration'], path=path,
                fetched_at=dt.datetime.now(dt.timezone.utc).isoformat(),
                source='Kakao Mobility directions', priority='RECOMMEND')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=100)
    parser.add_argument('--facility-id', default='')
    args = parser.parse_args()
    if not 1 <= args.limit <= 1000:
        raise SystemExit('limit must be between 1 and 1000')
    key = os.environ.get('KAKAO_REST_API_KEY')
    if not key:
        raise SystemExit('Add repository Actions secret KAKAO_REST_API_KEY first.')
    files = json.loads((ROOT / 'data/map/manifest.json').read_text())
    facilities = [f for file in files for f in json.loads((ROOT / file).read_text())]
    if args.facility_id and not any(f['facility_id'] == args.facility_id for f in facilities):
        raise SystemExit('Unknown facility ID')
    output = ROOT / 'routes'
    output.mkdir(exist_ok=True)
    completed = failed = attempted = skipped = 0
    for f in facilities:
        if args.facility_id and f['facility_id'] != args.facility_id:
            continue
        station = f.get('fire_station')
        if not station:
            skipped += 1
            continue
        target = output / (f['facility_id'] + '.json')
        if target.exists() and not args.facility_id:
            old = json.loads(target.read_text())
            if (old.get('station_name') == station['name'] and
                old.get('origin') == [station['longitude'], station['latitude']] and
                old.get('destination') == [f['longitude'], f['latitude']]):
                continue
        if attempted >= args.limit:
            break
        attempted += 1
        params = urllib.parse.urlencode(dict(
            origin=f"{station['longitude']},{station['latitude']}",
            destination=f"{f['longitude']},{f['latitude']}",
            priority='RECOMMEND', summary='false', alternatives='false'))
        request = urllib.request.Request(
            'https://apis-navi.kakaomobility.com/v1/directions?' + params,
            headers={'Authorization': 'KakaoAK ' + key})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.load(response)
            result = compact(data['routes'][0], f)
            target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
            completed += 1
        except urllib.error.HTTPError as error:
            print(f"{f['facility_id']}: HTTP {error.code}")
            failed += 1
            if error.code in (401, 403, 429):
                break
        except (ValueError, KeyError, IndexError, OSError):
            print(f"{f['facility_id']}: route unavailable")
            failed += 1
        time.sleep(0.2)
    print(f'Completed: {completed}; failed: {failed}; missing station: {skipped}')
    if failed and not completed:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
