# SkyLane Air Cargo: Digital Business App

A single-page web app for a fictional air cargo logistics company based at Ahmedabad airport (AMD).
Built by **Mohit Yadav** (MBA, Logistics and Supply Chain Management, Gati Shakti Vishwavidyalaya) for the
ITBT live class exercise "Build a Digital Business App".

**Live site:** `https://<your-github-username>.github.io/<repository-name>/`

## The business

| Question | Answer |
|---|---|
| Business | SkyLane Air Cargo, an air cargo logistics service |
| Problem | Shippers book air freight but cannot see where their cargo is, why it is delayed, or what it will cost |
| Customer | Exporters (pharma, textiles, engineering parts), e-commerce sellers and manufacturers with urgent freight |
| App | Booking-to-delivery shipment tracker with a manager's operations dashboard |
| Dashboard | Shipment volumes, on-time delivery, delays, tonnage, routes and customer satisfaction |

## Sections of the website

1. **Home**: business name, logo, purpose, short description and a "Get started" button
2. **About**: what the company does, target customers, service area and value proposition
3. **Services**: rate table with six services, plus links to customs and aviation rules
4. **Dashboard**: 8 KPIs, 4 charts and a table of delayed shipments to resolve first
5. **Contact**: email, phone, location, Google Maps link and an enquiry form

## Interactive feature: shipment tracking

Enter an air waybill number in the tracker and the app shows the status, route, flight, estimated arrival and a stage-by-stage timeline.
Sample numbers to try:

| Waybill | Status |
|---|---|
| SLC1001 | Delivered |
| SLC1025 | In Transit |
| SLC1042 | Delayed (customs documents pending) |
| SLC1050 | Booked |
| SLC1066, SLC1073, SLC1088 | Delayed |

## Hyperlinks and why they exist

| Link | Business purpose |
|---|---|
| Home "Get started" to Tracker | Takes a new visitor to the most useful action first |
| Services "Get a quote" to Contact | Moves a shopper from price to enquiry and preselects the service |
| Dashboard "Track" to Tracker | Lets a manager open the full status of a delayed waybill |
| Contact "Open in Google Maps" | Shows drivers and shippers where to deliver cargo |
| Email (`mailto:`) and phone (`tel:`) | Direct line to the 24x7 cargo desk |
| ICEGATE | Shippers file export shipping bills before cargo arrives |
| IATA Dangerous Goods Regulations | Shippers check packing rules before booking the DG add-on |
| DGCA and BCAS | Aviation and security rules that apply to every consignment |

## Dashboard: what the manager needs to know immediately

- Total shipments, delivered, in transit and delayed (is the day under control?)
- On-time delivery against the 95% target (are we meeting promises?)
- Customer satisfaction (are customers happy?)
- Cargo uplifted in tonnes and average transit time (how busy and how fast are we?)
- Delayed shipments with reason and hours lost (what do I fix first?)

All figures are sample data defined at the top of `script.js`.

## Files

```
index.html     page structure and content
style.css      design and responsive layout
script.js      tracker, dashboard charts, enquiry form, navigation
images/        logo.svg, favicon.svg, runway.svg
README.md      this file
```

No frameworks, no build step and no libraries. Charts are drawn with plain SVG in `script.js`.
Only the Google Fonts stylesheet loads from the internet; the page still works without it.

## Publish on GitHub Pages

1. Create a new public repository named like `MohitYadav-AirCargoApp`.
2. Upload `index.html`, `style.css`, `script.js`, `README.md` and the `images` folder to the **root** of the repository.
3. Go to **Settings > Pages**. Under "Build and deployment", choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, then click **Save**.
4. Wait one to two minutes. The live link appears at the top of the Pages screen.

## Customise before submitting

- Replace the placeholder email and phone in `index.html` and in `script.js` (search for `skylanecargo.example`).
- Change business name, rates, KPIs and shipment data to your own numbers.
- Note: the enquiry form is a front-end demo. It confirms the enquiry on screen and offers an email link; it does not store data on a server.

## 2-minute presentation answers

1. **What is your business?** SkyLane Air Cargo, an air freight company at Ahmedabad airport.
2. **What problem are you solving?** Shippers cannot see where their cargo is or why it is late.
3. **Who is your customer?** Exporters, e-commerce sellers and manufacturers with time-critical freight.
4. **What does your app do?** Tracks a shipment by waybill number, lists services with rates, and takes enquiries.
5. **What does your dashboard tell the manager?** Volumes, delays, on-time rate, tonnage, top routes and which delayed shipments to fix first.
