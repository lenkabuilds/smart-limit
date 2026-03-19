# Contributing to SMART-LIMIT

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/smart-limit.git
cd smart-limit
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

## Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test everything works: run `python app.py` + `npm run dev`
5. Commit with a clear message: `git commit -m "feat: add your feature"`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Commit Message Format

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
```

## Areas to Contribute

- Additional ML models (LSTM, Autoencoder)
- More traffic simulation modes
- Docker support
- Unit tests
- Dashboard improvements
- Documentation improvements
