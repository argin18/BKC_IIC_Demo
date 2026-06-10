cd BKC_IIC_Demo/Backend
python -m venv .venv
source .venv/bin/activate
python seed.py
uvicorn main:app --reload --port 8000
