import pandas as pd
import json

df = pd.read_csv('6accident_data.csv')

# Filter for India bounds
india_df = df[(df['Latitude'] >= 6) & (df['Latitude'] <= 38) & 
              (df['Longitude'] >= 68) & (df['Longitude'] <= 98)].copy()

# Replace NaNs with suitable defaults
india_df.fillna({
    'Accident_Severity': 'Unknown',
    'Weather_Conditions': 'Unknown',
    'Light_Conditions': 'Unknown',
    'Road_Type': 'Unknown',
    'Road_Surface_Conditions': 'Unknown',
    'Number_of_Casualties': 0,
    'Day_of_Week': 'Unknown',
    'Time': 'Unknown',
    'Vehicle_Type': 'Unknown',
    'Speed_limit': 0
}, inplace=True)

# Keep it light for JSON download, but enough for popups. 10k max is good if there are that many.
# Actually, let's keep all India points, or we limit it to 20000. Let's see how big it gets.
india_df = india_df.head(15000)

records = []
for index, row in india_df.iterrows():
    records.append({
        'id': str(index),
        'lat': float(row['Latitude']),
        'lng': float(row['Longitude']),
        'severity': str(row['Accident_Severity']),
        'weather': str(row['Weather_Conditions']),
        'light': str(row['Light_Conditions']),
        'road_type': str(row['Road_Type']),
        'road_surface': str(row['Road_Surface_Conditions']),
        'casualties': int(row['Number_of_Casualties']),
        'day': str(row['Day_of_Week']),
        'time': str(row['Time']),
        'vehicle': str(row['Vehicle_Type']),
        'speed_limit': int(row['Speed_limit'])
    })

with open('../public/ap_accidents.json', 'w') as f:
    json.dump(records, f)

print(f"✅ Generated JSON with {len(records)} records")
