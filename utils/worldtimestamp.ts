import fetch from 'isomorphic-unfetch';

interface DateTimeJsonResponse {
    abbreviation: string;
    client_ip: string;
    datetime: string;
    day_of_week: number;
    day_of_year: number;
    dst: boolean;
    dst_from: string;
    dst_offset: number;
    dst_until: string;
    raw_offset: number;
    timezone: string;
    unixtime: number;
    utc_datetime: string;
    utc_offset: string;
    week_number: number;
}

interface WorldTimestamp {
    response: DateTimeJsonResponse;
    microseconds: number;
    utcMicroseconds: number;
    milliseconds: number;
    utcMilliseconds: number;
}

const worldTimestamp = async (timezone: string = 'Etc/UTC'): Promise<WorldTimestamp> => {
    const res: Response = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`);
    const json: DateTimeJsonResponse = await res.json();

    const status = res.status;

    if (status >= 400)
        throw Error(res.statusText);

    const utcDatetime = json.utc_datetime;

    const datetimeMicrosecond = +utcDatetime.match(/\.\d{3}(\d*?)\+/)![1];
    const utcMicroseconds = new Date(utcDatetime).getTime() * 1000 + datetimeMicrosecond;
    const microseconds = utcMicroseconds + json.raw_offset * 1000000;

    return {
        response: json,
        microseconds: microseconds,
        utcMicroseconds: utcMicroseconds,
        milliseconds: microseconds / 1000,
        utcMilliseconds: utcMicroseconds / 1000,
    };
}

export default worldTimestamp;