import os
import shutil
import sqlite3
import json

def backup_and_verify():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backup_dir = os.path.join(backend_dir, "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    src_db = os.path.join(backend_dir, "syra.db")
    dst_db = os.path.join(backup_dir, "syra_backup_verified.db")
    
    if not os.path.exists(src_db):
        print(f"Error: {src_db} does not exist!")
        return False
        
    shutil.copy2(src_db, dst_db)
    print(f"Database copied from {src_db} to {dst_db} (size: {os.path.getsize(dst_db)} bytes)")
    
    # Verify backup by connecting and inspecting tables and counts
    conn = sqlite3.connect(dst_db)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall() if row[0] != 'sqlite_sequence']
    
    counts = {}
    print("\n--- Verified Backup Table Record Counts ---")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        count = cursor.fetchone()[0]
        counts[table] = count
        print(f"  {table}: {count} records")
        
    conn.close()
    
    # Save verification metadata
    meta_path = os.path.join(backup_dir, "backup_verification.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({
            "source_db": src_db,
            "backup_db": dst_db,
            "source_size_bytes": os.path.getsize(src_db),
            "backup_size_bytes": os.path.getsize(dst_db),
            "tables": tables,
            "record_counts": counts
        }, f, indent=2)
        
    print(f"\nBackup metadata written to {meta_path}")
    print("BACKUP VERIFICATION SUCCESSFUL.")
    return True

if __name__ == "__main__":
    backup_and_verify()
