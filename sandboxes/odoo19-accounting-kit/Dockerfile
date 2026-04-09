FROM odoo:19.0-20260324

USER root

RUN python3 -m pip install --break-system-packages --no-cache-dir \
    openpyxl \
    ofxparse \
    qifparse

USER odoo
