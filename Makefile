install:
	npm ci

setup: install

lint:
	npm run lint

test:
	npm test

.PHONY: install setup lint test
