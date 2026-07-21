import React from 'react';
import { Facebook, Linkedin, Instagram, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import './About.css';

// Import local images (placeholder paths - ensure files exist in src/assets/team/)
import ragulImg from '../assets/team/ragul.jpg';
import preamImg from '../assets/team/pream.jpg';
import mohanaImg from '../assets/team/mohana.jpg';
import nitheshImg from '../assets/team/nithesh.jpg';
// Fallback if images are missing
const fallbackImg = 'https://ui-avatars.com/api/?background=random&color=fff&size=200';

const teamMembers = [
    {
        name: 'Ragul.P',
        role: 'Founder & CEO',
        image: ragulImg,
        socials: { facebook: '#', linkedin: '#', instagram: '#' }
    },
    {
        name: 'Pream kumar.S',
        role: 'Co-Founder & CTO',
        image: preamImg,
        socials: { facebook: '#', linkedin: '#', instagram: '#' }
    },
    {
        name: 'Mohana Prakash.G',
        role: 'Design Lead',
        image: mohanaImg,
        socials: { facebook: '#', instagram: '#', linkedin: '#' }
    },
    {
        name: 'Nithesh kumar.V',
        role: 'Marketing Head',
        image: nitheshImg,
        socials: { linkedin: '#', instagram: '#' }
    }
];

const About = () => {
    return (
        <div className="about-page">
            <section className="about-hero section">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="about-content"
                    >
                        <h1 className="h1 title-centered text-center">About <span style={{ color: 'var(--primary)' }}>Retro Stylings</span></h1>
                        <p className="mission-text">
                            At Retro Stylings, we believe fashion should be accessible to everyone without compromising on quality.
                            Our mission is to bring you stylish, high-quality clothing at budget-friendly prices.
                            Whether you’re looking for timeless classics or trendy pieces, Retro Stylings offers a curated selection
                            that fits your style and your wallet. Shop with confidence knowing you’re getting the best value,
                            exceptional craftsmanship, and designs that stand out. Discover fashion that’s affordable, durable,
                            and undeniably you, only at Retro Stylings.
                        </p>
                    </motion.div>
                </div>
            </section>

            
        </div>
    );
};

export default About;
