import { createSlice } from "@reduxjs/toolkit";

// Default date range: December 20-29, 2025 (matching seeded data)
const defaultStartDate = '2025-12-20T00:00:00.000Z';
const defaultEndDate = '2025-12-29T23:59:59.000Z';

const initialState = {
    status: false,
    dates: [defaultStartDate, defaultEndDate]
};

const dateSlice = createSlice({
    name: 'datePicker',
    initialState,
    reducers: {
        setDate: (state, action) => {
            state.status = true;
            state.dates = action.payload.dates;
        } 
    }
});

// Exporting the setDate action for use in components
export const { setDate } = dateSlice.actions;

// Exporting the reducer to be used in the store
export default dateSlice.reducer;
