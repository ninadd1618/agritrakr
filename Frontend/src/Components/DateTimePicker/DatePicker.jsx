import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setDate } from '../../redux/dateSlice';

const { RangePicker } = DatePicker;

// Default date range: December 20-29, 2025
const defaultDates = [
    dayjs('2025-12-20'),
    dayjs('2025-12-29')
];

const Datepicker = () => {
    const [date, setDateState] = useState(defaultDates);
    const dispatch = useDispatch();

    // Set default dates on mount
    useEffect(() => {
        const formattedDates = defaultDates.map(item => item.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'));
        dispatch(setDate({ dates: formattedDates }));
    }, [dispatch]);

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
                defaultValue={defaultDates}
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
