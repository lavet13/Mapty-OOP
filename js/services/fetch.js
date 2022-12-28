export async function getJSON(url, msg = `Something went wrong`) {
    try {
        const res = await fetch(url);

        if (!res.ok) throw new Error(`${msg} status code: ${res.status}`);

        return await res.json();
    } catch (err) {
        throw err;
    }
}
