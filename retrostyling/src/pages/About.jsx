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
                        <h1 className="h1 title-centered">About <span style={{ color: 'var(--primary)' }}>Retro Stylings</span></h1>
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

            <section className="team-section section">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="section-header"
                    >
                        <Users size={40} className="section-icon" />
                        <h2 className="h2">Meet Our Team</h2>
                        <p className="text-light">The creative minds behind Retro Stylings</p>
                    </motion.div>

                    <div className="team-grid">
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={index}
                                className="team-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="team-img-wrapper">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        onError={(e) => { e.target.src = fallbackImg + `&name=${member.name}`; }}
                                    />
                                </div>
                                <div className="team-info">
                                    <h3>{member.name}</h3>
                                    {/* Optional: Add roles if known, otherwise just name */}
                                    {/* <p className="team-role">{member.role}</p> */}

                                    <div className="social-links">
                                        {member.socials.facebook && (
                                            <a href={member.socials.facebook} className="social-icon fb"><Facebook size={18} /></a>
                                        )}
                                        {member.socials.linkedin && (
                                            <a href={member.socials.linkedin} className="social-icon li"><Linkedin size={18} /></a>
                                        )}
                                        {member.socials.instagram && (
                                            <a href={member.socials.instagram} className="social-icon ig"><Instagram size={18} /></a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
