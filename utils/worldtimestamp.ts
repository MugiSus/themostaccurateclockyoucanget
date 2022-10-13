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
    timestamp: number;
    utcTimestamp: number;
}

const worldTimestamp = async (timezone: string = 'Etc/GMT'): Promise<WorldTimestamp> => {
    const res: Response = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`);
    const json: DateTimeJsonResponse = await res.json();

    const status = res.status;

    if (status >= 400)
        throw Error(res.statusText);

    const utcDatetime = json.utc_datetime;

    const microseconds = +utcDatetime.match(/\.\d{3}(\d*?)\+/)![1];
    const utcTimestamp = new Date(utcDatetime).getTime() + microseconds / 1000;
    const timestamp = utcTimestamp + json.raw_offset * 1000;

    return {
        response: json,
        timestamp: timestamp,
        utcTimestamp: utcTimestamp,
    };
}

export default worldTimestamp;