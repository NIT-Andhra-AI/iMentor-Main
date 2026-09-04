#!/bin/bash
exec /home/sri/anaconda3/envs/imentor/bin/uvicorn app:app --host 0.0.0.0 --port ${RAG_PORT:-2006}

