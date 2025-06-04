const axios = require("axios"); // Using axios, Terra seems more static
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
require("dotenv").config();

// --- Configuration (Set these environment variables) ---
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_PASSWORD = process.env.SENDER_PASSWORD;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;
const SMTP_SERVER = process.env.SMTP_SERVER || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
// ---------------------------------------------------------

// --- Target URL changed to Terra Esportes ---
const TARGET_URL = "https://www.terra.com.br/esportes/futebol/";
const BASE_URL = "https://www.terra.com.br"; // Base URL for resolving relative links
// ---------------------------------------------

/**
 * Fetches HTML content from a given URL using Axios.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string|null>} - The HTML content or null on error.
 */
async function fetchHTML(url) {
    try {
        console.log(`Fetching HTML from ${url} using Axios...`);
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            },
            timeout: 15000,
        });
        console.log("HTML fetched successfully.");
        return response.data;
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
        }
        return null;
    }
}

/**
 * Parses the HTML content of Terra Esportes Futebol to extract news headlines and links.
 * @param {string} htmlContent - The HTML content.
 * @returns {Array<{title: string, link: string}>} - List of news items.
 */
function parseTerraNews(htmlContent) {
    if (!htmlContent) {
        return [];
    }
    console.log("Parsing HTML content for Terra Esportes...");
    const $ = cheerio.load(htmlContent);
    const newsItems = [];
    const seenLinks = new Set();

    // --- Selector adjusted for Terra Esportes structure ---
    // Based on initial browser view, look for links within common news card structures.
    // Example: <a class="card-news__url" ...> <h2 ...>Title</h2> </a>
    $("a.card-news__url[href*='/esportes/futebol/']").each((index, element) => {
        // Extract title: Look for h2 or strong tags inside, or use the link's text/title attribute
        let title = $(element).find("h2, strong").first().text()?.trim();
        if (!title) {
            title = $(element).attr("title")?.trim() || $(element).text()?.trim(); // Fallback
        }

        let link = $(element).attr("href")?.trim();

        // Clean up title
        title = title.replace(/\s\s+/g, ' ').trim();

        if (title && link && link !== "#" && !link.startsWith("javascript:")) {
            // Terra links seem absolute, but double-check
            if (!link.startsWith("http")) {
                 console.warn(`Skipping potentially relative or invalid link: ${link}`);
                 return; // Skip if not absolute
            }

            // Avoid duplicates
            if (!seenLinks.has(link)) {
                newsItems.push({ title, link });
                seenLinks.add(link);
            }
        }
    });

    // Fallback selector if the primary one fails (e.g., simpler list items)
    if (newsItems.length === 0) {
        console.log("Primary selector failed, trying fallback selector for Terra...");
        $("a[href*='/esportes/futebol/']").each((index, element) => {
            const title = $(element).text()?.trim(); // Simpler title extraction
            let link = $(element).attr("href")?.trim();

            // Basic filtering for plausible titles and links
            if (title && title.length > 15 && link && link.startsWith("http") && !link.endsWith("/futebol/") && !seenLinks.has(link)) {
                 // Check if parent has common article/list classes
                 if ($(element).closest("article, .list-item, .news-item").length > 0) {
                    newsItems.push({ title, link });
                    seenLinks.add(link);
                 }
            }
        });
    }

    console.log(`Found ${newsItems.length} potential news items after filtering.`);
    // Limit to top 5 news items
    return newsItems.slice(0, 5);
}

/**
 * Formats the news list into an HTML email body.
 * @param {Array<{title: string, link: string}>} newsList - List of news items.
 * @returns {string} - HTML email body.
 */
function formatEmailBody(newsList) {
    if (!newsList || newsList.length === 0) {
        return "<p>Nenhuma notícia encontrada hoje no Terra Esportes!</p>";
    }
    let body = "<h1>Últimas Notícias de Futebol (Terra Esportes)</h1>";
    body += "<ul>";
    newsList.forEach((news) => {
        body += `<li><a href=\"${news.link}\">${news.title}</a></li>`;
    });
    body += "</ul>";
    return body;
}

/**
 * Sends an email using Nodemailer.
 * @param {string} subject - The email subject.
 * @param {string} htmlBody - The HTML email body.
 * @returns {Promise<boolean>} - True if email sent/simulated successfully, false otherwise.
 */
async function sendEmail(subject, htmlBody) {
    if (!SENDER_EMAIL || !SENDER_PASSWORD || !RECEIVER_EMAIL) {
        console.warn("\n------------------------------------------------------------------");
        console.warn("WARN: Email environment variables not set. Simulating email output.");
        console.warn("--- Email Content (Simulated) ---");
        console.warn(`To: ${RECEIVER_EMAIL || "Not Set"}`);
        console.warn(`From: ${SENDER_EMAIL || "Not Set"}`);
        console.warn(`Subject: ${subject}`);
        console.warn("--- Body (HTML) ---");
        console.warn(htmlBody);
        console.warn("---------------------------------");
        console.warn("------------------------------------------------------------------\n");
        return true;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_SERVER,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SENDER_EMAIL,
            pass: SENDER_PASSWORD,
        },
        tls: {
            rejectUnauthorized: SMTP_SERVER.includes("gmail") || SMTP_SERVER.includes("office365"),
        },
    });

    const mailOptions = {
        from: SENDER_EMAIL,
        to: RECEIVER_EMAIL,
        subject: subject,
        html: htmlBody,
    };

    try {
        console.log(`Attempting to send email via ${SMTP_SERVER}:${SMTP_PORT}...`);
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

/**
 * Main function to orchestrate scraping and emailing.
 */
async function main() {
    console.log(`Starting Terra Esportes scraper for ${TARGET_URL}...`);
    const html = await fetchHTML(TARGET_URL);

    if (html) {
        const news = parseTerraNews(html);
        if (news.length > 0) {
            console.log(`Successfully parsed ${news.length} news items.`);
            const subject = "Relatório Diário de Notícias de Futebol - Terra Esportes";
            const emailBody = formatEmailBody(news);
            await sendEmail(subject, emailBody);
        } else {
            console.log("No news items found after parsing the HTML for Terra Esportes.");
            // If Terra fails, next step would be to try another segment as per user request
        }
    } else {
        console.log("Failed to fetch HTML using Axios. Cannot proceed with Terra.");
        // If Terra fails, next step would be to try another segment as per user request
    }
    console.log("Scraper finished.");
}

main();

