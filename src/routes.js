import { Dataset, createCheerioRouter } from 'crawlee';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ request, $, enqueueLinks, log }) => {
    log.info(`Enqueueing links from ${request.url}`);

    await enqueueLinks({
        globs: ['https://apify.com/*'],
        label: 'detail',
    });
});

router.addHandler('detail', async ({ request, $, log }) => {
    const title = $('title').text().trim();
    log.info(`Extracted title: "${title}"`, { url: request.loadedUrl });

    await Dataset.pushData({
        url: request.loadedUrl,
        title,
    });
});
