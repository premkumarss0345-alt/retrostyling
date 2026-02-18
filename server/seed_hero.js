const mysql = require('mysql2/promise');
require('dotenv').config();

const slides = [
    {
        title: "Youth dress \n style now",
        subtitle: "NEW ERA OF STYLE",
        description: "Explore the latest collection of premium men's fashion. \n Designed for the modern generation.",
        image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2070&auto=format&fit=crop",
        active: 1
    },
    {
        title: "Urban Street \n Culture",
        subtitle: "EXCLUSIVELY FOR YOU",
        description: "Redefining the streets with bold looks. \n Comfort mixed with unapologetic style.",
        image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2070&auto=format&fit=crop",
        active: 1
    },
    {
        title: "Winter \n Collection",
        subtitle: "Elegance Redefined",
        description: "Discover warmth in every stitch. \n Premium wool blends for the season.",
        image: "https://images.unsplash.com/photo-1515434126000-961d90c546a1?q=80&w=2070&auto=format&fit=crop", // Replaced with a winter one
        active: 1
    }
];

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        // Clear existing
        await conn.query("TRUNCATE TABLE hero_slides");

        for (const slide of slides) {
            await conn.query("INSERT INTO hero_slides (title, subtitle, description, image, active) VALUES (?, ?, ?, ?, ?)", 
                [slide.title, slide.subtitle, slide.description, slide.image, slide.active]);
            console.log(`Inserted slide: ${slide.title}`);
        }
        
        console.log("Seeding complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
