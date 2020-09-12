import "../dateTimePicker.css";

import React, { useEffect, useState } from "react";

import DatePicker from "react-datepicker";
import { InputTypeProps } from "types/formTypes";

export const DateTime = ({
	placeholder,
	readOnly,
	val,
	setVal
}: InputTypeProps) => {
	const [openToDate, setOpenToDate] = useState<Date>();
	useEffect(() => {
		const utc = new Date();
		setOpenToDate(
			new Date(
				utc.getUTCFullYear(),
				utc.getUTCMonth(),
				utc.getUTCDate(),
				utc.getUTCHours(),
				utc.getUTCMinutes()
			)
		);
	}, []);

	return (
		<DatePicker
			selected={val ? new Date(val) : null}
			onChange={(date) => {
				setVal && setVal(date?.toString());
			}}
			// popperPlacement="auto"
			dateFormat={"dd/MMM/yyyy HH:mm"}
			timeFormat={"HH:mm"}
			dateFormatCalendar={"MMM yyyy"}
			placeholderText="DD/MMM/YYYY HH:MM"
			isClearable
			showTimeSelect={true}
			openToDate={openToDate}
			readOnly={readOnly}
			fixedHeight
			timeIntervals={5}
			className="form-control"
		/>
	);
};
