# FastAPI Project Setup & Run Guide

## 1. Create Virtual Environment

### Linux / macOS

```bash
python -m venv .venv
source .venv/bin/activate
```

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
```

---

## 2. Install Dependencies

Using pip:

```bash
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/dbname
SECRET_KEY=your-secret-key
```

---

## 5. Run Database Migrations
```bash
python seed.py
```
## 6. Run Development Server

```bash
uvicorn main:app --reload --port 8000
```

### URLs

- API: http://127.0.0.1:8000
- Swagger Docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

---

## 7. Run Production Server

Using Uvicorn:

```bash
uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4
```

Using Gunicorn:

```bash
gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    -w 4 \
    -b 0.0.0.0:8000
```
