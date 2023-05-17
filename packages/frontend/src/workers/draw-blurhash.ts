import { render } from 'buraha';

onmessage = async (event) => {
    // console.log(event.data);
    if (!('id' in event.data && typeof event.data.id === 'string')) {
        return;
    }
    if (!('hash' in event.data && typeof event.data.hash === 'string')) {
        return;
    }
    const work = new OffscreenCanvas(event.data.width ?? 64, event.data.height ?? 64);
    render(event.data.hash, work);
    const bitmap = await createImageBitmap(work);
    postMessage({ id: event.data.id, bitmap });
};
