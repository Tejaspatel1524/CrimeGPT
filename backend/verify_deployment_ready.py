"""
Deployment Readiness Verification Script
Checks if the application is ready for production deployment
"""

import os
import sys
from pathlib import Path

# Windows console UTF-8 encoding
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'


def check_mark(condition):
    return f"{Colors.GREEN}✓{Colors.RESET}" if condition else f"{Colors.RED}✗{Colors.RESET}"


def print_header(text):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}{text.center(80)}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")


def check_file_exists(filepath, description):
    exists = Path(filepath).exists()
    status = check_mark(exists)
    print(f"{status} {description}: {filepath}")
    return exists


def check_env_variable(var_name):
    exists = var_name in open('.env').read() if Path('.env').exists() else False
    status = check_mark(exists)
    print(f"{status} {var_name}")
    return exists


def main():
    print_header("CRIMEGPT DEPLOYMENT READINESS VERIFICATION")
    
    all_checks_passed = True
    
    # ============================================
    # 1. ENVIRONMENT FILES
    # ============================================
    print_header("1. ENVIRONMENT FILES")
    
    checks = [
        check_file_exists('.env', 'Backend .env exists'),
        check_file_exists('.env.example', 'Backend .env.example exists'),
    ]
    
    # Frontend is in different workspace root
    frontend_env_path = Path('c:/Users/HP/Desktop/sentinelai/.env.example')
    if frontend_env_path.exists():
        print(f"{Colors.GREEN}✓{Colors.RESET} Frontend .env.example exists: {frontend_env_path}")
        checks.append(True)
    else:
        print(f"{Colors.RED}✗{Colors.RESET} Frontend .env.example exists: {frontend_env_path}")
        checks.append(False)
    all_checks_passed &= all(checks)
    
    # ============================================
    # 2. BACKEND CONFIGURATION
    # ============================================
    print_header("2. BACKEND ENVIRONMENT VARIABLES")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = [
        'DATABASE_URL',
        'SECRET_KEY',
        'AI_PROVIDER',
        'GEMINI_API_KEY',
        'GEMINI_MODEL',
        'ALLOWED_ORIGINS'
    ]
    
    for var in required_vars:
        has_var = check_env_variable(var)
        all_checks_passed &= has_var
    
    # ============================================
    # 3. CODE CHECKS
    # ============================================
    print_header("3. CODE CONFIGURATION")
    
    # Check api.ts uses environment variable
    frontend_api_path = Path('c:/Users/HP/Desktop/sentinelai/src/services/api.ts')
    if frontend_api_path.exists():
        api_content = frontend_api_path.read_text()
        uses_env_var = 'import.meta.env.VITE_API_URL' in api_content
        status = check_mark(uses_env_var)
        print(f"{status} Frontend api.ts uses VITE_API_URL")
        all_checks_passed &= uses_env_var
    else:
        print(f"{Colors.RED}✗{Colors.RESET} Frontend api.ts not found")
        all_checks_passed = False
    
    # Check main.py uses ALLOWED_ORIGINS
    main_path = Path('app/main.py')
    if main_path.exists():
        main_content = main_path.read_text()
        uses_cors_env = 'ALLOWED_ORIGINS' in main_content
        status = check_mark(uses_cors_env)
        print(f"{status} Backend main.py uses ALLOWED_ORIGINS")
        all_checks_passed &= uses_cors_env
    else:
        print(f"{Colors.RED}✗{Colors.RESET} Backend main.py not found")
        all_checks_passed = False
    
    # Check file_service.py uses env var
    file_service_path = Path('app/services/file_service.py')
    if file_service_path.exists():
        file_service_content = file_service_path.read_text()
        uses_upload_env = 'UPLOAD_BASE_DIR' in file_service_content
        status = check_mark(uses_upload_env)
        print(f"{status} file_service.py uses UPLOAD_BASE_DIR")
        all_checks_passed &= uses_upload_env
    else:
        print(f"{Colors.RED}✗{Colors.RESET} file_service.py not found")
        all_checks_passed = False
    
    # ============================================
    # 4. DEPLOYMENT DOCUMENTATION
    # ============================================
    print_header("4. DEPLOYMENT DOCUMENTATION")
    
    docs = [
        '../DEPLOYMENT_MASTER_GUIDE.md',
        '../DEPLOY_VERCEL.md',
        '../DEPLOY_RENDER.md',
        '../DEPLOY_NEON.md',
        '../QUICK_DEPLOY_REFERENCE.md',
        '../PHASE5_DEPLOYMENT_READY.md'
    ]
    
    for doc in docs:
        exists = check_file_exists(doc, Path(doc).name)
        all_checks_passed &= exists
    
    # ============================================
    # 5. IMPORT CHECKS
    # ============================================
    print_header("5. BACKEND IMPORT CHECKS")
    
    try:
        from app.main import app
        print(f"{Colors.GREEN}✓{Colors.RESET} Backend imports successfully")
        print(f"{Colors.GREEN}✓{Colors.RESET} FastAPI app created")
    except Exception as e:
        print(f"{Colors.RED}✗{Colors.RESET} Backend import failed: {e}")
        all_checks_passed = False
    
    try:
        from app.database.database import engine
        print(f"{Colors.GREEN}✓{Colors.RESET} Database engine created")
    except Exception as e:
        print(f"{Colors.RED}✗{Colors.RESET} Database engine creation failed: {e}")
        all_checks_passed = False
    
    # ============================================
    # 6. SECURITY CHECKS
    # ============================================
    print_header("6. SECURITY CHECKS")
    
    # Check .gitignore has .env
    gitignore_frontend = Path('c:/Users/HP/Desktop/sentinelai/.gitignore')
    
    if gitignore_frontend.exists():
        gitignore_content = gitignore_frontend.read_text()
        has_env_ignore = '.env' in gitignore_content
        status = check_mark(has_env_ignore)
        print(f"{status} Frontend .gitignore includes .env files")
        all_checks_passed &= has_env_ignore
    
    # Check no hardcoded localhost in api.ts
    if frontend_api_path.exists():
        api_content = frontend_api_path.read_text()
        no_hardcoded = 'baseURL: "http://127.0.0.1' not in api_content and 'baseURL: "http://localhost' not in api_content
        status = check_mark(no_hardcoded)
        print(f"{status} No hardcoded localhost in api.ts")
        all_checks_passed &= no_hardcoded
    
    # Check SECRET_KEY is not default
    secret_key = os.getenv('SECRET_KEY', '')
    is_strong = len(secret_key) >= 32 and secret_key != 'crimegpt-secret-key-change-in-production'
    status = check_mark(is_strong)
    if is_strong:
        print(f"{status} SECRET_KEY is strong (32+ characters)")
    else:
        print(f"{Colors.YELLOW}⚠{Colors.RESET} SECRET_KEY should be changed in production")
    
    # ============================================
    # FINAL SUMMARY
    # ============================================
    print_header("DEPLOYMENT READINESS SUMMARY")
    
    if all_checks_passed:
        print(f"""
{Colors.GREEN}╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                     ✅ ALL CHECKS PASSED                                 ║
║                                                                           ║
║               🚀 READY FOR PRODUCTION DEPLOYMENT                         ║
║                                                                           ║
║     Next Step: Follow DEPLOYMENT_MASTER_GUIDE.md                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.BLUE}📖 Deployment Guides:{Colors.RESET}
   - DEPLOYMENT_MASTER_GUIDE.md (Complete guide)
   - QUICK_DEPLOY_REFERENCE.md (Quick reference)
   - DEPLOY_NEON.md (Database)
   - DEPLOY_RENDER.md (Backend)
   - DEPLOY_VERCEL.md (Frontend)

{Colors.BLUE}🎯 Quick Start:{Colors.RESET}
   1. Deploy database to Neon
   2. Deploy backend to Render
   3. Deploy frontend to Vercel
   4. Update CORS configuration
   5. Test the deployment

{Colors.GREEN}Total Time: ~50 minutes{Colors.RESET}
""")
    else:
        print(f"""
{Colors.RED}╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                     ❌ SOME CHECKS FAILED                                ║
║                                                                           ║
║               Please fix the issues above before deploying               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.YELLOW}⚠ Review the failed checks above and fix them before deployment.{Colors.RESET}
""")
    
    return 0 if all_checks_passed else 1


if __name__ == '__main__':
    sys.exit(main())
