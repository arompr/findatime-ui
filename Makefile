.PHONY: dev build container-dev

VITE_API_URL ?= http://localhost:5263

dev:
	VITE_API_URL=$(VITE_API_URL) npm run dev

build:
	npm run build

container:
	podman build --secret id=npmrc,src=$(HOME)/.npmrc -t findatime-ui .

container-dev: container
	@echo "findatime-ui available at http://localhost:8080"
	podman run --rm -p 127.0.0.1:8080:80 findatime-ui
