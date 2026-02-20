import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDate } from '../../redux/dateSlice';

const { RangePicker } = DatePicker;

// Default date range: January 1 - February 20, 2026 (matching seeded data)
const defaultDates = [
    dayjs('2026-01-01'),
    dayjs('2026-02-20')
];

const Datepicker = () => {
    const dispatch = useDispatch();
    // Get dates from Redux store to persist across navigation
    const reduxDates = useSelector((state) => state.datePicker.dates);
    
    // Initialize local state from Redux (persisted) or defaults
    const getInitialDates = () => {
        if (reduxDates && reduxDates.length === 2 && reduxDates[0] && reduxDates[1]) {
            return [dayjs(reduxDates[0]), dayjs(reduxDates[1])];
        }
        return defaultDates;
    };
    
    const [date, setDateState] = useState(getInitialDates);

    // Only dispatch default dates on first mount if Redux state is empty
    useEffect(() => {
        if (!reduxDates || reduxDates.length !== 2 || !reduxDates[0]) {
            const formattedDates = defaultDates.map(item => item.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'));
            dispatch(setDate({ dates: formattedDates }));
        }
    }, []); // Empty dependency - only run once on mount

    // Sync local state when Redux state changes (from other components)
    useEffect(() => {
        if (reduxDates && reduxDates.length === 2 && reduxDates[0] && reduxDates[1]) {
            const newDates = [dayjs(reduxDates[0]), dayjs(reduxDates[1])];
            // Only update if dates are different to avoid infinite loops
            if (!date[0].isSame(newDates[0], 'day') || !date[1].isSame(newDates[1], 'day')) {
                setDateState(newDates);
            }
        }
    }, [reduxDates]);

    const handleChange = (values) => {
        if (values && values.length === 2) {
            // Ensure we're working with dayjs objects and set proper time boundaries
            const startDate = dayjs(values[0]).startOf('day');
            const endDate = dayjs(values[1]).endOf('day');
            const formattedDates = [
                startDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
                endDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            ];
            setDateState([startDate, endDate]);
            dispatch(setDate({ dates: formattedDates }));
        } else {
            setDateState(defaultDates);
            const formattedDates = defaultDates.map(item => item.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'));
            dispatch(setDate({ dates: formattedDates }));
        }
    };

    return (
        <div>
            <RangePicker 
                onChange={handleChange}
                value={date}
                format="YYYY-MM-DD"
                style={{
                    backgroundColor: 'white',
                    border: '2px solid #66bb6a',
                    borderRadius: '8px',
                }}
                className="custom-range-picker"
            />
        </div>
    );
};

export default Datepicker;
