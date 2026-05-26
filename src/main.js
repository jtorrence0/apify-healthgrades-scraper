import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';

await Actor.init();

const {
    specialty = '',
    location = '',
    maxPages = 1,
    proxyConfiguration,
} = (await Actor.getInput()) || {};
const startUrl = `https://www.healthgrades.com/usearch?what=${encodeURIComponent(
    specialty,
)}&where=${encodeURIComponent(location)}`;

const proxyConfig = await Actor.createProxyConfiguration(proxyConfiguration);
const dataset = await Actor.openDataset();
const HARD_PAGE_LIMIT = 100;

const crawler = new CheerioCrawler({
    proxyConfiguration: proxyConfig,
    maxConcurrency: 5,
    maxRequestsPerCrawl: maxPages === 0 ? undefined : HARD_PAGE_LIMIT,

    async requestHandler({ request, $, log }) {
        // Handle profile pages
        if (request.userData.isProfile) {
            const { doctorData } = request.userData;
            log.info(`Processing profile page for: ${doctorData.name}`);

            // Extract location data from profile page
            const locations = [];

            $('[data-qa-target="office-locations"] [data-qa-target="Practice-Name"]').each((index, el) => {
                let $container = $(el).parent();
                while (
                    $container.length
                    && !$container.is('[data-qa-target="office-locations"]')
                    && ($container.find('[data-qa-target="Practice-Name"]').length !== 1
                        || !$container.find('[data-qa-target="practice-address-street"]').length)
                ) {
                    $container = $container.parent();
                }
                if (!$container.length || $container.is('[data-qa-target="office-locations"]')) return;

                const practiceName = $container.find('[data-qa-target="Practice-Name"]').text().trim();
                const streetAddress = $container.find('[data-qa-target="practice-address-street"]').text().trim();
                const city = $container.find('[data-qa-target="practice-address-city"]').text().trim().replace(',', '');
                const state = $container.find('[data-qa-target="practice-address-state"]').text().trim();
                const postalCode = $container.find('[data-qa-target="practice-address-postalCode"]').text().trim();

                const phoneHref = $container.find('[data-qa-target="visit-open-phone"]').attr('href');
                const phone = phoneHref ? phoneHref.replace('tel:', '') : null;

                if (streetAddress || city || practiceName) {
                    locations.push({
                        practiceName: practiceName || null,
                        streetAddress: streetAddress || null,
                        city: city || null,
                        state: state || null,
                        postalCode: postalCode || null,
                        phone: phone || null,
                    });
                }
            });

            // Add locations to doctor data and save
            const enhancedDoctorData = {
                ...doctorData,
                locations,
            };

            await dataset.pushData(enhancedDoctorData);
            log.info(`Saved enhanced data for ${doctorData.name} with ${locations.length} location(s)`);
            return;
        }

        // Handle search result pages
        const currentPage = request.userData.page || 1;
        log.info(`Processing search page ${currentPage}: ${request.url}`);

        const doctors = $('[data-qa-target^="pro-card-natural-"]')
            .map((doctorIndex, el) => {
                const $el = $(el);
                const name = $el
                    .find('[data-qa-target="provider-name-link"]')
                    .text()
                    .trim();
                const profilePath = $el
                    .find('[data-qa-target="provider-name-link"]')
                    .attr('href');
                const doctorSpecialty = $el
                    .find('[data-qa-target="provider-specialty"]')
                    .text()
                    .trim()
                    .replace(/^Specialty:\s*/i, '')
                    .split('\n')
                    .pop()
                    .trim();
                const rating = $el
                    .find('[data-qa-target="rating-score"]')
                    .text()
                    .trim();
                const reviewCount = $el
                    .find('[data-qa-target="rating-count"]')
                    .text()
                    .trim();

                // Deduplicate and clean up address
                const rawAddresses = $el
                    .find('[data-qa-target="location-info-address"]')
                    .map((index, addr) => {
                        const $addr = $(addr);
                        const streetAddress = $addr.contents().filter(function () {
                            return this.nodeType === 3; // Text node
                        }).text().trim();
                        const cityStateZip = $addr.find('span').text().trim();
                        return streetAddress && cityStateZip
                            ? `${streetAddress}, ${cityStateZip}`.replace(/\s+/g, ' ').trim()
                            : $addr.text().replace(/\s+/g, ' ').trim();
                    })
                    .get();
                const address = [...new Set(rawAddresses)].join(' / ');

                const attributes = $el
                    .find('li[data-qa-target^="strength-item--"]')
                    .map((attributeIndex, li) => $(li).text().trim())
                    .get();
                const imageUrl = $el
                    .find('[data-qa-target="provider-card-provider-img"]')
                    .attr('src');

                return {
                    name: name || null,
                    profileUrl: profilePath
                        ? `https://www.healthgrades.com${profilePath}`
                        : null,
                    doctorSpecialty,
                    rating,
                    reviewCount,
                    address: address || null,
                    attributes,
                    imageUrl: imageUrl || null,
                };
            })
            .get();

        log.info(
            `Found ${doctors.length} doctor profiles on page ${currentPage}`,
        );

        // Visit each doctor's profile to get location data
        for (const doctor of doctors) {
            if (doctor.profileUrl) {
                try {
                    log.info(`Fetching location data for: ${doctor.name}`);

                    await crawler.addRequests([{
                        url: doctor.profileUrl,
                        userData: {
                            isProfile: true,
                            doctorData: doctor,
                        },
                    }]);
                } catch (error) {
                    log.error(`Failed to queue profile request for ${doctor.name}: ${error.message}`);
                    // Push doctor data without locations if profile fetch fails
                    await dataset.pushData(doctor);
                }
            } else {
                // Push doctor data without locations if no profile URL
                await dataset.pushData(doctor);
            }
        }

        const nextHref = $('a[data-qa-target="pagination--next-page"]').attr(
            'href',
        );
        if (nextHref && (maxPages === 0 || currentPage < maxPages)) {
            const nextPage = currentPage + 1;
            const fullUrl = new URL(
                nextHref,
                'https://www.healthgrades.com',
            ).toString();
            log.info(`Queueing next page: ${fullUrl}`);
            await crawler.addRequests([
                { url: fullUrl, userData: { page: nextPage } },
            ]);
        }
    },
});

await crawler.run([{ url: startUrl, userData: { page: 1 } }]);
await Actor.exit();
