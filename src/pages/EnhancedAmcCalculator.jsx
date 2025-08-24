import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector} from "react-redux";
import VirtualDataTable from "../components/VirtualDataTable";
import QuarterlyDataTable from "../components/QuarterlyDataTable";
import CalculationProgress from "../components/CalculationProgress";
import CacheManager from "../components/CacheManager";
import AMCChartsView from "../components/AMCChartsView";
import { useAMCCalculationWorker } from "../hooks/useWebWorker";
import { useAMCCache } from "../hooks/useCalculationCache";

// Import Redux
import {
  selectExcelData,
  selectHasData,
  selectFileName,
} from "../store/selectors/excelSelectors";

// Custom formatter for Indian number system
const formatIndianNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const numStr = Math.abs(num).toString();
  const [integerPart, decimalPart] = numStr.split('.');
  
  if (integerPart.length <= 3) {
    return (num < 0 ? '-' : '') + integerPart + (decimalPart ? '.' + decimalPart : '');
  }
  
  // Format integer part with Indian number system
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  
  const formatted = formattedOthers + ',' + lastThree;
  return (num < 0 ? '-' : '') + formatted + (decimalPart ? '.' + decimalPart : '');
};

// Custom currency formatter
const formatIndianCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) return showSymbol ? '₹0' : '0';
  
  const formatted = formatIndianNumber(amount);
  return showSymbol ? `₹${formatted}` : formatted;
};



// Manual Product Form Component
const ManualProductForm = ({ onAddProduct }) => {
  const [formData, setFormData] = useState({
    productName: "",
    invoiceValue: "",
    invoiceNumber: "",
    quantity: 1,
    location: "",
    uatDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = () => {
    const { productName, invoiceValue, invoiceNumber, quantity, location, uatDate } = formData;

    if (
      !productName.trim() ||
      !invoiceValue ||
      parseFloat(invoiceValue) <= 0 ||
      !invoiceNumber.trim() ||
      invoiceNumber.length < 1 ||
      invoiceNumber.length > 25 ||
      !location.trim() ||
      !uatDate
    ) {
      alert("Please fill in all required fields with valid values.");
      return;
    }

    const manualProduct = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productName: productName.trim(),
      invoiceValue: parseFloat(invoiceValue),
      invoiceNumber: invoiceNumber.trim() || '',
      quantity: parseInt(quantity) || 1,
      location: location.trim(),
      uatDate: uatDate,
      roi: 0, 
    };

    onAddProduct(manualProduct);

    // Reset form
    setFormData({
      productName: "",
      invoiceValue: "",
      invoiceNumber: "",
      quantity: 1,
      location: "",
      uatDate: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Product Name *
          </label>
          <input
            type="text"
            placeholder="Enter product name"
            value={formData.productName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, productName: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>
        
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Invoice Value (₹) *
          </label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={formData.invoiceValue}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, invoiceValue: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Invoice Number *
          </label>
          <input
            type="text"
            placeholder="Enter invoice number"
            value={formData.invoiceNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value.replace(/\D/g, '') })) // Allow only digits
            }
            maxLength={20}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Quantity
          </label>
          <input
            type="number"
            placeholder="1"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, quantity: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Location *
          </label>
          <input
            type="text"
            placeholder="Enter location"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            UAT Date *
          </label>
          <input
            type="date"
            value={formData.uatDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, uatDate: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: "12px 24px",
            backgroundColor: "#059669",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          ➕ Add Product
        </button>
      </div>
    </>
  );
};

const EnhancedAmcCalculator = () => {
  // Redux selectors
  const excelData = useSelector(selectExcelData);
  const hasExcelData = useSelector(selectHasData);
  const fileName = useSelector(selectFileName);

  // Local state
  const [settings, setSettings] = useState({
    roiRates: [20, 22.5, 27.5, 30],
    amcPercentage: 0.4,
    gstRate: 0.18,
    amcYears: 4,
    chunkSize: 1000,
  });
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [showCacheManager, setShowCacheManager] = useState(false);
  const [useCache] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedROI, setSelectedROI] = useState(null);
  const [showSplitDetails, setShowSplitDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showWithoutGST, setShowWithoutGST] = useState(false);
  const [manualProducts, setManualProducts] = useState([]);
  const [viewMode, setViewMode] = useState("table"); 

  // Update ROI rates array when AMC years change
  useEffect(() => {
    setSettings((prev) => {
      const currentLength = prev.roiRates.length;
      const newLength = prev.amcYears;

      if (currentLength === newLength) return prev; 

      let newRoiRates = [...prev.roiRates];

      if (newLength > currentLength) {
        // Add new rates for additional years (default to last rate + 2.5%)
        const lastRate = newRoiRates[newRoiRates.length - 1] || 30;
        for (let i = currentLength; i < newLength; i++) {
          newRoiRates.push(lastRate + (i - currentLength + 1) * 2.5);
        }
      } else {
        // Trim excess rates
        newRoiRates = newRoiRates.slice(0, newLength);
      }

      return {
        ...prev,
        roiRates: newRoiRates,
      };
    });
  }, [settings.amcYears]);

  // Process Excel data when available 
  const parseExcelDate = (dateValue) => {
    if (!dateValue) return new Date().toISOString().split("T")[0];

    // Handle various date formats
    const dateStr = String(dateValue).trim();

    // If it's already a valid date string
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    // Handle Excel serial numbers (like 44562 for Oct 18, 2021)
    if (!isNaN(dateStr) && dateStr.length <= 6) {
      const serialNumber = parseInt(dateStr);
      if (serialNumber > 0 && serialNumber < 100000) {
        
const excelEpoch = new Date(1900, 0, 1); 
        let resultDate = new Date(
          excelEpoch.getTime() + (serialNumber - 1) * 24 * 60 * 60 * 1000
        );

       
        // Excel incorrectly thinks 1900 was a leap year and includes Feb 29, 1900
        if (serialNumber > 59) {
          // 59 = Feb 28, 1900 in Excel
          resultDate = new Date(resultDate.getTime() - 24 * 60 * 60 * 1000); // Subtract 1 day
        }

        return resultDate.toISOString().split("T")[0];
      }
    }

    // Handle DD-MMM-YY format specifically (like "18-Oct-21") 
    const ddMmmYyMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (ddMmmYyMatch) {
      const [, day, monthStr, year] = ddMmmYyMatch;
      const monthMap = {
        jan: "01",
        feb: "02",
        mar: "03",
        apr: "04",
        may: "05",
        jun: "06",
        jul: "07",
        aug: "08",
        sep: "09",
        oct: "10",
        nov: "11",
        dec: "12",
      };
      const month = monthMap[monthStr.toLowerCase()];
      if (month) {
        // Handle 2-digit years - assume 2000s for years 00-99
        const fullYear = `20${year}`;
        const formattedDate = `${fullYear}-${month}-${day.padStart(2, "0")}`;
        
        return formattedDate;
      }
    }

    // Handle DD-MMM-YYYY format (4-digit year)
    const ddMmmYyyyMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (ddMmmYyyyMatch) {
      const [, day, monthStr, year] = ddMmmYyyyMatch;
      const monthMap = {
        jan: "01",
        feb: "02",
        mar: "03",
        apr: "04",
        may: "05",
        jun: "06",
        jul: "07",
        aug: "08",
        sep: "09",
        oct: "10",
        nov: "11",
        dec: "12",
      };
      const month = monthMap[monthStr.toLowerCase()];
      if (month) {
        const formattedDate = `${year}-${month}-${day.padStart(2, "0")}`;
        
        return formattedDate;
      }
    }

    // Handle text dates like "Oct 18, 2021"
    try {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        const formattedDate = parsedDate.toISOString().split("T")[0];
        
        return formattedDate;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to parse date: ${dateStr}`);
    }

    // Default fallback
    const today = new Date().toISOString().split("T")[0];
    console.warn(
      `⚠️ Using today's date as fallback for: ${dateStr} -> ${today}`
    );
    return today;
  };

  const processedExcelData = useMemo(() => {
    let processed = [];

    // Process Excel data if available
    if (excelData && Object.keys(excelData).length > 0) {
      const firstSheetName = Object.keys(excelData)[0];
      const sheetData = excelData[firstSheetName] || [];

      processed = sheetData
        .map((row, index) => ({
          id: `excel_${index}`,
          productName:
            row["Item Name"] ||
            row["Product Name"] ||
            row.productName ||
            row.name ||
            `Product ${index + 1}`,
          invoiceValue: (() => {
            let costStr = String(
              row["Cost"] ||
                row["Invoice Value"] ||
                row.invoiceValue ||
                row.cost ||
                0
            );
            costStr = costStr
              .replace(/[₹$,\s]/g, "")
              .replace(/\.00$/, "")
              .trim();
            const parsed = parseFloat(costStr || 0);
            if (parsed > 0 && parsed < 1000) {
              console.warn(
                `⚠️ Small cost value detected for ${
                  row["Item Name"] || "Unknown"
                }: ₹${parsed}. Original: ${row["Cost"]}`
              );
            }
            return parsed;
          })(),
          invoiceNumber: String(
            row["Invoice Number"] ||
            row.invoiceNumber ||
            row["Invoice No"] ||
            row["Invoice No."] || ''
          ),
          location: row.Location || row.location || "Unknown",
          //  DATE PARSING 
          uatDate: parseExcelDate(
            row["UAT Date"] ||row["UAT DATE"] ||
              row.uatDate ||
              row.date ||
              row["Date"] ||
              row["Installation Date"] ||
              row["Go Live Date"]
          ),
          quantity: parseInt(
            String(row.Quantity || row.quantity || 1).replace(/,/g, "") || 1
          ),
          category: row.Category || row.category || "General",
          roi: parseFloat(
            String(row.ROI || row.roi || 0).replace(/[(),%]/g, "") || 0
          ),
        }))
        .filter((item) => {
          if (!item.productName) {
            console.warn("⚠️ Product filtered out: Missing product name");
            return false;
          }
          if (item.invoiceValue <= 0) {
            console.warn(
              `⚠️ Product filtered out: Invalid cost for ${item.productName}: ₹${item.invoiceValue}`
            );
            return false;
          }
          
          return true;
        });
    }

    // Add manual products
    const combinedData = [...processed, ...manualProducts];
    return combinedData;
  }, [fileName, manualProducts]);

  // Web Worker hook
  const {
    isReady: workerReady,
    error: workerError,
    progress,
    results,
    summary,
    calculateAMCForDataset,
    terminate,
  } = useAMCCalculationWorker();

  // Cache hook (now processedExcelData is available)
  const {
    isSupported: cacheSupported,
    cachedResult,
    hasCachedResult,
    storeCachedResult,
    isOnline,
    cacheStats,
  } = useAMCCache(processedExcelData, settings);

  // Check if we have calculations (from worker or cache)
  const hasCalculations = results.length > 0 || hasCachedResult;
  const isCalculating = progress.isProcessing;
  const rawResults =
    hasCachedResult && useCache ? cachedResult.results : results;
  const currentSummary = useMemo(() => {
    if (hasCachedResult && useCache && cachedResult.metadata) {
      return cachedResult.metadata;
    }
    if (results.length === 0) return summary;
    const totalValue = results.reduce((sum, r) => {
    // Use the actual quarter amounts, not the rounded display values
    const quarterTotal = (r.quarters || []).reduce((qSum, q) => qSum + (q.totalAmount || 0), 0);
    return sum + quarterTotal;
  }, 0);
  
  return {
    ...summary,
    totalValue: Math.round(totalValue * 100) / 100  // Round only final display value
  };
}, [results, summary, hasCachedResult, useCache, cachedResult]);

  // Transform data to match Excel AMC Schedule format 
  const currentResults = useMemo(() => {
    if (!rawResults || rawResults.length === 0) return [];

    return rawResults.map((product) => {
      // Start with base product data
      const row = {
        productName: product.productName,
        location: product.location || "Unknown",
        invoiceValue: product.invoiceValue,
        invoiceNumber: product.invoiceNumber ,
        quantity: product.quantity,
        amcStartDate: product.amcStartDate,
        uatDate: product.uatDate,
      };

      // Add quarter data as individual columns (quarter-year format for readability)
      if (product.quarters && Array.isArray(product.quarters)) {
        // Sort quarters chronologically before processing
        const sortedQuarters = [...product.quarters].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          const quarterOrder = { JFM: 0, AMJ: 1, JAS: 2, OND: 3 };
          return quarterOrder[a.quarter] - quarterOrder[b.quarter];
        });

        sortedQuarters.forEach((quarter) => {
          const quarterKey = `${quarter.quarter}-${quarter.year}`;
          row[quarterKey] = quarter.totalAmount; // Amount with GST
        });
      }

      return row;
    });
  }, [rawResults]);

  // Process results for display with totals and options
  const {
    filteredResults,
    quarterTotals,
    yearTotals,
    locationOptions,
    roiOptions,
  } = useMemo(() => {
    if (!currentResults || currentResults.length === 0) {
      return {
        filteredResults: [],
        quarterTotals: {},
        yearTotals: {},
        locationOptions: ["All Locations"],
        roiOptions: [],
      };
    }

    // Get unique locations and ROI options
    const locations = [
      "All Locations",
      ...new Set(currentResults.map((r) => r.location).filter(Boolean)),
    ];
    const roiGroups = [settings.roiRates]; // For now, just use current settings

    // Simple filtering (can be enhanced later)
    const filtered = currentResults;

    // Calculate quarter and year totals from the flattened data
    const qTotals = {};
    const yTotals = {};

    // Extract quarter data from rawResults for totals calculation
    if (rawResults && rawResults.length > 0) {
      rawResults.forEach((product) => {
        if (product.quarters && Array.isArray(product.quarters)) {
          product.quarters.forEach((quarter) => {
            const key = `${quarter.quarter}-${quarter.year}`;

            // Quarter totals
            if (!qTotals[key]) {
              qTotals[key] = {
                withGst: 0,
                withoutGst: 0,
                quarter: quarter.quarter,
                year: quarter.year,
              };
            }
            qTotals[key].withGst += quarter.totalAmount || 0;
            qTotals[key].withoutGst += quarter.baseAmount || 0;

            // Year totals
            if (!yTotals[quarter.year]) {
              yTotals[quarter.year] = { withGst: 0, withoutGst: 0 };
            }
            yTotals[quarter.year].withGst += quarter.totalAmount || 0;
            yTotals[quarter.year].withoutGst += quarter.baseAmount || 0;
          });
        }
      });
    }

    return {
      filteredResults: filtered,
      quarterTotals: qTotals,
      yearTotals: yTotals,
      locationOptions: locations,
      roiOptions: roiGroups,
    };
  }, [currentResults, rawResults, settings.roiRates]);
  


  // Handle AMC calculation
  const handleCalculate = useCallback(async () => {
    
    if (!hasExcelData && processedExcelData.length === 0) {
      
      alert(
        "Please upload an Excel file from the dashboard or add manual products below"
      );
      return;
    }

    if (processedExcelData.length === 0) {
    
      alert(
        "No valid products found. Please:\n- Upload an Excel file with Item Name, Cost, and Location columns, OR\n- Add products manually using the form above"
      );
      return;
    }

    if (!workerReady) {
      
      alert(
        "Calculation engine is loading. Please wait a moment and try again."
      );
      return;
    }

    try {
      
      if (hasCachedResult && useCache) {
        
        return;
      }

      // Start fresh calculation
      await calculateAMCForDataset(processedExcelData, settings);

      // Store results in cache after successful calculation
      if (results.length > 0) {
        await storeCachedResult(results, {
          timestamp: Date.now(),
          settings: { ...settings },
          productCount: processedExcelData.length,
          fileName: fileName || "unknown",
        });
      }
    } catch (error) {
      console.error("❌ Calculation error:", error);
    }
  }, [
    hasExcelData,
    isCalculating,
    workerReady,
    hasCachedResult,
    useCache,
    processedExcelData,
    settings,
    calculateAMCForDataset,
    results,
    storeCachedResult,
    fileName,
    excelData,
  ]);

  // Handle quarterly export
  const handleQuarterlyExport = useCallback(
    async (quarterlyData, sheetName = "Quarterly_AMC_Schedule") => {
      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();

        // Create quarterly sheet
        const quarterlySheet = XLSX.utils.json_to_sheet(quarterlyData);
        XLSX.utils.book_append_sheet(workbook, quarterlySheet, sheetName);

        // Download the file
        const locationSuffix =
          selectedLocation !== "All Locations"
            ? `_${selectedLocation.replace(/\s+/g, "_")}`
            : "";
        XLSX.writeFile(
          workbook,
          `${sheetName}${locationSuffix}_${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        );
      } catch (error) {
        
        alert("Failed to export Excel file. Please try again.");
      }
    },
    [selectedLocation]
  );

  // Handle export (use current results - cached or fresh)
  const handleExport = useCallback(
    async (data = rawResults) => {
      if (!data || data.length === 0) return;

      try {
        // Create workbook with multiple sheets
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();

        // Summary sheet
          const totalValue = Math.round(
            results.reduce((sum, r) => sum + (r.totalAmountWithGST || 0), 0) * 100
          ) / 100;
        const summaryData = [
          ["AMC Calculation Summary"],
          ["Generated on:", new Date().toLocaleString()],
          ["Source file:", fileName || "Uploaded data"],
          ["Location filter:", selectedLocation],
          ["Total products:", data.length],
          ["Total AMC value:", `₹${formatIndianCurrency(totalValue)}`],
          ["Calculation settings:"],
          ["AMC percentage:", `${settings.amcPercentage * 100}%`],
          ["GST rate:", `${settings.gstRate * 100}%`],
          ["AMC duration:", `${settings.amcYears} years`],
          ["ROI rates:", settings.roiRates.join(", ") + "%"],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // Main AMC Schedule sheet - single row per product

        const allQuartersSet = new Set();
        data.forEach((product) => {
          if (product.quarters) {
            product.quarters.forEach((quarter) => {
              const quarterKey = `${quarter.quarter}-${quarter.year}`;
              allQuartersSet.add(quarterKey);
            });
          }
        });

        // Sort all quarters chronologically to ensure correct Excel column order
        const quarterOrder = { JFM: 0, AMJ: 1, JAS: 2, OND: 3 };
        const allQuartersSorted = Array.from(allQuartersSet).sort((a, b) => {
          const [quarterA, yearA] = a.split("-");
          const [quarterB, yearB] = b.split("-");
          if (parseInt(yearA) !== parseInt(yearB)) {
            return parseInt(yearA) - parseInt(yearB);
          }
          return quarterOrder[quarterA] - quarterOrder[quarterB];
        });

        // Create base column headers in the correct order
        const baseHeaders = [
          "Product Name",
          "Location",
          "Invoice Value",
          "Quantity",
          "UAT Date",
          "AMC Start Date",
          "Total AMC Value",
          "Total Amount (with GST)",
          "Total Quarters",
        ];

        // Add quarter headers and GST headers if needed
        const quarterHeaders = [];
        allQuartersSorted.forEach((quarterKey) => {
          quarterHeaders.push(quarterKey);
          if (showWithoutGST) {
            quarterHeaders.push(`${quarterKey} (Without GST)`);
          }
        });

        // Define complete header order
        const allHeaders = [...baseHeaders, ...quarterHeaders];

        const mainData = data.map((product) => {
          // Initialize row with all headers set to empty/default values
          const row = {};
          allHeaders.forEach((header) => {
            row[header] = "";
          });

          // Fill in base product data
          row["Product Name"] = product.productName;
          row["Location"] = product.location;
          row["Invoice Value"] = product.invoiceValue;
          row["Invoice Number"] = product.invoiceNumber;
          row["Quantity"] = product.quantity;
          row["UAT Date"] = product.uatDate;
          row["AMC Start Date"] = product.amcStartDate;
          row["Total AMC Value"] = product.totalAmcValue;
          row["Total Amount (with GST)"] = product.totalAmountWithGST;
          row["Total Quarters"] = product.totalQuarters;

          // Fill in quarter data
          if (product.quarters) {
            product.quarters.forEach((quarter) => {
              const quarterKey = `${quarter.quarter}-${quarter.year}`;
              row[quarterKey] = quarter.totalAmount;
              if (showWithoutGST) {
                row[`${quarterKey} (Without GST)`] = quarter.baseAmount;
              }
            });
          }

          return row;
        });

        const mainSheet = XLSX.utils.json_to_sheet(mainData, {
          header: allHeaders,
        });
        XLSX.utils.book_append_sheet(workbook, mainSheet, "AMC Schedule");

        // Quarter Totals Sheet
        const quarterTotalData = Object.entries(quarterTotals)
          .sort(([a], [b]) => {
            const [quarterA, yearA] = a.split("-");  
            const [quarterB, yearB] = b.split("-");
            if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
            const qOrder = { JFM: 0, AMJ: 1, JAS: 2, OND: 3 };
            return qOrder[quarterA] - qOrder[quarterB];
          })
          .map(([quarter, totals]) => ({
            Quarter: quarter,
            "Total Amount (₹)": totals.withGst,
            "Amount Without GST (₹)": totals.withoutGst,
            "GST Amount (₹)": totals.withGst - totals.withoutGst,
            Location: selectedLocation,
          }));

        const quarterTotalsSheet = XLSX.utils.json_to_sheet(quarterTotalData);
        XLSX.utils.book_append_sheet(
          workbook,
          quarterTotalsSheet,
          "Quarter Totals"
        );

        // Split-Wise Breakdown Sheet 
        const splitRows = [];
        try {
          rawResults.forEach((product, productIndex) => {
            try {
              // More robust checking for splitDetails
              if (product && 
                  product.splitDetails && 
                  typeof product.splitDetails === 'object' && 
                  Object.keys(product.splitDetails).length > 0) {
                
                Object.entries(product.splitDetails).forEach(([quarterKey, details], quarterIndex) => {
                  try {
                    if (Array.isArray(details) && details.length > 0) {
                      details.forEach((detail, detailIndex) => {
                        try {
                          // Validate detail object has required properties
                          if (detail && typeof detail === 'object') {
                            
                            // Parse quarterKey to get quarter and year
                            let quarter, year;
                            if (quarterKey.match(/^[A-Z]{3}-\d{4}$/)) {
                              [quarter, year] = quarterKey.split("-");
                            } else if (quarterKey.match(/^\d{4}-[A-Z]{3}$/)) {
                              [year, quarter] = quarterKey.split("-");
                            } else {
                              // Fallback parsing
                              const parts = quarterKey.split("-");
                              if (parts.length === 2) {
                                if (!isNaN(parseInt(parts[0]))) {
                                  [year, quarter] = parts;
                                } else {
                                  [quarter, year] = parts;
                                }
                              } else {
                                quarter = "Unknown";
                                year = "Unknown";
                              }
                            }

                            // Safe value extraction with defaults
                            const roiRate = typeof detail.roiRate === 'number' && !isNaN(detail.roiRate) 
                              ? detail.roiRate 
                              : 0;
                            
                            const fullQuarterAmount = typeof detail.fullQuarterAmount === 'number' && !isNaN(detail.fullQuarterAmount)
                              ? detail.fullQuarterAmount
                              : (typeof detail.actualAmount === 'number' && !isNaN(detail.actualAmount) ? detail.actualAmount : 0);
                            
                            const proratedAmount = typeof detail.proratedAmount === 'number' && !isNaN(detail.proratedAmount)
                              ? detail.proratedAmount
                              : fullQuarterAmount;
                            
                            const actualAmount = typeof detail.actualAmount === 'number' && !isNaN(detail.actualAmount)
                              ? detail.actualAmount
                              : proratedAmount;
                            
                            const currentYearContribution = typeof detail.currentYearContribution === 'number' && !isNaN(detail.currentYearContribution)
                              ? detail.currentYearContribution
                              : actualAmount;
                            
                            const residualFromPrevious = typeof detail.residualFromPrevious === 'number' && !isNaN(detail.residualFromPrevious)
                              ? detail.residualFromPrevious
                              : 0;
                            
                            const amountWithoutGst = typeof detail.amountWithoutGst === 'number' && !isNaN(detail.amountWithoutGst)
                              ? detail.amountWithoutGst
                              : (typeof detail.baseAmount === 'number' && !isNaN(detail.baseAmount) ? detail.baseAmount : actualAmount);
                            
                            const amountWithGst = typeof detail.amountWithGst === 'number' && !isNaN(detail.amountWithGst)
                              ? detail.amountWithGst
                              : (typeof detail.totalAmount === 'number' && !isNaN(detail.totalAmount) ? detail.totalAmount : amountWithoutGst * 1.18);
                            
                            const days = typeof detail.days === 'number' && !isNaN(detail.days) && detail.days > 0
                              ? detail.days
                              : (typeof detail.daysInQuarter === 'number' && !isNaN(detail.daysInQuarter) ? detail.daysInQuarter : 90);
                            
                            const totalDaysInQuarter = typeof detail.totalDaysInQuarter === 'number' && !isNaN(detail.totalDaysInQuarter) && detail.totalDaysInQuarter > 0
                              ? detail.totalDaysInQuarter
                              : 90;

                            splitRows.push({
                              "Item Name": product.productName || "Unknown Product",
                              "Quarter": quarter || "Unknown",
                              "Display Year": detail.displayYear || year || "Unknown",
                              "Quarter-Label": quarterKey || "Unknown",
                              "AMC Year": detail.amcYear || `Year ${detailIndex + 1}`,
                              "ROI Rate": `${(roiRate * 100).toFixed(2)}%`,
                              "Full Quarter Amount": Math.round(fullQuarterAmount * 100) / 100,
                              "Prorated Amount": Math.round(proratedAmount * 100) / 100,
                              "Actual Amount": Math.round(actualAmount * 100) / 100,
                              "Calculation Type": detail.calculationType || "Standard",
                              "Current Year Contribution (₹)": Math.round(currentYearContribution * 100) / 100,
                              "Residual from Previous (₹)": Math.round(residualFromPrevious * 100) / 100,
                              "Amount Without GST": Math.round(amountWithoutGst * 100) / 100,
                              "Amount With GST": Math.round(amountWithGst * 100) / 100,
                              "Days Covered": `${days} / ${totalDaysInQuarter}`,
                            });
                          }
                        } catch (detailError) {
                          console.warn(`Error processing detail ${detailIndex} for ${product.productName}:`, detailError);
                          // Add a row with available data for debugging
                          splitRows.push({
                            "Item Name": product.productName || "Unknown Product",
                            "Quarter": "ERROR - Detail Processing",
                            "Display Year": "See Console",
                            "Quarter-Label": quarterKey || "Unknown",
                            "AMC Year": `Error in detail ${detailIndex}`,
                            "ROI Rate": "0%",
                            "Full Quarter Amount": 0,
                            "Prorated Amount": 0,
                            "Actual Amount": 0,
                            "Calculation Type": "ERROR",
                            "Current Year Contribution (₹)": 0,
                            "Residual from Previous (₹)": 0,
                            "Amount Without GST": 0,
                            "Amount With GST": 0,
                            "Days Covered": "0 / 90",
                          });
                        }
                      });
                    } else {
                      // No details array or empty array
                      console.warn(`No valid details for quarter ${quarterKey} in product ${product.productName}`);
                      splitRows.push({
                        "Item Name": product.productName || "Unknown Product",
                        "Quarter": "No Data",
                        "Display Year": "No Data",
                        "Quarter-Label": quarterKey || "Unknown",
                        "AMC Year": "No Data",
                        "ROI Rate": "0%",
                        "Full Quarter Amount": 0,
                        "Prorated Amount": 0,
                        "Actual Amount": 0,
                        "Calculation Type": "No Details Available",
                        "Current Year Contribution (₹)": 0,
                        "Residual from Previous (₹)": 0,
                        "Amount Without GST": 0,
                        "Amount With GST": 0,
                        "Days Covered": "0 / 90",
                      });
                    }
                  } catch (quarterError) {
                    console.warn(`Error processing quarter ${quarterKey} for ${product.productName}:`, quarterError);
                  }
                });
              } else {
                // Product has no split details
                console.warn(`No split details for product: ${product.productName}`);
                splitRows.push({
                  "Item Name": product.productName || "Unknown Product",
                  "Quarter": "No Split Details",
                  "Display Year": "N/A",
                  "Quarter-Label": "N/A",
                  "AMC Year": "N/A", 
                  "ROI Rate": "N/A",
                  "Full Quarter Amount": 0,
                  "Prorated Amount": 0,
                  "Actual Amount": 0,
                  "Calculation Type": "No Split Details Available",
                  "Current Year Contribution (₹)": 0,
                  "Residual from Previous (₹)": 0,
                  "Amount Without GST": 0,
                  "Amount With GST": 0,
                  "Days Covered": "N/A",
                });
              }
            } catch (productError) {
              console.warn(`Error processing product ${productIndex}:`, productError);
              splitRows.push({
                "Item Name": `ERROR: Product ${productIndex}`,
                "Quarter": "Product Error",
                "Display Year": "See Console",
                "Quarter-Label": "ERROR",
                "AMC Year": "ERROR",
                "ROI Rate": "0%",
                "Full Quarter Amount": 0,
                "Prorated Amount": 0,
                "Actual Amount": 0,
                "Calculation Type": "Product Processing Error",
                "Current Year Contribution (₹)": 0,
                "Residual from Previous (₹)": 0,
                "Amount Without GST": 0,
                "Amount With GST": 0,
                "Days Covered": "0 / 90",
              });
            }
          });
        } catch (splitError) {
          console.error("Error generating split-wise data:", splitError);
          // Create a fallback sheet with error message
          splitRows.push({
            "Item Name": "ERROR: Split data generation failed",
            "Quarter": "Check console for details",
            "Display Year": "",
            "Quarter-Label": "",
            "AMC Year": "",
            "ROI Rate": "0%",
            "Full Quarter Amount": 0,
            "Prorated Amount": 0,
            "Actual Amount": 0,
            "Calculation Type": "Generation Error",
            "Current Year Contribution (₹)": 0,
            "Residual from Previous (₹)": 0,
            "Amount Without GST": 0,
            "Amount With GST": 0,
            "Days Covered": "0 / 90",
          });
        }

        // Only create the sheet if we have data (or error rows)
        if (splitRows.length > 0) {
          const splitSheet = XLSX.utils.json_to_sheet(splitRows);
          XLSX.utils.book_append_sheet(workbook, splitSheet, "Split-Wise Breakdown");
        } else {
          // Create an empty sheet with headers only as fallback
          const emptySheet = XLSX.utils.json_to_sheet([{
            "Item Name": "No split data available - check calculation",
            "Quarter": "",
            "Display Year": "",
            "Quarter-Label": "",
            "AMC Year": "",
            "ROI Rate": "0%",
            "Full Quarter Amount": 0,
            "Prorated Amount": 0,
            "Actual Amount": 0,
            "Calculation Type": "",
            "Current Year Contribution (₹)": 0,
            "Residual from Previous (₹)": 0,
            "Amount Without GST": 0,
            "Amount With GST": 0,
            "Days Covered": "",
          }]);
          XLSX.utils.book_append_sheet(workbook, emptySheet, "Split-Wise Breakdown");
        }

        // Download the file
        const locationSuffix =
          selectedLocation !== "All Locations"
            ? `_${selectedLocation.replace(/\s+/g, "_")}`
            : "";
        XLSX.writeFile(
          workbook,
          `AMC_Schedule${locationSuffix}_${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        );
      } catch (error) {
        alert("Failed to export Excel file. Please try again.");
      }
    },
    [
      rawResults,
      quarterTotals,
      yearTotals,
      selectedLocation,
      fileName,
      settings,
      showWithoutGST,
    ]
  );
  
  // Generate dynamic table columns based on calculation results (like Excel AMC Schedule sheet)
  const tableColumns = useMemo(() => {
    // Base columns (matching Excel AMC Schedule sheet)
    const baseColumns = [
      {
        key: "productName",
        title: "Item Name",
        width: 200,
        filterable: true,
      },
      {
        key: "location",
        title: "Location",
        width: 120,
        filterable: true,
      },
      {
        key: "invoiceValue",
        title: "Invoice Value",
        width: 180,
        className: "text-right",
      },
      {
        key: "invoiceNumber",
        title: "Invoice Number",
        width: 150,
        className: "text-left",
        formatter: (value, row) => value || "-"
      },
      {
        key: "quantity",
        title: "Quantity",
        width: 80,
        className: "text-center",
      },
      {
        key: "amcStartDate",
        title: "AMC Start Date",
        width: 120,
      },
      {
        key: "uatDate",
        title: "UAT Date",
        width: 120,
      },
    ];

    // Generate quarter columns dynamically from results
    const quarterColumns = [];
    const quarterSet = new Set();

    // Extract unique quarters from ALL products (not just first one)
    if (currentResults && currentResults.length > 0) {
      // Look for quarter columns in ALL products to collect complete quarter set
      currentResults.forEach((product) => {
        Object.keys(product).forEach((key) => {
          
          if (key.match(/^[A-Z]{3}-\d{4}$/)) {
            quarterSet.add(key);
          }
        });
      });
    }

    // Sort quarters chronologically (year first, then quarter within year)
    const quarterOrder = { JFM: 1, AMJ: 2, JAS: 3, OND: 4 };
    const sortedQuarters = Array.from(quarterSet).sort((a, b) => {
      const [qA, yearA] = a.split("-");
      const [qB, yearB] = b.split("-");

      const numYearA = parseInt(yearA, 10);
      const numYearB = parseInt(yearB, 10);
      
      if (numYearA !== numYearB) {
        return numYearA - numYearB;
      }
      
      return quarterOrder[qA] - quarterOrder[qB];
    });

    // Create column definitions for each quarter
    sortedQuarters.forEach((quarterKey) => {
      quarterColumns.push({
        key: quarterKey,
        title: quarterKey,
        width: 120,
        className: "text-right",
      });
    });

    return [...baseColumns, ...quarterColumns];
  }, [currentResults]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      terminate();
    };
  }, [terminate]);

  const containerStyle = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
    color: "#1e293b",
    fontFamily:
      '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: "40px",
    position: "relative",
  };

  const backgroundOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
    `,
    pointerEvents: "none",
  };

  const headerStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "32px",
    marginBottom: "40px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
    position: "relative",
    zIndex: 1,
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "32px",
    marginBottom: "32px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
    position: "relative",
    zIndex: 1,
  };

  return (
    <div style={containerStyle}>
      <div style={backgroundOverlayStyle}></div>

      {/* Header */}
      <div style={headerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: "0 0 8px 0",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              🚀 AMC Calculator
            </h1>
            <p
              style={{
                color: "#64748b",
                fontSize: "1rem",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Get the Amc Schedule in just one click !
            </p>
          </div>

          {/* Cache Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {cacheSupported && (
              <>
                {isOnline ? (
                  <div
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#f0fdf4",
                      color: "#059669",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    🌐 Online
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#fef3c7",
                      color: "#d97706",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: "1px solid #fcd34d",
                    }}
                  >
                    💾 Offline
                  </div>
                )}

                {hasCachedResult && (
                  <div
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    ⚡ Cached Results Available
                  </div>
                )}

                <button
                  onClick={() => setShowCacheManager(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                >
                  💾 Cache ({cacheStats?.counts?.amcCalculations || 0})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Worker Error Alert */}
      {workerError && (
        <div
          style={{
            ...cardStyle,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
            ⚠️ Worker Error
          </h4>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{workerError}</p>
        </div>
      )}

      {/* Cache Manager */}
      <CacheManager
        visible={showCacheManager}
        onClose={() => setShowCacheManager(false)}
      />

      {/* Cache Status Compact */}
      {cacheSupported && <CacheManager compact={true} />}

      {/* Progress Indicator */}
      <CalculationProgress
        progress={progress}
        summary={currentSummary}
        isCalculating={isCalculating}
        title="AMC Calculation Progress"
      />

      {/* Data Status */}
      {hasExcelData && (
        <div style={cardStyle}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e293b",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📊 Data Status
          </h3>

          {/* Data Preview Toggle */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={() => setShowDataPreview(!showDataPreview)}
              style={{
                padding: "8px 16px",
                backgroundColor: showDataPreview ? "#ef4444" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {showDataPreview
                ? " Hide Data Preview"
                : "👁 Show Data Preview (First 5 rows)"}
            </button>
          </div>

          {/* Data Preview Table */}
          {showDataPreview && processedExcelData.length > 0 && (
            <div
              style={{
                marginBottom: "20px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "left",
                      }}
                    >
                      Product Name
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "right",
                      }}
                    >
                      Invoice Value
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "left",
                      }}
                    >
                      Invoice Number
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "left",
                      }}
                    >
                      Location
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        textAlign: "left",
                      }}
                    >
                      UAT Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedExcelData.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td
                        style={{ padding: "8px", border: "1px solid #e2e8f0" }}
                      >
                        {item.productName}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          textAlign: "right",
                          fontWeight: 600,
                          color:
                            item.invoiceValue > 10000000
                              ? "#059669"
                              : "#dc2626",
                        }}
                      >
                        ₹{formatIndianNumber(item.invoiceValue)}
                        {item.invoiceValue > 10000000 && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#059669",
                              marginLeft: "4px",
                            }}
                          >
                            (₹{(item.invoiceValue / 10000000).toFixed(2)} Cr)
                          </span>
                        )}
                      </td>
                      <td
                        style={{ padding: "8px", border: "1px solid #e2e8f0" }}
                        >
                          {item.invoiceNumber || 'N/A'}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{ padding: "8px", border: "1px solid #e2e8f0" }}
                      >
                        {item.location}
                      </td>
                      <td
                        style={{ padding: "8px", border: "1px solid #e2e8f0" }}
                      >
                        {item.uatDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f0f9ff",
                  borderTop: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e40af",
                }}
              >
                <strong>💡 Data Validation:</strong>
                <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                  <li>
                    <span style={{ color: "#059669" }}>Green amounts</span> are
                    ≥₹1 Crore (correctly parsed large values)
                  </li>
                  <li>
                    <span style={{ color: "#dc2626" }}>Red amounts</span> are
                    &lt;₹1 Crore (check if these should be larger)
                  </li>
                  <li>
                    Total products loaded:{" "}
                    <strong>{processedExcelData.length}</strong>
                  </li>
                  <li>
                    Products ≥₹1 Cr:{" "}
                    <strong style={{ color: "#059669" }}>
                      {
                        processedExcelData.filter(
                          (p) => p.invoiceValue >= 10000000
                        ).length
                      }
                    </strong>
                  </li>
                  <li>
                    Products &lt;₹1 Cr:{" "}
                    <strong style={{ color: "#dc2626" }}>
                      {
                        processedExcelData.filter(
                          (p) => p.invoiceValue < 10000000
                        ).length
                      }
                    </strong>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📄</div>
              <h4
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: "#1e293b",
                }}
              >
                Excel File
              </h4>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                {fileName || "Unknown file"}
              </p>
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🔢</div>
              <h4
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: "#1e293b",
                }}
              >
                Products
              </h4>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                {formatIndianNumber(processedExcelData.length)} items ready
              </p>
            </div>

            {hasCachedResult && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fcd34d",
                  borderRadius: "12px",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
                  ⚡
                </div>
                <h4
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "#1e293b",
                  }}
                >
                  Cache Status
                </h4>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                  Results available from cache
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Product Entry */}
      <div style={cardStyle}>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1e293b",
            margin: "0 0 24px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ➕ Manual Product Entry
        </h3>

        <ManualProductForm
          onAddProduct={(product) => {
            setManualProducts((prev) => [...prev, product]);
          }}
        />

        {/* Display Currently Added Manual Products */}
        {manualProducts.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "#f0f9ff",
              border: "1px solid #3b82f6",
              borderRadius: "8px",
            }}
          >
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#1e293b",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📋 Manual Products Added ({manualProducts.length})
            </h4>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {manualProducts.map((product, index) => (
                <div
                  key={product.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", flex: 1 }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>
                      {product.productName}
                    </span>
                    <span style={{ color: "#64748b" }}>
                      ₹{formatIndianNumber(product.invoiceValue)}
                    </span>
                    <span style={{ color: "#64748b" }}>
                      {product.invoiceNumber || 'N/A'}
                    </span>
                    <span style={{ color: "#64748b" }}>{product.location}</span>
                    <span style={{ color: "#64748b" }}>
                      UAT: {new Date(product.uatDate).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setManualProducts((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      padding: "4px",
                      borderRadius: "4px",
                    }}
                    title="Remove product"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "12px",
                padding: "8px",
                backgroundColor: "#dbeafe",
                borderRadius: "4px",
                fontSize: "0.8rem",
                color: "#1d4ed8",
                textAlign: "center",
              }}
            >
              Ready to calculate! Click "Calculate AMC Schedule" below to
              process these products.
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            fontSize: "0.875rem",
            color: "#0c4a6e",
          }}
        >
          <strong>💡 Note:</strong> Manually added products will use the ROI
          rates configured in the settings below. AMC will start exactly 3 years
          after the UAT date. You can mix manual entries with Excel uploads.
        </div>
      </div>

      {/* AMC Settings & Calculation */}
      {(hasExcelData || processedExcelData.length > 0) && (
        <div style={cardStyle}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e293b",
              margin: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⚙️ AMC Calculation Settings
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                AMC Percentage
              </label>
              <input
                type="number"
                value={settings.amcPercentage * 100}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    amcPercentage: parseFloat(e.target.value) / 100,
                  }))
                }
                min="1"
                max="100"
                step="0.1"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  margin: "4px 0 0 0",
                }}
              >
                Current: {(settings.amcPercentage * 100).toFixed(1)}%
              </p>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                GST Rate
              </label>
              <input
                type="number"
                value={settings.gstRate * 100}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    gstRate: parseFloat(e.target.value) / 100,
                  }))
                }
                min="0"
                max="50"
                step="0.1"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  margin: "4px 0 0 0",
                }}
              >
                Current: {(settings.gstRate * 100).toFixed(1)}%
              </p>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                AMC Duration (Years)
              </label>
              <select
                value={settings.amcYears}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    amcYears: parseInt(e.target.value),
                  }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                <option value={3}>3 Years</option>
                <option value={4}>4 Years</option>
                <option value={5}>5 Years</option>
                <option value={6}>6 Years</option>
                <option value={7}>7 Years</option>
                <option value={8}>8 Years</option>
                <option value={9}>9 Years</option>
                <option value={10}>10 Years</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Processing Chunk Size
              </label>
              <select
                value={settings.chunkSize}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    chunkSize: parseInt(e.target.value),
                  }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                <option value={500}>500 (Slower, Stable)</option>
                <option value={1000}>1,000 (Balanced)</option>
                <option value={2000}>2,000 (Faster)</option>
                <option value={5000}>5,000 (Maximum Speed)</option>
              </select>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  margin: "4px 0 0 0",
                }}
              >
                Larger chunks = faster processing
              </p>
            </div>
          </div>

          {/* ROI Rates */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "12px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              ROI Rates (%) - {settings.amcYears} Year
              {settings.amcYears > 1 ? "s" : ""}
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  settings.amcYears <= 5
                    ? "repeat(auto-fit, minmax(150px, 1fr))"
                    : "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "12px",
                maxWidth: "100%",
              }}
            >
              {Array.from({ length: settings.amcYears }, (_, index) => {
                const rate = settings.roiRates[index] || 0;
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#4b5563",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      Year {index + 1}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <input
                        type="number"
                        value={rate}
                        onChange={(e) => {
                          const newRates = [...settings.roiRates];
                          newRates[index] = parseFloat(e.target.value) || 0;
                          setSettings((prev) => ({
                            ...prev,
                            roiRates: newRates,
                          }));
                        }}
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0"
                        style={{
                          width: "70px",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "0.875rem",
                          textAlign: "center",
                        }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        %
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: "6px",
                fontSize: "0.8rem",
                color: "#1e40af",
              }}
            >
              💡 <strong>Tip:</strong> ROI rates typically increase over time.
              Default progression adds 2.5% per year when extending duration.
            </div>
          </div>

          {/* Calculate Button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleCalculate}
              disabled={
                (!hasExcelData && processedExcelData.length === 0) ||
                isCalculating ||
                !workerReady
              }
              style={{
                padding: "16px 32px",
                backgroundColor:
                  (!hasExcelData && processedExcelData.length === 0) ||
                  isCalculating ||
                  !workerReady
                    ? "#9ca3af"
                    : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor:
                  (!hasExcelData && processedExcelData.length === 0) ||
                  isCalculating ||
                  !workerReady
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                margin: "0 auto",
                minWidth: "250px",
              }}
            >
              {isCalculating ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid #ffffff",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></span>
                  Calculating...
                </>
              ) : hasCachedResult ? (
                <>🚀 Load from Cache</>
              ) : (
                <>🔥 Calculate AMC Schedule</>
              )}
            </button>

            {!hasExcelData && processedExcelData.length === 0 && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#dc2626",
                  margin: "12px 0 0 0",
                  fontWeight: 500,
                }}
              >
                ⚠️ Please upload Excel data from the dashboard or add manual
                products above
              </p>
            )}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!hasExcelData && processedExcelData.length === 0 && (
        <div
          style={{
            ...cardStyle,
            textAlign: "center",
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#92400e",
              margin: "0 0 8px 0",
            }}
          >
            No Excel Data Found
          </h3>
          <p
            style={{
              fontSize: "1rem",
              color: "#a16207",
              margin: "0 0 16px 0",
              lineHeight: 1.6,
            }}
          >
            Please go back to the dashboard and upload your Excel file first.{" "}
            <br />
            The AMC Calculator requires Excel data to perform calculations.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: "12px 24px",
              backgroundColor: "#ca8a04",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Filters and Settings */}
      {hasCalculations && (
        <div style={cardStyle}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e293b",
              margin: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🔍 Filters & Display Options
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                📍 Filter by Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                💰 Filter by ROI Group
              </label>
              <select
                value={selectedROI ? JSON.stringify(selectedROI) : ""}
                onChange={(e) =>
                  setSelectedROI(
                    e.target.value ? JSON.parse(e.target.value) : null
                  )
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                <option value="">All ROI Groups</option>
                {roiOptions.map((roi, index) => (
                  <option key={index} value={JSON.stringify(roi)}>
                    {roi.map((rate, i) => `Y${i + 1}: ${rate}%`).join(", ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Display Options
              </label>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showWithoutGST}
                    onChange={(e) => setShowWithoutGST(e.target.checked)}
                  />
                  Show amounts without GST
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showSplitDetails}
                    onChange={(e) => setShowSplitDetails(e.target.checked)}
                  />
                  Show overlapping quarter details
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Year-wise AMC Totals */}
      {hasCalculations && Object.keys(yearTotals).length > 0 && (
        <div style={cardStyle}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e293b",
              margin: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📆 Year-Wise AMC Totals for {selectedLocation}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {Object.entries(yearTotals)
              .sort()
              .map(([year, totals]) => (
                <div
                  key={year}
                  style={{
                    padding: "16px",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: "#2563eb",
                      marginBottom: "8px",
                    }}
                  >
                    Year {year}
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#059669",
                      marginBottom: "4px",
                    }}
                  >
                    ₹{formatIndianNumber(Math.round(totals.withGst))}
                  </div>
                  {showWithoutGST && (
                    <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                      Without GST: ₹
                      {formatIndianCurrency(Math.round(totals.withoutGst))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

     {/* Quarter-wise Summary */}
        {hasCalculations && Object.keys(quarterTotals).length > 0 && (
          <div style={cardStyle}>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#1e293b",
                margin: "0 0 24px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📊 Quarter-Wise AMC Totals for {selectedLocation}
            </h3>
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {Object.entries(quarterTotals)
                .sort(([a], [b]) => {
                
                  // Handle both possible formats: "Quarter-Year" or "Year-Quarter"
                  let quarterA, yearA, quarterB, yearB;
                  
                  // Check if format is "Quarter-Year" (e.g., "JFM-2024")
                  if (a.match(/^[A-Z]{3}-\d{4}$/)) {
                    [quarterA, yearA] = a.split("-");
                    [quarterB, yearB] = b.split("-");
                  } 
                  // Check if format is "Year-Quarter" (e.g., "2024-JFM")
                  else if (a.match(/^\d{4}-[A-Z]{3}$/)) {
                    [yearA, quarterA] = a.split("-");
                    [yearB, quarterB] = b.split("-");
                  }
                  // Fallback - try to detect based on which part is numeric
                  else {
                    const partsA = a.split("-");
                    const partsB = b.split("-");
                    
                    if (!isNaN(parseInt(partsA[0]))) {
                      // First part is year
                      [yearA, quarterA] = partsA;
                      [yearB, quarterB] = partsB;
                    } else {
                      // First part is quarter
                      [quarterA, yearA] = partsA;
                      [quarterB, yearB] = partsB;
                    }
                  }
                  
                  // Convert years to numbers for proper numeric comparison
                  const numYearA = parseInt(yearA);
                  const numYearB = parseInt(yearB);
                  
                  // First sort by year (numerically)
                  if (numYearA !== numYearB) {
                    return numYearA - numYearB;
                  }
                  
                  // If years are same, sort by quarter
                  const qOrder = { JFM: 0, AMJ: 1, JAS: 2, OND: 3 };
                  return qOrder[quarterA] - qOrder[quarterB];
                })
                .map(([key, totals]) => {
                  const [year, quarter] = key.split("-");
                  const quarterColors = {
                    JFM: "#e0f2fe",
                    AMJ: "#fef3c7",
                    JAS: "#f0fdf4",
                    OND: "#fce7f3",
                  };
                  return (
                    <div
                      key={key}
                      style={{
                        padding: "16px",
                        backgroundColor: quarterColors[quarter] || "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        {quarter} {year}
                      </div>
                      <div
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: 700,
                          color: "#059669",
                          marginBottom: "4px",
                        }}
                      >
                        ₹{formatIndianNumber(Math.round(totals.withGst))}
                      </div>
                      {showWithoutGST && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          Without GST: ₹
                          {formatIndianNumber(Math.round(totals.withoutGst))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {/* Split Details - Overlapping Quarters */}
      {showSplitDetails && hasCalculations && (
        <div style={cardStyle}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e293b",
              margin: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📋 Overlapping Quarter Breakdown — Contributions by ROI Year
          </h3>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              🔍 Select product to view ROI quarter breakdown
            </label>
            
          </div>

           <select
            value={selectedProduct || ""}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          >
            <option value="">Select a product...</option>
            {rawResults && rawResults.length > 0 && rawResults
              .filter(product => {
             
                //  Better validation for split details
                if (!product.splitDetails || typeof product.splitDetails !== 'object') {
                  return false;
                }

                const splitDetailsKeys = Object.keys(product.splitDetails);
                if (splitDetailsKeys.length === 0) {
                  return false;
                }

                // Check if any split detail has actual data
                const hasValidData = splitDetailsKeys.some(key => {
                  const details = product.splitDetails[key];
                  const isValidArray = Array.isArray(details) && details.length > 0;
                  const hasNonZeroAmounts = isValidArray && details.some(detail => 
                    (detail.amountWithGst && detail.amountWithGst > 0) ||
                    (detail.amountWithoutGst && detail.amountWithoutGst > 0) ||
                    (detail.actualAmount && detail.actualAmount > 0) ||
                    (detail.currentYearContribution && detail.currentYearContribution > 0)
                  );
              
                  return hasNonZeroAmounts;
                });

                if (!hasValidData) {
                  
                  return false;
                }

                return true;
              })
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName} - {product.location} 
                  ({Object.keys(product.splitDetails || {}).length} quarters with data)
                </option>
              ))}
          </select>

        {selectedProduct &&
          (() => {
            const product = rawResults?.find(p => p.id === selectedProduct);
            
            if (!product) {
              return (
                <div style={{
                  padding: "16px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#dc2626"
                }}>
                 ❌ Product not found. Selected ID: {selectedProduct}
                 <br/>
                 Available IDs: {rawResults?.map(p => p.id).join(", ") || "None"}
                </div>
              );
            }
            
            if (!product.splitDetails || Object.keys(product.splitDetails).length === 0) {
              return (
                <div style={{
                  padding: "16px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fcd34d",
                  borderRadius: "8px",
                  color: "#d97706"
                }}>
                  No split details available for: {product.productName}
                  <br/>
                  <details style={{ marginTop: "8px" }}>
                    <summary>Debug Info</summary>
                    <pre style={{ fontSize: "0.7rem", marginTop: "4px", overflow: "auto" }}>
                      {JSON.stringify({
                        productName: product.productName,
                        hasSplitDetails: !!product.splitDetails,
                        splitDetailsKeys: Object.keys(product.splitDetails || {}),
                        quarters: product.quarters?.length || 0
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            }

            return (
              <div>
                <h4 style={{ color: "#374151", marginBottom: "16px" }}>
                  {product.productName} — ROI Split Breakdown
                </h4>

                {Object.entries(product.splitDetails)
                  .sort(([a], [b]) => {
                    const [qA, yearA] = a.split("-");
                    const [qB, yearB] = b.split("-");
                    const numYearA = parseInt(yearA);
                    const numYearB = parseInt(yearB);
                    if (numYearA !== numYearB) return numYearA - numYearB;
                    const qOrder = { JFM: 0, AMJ: 1, JAS: 2, OND: 3 };
                    return qOrder[qA] - qOrder[qB];
                  })
                  .map(([quarterKey, details]) => {
                    if (!details || details.length === 0) return null;

                    const [quarter, year] = quarterKey.split("-");
                    
                    return (
                      <div key={quarterKey} style={{ marginBottom: "24px" }}>
                        <h5 style={{ color: "#2563eb", marginBottom: "12px" }}>
                          {quarter} {year} ({details.length} ROI year{details.length > 1 ? 's' : ''})
                        </h5>

                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                              <tr style={{ backgroundColor: "#f8fafc" }}>
                                <th style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                                  AMC Year
                                </th>
                                <th style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                                  ROI %
                                </th>
                                <th style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "left" }}>
                                  Days Covered
                                </th>
                                <th style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                  Current Year Contribution
                                </th>
                                <th style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                  Residual from Previous
                                </th>
                                <th style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                  Total Without GST
                                </th>
                                <th style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                  Total With GST
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {details.map((detail, index) => (
                                <tr key={index}>
                                  <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>
                                    {detail.amcYear}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>
                                    {(detail.roiRate * 100).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #e2e8f0" }}>
                                    {detail.days} / {detail.totalDaysInQuarter}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                    ₹{formatIndianNumber(Math.round(detail.currentYearContribution))}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                    ₹{formatIndianNumber(Math.round(detail.residualFromPrevious))}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                    ₹{formatIndianNumber(Math.round(detail.amountWithoutGst))}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                                    ₹{formatIndianNumber(Math.round(detail.amountWithGst))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ marginTop: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#059669" }}>
                          Quarter Total = ₹{formatIndianNumber(Math.round(details.reduce((sum, d) => sum + d.amountWithoutGst, 0)))} (Without GST) + 
                          ₹{formatIndianNumber(Math.round(details.reduce((sum, d) => sum + (d.amountWithGst - d.amountWithoutGst), 0)))} (GST) = 
                          ₹{formatIndianNumber((Math.round(details.reduce((sum, d) => sum + d.amountWithGst, 0))))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
            })()}
          
        </div>
      )}

      {/* Results Display */}
      {hasCalculations && (
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#1e293b",
                margin: "0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📊 AMC Calculation Results
            </h3>

            {/* View Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "4px",
                backgroundColor: "#f1f5f9",
                borderRadius: "8px",
              }}
            >
              <button
                onClick={() => setViewMode("standard")}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    viewMode === "standard" ? "#3b82f6" : "transparent",
                  color: viewMode === "standard" ? "white" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                📋 Standard View
              </button>
              <button
                onClick={() => setViewMode("quarterly")}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    viewMode === "quarterly" ? "#3b82f6" : "transparent",
                  color: viewMode === "quarterly" ? "white" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                📅 Uploaded Data
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                padding: "16px",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🔢</div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#2563eb",
                }}
              >
                {formatIndianNumber(currentSummary?.totalProducts || 0)}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Products Processed
              </div>
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>💰</div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#059669",
                }}
              >
                ₹{formatIndianNumber(currentSummary?.totalValue || 0)}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Total AMC Value
              </div>
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>⚡</div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#d97706",
                }}
              >
                {currentSummary?.successful || 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Successful Calculations
              </div>
            </div>

            {(currentSummary?.errors || 0) > 0 && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
                  ⚠️
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#dc2626",
                  }}
                >
                  {currentSummary?.errors || 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Errors
                </div>
              </div>
            )}
          </div>

          {/* Export Button */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <button
              onClick={() => handleExport()}
              disabled={!hasCalculations}
              style={{
                padding: "12px 24px",
                backgroundColor: hasCalculations ? "#3b82f6" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: hasCalculations ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                margin: "0 auto",
              }}
            >
              📥 Export to Excel
            </button>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              borderBottom: "2px solid #e5e7eb",
              marginBottom: "24px",
              backgroundColor: "white",
              borderRadius: "8px 8px 0 0",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "12px 24px",
                backgroundColor:
                  viewMode === "table" ? "#3b82f6" : "transparent",
                color: viewMode === "table" ? "white" : "#64748b",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom:
                  viewMode === "table" ? "none" : "2px solid transparent",
              }}
            >
              📊 AMC Schedule Table
            </button>
            <button
              onClick={() => setViewMode("charts")}
              style={{
                padding: "12px 24px",
                backgroundColor:
                  viewMode === "charts" ? "#3b82f6" : "transparent",
                color: viewMode === "charts" ? "white" : "#64748b",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom:
                  viewMode === "charts" ? "none" : "2px solid transparent",
              }}
            >
              📈 Charts & Analytics
            </button>
            <button
              onClick={() => setViewMode("quarterly")}
              style={{
                padding: "12px 24px",
                backgroundColor:
                  viewMode === "quarterly" ? "#3b82f6" : "transparent",
                color: viewMode === "quarterly" ? "white" : "#64748b",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom:
                  viewMode === "quarterly" ? "none" : "2px solid transparent",
              }}
            >
              📋Uploaded File 
            </button>
          </div>

          {/* Tab Content */}
          {viewMode === "table" ? (
            <VirtualDataTable
              data={filteredResults}
              columns={tableColumns}
              height={600}
              title={`AMC Schedule - ${filteredResults.length} products`}
              onExport={() => handleExport(rawResults)}
              searchable={true}
              filterable={true}
              sortable={true}
              showTotals={true}
              showRowTotals={true}
              summary={{
                ...currentSummary,
                totalProducts: filteredResults.length,
              }}
              formatters={{
                invoiceValue: (value) => `₹${formatIndianNumber(value || 0)}`,
                invoiceNumber: (value) => value || "-",
                quantity: (value) => formatIndianNumber(value || 0),
                amcStartDate: (value) =>
                  value ? new Date(value).toLocaleDateString() : "-",
                uatDate: (value) =>
                  value ? new Date(value).toLocaleDateString() : "-",
                
                ...Object.fromEntries(
                  tableColumns
                    .filter(
                      (col) =>
                        col.key.includes("-") &&
                        col.key.match(/^[A-Z]{3}-\d{4}$/)
                    )
                    .map((col) => [
                      col.key,
                      (value) => (value ? `₹${formatIndianNumber(value)}` : "₹0"),
                    ])
                ),
              }}
            />
          ) : viewMode === "charts" ? (
            <AMCChartsView
              data={filteredResults}
              quarterTotals={quarterTotals}
              yearTotals={yearTotals}
              rawResults={rawResults}
            />
          ) : (
            <QuarterlyDataTable
              data={filteredResults}
              title={`Quarterly AMC Schedule - ${filteredResults.length} products`}
              onExport={handleQuarterlyExport}
              searchable={true}
              filterable={true}
              showWithoutGST={showWithoutGST}
              height={600}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedAmcCalculator;