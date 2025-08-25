# SuvidhaSetu

A React-based dashboard to manage AMC calculations, warranty tracking, and payment summaries. Built with Tailwind CSS, Recharts, Lucide icons, and XLSX export support.

---

##  Features

- 📊 AMC Calculator with quarter-wise visualization
- 📅 Warranty tracker with automated status updates
- 📥 Excel export using `xlsx`
- 📌 Responsive UI built with Tailwind CSS
- 📈 Interactive charts powered by Recharts

---

##  Prerequisites
Ensure the following are installed in your system:

- Node.js (v16+ recommended)
- npm
- Git

---




### Install the following in terminal, the path should be your project directory
```bash
npm install

npm install lucide-react
npm install xlsx
npm install xlsx file-saver
npm install jspdf jspdf-autotable
npm install exceljs
npm install recharts
npm install react-router-dom
npm install -D @tailwindcss/postcss
npm install antd @ant-design/icons react-window react-window-infinite-loader web-vitals

#To Start the development server
npm start

---

### Required Excel Columns
```bash

To ensure correct AMC and warranty processing, your Excel file **must** include the following columns:

| Column Name       | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| Item Name         | Name of the product (e.g., Laptop, Server, Software License).               |
| Cost              | Invoice value or cost of the product (numeric).                             |
| Invoice Number    | Unique invoice identifier for the product(takes characters aswell)          |
| Location          | Location/site of the product installation.                                  |
| UAT Date          | User Acceptance Testing / Installation / Go-Live date (used for AMC start). |
| Quantity          | Number of product units or Qty (default = 1 if not provided).               |

 **Important Notes**  
- Column names should match exactly as above (case-insensitive).  
- Additional columns are allowed but will be ignored.  
- If any required column is missing, the file will be rejected or default values will be applied.  
