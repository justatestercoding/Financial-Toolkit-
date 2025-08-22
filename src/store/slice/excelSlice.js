import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as XLSX from 'xlsx';

// Async thunk to process Excel file
export const processExcelFile = createAsyncThunk(
  'excel/processExcelFile',
  async (file, { rejectWithValue }) => {
    try {
     
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        console.error('❌ Invalid file format:', file.name);
        return rejectWithValue('Unsupported file format. Please upload a .xlsx or .xls file.');
      }

      const arrayBuffer = await file.arrayBuffer();
     
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;


      const sheets = {};
      let totalRows = 0;

      sheetNames.forEach(sheetName => {
       
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
          blankrows: false,
        });
        
        sheets[sheetName] = jsonData;
        totalRows += jsonData.length;
      });

      // Prepare data to save
      const dataToSave = {
        sheets,
        sheetNames,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        totalRows
      };

      // Save to localStorage
      
      localStorage.setItem('excelData', JSON.stringify(sheets));
      localStorage.setItem('excelSheetNames', JSON.stringify(sheetNames));
      localStorage.setItem('excelFileName', file.name);
      localStorage.setItem('excelFileSize', file.size.toString());
      localStorage.setItem('excelUploadDate', dataToSave.uploadDate);
    
      return { 
        sheets, 
        sheetNames, 
        fileName: file.name,
        fileSize: file.size,
        uploadDate: dataToSave.uploadDate,
        totalRows
      };
    } catch (error) {
      console.error('❌ Error reading Excel file:', error);
      return rejectWithValue('Failed to process Excel file. Please try again.');
    }
  }
);

// Load saved data from localStorage on app init
export const loadExcelFromMemory = createAsyncThunk(
  'excel/loadExcelFromMemory',
  async (_, { rejectWithValue }) => {
    try {
     
      const savedData = localStorage.getItem('excelData');
      const savedSheetNames = localStorage.getItem('excelSheetNames');
      const savedFileName = localStorage.getItem('excelFileName');
      const savedFileSize = localStorage.getItem('excelFileSize');
      const savedUploadDate = localStorage.getItem('excelUploadDate');

      if (savedData && savedSheetNames) {
        const sheets = JSON.parse(savedData);
        const sheetNames = JSON.parse(savedSheetNames);
       

        return {
          sheets,
          sheetNames,
          fileName: savedFileName || 'Excel File',
          fileSize: savedFileSize ? parseInt(savedFileSize) : 0,
          uploadDate: savedUploadDate || new Date().toISOString()
        };
      } else {
      
        return rejectWithValue('No stored Excel data found.');
      }
    } catch (error) {
      console.error('❌ Failed to load Excel data from memory:', error);
      return rejectWithValue('Error loading Excel data from memory.');
    }
  }
);

const excelSlice = createSlice({
  name: 'excel',
  initialState: {
    data: {},              // All parsed sheets
    sheetNames: [],        // Sheet name list
    activeSheet: '',       // Currently selected sheet
    status: 'idle',        // idle | loading | succeeded | failed
    error: null,
    fileName: null,        // Added fileName
    fileSize: 0,           // Added fileSize
    uploadDate: null,      // Added uploadDate
    totalRows: 0           // Added totalRows
  },
  reducers: {
    clearData: (state) => {
    
      state.data = {};
      state.sheetNames = [];
      state.activeSheet = '';
      state.status = 'idle';
      state.error = null;
      state.fileName = null;
      state.fileSize = 0;
      state.uploadDate = null;
      state.totalRows = 0;
      
      // Clear localStorage
      localStorage.removeItem('excelData');
      localStorage.removeItem('excelSheetNames');
      localStorage.removeItem('excelFileName');
      localStorage.removeItem('excelFileSize');
      localStorage.removeItem('excelUploadDate');

    },
    setActiveSheet: (state, action) => {
      state.activeSheet = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processExcelFile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(processExcelFile.fulfilled, (state, action) => {
       
        
        state.status = 'succeeded';
        state.data = action.payload.sheets;
        state.sheetNames = action.payload.sheetNames;
        state.activeSheet = action.payload.sheetNames[0] || '';
        state.fileName = action.payload.fileName;
        state.fileSize = action.payload.fileSize;
        state.uploadDate = action.payload.uploadDate;
        state.totalRows = action.payload.totalRows || 0;
        
      })
      .addCase(processExcelFile.rejected, (state, action) => {
        console.error('❌ Excel file processing failed:', action.payload);
        state.status = 'failed';
        state.error = action.payload || 'Failed to process Excel file.';
      })
      .addCase(loadExcelFromMemory.fulfilled, (state, action) => {
      
        state.status = 'succeeded';
        state.data = action.payload.sheets;
        state.sheetNames = action.payload.sheetNames;
        state.activeSheet = action.payload.sheetNames[0] || '';
        state.fileName = action.payload.fileName;
        state.fileSize = action.payload.fileSize;
        state.uploadDate = action.payload.uploadDate;
        
        // Calculate total rows
        state.totalRows = Object.values(action.payload.sheets).reduce((total, sheetData) => {
          return total + (Array.isArray(sheetData) ? sheetData.length : 0);
        }, 0);
        
      })
      .addCase(loadExcelFromMemory.rejected, (state, action) => {
       
        state.status = 'idle';
        state.error = action.payload || null;
      });
  }
});

export const { clearData, setActiveSheet } = excelSlice.actions;

export default excelSlice.reducer;