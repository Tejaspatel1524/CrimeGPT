"""
Update all UserPublic constructor calls to include account_status and failed_login_attempts
"""
import re

def add_missing_fields(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern to find UserPublic constructors
    pattern = r'(UserPublic\([^)]+is_active=bool\([\w.]+\))'
    
    def replacer(match):
        text = match.group(1)
        # Check if account_status is already there
        if 'account_status' in text:
            return text
        # Add the missing fields before last_login
        if 'last_login=' in text:
            text = text.replace(
                'last_login=',
                'account_status=user.account_status,\n        failed_login_attempts=user.failed_login_attempts,\n        last_login='
            )
        return text
    
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Updated {file_path}")
        return True
    else:
        print(f"  No changes needed in {file_path}")
        return False

# Files to update
files = [
    r"c:\Users\HP\OneDrive\Desktop\gpt backend\backend\app\services\auth_service.py",
    r"c:\Users\HP\OneDrive\Desktop\gpt backend\backend\app\api\users.py"
]

for file in files:
    try:
        add_missing_fields(file)
    except Exception as e:
        print(f"✗ Error updating {file}: {e}")
