import csv
import json
import os

def generate_combined_json():
    print("🚀 Merging datasets for map visualization...")
    records = []
    
    # 1. PROCESS MAIN DATASET
    try:
        main_path = '6accident_data.csv'
        if os.path.exists(main_path):
            with open(main_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    try:
                        lat = float(row['Latitude'])
                        lng = float(row['Longitude'])
                        if 6 <= lat <= 38 and 68 <= lng <= 98:
                            records.append({
                                'id': f"main-{count}",
                                'lat': lat,
                                'lng': lng,
                                'severity': row.get('Accident_Severity', 'Serious'),
                                'weather': row.get('Weather_Conditions', 'N/A'),
                                'road_type': row.get('Road_Type', 'N/A'),
                                'casualties': int(row.get('Number_of_Casualties', 0)),
                                'point_type': 'original'
                            })
                            count += 1
                        if count >= 2000: break
                    except: continue
            print(f"✅ Loaded {count} main records.")
    except Exception as e:
        print(f"⚠️ Main dataset error: {e}")

    # 2. PROCESS VIJAYAWADA BLACKSPOTS
    try:
        vj_path = 'vijayawada_blackspots.csv'
        if os.path.exists(vj_path):
            with open(vj_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                vj_count = 0
                for row in reader:
                    try:
                        lat = float(row['Latitude'])
                        lng = float(row['Longitude'])
                        records.append({
                            'id': f"vj-{vj_count}",
                            'lat': lat,
                            'lng': lng,
                            'severity': row.get('Severity', 'Fatal'),
                            'weather': 'N/A',
                            'road_type': row.get('Road_Type', 'N/A'),
                            'casualties': 0,
                            'point_type': 'blackspot',
                            'landmark': row.get('Nearby_Landmark', 'N/A'),
                            'risk_info': row.get('Risk_Factor', 'High Density'),
                            'incident_count': 25
                        })
                        vj_count += 1
                    except: continue
            print(f"✅ Loaded {vj_count} blackspots.")
    except Exception as e:
        print(f"⚠️ Blackspots error: {e}")

    # Write to public folder
    output_path = os.path.join('..', 'public', 'accident_data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(records, f)
    print(f"✨ SUCCESS! {len(records)} points generated.")

if __name__ == "__main__":
    generate_combined_json()
