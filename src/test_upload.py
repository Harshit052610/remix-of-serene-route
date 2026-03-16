import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, name='test_upload')
    db = firestore.client(app=firebase_admin.get_app('test_upload'))
    
    doc_ref = db.collection('accident_zones').document('test_point')
    doc_ref.set({
        'location': firestore.GeoPoint(16.5, 80.6),
        'severity': 'Fatal',
        'point_type': 'blackspot',
        'landmark': 'Test Point',
        'risk_info': 'Verification Point'
    })
    print("✅ TEST UPLOAD SUCCESS!")
except Exception as e:
    print(f"❌ TEST UPLOAD FAILED: {e}")
