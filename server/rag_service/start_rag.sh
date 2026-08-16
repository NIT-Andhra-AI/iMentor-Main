#!/bin/bash
conda run -n imentor uvicorn app:app --host 0.0.0.0 --port 2005
