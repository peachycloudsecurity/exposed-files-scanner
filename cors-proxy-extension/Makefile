# CORS Proxy Extension - build for Chrome and Firefox
# Run from this directory: make [chrome|firefox|all|clean]

EXT_NAME := cors-proxy-extension
CHROME_ZIP := $(EXT_NAME)-chrome.zip
FIREFOX_XPI := $(EXT_NAME).xpi
FILES := manifest.json background.js content.js README.md icon16.png icon48.png icon128.png

.PHONY: all chrome firefox clean

all: chrome firefox

chrome: $(CHROME_ZIP)

firefox: $(FIREFOX_XPI)

$(CHROME_ZIP): $(FILES)
	zip -r $(CHROME_ZIP) $(FILES) -x "*.DS_Store"
	@echo "Chrome: Load unpacked from this folder, or install $(CHROME_ZIP) as needed."

$(FIREFOX_XPI): $(FILES)
	zip -r $(FIREFOX_XPI) $(FILES) -x "*.DS_Store"
	@echo "Firefox: about:debugging -> Load Temporary Add-on -> pick $(FIREFOX_XPI) or this folder."

clean:
	rm -f $(CHROME_ZIP) $(FIREFOX_XPI)
