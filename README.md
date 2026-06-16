# SummerPro - Local Services Booking Platform

A modern, responsive web application for booking local services including bin cleaning, car detailing, junk removal, and moving help in Collin County, TX.

## Features

- **Service Booking**: Easy-to-use booking interface for multiple services
- **Deposit System**: Secure deposit handling with multiple payment methods (Cash App, Venmo, PayPal, Zelle, Cash)
- **Monthly Subscriptions**: Subscribe to monthly plans and save
- **Real-time Availability Calendar**: View and manage service availability
- **Reviews & Ratings**: Customer reviews and 5-star rating system
- **Admin Panel**: Manage bookings, block dates, and track subscriptions
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Local Storage**: Persistent data storage for bookings and preferences

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Modern CSS** - Inline styling with responsive design
- **No external component libraries** - Pure React implementation

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/seanmotsi/Summer-Pro.git
cd Summer-Pro
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
Summer-Pro/
├── src/
│   ├── App.jsx          # Main application component with all pages
│   └── main.jsx         # React entry point
├── index.html           # HTML template
├── package.json         # Project dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Key Pages

- **Home** - Landing page with services overview, pricing, reviews, and contact
- **Book** - Service booking form with date/time selection
- **Checkout** - Deposit payment processing with multiple payment methods
- **Cancel** - Booking cancellation with refund policy notice
- **Schedule** - Real-time availability calendar showing booked/blocked dates
- **Reviews** - Customer reviews with rating filter and review submission
- **About** - Company information, values, and FAQ

## Services Offered

### One-Time Services
- Bin Cleaning: Single ($20) or Both bins ($35)
- Car Detailing: Interior ($50), Exterior ($40), Full detail ($80)
- Junk Removal: Quote-based starting at $70
- Moving Help: $28/hr or $65 for small moves

### Monthly Plans
- Clean Bins: $28/mo
- Clean Car: $65/mo
- Bins + Car (Most Popular): $88/mo
- Full Bundle (Best Value): $149/mo

## Admin Features

Access the admin panel with PIN `1302` to:
- Block/unblock service dates
- View all bookings and their details
- Manage active subscriptions
- Track blocked dates calendar
- Monitor booking status

## Deposit Policy

- Deposits are **non-refundable** per policy
- Can be rescheduled by texting before appointment
- Deposits range from $5–$40 depending on service
- Multiple payment methods available

## Payment Methods

- 💚 **Cash App**: $eanMotsi
- 💙 **Venmo**: @Sean-Motsi
- 💛 **PayPal**: SeanMotsi1302
- 🟣 **Zelle**: (469) 258-5342
- 💵 **Cash on Arrival**

## Contact Information

- **Phone/Text**: (469) 258-5342
- **Email**: smots07@gmail.com
- **Service Area**: Collin County, TX
- **Hours**: Mon–Sat 8am–8pm, Sun 1pm–8pm

## Development Notes

- All data is stored in browser local storage
- No backend API required for MVP
- Responsive design optimized for mobile-first experience
- All styling is inline using JavaScript objects
- Fonts: Bebas Neue (headings) and DM Sans (body)

## License

© 2025 SummerPro Services - Sean Motsi

---

**Built by Sean Motsi** | Student-run, real service, affordable pricing
