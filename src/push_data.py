import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore

# STEP A: LOG INTO FIREBASE
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    # Using a unique app name to avoid "app already exists" errors
    firebase_admin.initialize_app(cred, name='dual_uploader')
    db = firestore.client(app=firebase_admin.get_app('dual_uploader'))
    print("✅ Connection to Firebase Cloud established!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit()

# STEP B: LOAD ORIGINAL DATASET
try:
    df_orig = pd.read_csv('6accident_data.csv')
    india_df = df_orig[(df_orig['Latitude'] >= 6) & (df_orig['Latitude'] <= 38) & 
                       (df_orig['Longitude'] >= 68) & (df_orig['Longitude'] <= 98)].copy()
    india_df = india_df.head(2000) # Keep your 2000 demo points
    india_df['point_type'] = 'original'
    print(f"✅ Loaded {len(india_df)} original India records.")
except Exception as e:
    print(f"⚠️ Original dataset not found or error: {e}")
    india_df = pd.DataFrame()

# STEP C: LOAD VIJAYAWADA BLACKSPOTS
try:
    df_vj = pd.read_csv('vijayawada_blackspots.csv')
    df_vj['point_type'] = 'blackspot'
    # Mapping columns to match the main schema
    df_vj = df_vj.rename(columns={
        'Severity': 'Accident_Severity',
        'Risk_Factor': 'risk_info',
        'Nearby_Landmark': 'landmark'
    })
    print(f"✅ Loaded {len(df_vj)} Vijayawada high-detail blackspots.")
except Exception as e:
    print(f"⚠️ Vijayawada blackspots CSV not found: {e}")
    df_vj = pd.DataFrame()

# STEP D: MERGE AND BLAST
combined_df = pd.concat([india_df, df_vj], ignore_index=True)
print(f"🚀 Starting the blast for {len(combined_df)} total points...")

batch = db.batch()
count = 0

for index, row in combined_df.iterrows():
    doc_ref = db.collection('accident_zones').document()
    
    # Logic to handle missing columns between the two different CSV structures
    data = {
        'location': firestore.GeoPoint(row['Latitude'], row['Longitude']),
        'severity': row.get('Accident_Severity', 'Unknown'),
        'point_type': row.get('point_type', 'original'),
        'weather': row.get('Weather_Conditions', 'N/A'),
        'road_type': row.get('Road_Type', 'N/A'),
        'landmark': row.get('landmark', 'N/A'),
        'risk_info': row.get('risk_info', 'Historical Data')
    }
    
    # Add extra details if they exist in the row (for the 6mb dataset)
    if 'Number_of_Casualties' in row: data['casualties'] = row['Number_of_Casualties']
    if 'Time' in row: data['time'] = row['Time']

    batch.set(doc_ref, data)
    count += 1
    
    if count % 500 == 0:
        batch.commit()
        batch = db.batch()
        print(f"📡 Uploading... {count} points processed.")

batch.commit()
print(f"✨ SUCCESS! {count} points (Original + Blackspots) are now LIVE in Firebase.")