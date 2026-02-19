import { DatePicker } from 'antd';
import moment from 'moment';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setDate } from '../../redux/dateSlice';

const { RangePicker } = DatePicker;

// Default date range: December 20-29, 2025
const defaultDates = [
    moment('2025-12-20'),
    moment('2025-12-29')
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
            const formattedDates = values.map(item => item.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'));
            setDateState(values);
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
