# 📋 Healthgrades Doctor Directory Scraper

Effortlessly extract detailed doctor listings from [Healthgrades.com](https://www.healthgrades.com) using a lightweight and fast HTML parser powered by CheerioCrawler on Apify.

---

### 🔍 Key Features

* **Fast & Lightweight**: Uses Cheerio instead of a browser for blazing-fast performance.
* **Comprehensive Data Extraction**: Retrieve doctor names, specialties, addresses, ratings, review counts, detailed practice locations, and more.
* **Customizable Search**: Target your scrape with specialty and location filters.
* **Pagination Support**: Automatically queues next pages to collect deeper results.
* **Proxy Integration**: Supports Apify Proxy and custom proxy settings to help avoid IP blocks.

---

## 🌟 Use Cases

* **Healthcare Marketing** – Build targeted contact lists of healthcare professionals.
* **Market Intelligence** – Monitor provider availability by region or specialty.
* **Data Enrichment** – Add missing provider data to existing databases.
* **Lead Generation** – Identify potential medical partners or prospects.

---

## 🛠️ Input Configuration

Configure the actor with the following fields:

| Field                | Type    | Description                       | Example         |
| -------------------- | ------- | --------------------------------- | --------------- |
| `specialty`          | String  | Doctor specialty to search for    | `"Cardiologist"`  |
| `location`           | String  | City, state, or ZIP to search     | `"Portland, OR"`  |
| `maxPages`           | Integer | Max number of pages to scrape (0 = no limit) | `5` |
| `proxyConfiguration` | Object  | Apify Proxy or custom proxy usage | Enabled |

---

## 📄 Output

Each result is returned as a structured JSON object containing:

### Basic Information
- `name`: Doctor's name
- `profileUrl`: Direct link to doctor's Healthgrades profile
- `doctorSpecialty`: Medical specialty
- `rating`: Star rating
- `reviewCount`: Number of patient reviews
- `address`: Formatted practice address from search results
- `attributes`: Patient feedback highlights
- `imageUrl`: Doctor's photo URL (if available)

### Detailed Practice Locations
- `locations`: Array of practice locations with detailed information:
  - `practiceName`: Name of the practice/facility
  - `streetAddress`: Street address
  - `city`: City
  - `state`: State
  - `postalCode`: ZIP/postal code
  - `phone`: Phone number
  - `fax`: Fax number (if available)

**Example:**

```json
{
  "name": "Dr. Jane Smith, MD",
  "profileUrl": "https://www.healthgrades.com/physician/dr-jane-smith-abc123",
  "doctorSpecialty": "Specialty: Cardiology",
  "rating": "4.8",
  "reviewCount": "(85 ratings)",
  "address": "123 Heartbeat Ln Ste 200Portland, OR 97201",
  "attributes": [
    "Listened/answered questions (65)",
    "Explains conditions well (62)",
    "Found trustworthy (58)"
  ],
  "imageUrl": "https://dims.healthgrades.com/dims3/MMH/format/webp/?url=https://example.com/photo.jpg",
  "locations": [
    {
      "practiceName": "Heart Center of Excellence",
      "streetAddress": "123 Heartbeat Ln Ste 200",
      "city": "Portland",
      "state": "OR",
      "postalCode": "97201",
      "phone": "(503) 555-0123",
      "fax": "(503) 555-0124"
    },
    {
      "practiceName": "Cardiac Specialists Group",
      "streetAddress": "456 Medical Plaza Dr",
      "city": "Beaverton",
      "state": "OR",
      "postalCode": "97005",
      "phone": "(503) 555-0125",
      "fax": null
    }
  ]
}