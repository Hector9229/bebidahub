# BebidaHub

**Tu colección de bebidas, recetas y descubrimientos.**

BebidaHub es una aplicación web full stack para administrar un bar personal: registra tus bebidas favoritas, organízalas por categoría, califícalas y descubre cócteles del mundo con la API pública de **TheCocktailDB**.

Proyecto individual de **Desarrollo Web Integral**.

- Repositorio: <https://github.com/Hector9229/bebidahub>
- Demo local: `http://127.0.0.1:5173`
- API local: `http://127.0.0.1:8000/api`

---

## Contenido

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Cuenta demo](#cuenta-demo)
- [API](#api)
- [Modelos de datos](#modelos-de-datos)
- [API externa](#api-externa)
- [Seguridad](#seguridad)
- [Pruebas](#pruebas)
- [Documentación y entregables](#documentación-y-entregables)
- [Despliegue](#despliegue)

---

## Características

### Frontend (React)

- **Inicio** público con hero, categorías reales, beneficios, pasos y llamados a la acción.
- **Registro** con validación de nombre, apellido, correo, contraseña y confirmación.
- **Inicio de sesión** con correo y contraseña, más acceso directo a la cuenta demo.
- **Mi bar** (datos propios, ruta protegida):
  - Estadísticas: bebidas, favoritas, categorías, ABV promedio y bebidas sin alcohol.
  - CRUD completo con modal de creación/edición y diálogo de confirmación al eliminar.
  - Búsqueda, filtro por categoría, filtro de favoritas y ordenamientos.
  - Paginación de 12 bebidas por página.
  - Imágenes con respaldo visual si la URL falla.
- **Explorar** (datos de API externa):
  - Búsqueda de cócteles por nombre.
  - Botón **Sorpréndeme** para receta aleatoria.
  - Ingredientes, medidas, instrucciones, cristalería, categoría y nivel alcohólico.
  - Indicador de resultados servidos desde caché.
- Sesión persistente con JWT, refresco automático de tokens y cierre de sesión con blacklist.
- Diseño responsive con sistema propio de color, tipografía y componentes.
- Mensajes de error de campo, alertas y toasts.

### Backend (Django REST Framework)

- Autenticación JWT con SimpleJWT.
- CRUD de bebidas aislado por propietario.
- Categorías globales de solo lectura.
- Endpoint de estadísticas por usuario.
- Proxy seguro hacia TheCocktailDB con timeout, validación y caché.
- Validación estricta de todos los datos de entrada.
- Throttling por alcance para login, registro y API externa.
- Configuración separada de desarrollo y producción.
- 39 pruebas automatizadas y 88 % de cobertura.

---

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 7, Axios, lucide-react |
| Backend | Python 3.13, Django 5.2, Django REST Framework 3.18 |
| Autenticación | SimpleJWT (access + refresh, rotación y blacklist) |
| Base de datos | SQLite (demo); sustituible por PostgreSQL |
| API externa | TheCocktailDB |
| Pruebas | Django `APITestCase`, `coverage.py` |
| Reportes | ReportLab |

---

## Arquitectura

```text
Navegador
   |
   |  React SPA (Vite, puerto 5173)
   |  Axios + JWT en Authorization: Bearer
   v
API Django REST (puerto 8000)
   |
   +-- PostgreSQL / SQLite  ->  Category 1 --- N Beverage
   |
   +-- Proxy /api/external/cocktails/  ->  TheCocktailDB
          (timeout 8 s, validación, caché 5 min)
```

Decisiones principales:

- El navegador **nunca** llama directamente a TheCocktailDB: todo pasa por el backend.
- Cada bebida pertenece a un usuario. El queryset siempre se filtra por `request.user`, por lo que un usuario no puede leer ni modificar datos de otro.
- Las categorías son globales y protegidas contra borrado si tienen bebidas (`on_delete=PROTECT`).
- La configuración sensible vive en variables de entorno, nunca en el código.

---

## Estructura del proyecto

```text
proyecto/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # Usuario, registro, login JWT, perfil
│   │   └── catalog/         # Categorías, bebidas, stats, API externa
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── .env.example
│   └── .env.production.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Cliente Axios e interceptor de refresh
│   │   ├── components/      # Navbar, modal, tarjetas, toasts...
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Home, Login, Register, Dashboard, Explore
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── screenshots/
│   ├── evidence/
│   ├── Capturas_de_pantalla.pdf
│   ├── Reporte_de_Seguridad.pdf
│   └── Reporte_de_Pruebas.pdf
├── scripts/
│   ├── collect_evidence.py   # Regenera la evidencia en docs/evidence/
│   └── generate_reports.py   # Genera los tres PDFs
└── README.md
```

---

## Instalación

### Requisitos

- Python 3.12 o superior
- Node.js 20 o superior
- npm 10 o superior
- Git

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

`requirements-dev.txt` incluye las dependencias de ejecución, pruebas, auditoría y generación de reportes. Si solo necesitas correr la aplicación, usa `requirements.txt`.

Genera la clave secreta y crea el archivo de entorno:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
Copy-Item .env.example .env
```

Edita `backend/.env` y coloca la clave generada en `DJANGO_SECRET_KEY`.

Aplica migraciones y carga la cuenta demo:

```powershell
python manage.py migrate
python manage.py seed_demo
```

Arranca el servidor:

```powershell
python manage.py runserver 127.0.0.1:8000
```

En Linux/macOS los comandos equivalentes son:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend

En otra terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Abre <http://127.0.0.1:5173>.

Variables del frontend:

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000/api` | URL base del backend |
| `VITE_REPOSITORY_URL` | `https://github.com/Hector9229/bebidahub` | Enlace al repositorio |

### 3. Build de producción del frontend

```powershell
cd frontend
npm run build
npm run preview
```

---

## Cuenta demo

El comando `python manage.py seed_demo` crea:

| Campo | Valor |
| --- | --- |
| Correo | `demo@bebidahub.com` |
| Contraseña | `MangoPicante#42` |
| Bebidas | 12, distribuidas en 7 categorías |

La pantalla de login incluye el botón **Entrar con la cuenta demo** para acceder sin escribir credenciales.

> Las credenciales demo son públicas y solo existen para fines académicos. No deben reutilizarse en producción.

---

## API

Base: `http://127.0.0.1:8000/api`

### Autenticación

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register/` | Público | Crea cuenta y devuelve `access`, `refresh` y `user` |
| `POST` | `/auth/login/` | Público | Login con correo y contraseña |
| `POST` | `/auth/refresh/` | Público | Rota el refresh token |
| `POST` | `/auth/verify/` | Público | Verifica un access token |
| `POST` | `/auth/logout/` | Autenticado | Invalida el refresh token (blacklist) |
| `GET/PATCH` | `/auth/me/` | Autenticado | Perfil del usuario actual |

### Catálogo

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/categories/` | Público | Categorías globales con conteo de bebidas |
| `GET` | `/beverages/` | Autenticado | Lista paginada de bebidas propias |
| `POST` | `/beverages/` | Autenticado | Crea una bebida propia |
| `GET` | `/beverages/{id}/` | Autenticado | Detalle de una bebida propia |
| `PUT/PATCH` | `/beverages/{id}/` | Autenticado | Actualiza una bebida propia |
| `DELETE` | `/beverages/{id}/` | Autenticado | Elimina una bebida propia |
| `GET` | `/beverages/stats/` | Autenticado | Métricas del bar del usuario |

Filtros de `/beverages/`:

| Parámetro | Ejemplo | Descripción |
| --- | --- | --- |
| `search` | `?search=mojito` | Busca en nombre y descripción |
| `category` | `?category=cocteles` | Filtra por slug de categoría |
| `favorite` | `?favorite=true` | Filtra favoritas (`true/false`, `1/0`, `si/no`) |
| `ordering` | `?ordering=-price` | `name`, `price`, `rating`, `abv`, `created_at` (con `-` para descendente) |
| `page` | `?page=2` | Paginación de 12 elementos |

### API externa

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/external/cocktails/?q=margarita` | Público | Busca cócteles por nombre |
| `GET` | `/external/cocktails/random/` | Público | Devuelve un cóctel aleatorio |

### Salud

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health/` | Estado del servicio y marca de tiempo |

### Ejemplo de uso

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@bebidahub.com","password":"MangoPicante#42"}'

# Listar bebidas con el access token
curl http://127.0.0.1:8000/api/beverages/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## Modelos de datos

### `Category` (global)

| Campo | Tipo | Notas |
| --- | --- | --- |
| `name` | `CharField(60)` | Único |
| `slug` | `SlugField(70)` | Único, generado automáticamente |
| `description` | `CharField(200)` | Opcional |
| `icon` | `CharField(16)` | Emoji de la categoría |
| `order` | `PositiveSmallIntegerField` | Orden de presentación |

### `Beverage` (por usuario)

| Campo | Tipo | Notas |
| --- | --- | --- |
| `owner` | FK a `User` | `CASCADE`, aísla los datos |
| `category` | FK a `Category` | `PROTECT` |
| `name` | `CharField(100)` | Único por propietario |
| `description` | `TextField(1000)` | Sin HTML |
| `price` | `Decimal(9,2)` | `0.00` a `999999.99` |
| `abv` | `Decimal(5,2)` | `0` a `100` |
| `serving_ml` | `PositiveSmallIntegerField` | `30` a `2000` |
| `rating` | `PositiveSmallIntegerField` | `1` a `5` |
| `is_alcoholic` | `BooleanField` | Debe ser coherente con `abv` |
| `is_favorite` | `BooleanField` | Favorita |
| `image_url` | `URLField(500)` | `http`/`https`, sin hosts internos |
| `created_at` / `updated_at` | `DateTimeField` | Automáticos |

Restricciones de base de datos:

- Nombre único por propietario.
- `abv` entre 0 y 100.
- `serving_ml` entre 30 y 2000.
- `rating` entre 1 y 5.
- `price` no negativo.
- Índices por `(owner, -created_at)` y `(category, name)`.

---

## API externa

Integración con **TheCocktailDB**:

- La clave de API no es necesaria para el plan de pruebas; aun así, todas las llamadas salen del backend, nunca del navegador.
- `requests.get` con `timeout` configurable (8 s por defecto).
- Validación del parámetro `q`: 2 a 50 caracteres, sin HTML ni caracteres de control.
- Normalización de ingredientes, medidas, etiquetas e imágenes.
- Caché en memoria de 5 minutos para búsquedas repetidas.
- Errores del proveedor se traducen a `502 Bad Gateway` sin filtrar detalles internos.
- Límite de 40 solicitudes por minuto por usuario/IP.

---

## Seguridad

Consulta el reporte completo en [`docs/Reporte_de_Seguridad.pdf`](docs/Reporte_de_Seguridad.pdf).

### Medidas implementadas

- **Secretos fuera del repositorio:** `DJANGO_SECRET_KEY` se lee de `.env`; la aplicación falla al iniciar si no existe. `.env` está en `.gitignore`.
- **Configuración por entorno:** `development.py` para HTTP local y `production.py` con HSTS, redirección SSL, cookies seguras y cabeceras defensivas.
- **JWT:** access de 30 minutos, refresh de 1 día, rotación de refresh y blacklist al cerrar sesión.
- **Contraseñas:** mínimo 10 caracteres, validadores de Django (similitud, comunes y numéricas), hash PBKDF2.
- **Autorización:** todas las rutas de bebidas exigen autenticación; el queryset se filtra por propietario. Acceder a una bebida ajena devuelve 404.
- **Validación de entrada:** longitudes, rangos, correo, URL, rechazo de HTML y caracteres de control, nombres duplicados y coherencia entre ABV y bandera de alcohol.
- **CORS:** allowlist explícita, sin credenciales, métodos y cabeceras acotados.
- **CSRF:** orígenes de confianza configurados y cookies `SameSite=Lax`.
- **Rate limiting:** 80/min anónimo, 240/min autenticado, 30/min login, 100/h registro y 40/min API externa.
- **Cabeceras:** `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, `X-Frame-Options: DENY`.
- **Producción:** HSTS de 1 año con subdominios y preload, redirección a HTTPS, cookies `Secure` y `HttpOnly`.
- **Límite de carga:** 1 MiB para cuerpos JSON/formulario.
- **Dependencias fijadas y auditadas:** `pip-audit` y `npm audit` sin vulnerabilidades conocidas.

### Verificación

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py check --deploy --settings=config.settings.production
.\.venv\Scripts\python.exe manage.py test
.\.venv\Scripts\python.exe -m pip_audit

cd ..\frontend
npm audit
```

Resultados de la última ejecución:

| Verificación | Resultado |
| --- | --- |
| `manage.py check --deploy` | `System check identified no issues (0 silenced).` |
| Pruebas backend | 39 pruebas, `OK` |
| Cobertura backend | 88 % |
| `pip-audit` | 40 dependencias, 0 vulnerabilidades |
| `npm audit` | 145 dependencias, 0 vulnerabilidades |
| Build del frontend | Correcto |

> Las auditorías son una foto del momento. Vuelve a ejecutarlas después de actualizar dependencias.

---

## Pruebas

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py test

# Cobertura
.\.venv\Scripts\coverage.exe run --source=apps,config manage.py test
.\.venv\Scripts\coverage.exe report -m
```

Resumen:

- **39 pruebas** distribuidas en autenticación, catálogo y API externa.
- **88 %** de cobertura sobre `apps` y `config`.
- Casos cubiertos: registro, login, tokens, logout con blacklist, perfil, aislamiento por usuario, CRUD, validaciones, filtros, ordenamiento, paginación, estadísticas, protección de categorías, timeout, JSON inválido, caché y respuestas 404/502 de la API externa.

El detalle está en [`docs/Reporte_de_Pruebas.pdf`](docs/Reporte_de_Pruebas.pdf) y en `docs/evidence/`.

---

## Documentación y entregables

| Entregable | Ruta |
| --- | --- |
| Capturas de pantalla | [`docs/Capturas_de_pantalla.pdf`](docs/Capturas_de_pantalla.pdf) |
| Reporte de seguridad | [`docs/Reporte_de_Seguridad.pdf`](docs/Reporte_de_Seguridad.pdf) |
| Reporte de pruebas | [`docs/Reporte_de_Pruebas.pdf`](docs/Reporte_de_Pruebas.pdf) |
| Evidencia de comandos | `docs/evidence/` |
| Capturas individuales | `docs/screenshots/` |

Para regenerar la evidencia y los PDFs:

```powershell
cd backend
.\.venv\Scripts\python.exe ..\scripts\collect_evidence.py
.\.venv\Scripts\python.exe ..\scripts\generate_reports.py
```

`collect_evidence.py` vuelve a ejecutar pruebas, cobertura, `check --deploy`, build y auditorías, y guarda la salida en UTF-8 dentro de `docs/evidence/`.

---

## Despliegue

Recomendaciones para publicar:

1. Usa PostgreSQL en lugar de SQLite.
2. Configura `DJANGO_SETTINGS_MODULE=config.settings.production` y un `.env` real.
3. Sirve Django detrás de un proxy con TLS (Nginx, Caddy o similar).
4. Define `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` con los dominios reales.
5. Ejecuta `python manage.py collectstatic` y sirve los estáticos con el proxy o WhiteNoise.
6. Publica el frontend con `npm run build` y apunta `VITE_API_URL` al dominio de la API.
7. Mantén `DEBUG=False` y ejecuta `check --deploy` antes de cada despliegue.

---

## Autor

Proyecto individual de **Desarrollo Web Integral**.

- GitHub: [@Hector9229](https://github.com/Hector9229)
- Año: 2026

Consume responsablemente. Solo mayores de 18 años para bebidas alcohólicas.
