import fetch from 'isomorphic-unfetch';

const getWorldTimestamp = async (timezone: string = 'Etc/GMT'): Promise<number> => {
    const res: Response = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`);
    const json: any = await res.json();

    const status = res.status;

    if (status >= 400)
        throw Error(json.message);

    const datetime: string = json.datetime;

    const nanoseconds = +json.datetime.match(/\.\d{3}(\d*?)\+/)[1];
    const serverTimestamp = new Date(datetime).getTime() + nanoseconds / 1000;

    return serverTimestamp;
}

export default getWorldTimestamp;