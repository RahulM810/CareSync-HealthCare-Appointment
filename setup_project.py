import os
from pathlib import Path

# File structure and content mapping
FILES = {
    "Dockerfile": """FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
""",

    "frontend/tailwind.config.js": """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
""",

    "backend/requirements.txt": """fastapi[standard]
uvicorn[standard]
motor
beanie
pydantic[email]
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
groq
aiosmtplib
jinja2
google-api-python-client
google-auth-oauthlib
google-auth-httplib2
apscheduler
pymongo
python-multipart
httpx
pytest
""",

    "frontend/src/styles.scss": """@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
""",

    "frontend/src/app/app.config.ts": """import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
""",

    "frontend/src/app/app.component.ts": """import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {}
"""
}

DIRS = [
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/routers",
    "backend/app/services",
    "backend/app/jobs",
    "backend/app/middleware",
    "backend/app/utils",
    "frontend/src/app/core/guards",
    "frontend/src/app/core/interceptors",
    "frontend/src/app/core/services",
    "frontend/src/app/shared/components",
    "frontend/src/app/features/auth/login",
    "frontend/src/app/features/auth/register",
    "frontend/src/app/features/patient/doctor-search",
    "frontend/src/app/features/patient/booking",
    "frontend/src/app/features/patient/appointments",
    "frontend/src/app/features/doctor/dashboard",
    "frontend/src/app/features/doctor/appointments",
    "frontend/src/app/features/admin/dashboard"
]

def build_project():
    print("🚀 Creating directory structure...")
    for directory in DIRS:
        Path(directory).mkdir(parents=True, exist_ok=True)
        # Touch __init__.py for Python packages
        if directory.startswith("backend"):
            init_file = Path(directory) / "__init__.py"
            if not init_file.exists():
                init_file.touch()

    print("📝 Writing project configuration & core files...")
    for filepath, content in FILES.items():
        file_path = Path(filepath)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

    print("✅ Project scaffolding initialized successfully.")

if __name__ == "__main__":
    build_project()