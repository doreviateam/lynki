#!/usr/bin/env python3
"""
Setup script pour DVIG (Dorevia Vault Integration Gateway)
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="dorevia-vault-integration-gateway",
    version="0.1.0",
    author="Dorevia Team",
    author_email="team@dorevia.io",
    description="Passerelle universelle ERP ↔ Vault",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://gitlab.example.com/dorevia/dorevia-vault-integration-gateway",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.9",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "dvig=dvig.api:main",
        ],
    },
)

