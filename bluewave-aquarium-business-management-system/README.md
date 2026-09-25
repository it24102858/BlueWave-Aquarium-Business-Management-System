# BlueWave Aquarium Business Management System

A personal business management web application developed for **BlueWave Aquarium** to manage daily sales, fish inventory, fish food, aquarium accessories, revenue, expenses, pricing, profit margins, and monthly financial records.

## Overview

The BlueWave Aquarium Business Management System is designed for personal business management rather than customer-facing e-commerce.

The system helps manage:

* Daily fish sales
* Fish inventory
* Fish purchases
* Fish food products
* Aquarium accessories
* Wholesale and selling prices
* Price and profit margin history
* Daily revenue and expenses
* Monthly revenue and profit
* Stock levels
* Transaction history
* Business reports

The application automatically calculates important financial information from the records entered into the system.

## Main Features

### Dashboard

The dashboard provides an overview of the aquarium business, including:

* Today's revenue
* Today's expenses
* Today's profit
* Fish sold today
* Monthly revenue
* Monthly profit
* Total inventory
* Low-stock products
* Recent transactions
* Sales and revenue charts

### Fish Inventory

Manage different fish varieties available in the aquarium business.

Each fish can contain:

* Fish name
* Variety
* Category
* Wholesale purchase price
* Selling price
* Profit margin
* Profit margin percentage
* Current stock
* Minimum stock level
* Supplier
* Description

### Daily Sales

Record daily sales for:

* Live fish
* Fish food
* Aquarium accessories

The system calculates:

* Quantity
* Selling price
* Total sales amount
* Purchase cost
* Gross profit
* Profit margin

Stock is automatically reduced when a sale is recorded.

### Fish Purchases

Record wholesale fish purchases and automatically update inventory.

Purchase records include:

* Purchase date
* Fish variety
* Supplier
* Quantity
* Wholesale price
* Total purchase cost
* Notes

### Fish Food

Manage fish food products separately.

Features include:

* Product management
* Wholesale price
* Selling price
* Stock management
* Profit margin calculation
* Purchase history
* Price history
* Low-stock alerts
* Sales tracking

### Aquarium Accessories

Manage aquarium equipment and accessories separately.

Examples include:

* Aquarium tanks
* Filters
* Air pumps
* Water pumps
* Aquarium lights
* Heaters
* Fish nets
* Water conditioners
* Aquarium decorations
* Gravel and sand
* Air stones
* Cleaning equipment

The system tracks purchase prices, selling prices, stock, sales, and profit margins.

### Price and Margin History

Maintain historical pricing information for products.

The system records:

* Previous wholesale price
* Current wholesale price
* Previous selling price
* Current selling price
* Profit margin
* Profit margin percentage
* Price change date

Old pricing records are preserved instead of being overwritten.

### Revenue and Expenses

Manage daily business finances.

Revenue can come from:

* Fish sales
* Fish food sales
* Aquarium accessory sales
* Additional income

Expenses can include:

* Fish purchases
* Fish food purchases
* Aquarium equipment
* Fish food
* Electricity
* Water
* Transportation
* Fish treatments
* Maintenance
* Other business expenses

### Monthly Reports

Automatically generate monthly financial information based on recorded transactions.

Reports include:

* Monthly revenue
* Total fish sold
* Cost of goods sold
* Gross profit
* Operating expenses
* Net profit
* Total purchases
* Additional income
* Best-selling products
* Profit margin

Monthly reports can be filtered by month and year.

### Transaction History

Maintain a complete history of business transactions.

Transaction types include:

* Sales
* Purchases
* Expenses
* Additional income
* Inventory adjustments
* Price changes

Transactions can be searched and filtered by date and type.

## Financial Calculations

### Total Sales

```text
Quantity Sold × Selling Price
```

### Gross Profit

```text
Sales Revenue − Cost of Goods Sold
```

### Profit Per Unit

```text
Selling Price − Purchase Cost
```

### Profit Margin

```text
(Gross Profit ÷ Sales Revenue) × 100
```

### Net Profit

```text
Gross Profit + Additional Income − Operating Expenses
```

### Inventory

```text
Previous Stock + Purchases − Sales + Adjustments
```

The system should use the appropriate historical purchase cost when calculating profit rather than simply using the latest purchase price.

## Technology Stack

### Frontend

* React
* Vite
* JavaScript / TypeScript
* CSS
* Recharts

### Backend

* Node.js
* Express.js
* REST API

### Database

* MongoDB
* MongoDB Atlas

### Authentication

* JWT
* Secure password authentication

## Project Structure

```text
bluewave-aquarium-business-management-system/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.*
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── server.*
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

The exact structure may vary depending on the implementation.

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project:

```bash
cd bluewave-aquarium-business-management-system
```

Install dependencies:

```bash
npm install
```

If the frontend and backend use separate package files:

```bash
cd client
npm install

cd ../server
npm install
```

## Environment Variables

Create a `.env` file in the appropriate backend directory.

Example:

```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Do not commit `.env` files to GitHub.

## Running the Application

Start the development server:

```bash
npm run dev
```

If frontend and backend are separate:

```bash
npm run dev
```

or start them individually according to the project configuration.

The application may be available at:

```text
http://localhost:3000
```

## UI Design

The application uses an aquarium-inspired color system.

### Primary Colors

```text
Ocean Blue
#0077B6

Light Blue
#90E0EF

White
#FFFFFF

Pale Blue
#F0F9FF

Dark Navy
#12304A

Turquoise
#00B4D8
```

The interface focuses on:

* Clean dashboard cards
* White content areas
* Blue navigation
* Light-blue highlights
* Simple forms
* Responsive tables
* Clear financial charts
* Easy navigation

## Main Navigation

```text
Dashboard
Daily Sales
Fish Inventory
Fish Purchases
Fish Food
Aquarium Accessories
Price & Margin History
Revenue & Expenses
Monthly Reports
Transaction History
Settings
```

## Database Collections

The application can use the following MongoDB collections:

```text
Users
FishVarieties
FishFoodProducts
AquariumAccessories
Sales
Purchases
Expenses
AdditionalIncome
PriceHistory
InventoryAdjustments
```

## Future Improvements

Possible future features include:

* PDF invoice generation
* CSV/Excel export
* Automatic database backup
* Supplier management
* Customer records
* Barcode scanning
* Product images
* Advanced profit analytics
* Stock valuation
* Expense analytics
* Yearly financial reports
* Multi-user access
* Mobile application
* Cloud deployment

## Purpose

This system is built specifically for the personal management of **BlueWave Aquarium**.

The main objective is to make it easier to:

* Record daily business activities
* Track fish and product inventory
* Monitor wholesale and selling prices
* Calculate profit margins
* Track revenue and expenses
* Understand monthly business performance
* Maintain historical business records

## License

This project is intended for personal business management and development purposes.
