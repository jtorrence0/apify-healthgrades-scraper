# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Apify actor that scrapes doctor listings from Healthgrades.com using CheerioCrawler for fast, lightweight extraction. The scraper extracts comprehensive doctor data including names, specialties, addresses, ratings, and review counts.

## Common Commands

### Development
- `npm start` - Run the scraper (executes `node src/main.js`)
- `npm run lint` - Check code style with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm test` - No tests configured yet (exits with status 1)

### Running the Actor
The main entry point is `src/main.js`. The actor expects input configuration:
- `specialty` (string): Doctor specialty to search for
- `location` (string): City, state, or ZIP to search
- `maxPages` (integer): Maximum pages to scrape (0 = no limit, default: 1)
- `proxyConfiguration` (object): Apify Proxy configuration

## Architecture

### Core Components

**main.js** - Main crawler implementation
- Uses CheerioCrawler with Apify integration
- Handles pagination automatically by detecting next page links
- Extracts doctor profiles from search results pages
- Saves data to Apify dataset in structured JSON format

**routes.js** - Router configuration (appears to be template/unused)
- Contains sample routing logic for Apify.com crawling
- Not used by the current Healthgrades scraper implementation

### Data Flow
1. Takes input parameters (specialty, location, maxPages, proxy config)
2. Constructs search URL for Healthgrades
3. Crawls search result pages using CSS selectors to extract doctor data
4. Automatically follows pagination links up to maxPages limit
5. Saves extracted data to Apify dataset storage

### Storage Structure
- `storage/datasets/default/` - Contains scraped doctor profiles as numbered JSON files
- `storage/key_value_stores/default/` - Apify metadata and crawler statistics
- `storage/request_queues/default/` - Crawler request queue state

### Data Extraction Selectors
The scraper uses these key CSS selectors:
- `[data-qa-target^="pro-card-natural-"]` - Doctor profile cards
- `[data-qa-target="provider-name-link"]` - Doctor name and profile URL
- `[data-qa-target="provider-specialty"]` - Medical specialty
- `[data-qa-target="rating-score"]` - Star rating
- `[data-qa-target="rating-count"]` - Review count
- `[data-qa-target="location-info-address"]` - Practice address
- `[data-qa-target="location-info-distance"]` - Distance from search location
- `[data-qa-target="provider-card-provider-img"]` - Doctor profile image
- `[data-qa-target="office-locations"]` - Profile page locations container
- `[data-qa-target="Practice-Name"]` - Per-location anchor on profile pages
- `[data-qa-target="visit-open-phone"]` - Office phone number on profile pages

## Configuration

- Uses `@apify/eslint-config` for code style
- ES modules enabled (`"type": "module"` in package.json)
- Proxy support through Apify's proxy configuration
- Concurrency limited to 5 requests maximum
- Hard page limit set to 100 pages maximum